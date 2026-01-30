-- Atomic resolve_report function to ensure data consistency
-- This function handles report resolution with optional sanction creation in a single transaction

CREATE OR REPLACE FUNCTION public.resolve_report(
    p_report_id UUID,
    p_admin_user_id UUID,
    p_reason TEXT,
    p_sanction_type public.sanction_type DEFAULT NULL,
    p_duration_days INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_report RECORD;
    v_sanction_id UUID;
    v_now TIMESTAMPTZ := NOW();
    v_ends_at TIMESTAMPTZ;
    v_new_status TEXT;
    v_caller_role TEXT;
BEGIN
    -- Security check: Verify caller is admin
    SELECT role INTO v_caller_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
        RAISE EXCEPTION 'Permission denied: Admin role required';
    END IF;

    -- Verify p_admin_user_id matches the authenticated user
    IF p_admin_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Permission denied: User ID mismatch';
    END IF;

    -- Validate suspension requires duration_days (7 or 30)
    IF p_sanction_type = 'suspension' THEN
        IF p_duration_days IS NULL THEN
            RAISE EXCEPTION 'Suspension sanction requires duration_days';
        END IF;
        IF p_duration_days NOT IN (7, 30) THEN
            RAISE EXCEPTION 'duration_days must be 7 or 30';
        END IF;
    END IF;

    -- Get report and lock the row
    SELECT * INTO v_report
    FROM public.reports
    WHERE id = p_report_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Report not found: %', p_report_id;
    END IF;

    IF v_report.status IN ('resolved', 'dismissed') THEN
        RAISE EXCEPTION 'Report already processed: %', p_report_id;
    END IF;

    -- Update report status
    UPDATE public.reports
    SET
        status = 'resolved',
        resolved_by = p_admin_user_id,
        resolved_at = v_now,
        resolution_note = p_reason,
        updated_at = v_now
    WHERE id = p_report_id;

    -- Create sanction if sanction_type is provided
    IF p_sanction_type IS NOT NULL THEN
        -- Calculate ends_at for suspension
        IF p_sanction_type = 'suspension' THEN
            v_ends_at := v_now + (p_duration_days || ' days')::INTERVAL;
        END IF;

        INSERT INTO public.sanctions (
            target_type,
            target_id,
            report_id,
            sanction_type,
            status,
            reason,
            duration_days,
            starts_at,
            ends_at,
            created_by
        )
        VALUES (
            v_report.target_type,
            v_report.target_id,
            p_report_id,
            p_sanction_type,
            'active',
            p_reason,
            p_duration_days,
            v_now,
            v_ends_at,
            p_admin_user_id
        )
        RETURNING id INTO v_sanction_id;

        -- Update target status for permanent_ban or suspension
        IF p_sanction_type IN ('permanent_ban', 'suspension') THEN
            v_new_status := CASE WHEN p_sanction_type = 'permanent_ban' THEN 'banned' ELSE 'inactive' END;

            IF v_report.target_type = 'profile' THEN
                UPDATE public.profiles
                SET status = v_new_status, updated_at = v_now
                WHERE id = v_report.target_id;
            ELSIF v_report.target_type = 'vendor' THEN
                UPDATE public.vendors
                SET status = v_new_status, updated_at = v_now
                WHERE id = v_report.target_id;
            END IF;
        END IF;

        -- Log sanction creation
        INSERT INTO public.audit_logs (actor_user_id, action, target_type, target_id, metadata)
        VALUES (
            p_admin_user_id,
            'sanction.create',
            'sanction',
            v_sanction_id,
            jsonb_build_object(
                'sanctionId', v_sanction_id,
                'targetType', v_report.target_type,
                'targetId', v_report.target_id,
                'sanctionType', p_sanction_type,
                'durationDays', p_duration_days
            )
        );
    END IF;

    -- Log report resolution
    INSERT INTO public.audit_logs (actor_user_id, action, target_type, target_id, metadata)
    VALUES (
        p_admin_user_id,
        'report.resolve',
        'report',
        p_report_id,
        jsonb_build_object(
            'reportId', p_report_id,
            'sanctionType', p_sanction_type,
            'reason', p_reason
        )
    );

    RETURN jsonb_build_object(
        'reportId', p_report_id,
        'sanctionId', v_sanction_id
    );
END;
$$;

-- Grant execute permission to authenticated users (function checks admin role internally)
GRANT EXECUTE ON FUNCTION public.resolve_report TO authenticated;
