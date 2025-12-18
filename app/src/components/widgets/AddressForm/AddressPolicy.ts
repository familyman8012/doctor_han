import type { ShippingMethod } from "@/lib/schema/fulfillment";

export type AddressMode = "DIRECT" | "SEARCH_KR" | "OVERSEAS";

export interface AddressDraft {
  addressMode?: AddressMode;
  zipcode?: string;
  shippingAddress?: string;
  addressDetail?: string;
  overseasCountryCode?: string;
  overseasState?: string;
  overseasCity?: string;
  overseasStreet?: string;
}

export function isPostPickup(method?: ShippingMethod | null): boolean {
  return method === "POST_PICKUP";
}

// 합치기: 국내 기본+상세를 하나의 문자열로
export function combineDomesticAddress(base?: string, detail?: string): string {
  return [base ?? "", detail ?? ""].filter(Boolean).join(" ").trim();
}

// 국내 -> 해외 전환 시 정규화: 상세주소로 이관, 주/도/시는 비움
export function normalizeToOverseas(draft: AddressDraft): AddressDraft {
  const combined = combineDomesticAddress(draft.shippingAddress, draft.addressDetail);
  const next: AddressDraft = { ...draft };
  if (!next.overseasStreet && combined) next.overseasStreet = combined;
  next.overseasState = "";
  next.overseasCity = "";
  return next;
}

export function applyShippingMethodEffects(method: ShippingMethod | undefined, draft: AddressDraft): AddressDraft {
  if (method === "POST_PICKUP") {
    return normalizeToOverseas({ ...draft, addressMode: "OVERSEAS" });
  }
  if (method) {
    return { ...draft, addressMode: "DIRECT" };
  }
  return draft;
}

// 세미콜론 개수 기반 분할 표시 여부
export function shouldSplitOverseasFields(rawAddress: string | null | undefined): boolean {
  const raw = (rawAddress ?? "").trim();
  if (!raw) return false;
  const count = (raw.match(/;/g) || []).length;
  return count === 3; // country;state;city;street
}

