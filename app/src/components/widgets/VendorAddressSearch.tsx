"use client";

import { useState, useCallback } from "react";
import DaumPostcodeEmbed from "react-daum-postcode";
import type { Address } from "react-daum-postcode";
import { MapPin, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";

export interface VendorAddressData {
    roadAddress: string | null;
    jibunAddress: string | null;
    zonecode: string | null;
}

interface VendorAddressSearchProps {
    /** Currently selected address data */
    currentAddress?: {
        roadAddress?: string | null;
        jibunAddress?: string | null;
        addressDetail?: string | null;
        zonecode?: string | null;
    };
    /** Address detail (floor, room number, etc.) */
    addressDetail: string;
    /** Called when address is selected from Daum Postcode */
    onAddressSelect: (data: VendorAddressData) => void;
    /** Called when address detail input changes */
    onAddressDetailChange: (value: string) => void;
    /** Whether geocoding is in progress */
    isGeocoding?: boolean;
    disabled?: boolean;
}

export function VendorAddressSearch({
    currentAddress,
    addressDetail,
    onAddressSelect,
    onAddressDetailChange,
    isGeocoding = false,
    disabled = false,
}: VendorAddressSearchProps) {
    const [showPostcode, setShowPostcode] = useState(false);

    const handleComplete = useCallback(
        (data: Address) => {
            onAddressSelect({
                roadAddress: data.roadAddress || data.address || null,
                jibunAddress: data.jibunAddress || data.autoJibunAddress || null,
                zonecode: data.zonecode || null,
            });
            setShowPostcode(false);
        },
        [onAddressSelect],
    );

    const hasAddress = currentAddress?.roadAddress || currentAddress?.jibunAddress;

    return (
        <div className="space-y-4">
            {/* Search button */}
            <div>
                <Button
                    type="button"
                    variant="ghostSecondary"
                    size="md"
                    LeadingIcon={<Search className="w-4 h-4" />}
                    onClick={() => setShowPostcode(true)}
                    disabled={disabled}
                >
                    {hasAddress ? "주소 변경" : "주소 검색"}
                </Button>
                {isGeocoding && (
                    <span className="ml-2 inline-flex items-center gap-1 text-sm text-gray-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        좌표 변환 중...
                    </span>
                )}
            </div>

            {/* Daum Postcode embed */}
            {showPostcode && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <DaumPostcodeEmbed
                        onComplete={handleComplete}
                        onClose={() => setShowPostcode(false)}
                        style={{ height: 400 }}
                    />
                </div>
            )}

            {/* Display selected address */}
            {hasAddress && (
                <div className="space-y-3">
                    {/* Road address */}
                    {currentAddress?.roadAddress && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                도로명 주소
                            </label>
                            <div className="flex items-center gap-2 text-sm text-gray-700 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                {currentAddress.roadAddress}
                            </div>
                        </div>
                    )}

                    {/* Jibun address */}
                    {currentAddress?.jibunAddress && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                지번 주소
                            </label>
                            <div className="text-sm text-gray-500 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                {currentAddress.jibunAddress}
                            </div>
                        </div>
                    )}

                    {/* Zonecode */}
                    {currentAddress?.zonecode && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                우편번호
                            </label>
                            <div className="text-sm text-gray-500 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg w-32">
                                {currentAddress.zonecode}
                            </div>
                        </div>
                    )}

                    {/* Address detail (editable) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            상세 주소
                        </label>
                        <Input
                            value={addressDetail}
                            onChange={(e) => onAddressDetailChange(e.target.value)}
                            placeholder="상세 주소를 입력하세요 (예: 3층 301호)"
                            disabled={disabled}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
