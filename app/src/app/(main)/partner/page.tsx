"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { Building2, MapPin, Tag, CheckCircle, Clock, XCircle, AlertCircle, User, Camera } from "lucide-react";
import api from "@/api-client/client";
import { Button } from "@/components/ui/Button/button";
import { Input } from "@/components/ui/Input/Input";
import { Select, type IOption } from "@/components/ui/Select/Select";
import { RichEditor } from "@/components/ui/RichEditor/RichEditor";
import { Spinner } from "@/components/ui/Spinner/Spinner";
import { useAuthStore, useProfile, useProfileCompletion } from "@/stores/auth";
import { toast } from "sonner";
import { ProfileCompletionBanner } from "@/components/widgets/ProfileCompletionBanner";
import { VendorAddressSearch, type VendorAddressData } from "@/components/widgets/VendorAddressSearch";
import { REGION_OPTIONS } from "@/lib/constants/regions";
import type { VendorDetail } from "@/lib/schema/vendor";
import type { MeData } from "@/lib/schema/profile";
import type { FileSignedUploadResponse } from "@/lib/schema/file";
import { getSupabaseBrowserClient } from "@/server/supabase/browser";

interface Category {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    depth: number;
    listingType?: "vendor" | "product";
}

interface VendorFormData {
    name: string;
    summary: string;
    description: string;
    regionSecondary: string;
}

// 서비스 지역 옵션: "전국" + 17개 시도
const SERVICE_REGION_OPTIONS: IOption[] = [
    { value: "전국", label: "전국" },
    ...REGION_OPTIONS.map((r) => ({ value: r.value, label: r.label })),
];

interface AddressState {
    roadAddress: string | null;
    jibunAddress: string | null;
    addressDetail: string;
    zonecode: string | null;
    latitude: number | null;
    longitude: number | null;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

interface AccountFormData {
    displayName: string;
    position: string;
    phone: string;
    contactPhoneSecondary: string;
}

export default function PartnerProfilePage() {
    const queryClient = useQueryClient();
    const profile = useProfile();
    const user = useAuthStore((state) => state.user);
    const vendorVerification = useAuthStore((state) => state.vendorVerification);
    const setAuth = useAuthStore((state) => state.setAuth);
    const profileCompletion = useProfileCompletion();
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [initialCategoryIds, setInitialCategoryIds] = useState<string[]>([]);
    const [initialAddress, setInitialAddress] = useState<string>("");
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [initialRegions, setInitialRegions] = useState<string[]>([]);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [addressState, setAddressState] = useState<AddressState>({
        roadAddress: null,
        jibunAddress: null,
        addressDetail: "",
        zonecode: null,
        latitude: null,
        longitude: null,
    });

    // 내 업체 정보 조회
    const { data: vendorData, isLoading: vendorLoading } = useQuery({
        queryKey: ["vendor", "me"],
        queryFn: async () => {
            const res = await api.get<{ data: { vendor: VendorDetail | null } }>("/api/vendors/me");
            return res.data.data.vendor;
        },
    });

    // 카테고리 목록 조회
    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await api.get<{ data: { items: Category[] } }>("/api/categories");
            return res.data.data.items;
        },
    });

    // Geocode mutation: address -> coordinates
    const geocodeMutation = useMutation({
        mutationFn: async (address: string) => {
            const res = await api.post<{ data: { latitude: number; longitude: number } }>("/api/geocode", { address });
            return res.data.data;
        },
    });

    // Handle address selection from VendorAddressSearch
    const handleAddressSelect = useCallback(
        (data: VendorAddressData) => {
            setAddressState((prev) => ({
                ...prev,
                roadAddress: data.roadAddress,
                jibunAddress: data.jibunAddress,
                zonecode: data.zonecode,
                latitude: null,
                longitude: null,
            }));

            // Auto-geocode using the road address
            const addressToGeocode = data.roadAddress || data.jibunAddress;
            if (addressToGeocode) {
                geocodeMutation.mutate(addressToGeocode, {
                    onSuccess: (coords) => {
                        setAddressState((prev) => ({
                            ...prev,
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                        }));
                    },
                    onError: () => {
                        toast.info("좌표 변환에 실패했습니다. 주소는 정상 저장됩니다.");
                    },
                });
            }
        },
        [geocodeMutation],
    );

    const handleAddressDetailChange = useCallback((value: string) => {
        setAddressState((prev) => ({ ...prev, addressDetail: value }));
    }, []);

    const {
        register: registerAccount,
        handleSubmit: handleSubmitAccount,
        reset: resetAccount,
        formState: { errors: accountErrors, isDirty: isAccountDirty },
    } = useForm<AccountFormData>({
        defaultValues: {
            displayName: profile?.displayName ?? "",
            position: profile?.position ?? "",
            phone: profile?.phone ?? "",
            contactPhoneSecondary: "",
        },
    });

    const { register, handleSubmit, reset, control, formState: { errors, isDirty: isFormDirty } } = useForm<VendorFormData>({
        defaultValues: {
            name: "",
            summary: "",
            description: "",
            regionSecondary: "",
        },
    });

    // 본문 이미지 업로드 (WYSIWYG 에디터에서 사용)
    const handleRichImageUpload = useCallback(async (file: File): Promise<string> => {
        const signedRes = await api.post<FileSignedUploadResponse>("/api/files/signed-upload", {
            purpose: "rich_content",
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
        });

        const { bucket, path, token } = signedRes.data.data.upload;
        const fileId = signedRes.data.data.file.id;

        const supabase = getSupabaseBrowserClient();
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .uploadToSignedUrl(path, token, file, { cacheControl: "3600" });
        if (uploadError) throw uploadError;

        return `/api/files/open?fileId=${fileId}`;
    }, []);

    // 폼 초기값 설정: vendorData가 변경될 때 폼을 리셋하고 카테고리/주소도 동기화
    useEffect(() => {
        if (vendorData) {
            reset({
                name: vendorData.name ?? "",
                summary: vendorData.summary ?? "",
                description: vendorData.description ?? "",
                regionSecondary: vendorData.regionSecondary ?? "",
            });
            const newCategoryIds = vendorData.categories?.map((c) => c.id) ?? [];
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedCategoryIds(newCategoryIds);
            setInitialCategoryIds(newCategoryIds);
            const addrKey = [vendorData.roadAddress, vendorData.addressDetail].filter(Boolean).join("|");
            setInitialAddress(addrKey);
            const regions = vendorData.regionPrimary ?? [];
            setSelectedRegions(regions);
            setInitialRegions(regions);
            setAddressState({
                roadAddress: vendorData.roadAddress ?? null,
                jibunAddress: vendorData.jibunAddress ?? null,
                addressDetail: vendorData.addressDetail ?? "",
                zonecode: vendorData.zonecode ?? null,
                latitude: vendorData.latitude ?? null,
                longitude: vendorData.longitude ?? null,
            });
        }
    }, [vendorData, reset]);

    // 계정 정보 초기값 설정 (담당자 정보 + 업체 대표번호)
    useEffect(() => {
        resetAccount({
            displayName: profile?.displayName ?? "",
            position: profile?.position ?? "",
            phone: profile?.phone ?? "",
            contactPhoneSecondary: vendorData?.contactPhoneSecondary ?? "",
        });
    }, [profile?.displayName, profile?.position, profile?.phone, vendorData?.contactPhoneSecondary, resetAccount]);

    // 업체 프로필 생성/수정
    const saveMutation = useMutation({
        mutationFn: async (data: VendorFormData) => {
            const normalizedRoadAddress = normalizeOptionalText(addressState.roadAddress);

            const payload = {
                name: data.name,
                summary: data.summary || null,
                description: data.description || null,
                regionPrimary: selectedRegions.length > 0 ? selectedRegions : null,
                regionSecondary: data.regionSecondary || null,
                roadAddress: normalizedRoadAddress,
                jibunAddress: normalizeOptionalText(addressState.jibunAddress),
                addressDetail: normalizeOptionalText(addressState.addressDetail),
                zonecode: normalizeOptionalText(addressState.zonecode),
                latitude: addressState.latitude,
                longitude: addressState.longitude,
                categoryIds: selectedCategoryIds,
            };

            if (vendorData) {
                return api.patch("/api/vendors/me", payload);
            }
            return api.post("/api/vendors/me", payload);
        },
        onSuccess: async () => {
            toast.success(vendorData ? "업체 프로필이 수정되었습니다" : "업체 프로필이 생성되었습니다");
            // me 데이터 새로고침
            const res = await api.get<{ data: MeData }>("/api/me");
            const data = res.data.data;
            setAuth(data);
            queryClient.invalidateQueries({ queryKey: ["vendor", "me"] });
            queryClient.setQueryData(["auth", "me"], data);
        },
    });

    // 업체 프로필 이미지 업로드
    const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("이미지 파일만 업로드할 수 있습니다");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("5MB 이하의 이미지만 업로드할 수 있습니다");
            return;
        }

        setIsUploadingImage(true);
        try {
            const signedRes = await api.post<FileSignedUploadResponse>("/api/files/signed-upload", {
                purpose: "avatar",
                fileName: file.name,
                mimeType: file.type,
                sizeBytes: file.size,
            });

            const { bucket, path, token } = signedRes.data.data.upload;
            const fileId = signedRes.data.data.file.id;

            const supabase = getSupabaseBrowserClient();
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .uploadToSignedUrl(path, token, file, { cacheControl: "3600" });
            if (uploadError) throw uploadError;

            // 업체 프로필에 이미지 연결
            await api.patch("/api/vendors/me", { profileImageFileId: fileId });

            toast.success("프로필 사진이 변경되었습니다");
            queryClient.invalidateQueries({ queryKey: ["vendor", "me"] });
        } catch {
            toast.error("프로필 사진 업로드에 실패했습니다");
        } finally {
            setIsUploadingImage(false);
            if (imageInputRef.current) imageInputRef.current.value = "";
        }
    };

    // 계정/담당자 정보 수정 (profile + 업체 대표번호)
    const updateAccountMutation = useMutation({
        mutationFn: async (data: AccountFormData) => {
            await api.patch("/api/profile", {
                displayName: data.displayName,
                position: data.position?.trim() ? data.position.trim() : null,
                phone: data.phone || undefined,
            });
            // 업체 프로필이 이미 존재할 때만 업체 대표번호 반영
            if (vendorData) {
                await api.patch("/api/vendors/me", {
                    contactPhoneSecondary: data.contactPhoneSecondary?.trim() ? data.contactPhoneSecondary.trim() : null,
                });
            }
        },
        onSuccess: async () => {
            toast.success("담당자 정보가 수정되었습니다");
            const res = await api.get<{ data: MeData }>("/api/me");
            const data = res.data.data;
            setAuth(data);
            queryClient.setQueryData(["auth", "me"], data);
            queryClient.invalidateQueries({ queryKey: ["vendor", "me"] });
            resetAccount({
                displayName: data.profile?.displayName ?? "",
                position: data.profile?.position ?? "",
                phone: data.profile?.phone ?? "",
                contactPhoneSecondary: vendorData?.contactPhoneSecondary ?? "",
            });
        },
    });

    const toggleCategory = (categoryId: string) => {
        setSelectedCategoryIds((prev) =>
            prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
        );
    };

    const onSubmit = (data: VendorFormData) => {
        if (geocodeMutation.isPending) {
            toast.info("좌표 변환이 끝난 뒤 저장해주세요.");
            return;
        }
        saveMutation.mutate(data);
    };

    // 업체 폼 dirty 판단: 폼 필드 + 카테고리 + 주소 + 서비스 지역
    const isCategoryDirty = JSON.stringify([...selectedCategoryIds].sort()) !== JSON.stringify([...initialCategoryIds].sort());
    const currentAddrKey = [addressState.roadAddress, addressState.addressDetail].filter(Boolean).join("|");
    const isAddressDirty = currentAddrKey !== initialAddress;
    const isRegionsDirty = JSON.stringify([...selectedRegions].sort()) !== JSON.stringify([...initialRegions].sort());
    const isVendorDirty = !vendorData || isFormDirty || isCategoryDirty || isAddressDirty || isRegionsDirty;

    const verification = vendorVerification;
    const verificationStatus = verification?.status;

    // 최상위 카테고리만 필터링
    const topCategories = categories?.filter((c) => c.depth === 1) ?? [];

    if (vendorLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div>
                <h1 className="text-2xl font-bold text-content-primary">업체 프로필</h1>
                <p className="text-gray-500 mt-1">업체 정보를 관리하고 고객에게 노출되는 정보를 수정할 수 있습니다</p>
            </div>

            {/* 프로필 완성도 배너 */}
            {profileCompletion && <ProfileCompletionBanner completion={profileCompletion} />}

            {/* 담당자 정보 */}
            <form
                onSubmit={handleSubmitAccount((data) => updateAccountMutation.mutate(data))}
                className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
            >
                <h2 className="text-lg font-semibold text-content-primary flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    담당자 정보
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            담당자 이름 <span className="text-red-500">*</span>
                        </label>
                        <Input
                            {...registerAccount("displayName", { required: "담당자 이름을 입력해주세요" })}
                            placeholder="예: 홍길동"
                        />
                        {accountErrors.displayName && (
                            <p className="text-sm text-red-500 mt-1">{accountErrors.displayName.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            직책 <span className="text-gray-400 text-xs">(선택)</span>
                        </label>
                        <Input
                            {...registerAccount("position")}
                            placeholder="예: 대표, 영업담당, 마케팅팀장"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            담당자 휴대폰
                        </label>
                        <Input
                            {...registerAccount("phone")}
                            placeholder="예: 010-1234-5678"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            업체 대표번호 <span className="text-gray-400 text-xs">(선택)</span>
                        </label>
                        <Input
                            {...registerAccount("contactPhoneSecondary")}
                            placeholder="예: 02-1234-5678"
                            disabled={!vendorData}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            {vendorData ? "업체 대표전화(유선)" : "업체 프로필 생성 후 입력할 수 있습니다"}
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        이메일
                    </label>
                    <Input
                        value={user?.email ?? ""}
                        disabled
                        className="bg-gray-50"
                    />
                </div>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={updateAccountMutation.isPending || !isAccountDirty}
                        isLoading={updateAccountMutation.isPending}
                    >
                        저장하기
                    </Button>
                </div>
            </form>

            {/* 인증 상태 배너 */}
            {verification && (
                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                    verificationStatus === "approved"
                        ? "bg-green-50 text-green-700"
                        : verificationStatus === "pending"
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-red-50 text-red-700"
                }`}>
                    {verificationStatus === "approved" ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : verificationStatus === "pending" ? (
                        <Clock className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                    <div>
                        <p className="font-medium">
                            {verificationStatus === "approved"
                                ? "사업자 인증 완료"
                                : verificationStatus === "pending"
                                ? "인증 심사 중"
                                : "인증 반려"}
                        </p>
                        {verificationStatus === "rejected" && verification.rejectReason && (
                            <p className="text-sm mt-0.5">{verification.rejectReason}</p>
                        )}
                    </div>
                </div>
            )}

            {/* 프로필이 없는 경우 안내 */}
            {!vendorData && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 text-blue-700">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">업체 프로필을 등록해주세요</p>
                        <p className="text-sm mt-0.5">
                            업체 프로필을 등록하면 고객에게 노출되어 문의를 받을 수 있습니다
                        </p>
                    </div>
                </div>
            )}

            {/* 폼 */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 기본 정보 */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-content-primary mb-5 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        기본 정보
                    </h2>

                    <div className="space-y-5">
                        {/* 업체 프로필 사진 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                프로필 사진
                            </label>
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="relative w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                                        {vendorData?.profileImageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={vendorData.profileImageUrl}
                                                alt="업체 프로필"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Building2 className="w-10 h-10 text-gray-400" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={isUploadingImage || !vendorData}
                                        className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUploadingImage ? (
                                            <Spinner size="sm" className="text-white" />
                                        ) : (
                                            <Camera className="w-4 h-4" />
                                        )}
                                    </button>
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfileImageUpload}
                                        className="hidden"
                                    />
                                </div>
                                <div className="text-sm text-gray-500">
                                    <p>고객에게 보여지는 업체 대표 이미지입니다.</p>
                                    <p className="mt-1">JPG, PNG 형식, 5MB 이하</p>
                                </div>
                            </div>
                        </div>

                        {/* 업체명 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                업체명 <span className="text-red-500">*</span>
                            </label>
                            <Input
                                {...register("name", { required: "업체명을 입력해주세요" })}
                                placeholder="예: 메디허브 한약방"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                            )}
                        </div>

                        {/* 한 줄 소개 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                한 줄 소개
                            </label>
                            <Input
                                {...register("summary")}
                                placeholder="업체를 한 줄로 소개해주세요"
                            />
                        </div>

                        {/* 상세 설명 (WYSIWYG) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                상세 설명
                            </label>
                            <Controller
                                control={control}
                                name="description"
                                render={({ field }) => (
                                    <RichEditor
                                        value={field.value ?? ""}
                                        onChange={field.onChange}
                                        onImageUpload={handleRichImageUpload}
                                        placeholder="업체에 대해 자세히 설명해주세요. 이미지도 삽입할 수 있습니다."
                                        minHeight={280}
                                    />
                                )}
                            />
                            <p className="mt-1.5 text-xs text-gray-500">
                                서식과 이미지를 활용해 업체를 풍성하게 소개할 수 있습니다
                            </p>
                        </div>
                    </div>
                </div>

                {/* 업체 주소 */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-content-primary mb-5 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        업체 주소
                    </h2>

                    <VendorAddressSearch
                        currentAddress={addressState}
                        addressDetail={addressState.addressDetail}
                        onAddressSelect={handleAddressSelect}
                        onAddressDetailChange={handleAddressDetailChange}
                        isGeocoding={geocodeMutation.isPending}
                        disabled={saveMutation.isPending || geocodeMutation.isPending}
                    />

                    {/* 서비스 가능 지역 (주소와 별개) */}
                    <div className="mt-5 pt-5 border-t border-gray-100">
                        <p className="text-sm text-gray-500 mb-3">
                            서비스 가능 지역 (사업장 주소와 별도로 설정할 수 있습니다)
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    주요 지역 <span className="text-xs text-gray-400 font-normal">(복수 선택)</span>
                                </label>
                                <Select
                                    isMulti
                                    isSearchable
                                    options={SERVICE_REGION_OPTIONS.map((opt) => ({
                                        ...opt,
                                        // "전국" 선택 시 나머지 disabled, 다른 지역 선택 시 "전국" disabled
                                        isDisabled:
                                            (selectedRegions.includes("전국") && opt.value !== "전국") ||
                                            (selectedRegions.length > 0 && !selectedRegions.includes("전국") && opt.value === "전국"),
                                    }))}
                                    value={SERVICE_REGION_OPTIONS.filter((o) => selectedRegions.includes(String(o.value)))}
                                    onChange={(option) => {
                                        if (!option) {
                                            setSelectedRegions([]);
                                            return;
                                        }
                                        const opts = Array.isArray(option) ? option : [option];
                                        const values = opts.map((o) => String(o.value));
                                        // "전국"이 추가되면 전국 단독
                                        if (values.includes("전국") && !selectedRegions.includes("전국")) {
                                            setSelectedRegions(["전국"]);
                                            return;
                                        }
                                        setSelectedRegions(values);
                                    }}
                                    placeholder="서비스 가능한 지역을 선택하세요"
                                    noOptionsMessage={() => "옵션이 없습니다"}
                                />
                                <p className="mt-1.5 text-xs text-gray-500">
                                    전국 서비스면 &quot;전국&quot;, 특정 지역만이면 해당 시/도를 선택하세요
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    세부 지역 <span className="text-xs text-gray-400 font-normal">(선택)</span>
                                </label>
                                <Input
                                    {...register("regionSecondary")}
                                    placeholder="예: 강남구, 서초구, 송파구"
                                />
                                <p className="mt-1.5 text-xs text-gray-500">
                                    특정 구/군 단위로 제한이 있다면 자유롭게 작성하세요
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 카테고리 */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-content-primary mb-5 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-primary" />
                        서비스 카테고리
                    </h2>
                    <p className="mb-4 text-sm text-gray-500">
                        상품 등록은 <span className="font-medium text-content-primary">상품형</span> 카테고리를 선택한 뒤
                        진행할 수 있어요. <span className="font-medium text-content-primary">업체형</span> 카테고리는
                        리드/문의 중심으로 사용됩니다.
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {topCategories.map((category) => {
                            const isSelected = selectedCategoryIds.includes(category.id);
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => toggleCategory(category.id)}
                                    className={`min-w-[132px] rounded-xl border px-4 py-3 text-left transition-colors ${
                                        isSelected
                                            ? "border-primary bg-primary-25 text-content-primary"
                                            : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    <span className="block text-sm font-semibold">{category.name}</span>
                                    <span
                                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                            category.listingType === "product"
                                                ? isSelected
                                                    ? "bg-primary text-white"
                                                    : "bg-blue-100 text-blue-700"
                                                : isSelected
                                                  ? "bg-white text-content-primary"
                                                  : "bg-gray-200 text-gray-600"
                                        }`}
                                    >
                                        {category.listingType === "product" ? "상품형" : "업체형"}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {topCategories.length === 0 && (
                        <p className="text-sm text-gray-500">카테고리가 없습니다</p>
                    )}
                </div>

                {/* 제출 버튼 */}
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={saveMutation.isPending || geocodeMutation.isPending || !isVendorDirty}
                        isLoading={saveMutation.isPending}
                    >
                        {vendorData ? "저장하기" : "업체 프로필 등록"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
