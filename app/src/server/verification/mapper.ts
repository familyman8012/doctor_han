import type { Tables } from "@/lib/database.types";
import type { DoctorVerificationView, VendorVerificationView } from "@/lib/schema/verification";

type DoctorVerificationRow = Tables<"doctor_verifications">;
type VendorVerificationRow = Tables<"vendor_verifications">;

export function mapDoctorVerificationRow(row: DoctorVerificationRow): DoctorVerificationView {
    return {
        id: row.id,
        userId: row.user_id,
        licenseNo: row.license_no,
        fullName: row.full_name,
        birthDate: row.birth_date,
        clinicName: row.clinic_name,
        licenseFileId: row.license_file_id,
        status: row.status,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        rejectReason: row.reject_reason,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function mapVendorVerificationRow(row: VendorVerificationRow): VendorVerificationView {
    return {
        id: row.id,
        userId: row.user_id,
        businessNo: row.business_no,
        companyName: row.company_name,
        contactName: row.contact_name,
        contactPhone: row.contact_phone,
        contactEmail: row.contact_email,
        businessLicenseFileId: row.business_license_file_id,
        status: row.status,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        rejectReason: row.reject_reason,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

