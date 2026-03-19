interface RegionOption {
    label: string;
    value: string;
    aliases: readonly string[];
    districts: readonly string[];
}

export const REGION_OPTIONS: readonly RegionOption[] = [
    {
        label: "서울",
        value: "서울특별시",
        aliases: ["서울", "서울시"],
        districts: [
            "강남구",
            "강동구",
            "강북구",
            "강서구",
            "관악구",
            "광진구",
            "구로구",
            "금천구",
            "노원구",
            "도봉구",
            "동대문구",
            "동작구",
            "마포구",
            "서대문구",
            "서초구",
            "성동구",
            "성북구",
            "송파구",
            "양천구",
            "영등포구",
            "용산구",
            "은평구",
            "종로구",
            "중구",
            "중랑구",
        ],
    },
    {
        label: "부산",
        value: "부산광역시",
        aliases: ["부산"],
        districts: [
            "강서구",
            "금정구",
            "기장군",
            "남구",
            "동구",
            "동래구",
            "부산진구",
            "북구",
            "사상구",
            "사하구",
            "서구",
            "수영구",
            "연제구",
            "영도구",
            "중구",
            "해운대구",
        ],
    },
    {
        label: "대구",
        value: "대구광역시",
        aliases: ["대구"],
        districts: ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"],
    },
    {
        label: "인천",
        value: "인천광역시",
        aliases: ["인천"],
        districts: ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"],
    },
    {
        label: "광주",
        value: "광주광역시",
        aliases: ["광주"],
        districts: ["광산구", "남구", "동구", "북구", "서구"],
    },
    {
        label: "대전",
        value: "대전광역시",
        aliases: ["대전"],
        districts: ["대덕구", "동구", "서구", "유성구", "중구"],
    },
    {
        label: "울산",
        value: "울산광역시",
        aliases: ["울산"],
        districts: ["남구", "동구", "북구", "울주군", "중구"],
    },
    {
        label: "세종",
        value: "세종특별자치시",
        aliases: ["세종", "세종시"],
        districts: ["세종시"],
    },
    {
        label: "경기",
        value: "경기도",
        aliases: ["경기"],
        districts: [
            "가평군",
            "고양시",
            "과천시",
            "광명시",
            "광주시",
            "구리시",
            "군포시",
            "김포시",
            "남양주시",
            "동두천시",
            "부천시",
            "성남시",
            "수원시",
            "시흥시",
            "안산시",
            "안성시",
            "안양시",
            "양주시",
            "양평군",
            "여주시",
            "연천군",
            "오산시",
            "용인시",
            "의왕시",
            "의정부시",
            "이천시",
            "파주시",
            "평택시",
            "포천시",
            "하남시",
            "화성시",
        ],
    },
    {
        label: "강원",
        value: "강원특별자치도",
        aliases: ["강원", "강원도"],
        districts: [
            "강릉시",
            "고성군",
            "동해시",
            "삼척시",
            "속초시",
            "양구군",
            "양양군",
            "영월군",
            "원주시",
            "인제군",
            "정선군",
            "철원군",
            "춘천시",
            "태백시",
            "평창군",
            "홍천군",
            "화천군",
            "횡성군",
        ],
    },
    {
        label: "충북",
        value: "충청북도",
        aliases: ["충북"],
        districts: ["괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", "청주시", "충주시"],
    },
    {
        label: "충남",
        value: "충청남도",
        aliases: ["충남"],
        districts: ["계룡시", "공주시", "금산군", "논산시", "당진시", "보령시", "부여군", "서산시", "서천군", "아산시", "예산군", "천안시", "청양군", "태안군", "홍성군"],
    },
    {
        label: "전북",
        value: "전북특별자치도",
        aliases: ["전북", "전라북도"],
        districts: ["고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", "임실군", "장수군", "전주시", "정읍시", "진안군"],
    },
    {
        label: "전남",
        value: "전라남도",
        aliases: ["전남"],
        districts: [
            "강진군",
            "고흥군",
            "곡성군",
            "광양시",
            "구례군",
            "나주시",
            "담양군",
            "목포시",
            "무안군",
            "보성군",
            "순천시",
            "신안군",
            "여수시",
            "영광군",
            "영암군",
            "완도군",
            "장성군",
            "장흥군",
            "진도군",
            "함평군",
            "해남군",
            "화순군",
        ],
    },
    {
        label: "경북",
        value: "경상북도",
        aliases: ["경북"],
        districts: ["경산시", "경주시", "고령군", "구미시", "군위군", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군", "포항시"],
    },
    {
        label: "경남",
        value: "경상남도",
        aliases: ["경남"],
        districts: ["거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군", "창원시", "통영시", "하동군", "함안군", "함양군", "합천군"],
    },
    {
        label: "제주",
        value: "제주특별자치도",
        aliases: ["제주", "제주도"],
        districts: ["서귀포시", "제주시"],
    },
] as const;

export const REGIONS = Object.fromEntries(
    REGION_OPTIONS.map((region) => [region.value, [...region.districts]]),
) as Record<string, string[]>;

export const SIDO_LIST = REGION_OPTIONS.map((region) => region.value);

function findRegionOption(input?: string | null) {
    const normalized = input?.trim();
    if (!normalized) return undefined;

    return REGION_OPTIONS.find((region) =>
        region.value === normalized
        || region.label === normalized
        || region.aliases.includes(normalized),
    );
}

export function getRegionLabel(input?: string | null) {
    return findRegionOption(input)?.label ?? input?.trim() ?? undefined;
}

export function normalizeRegionPrimaryValue(input?: string | null) {
    return findRegionOption(input)?.value ?? input?.trim() ?? undefined;
}

export function getRegionFilterValues(input?: string | null) {
    const region = findRegionOption(input);
    if (!region) {
        const normalized = input?.trim();
        return normalized ? [normalized] : [];
    }

    return Array.from(new Set([region.value, region.label, ...region.aliases]));
}
