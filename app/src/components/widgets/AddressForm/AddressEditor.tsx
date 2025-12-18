"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input/Input";
import { Radio } from "@/components/ui/Radio/Radio";
import AddressRadioGroup from "./AddressRadioGroup";
import { AddressSearch } from "@/components/widgets/AddressSearch/AddressSearch";
import { CountrySelector } from "@/components/widgets/CountrySelector/CountrySelector";
import type { AddressDraft, AddressMode } from "./AddressPolicy";
import { normalizeToOverseas } from "./AddressPolicy";

export interface AddressEditorProps {
	namePrefix: string;
	draft: AddressDraft;
	onDraftChange: (partial: Partial<AddressDraft>) => void;
	disabled?: boolean;
	readOnly?: boolean; // view 모드
	hideDomesticOptions?: boolean; // 우체국 픽업일 때 국내 라디오 숨김
	hideOverseasOption?: boolean; // 비-우체국일 때 해외 라디오 숨김
}

export function AddressTypeRadioRow({
	name,
	value,
	onChange,
	hideDomesticOptions,
	hideOverseasOption,
	disabled,
}: {
	name: string;
	value: AddressMode | undefined;
	onChange: (value: AddressMode) => void;
	hideDomesticOptions?: boolean;
	hideOverseasOption?: boolean;
	disabled?: boolean;
}) {
	const v = value ?? "DIRECT";
    return (
        <AddressRadioGroup
            name={name}
            value={v}
            onChange={(val) => onChange(String(val) as AddressMode)}
            direction="horizontal"
            disabled={disabled}
        >
			{/* 우체국 픽업일 때: 해외만 노출 */}
			{hideDomesticOptions ? (
				<Radio value="OVERSEAS" label="해외주소입력" size="sm" />
			) : hideOverseasOption ? (
				// 비-우체국: 국내만 노출
				<>
					<Radio value="DIRECT" label="직접입력 (국내)" size="sm" />
					<Radio value="SEARCH_KR" label="주소검색 (국내)" size="sm" />
				</>
			) : (
				// 모두 허용
				<>
					<Radio value="DIRECT" label="직접입력 (국내)" size="sm" />
					<Radio value="SEARCH_KR" label="주소검색 (국내)" size="sm" />
					<Radio value="OVERSEAS" label="해외주소입력" size="sm" />
				</>
			)}
        </AddressRadioGroup>
    );
}

export function AddressFields({
	draft,
	onDraftChange,
	disabled,
	readOnly,
}: {
	draft: AddressDraft;
	onDraftChange: (partial: Partial<AddressDraft>) => void;
	disabled?: boolean;
	readOnly?: boolean;
}) {
	const mode: AddressMode = (draft.addressMode ?? "DIRECT") as AddressMode;

	if (mode === "SEARCH_KR") {
		return (
			<div className="space-y-2">
				<div className="flex gap-2 items-stretch align-middle">
					<Input
						placeholder="우편번호"
						disabled={disabled || readOnly}
						readOnly
						className="w-24"
						value={draft.zipcode ?? ""}
						onChange={(e) =>
							onDraftChange({ zipcode: e.target.value || undefined })
						}
					/>
					<AddressSearch
						value={draft.shippingAddress || ""}
						placeholder="클릭하여 주소 검색"
						disabled={disabled || readOnly}
						onSearch={(address: string, zonecode?: string) => {
							onDraftChange({
								shippingAddress: address,
								zipcode: zonecode ?? draft.zipcode,
							});
						}}
					/>
				</div>
				<Input
					placeholder="상세주소"
					disabled={disabled || readOnly}
					value={draft.addressDetail ?? ""}
					onChange={(e) => onDraftChange({ addressDetail: e.target.value })}
				/>
			</div>
		);
	}

	if (mode === "DIRECT") {
		const [directRaw, setDirectRaw] = useState<string>("");
		// 외부 상태 변화 반영: 트림 없이 그대로 합성(상세가 있으면 공백으로 연결)
		useEffect(() => {
			const base = draft.shippingAddress ?? "";
			const detail = draft.addressDetail ?? "";
			const joined = detail ? `${base}${base ? " " : ""}${detail}` : base;
			setDirectRaw(joined);
			// setDirectRaw는 useState setter로 안정적 참조가 보장됨
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [draft.shippingAddress, draft.addressDetail]);

		return (
			<div className="space-y-2">
				<div className="flex gap-2 items-stretch">
					<Input
						placeholder="우편번호"
						disabled={disabled || readOnly}
						className="w-24"
						value={draft.zipcode ?? ""}
						onChange={(e) =>
							onDraftChange({ zipcode: e.target.value || undefined })
						}
					/>
					<div className="flex-1 min-w-0">
						<Input
							placeholder="주소(기본+상세) 한 번에 입력"
							disabled={disabled || readOnly}
							value={directRaw}
							fullWidth
							onChange={(e) => {
								const v = e.target.value;
								setDirectRaw(v);
								// 사용자 입력을 그대로 저장(트림/분해하지 않음). 상세값은 사용하지 않으므로 비움
								onDraftChange({ shippingAddress: v, addressDetail: undefined });
							}}
						/>
					</div>
				</div>
			</div>
		);
	}

	// OVERSEAS
	return (
		<div className="space-y-2">
			<div className="flex gap-2 items-stretch">
				<Input
					placeholder="우편번호"
					disabled={disabled || readOnly}
					className="w-24"
					value={draft.zipcode ?? ""}
					onChange={(e) =>
						onDraftChange({ zipcode: e.target.value || undefined })
					}
				/>
				<div className="w-40 shrink-0">
					<CountrySelector
						value={draft.overseasCountryCode || ""}
						onChange={(code) =>
							onDraftChange({ overseasCountryCode: code ?? "" })
						}
						placeholder="국가 검색"
						size="sm"
						usePortal={false}
						disabled={disabled || readOnly}
					/>
				</div>
				<Input
					placeholder="주/도시"
					disabled={disabled || readOnly}
					value={draft.overseasState || ""}
					onChange={(e) => onDraftChange({ overseasState: e.target.value })}
				/>
				<Input
					placeholder="시/군/구"
					disabled={disabled || readOnly}
					className="w-32 shrink-0"
					value={draft.overseasCity || ""}
					onChange={(e) => onDraftChange({ overseasCity: e.target.value })}
				/>
				<div className="flex-1 min-w-0">
					<Input
						placeholder="상세주소"
						disabled={disabled || readOnly}
						value={draft.overseasStreet || ""}
						fullWidth
						onChange={(e) => onDraftChange({ overseasStreet: e.target.value })}
					/>
				</div>
			</div>
		</div>
	);
}

export default function AddressEditor({
	namePrefix,
	draft,
	onDraftChange,
	disabled,
	readOnly,
	hideDomesticOptions,
	hideOverseasOption,
}: AddressEditorProps) {
	const mode: AddressMode = (draft.addressMode ?? "DIRECT") as AddressMode;

	// 국내 옵션 숨김(예: 우체국 픽업)일 때는 강제로 해외 모드 유지
	useEffect(() => {
		if (hideDomesticOptions && mode !== "OVERSEAS") {
			const next = normalizeToOverseas({ ...draft, addressMode: "OVERSEAS" });
			onDraftChange(next);
		}
		// onDraftChange, draft, mode 제외: prop 변경 시점에만 모드 전환, 콜백/상태 갱신으로 재실행 방지
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hideDomesticOptions]);

	// 해외 옵션 숨김(비-우체국)일 때는 해외 모드를 피하고 국내 기본값으로 유도
	useEffect(() => {
		if (hideOverseasOption && mode === "OVERSEAS") {
			onDraftChange({ addressMode: "DIRECT" });
		}
		// onDraftChange, mode 제외: prop 변경 시점에만 모드 전환, 콜백/상태 갱신으로 재실행 방지
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hideOverseasOption]);

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-3 text-xs">
				<span className="shrink-0 font-medium text-[#0a3b41]">주소 유형</span>
				<div
					className={readOnly ? "pointer-events-none opacity-60" : undefined}
					aria-disabled={readOnly}
				>
					<AddressTypeRadioRow
						name={`${namePrefix}-addr-type`}
						value={draft.addressMode ?? "DIRECT"}
						onChange={(nextMode) => {
							if (hideDomesticOptions) {
								// 강제 해외 유지
								if (nextMode !== "OVERSEAS") return;
							}
							if (hideOverseasOption && nextMode === "OVERSEAS") {
								// 해외 선택 금지
								return;
							}
							const partial: Partial<AddressDraft> = { addressMode: nextMode };
							if (nextMode === "OVERSEAS" && draft.addressMode !== "OVERSEAS") {
								const normalized = normalizeToOverseas({
									...draft,
									...partial,
								});
								onDraftChange(normalized);
							} else {
								onDraftChange(partial);
							}
						}}
						hideDomesticOptions={hideDomesticOptions}
						hideOverseasOption={hideOverseasOption}
						disabled={disabled}
					/>
				</div>
			</div>
			<AddressFields
				draft={draft}
				onDraftChange={onDraftChange}
				disabled={disabled}
				readOnly={readOnly}
			/>
		</div>
	);
}
