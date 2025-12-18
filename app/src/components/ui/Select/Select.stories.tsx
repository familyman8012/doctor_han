import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useForm, Controller } from "react-hook-form";
import { Select, type IOption } from "./Select";
import { Badge } from "../Badge/Badge";
import { Hash, Type, Folder, Tag, Calendar, Globe, FileText } from "lucide-react";

const meta: Meta<typeof Select> = {
    title: "Ui/Select",
    component: Select,
    tags: ["autodocs"],
    parameters: {
        docs: {
            story: { inline: true },
            canvas: { sourceState: "shown" },
            source: { type: "code" },
        },
    },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
    render: () => {
        const [selectedOption, setSelectedOption] = useState<IOption | null>(null);

        const options: IOption[] = [
            { value: "apple", label: "Apple" },
            { value: "banana", label: "Banana" },
            { value: "cherry", label: "Cherry" },
            { value: "date", label: "Date" },
            { value: "elderberry", label: "Elderberry" },
        ];

        return (
            <div className="w-96">
                <Select
                    options={options}
                    value={selectedOption}
                    onChange={(option) => setSelectedOption(option as IOption | null)}
                    placeholder="Select a fruit..."
                />

                <div className="mt-4">
                    {selectedOption ? (
                        <p>You selected: {selectedOption.label}</p>
                    ) : (
                        <p className="text-gray-500">Please select an option</p>
                    )}
                </div>
            </div>
        );
    },
};

export const WithPrefixLabel: Story = {
    render: () => {
        const [selectedOption, setSelectedOption] = useState<IOption | null>(null);

        const options: IOption[] = [
            { value: "all", label: "전체" },
            { value: "active", label: "활성" },
            { value: "inactive", label: "비활성" },
        ];

        return (
            <div className="w-96">
                <Select
                    options={options}
                    value={selectedOption}
                    onChange={(option) => setSelectedOption(option as IOption | null)}
                    placeholder="전체"
                    prefixLabel="상태:"
                />
            </div>
        );
    },
};

export const WithStatusBadge: Story = {
    render: () => {
        const [selectedOption, setSelectedOption] = useState<IOption | null>(null);

        const options: IOption[] = [
            { value: "1", label: "Option 1", status: "enabled" },
            { value: "2", label: "Option 2", status: "disabled" },
            { value: "3", label: "Option 3", status: "pending" },
            { value: "4", label: "Option 4", status: "enabled" },
        ];

        const formatStatus = (status: string) => {
            switch (status) {
                case "enabled":
                    return (
                        <Badge color="green" size="sm">
                            사용
                        </Badge>
                    );
                case "disabled":
                    return (
                        <Badge color="red" size="sm">
                            미사용
                        </Badge>
                    );
                case "pending":
                    return (
                        <Badge color="yellow" size="sm">
                            대기중
                        </Badge>
                    );
                default:
                    return null;
            }
        };

        return (
            <div className="w-96">
                <Select
                    options={options}
                    value={selectedOption}
                    onChange={(option) => setSelectedOption(option as IOption | null)}
                    formatStatus={formatStatus}
                    placeholder="Select an option..."
                />
            </div>
        );
    },
};

export const ReactHookForm: Story = {
    render: () => {
        type FormData = {
            fruit: IOption | null;
            category: IOption | null;
        };

        const { control, handleSubmit, watch } = useForm<FormData>({
            defaultValues: {
                fruit: null,
                category: { value: "electronics", label: "Electronics" },
            },
        });

        const fruitOptions: IOption[] = [
            { value: "apple", label: "Apple" },
            { value: "banana", label: "Banana" },
            { value: "cherry", label: "Cherry" },
        ];

        const categoryOptions: IOption[] = [
            { value: "electronics", label: "Electronics" },
            { value: "clothing", label: "Clothing" },
            { value: "food", label: "Food" },
            { value: "books", label: "Books" },
        ];

        const onSubmit = (data: FormData) => {
            alert(JSON.stringify(data, null, 2));
        };

        const watchedValues = watch();

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-96">
                <div>
                    <label className="block text-sm font-medium mb-2">Fruit Selection</label>
                    <Controller
                        name="fruit"
                        control={control}
                        render={({ field }) => (
                            <Select
                                options={fruitOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select a fruit..."
                            />
                        )}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Category (with default)</label>
                    <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                            <Select
                                options={categoryOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select a category..."
                            />
                        )}
                    />
                </div>

                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Submit
                </button>

                <div className="mt-4 p-4 bg-gray-50 rounded">
                    <p className="text-sm font-medium mb-2">Form Values:</p>
                    <pre className="text-xs">{JSON.stringify(watchedValues, null, 2)}</pre>
                </div>
            </form>
        );
    },
};

export const States: Story = {
    render: () => {
        const options: IOption[] = [
            { value: "1", label: "Option 1" },
            { value: "2", label: "Option 2" },
            { value: "3", label: "Option 3" },
        ];

        return (
            <div className="space-y-4 w-96">
                <div>
                    <label className="block text-sm font-medium mb-2">Default</label>
                    <Select options={options} placeholder="Select..." />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">With Value</label>
                    <Select options={options} value={options[0]} placeholder="Select..." />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Disabled</label>
                    <Select options={options} isDisabled placeholder="Disabled select" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Not Searchable</label>
                    <Select options={options} isSearchable={false} placeholder="Not searchable..." />
                </div>
            </div>
        );
    },
};

export const WithDescription: Story = {
    render: () => {
        const [selectedOption, setSelectedOption] = useState<IOption | null>(null);

        const options: IOption[] = [
            {
                value: "taxed",
                label: "과세",
                description: "공급가액에 VAT 10%가 추가됩니다. 세금계산서 발행 대상",
            },
            {
                value: "tax-free",
                label: "영세",
                description: "과세대상이지만, 비율이 0% 입니다. 세금계산서 발행 대상",
            },
            {
                value: "exempt",
                label: "면세",
                description: "세금부과대상이 아닙니다. 세금계산서 발행 대상",
            },
            {
                value: "non-taxable",
                label: "비대상",
                description: "무상출고 등 회계/세무 업무의 대상이 아닌 경우. 세금계산서 발행하지 않습니다.",
            },
            {
                value: "direct-export",
                label: "직수출",
                description: "세금계산서 발행하지 않습니다.",
            },
        ];

        return (
            <div className="w-[500px]">
                <label className="block text-sm font-medium mb-2">
                    매출유형 <span className="text-red-500">*</span>
                </label>
                <Select
                    options={options}
                    value={selectedOption}
                    onChange={(option) => setSelectedOption(option as IOption | null)}
                    placeholder="선택해주세요"
                />

                {selectedOption && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">선택된 항목</div>
                        <div className="text-sm font-medium text-gray-900">{selectedOption.label}</div>
                        {selectedOption.description && (
                            <div className="text-xs text-gray-600 mt-1">{selectedOption.description}</div>
                        )}
                    </div>
                )}
            </div>
        );
    },
};

export const MultiSelect: Story = {
    render: () => {
        const [selectedOptions, setSelectedOptions] = useState<IOption[]>([]);

        const options: IOption[] = [
            { value: "학생기능", label: "🎓 학생기능" },
            { value: "출고요청", label: "📦 출고요청" },
            { value: "홍고추", label: "🌶️ 홍고추" },
            { value: "출고자", label: "👤 출고자" },
            { value: "출고카드", label: "💳 출고카드" },
            { value: "청소", label: "🧹 청소" },
        ];

        return (
            <div className="w-96">
                <label className="block text-sm font-medium mb-2">복수선택 가능</label>
                <Select
                    options={options}
                    value={selectedOptions}
                    onChange={(newValue) => setSelectedOptions(newValue as IOption[])}
                    placeholder="복수선택가능"
                    isMulti={true}
                    isClearable={true}
                />

                <div className="mt-4">
                    <p className="text-sm text-gray-600">Selected items: {selectedOptions.length}</p>
                    {selectedOptions.length > 0 && (
                        <ul className="mt-2 space-y-1">
                            {selectedOptions.map((option) => (
                                <li key={option.value} className="text-sm">
                                    • {option.label}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        );
    },
};

export const MultiSelectWithBadges: Story = {
    render: () => {
        const [selectedTags, setSelectedTags] = useState<IOption[]>([]);

        const tagOptions: IOption[] = [
            { value: "react", label: "React", status: "frontend" },
            { value: "vue", label: "Vue", status: "frontend" },
            { value: "angular", label: "Angular", status: "frontend" },
            { value: "node", label: "Node.js", status: "backend" },
            { value: "python", label: "Python", status: "backend" },
            { value: "java", label: "Java", status: "backend" },
            { value: "docker", label: "Docker", status: "devops" },
            { value: "k8s", label: "Kubernetes", status: "devops" },
        ];

        const formatStatus = (status: string) => {
            const colors: Record<string, string> = {
                frontend: "blue",
                backend: "green",
                devops: "purple",
            };
            return (
                <Badge color={colors[status] as any} size="sm">
                    {status}
                </Badge>
            );
        };

        return (
            <div className="w-[500px]">
                <label className="block text-sm font-medium mb-2">Select Technologies</label>
                <Select
                    options={tagOptions}
                    value={selectedTags}
                    onChange={(newValue) => setSelectedTags(newValue as IOption[])}
                    placeholder="Select multiple technologies..."
                    isMulti={true}
                    isClearable={true}
                    formatStatus={formatStatus}
                />

                {selectedTags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                            <Badge key={tag.value} color="indigo">
                                {tag.label}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        );
    },
};

export const WithUserProfiles: Story = {
    render: () => {
        const [selectedUser, setSelectedUser] = useState<IOption | null>(null);

        const userOptions: IOption[] = [
            {
                value: "sarah-chen",
                label: "Sarah Chen",
                description: "sarah.chen@company.com",
                icon: <img src="https://i.pravatar.cc/40?img=1" alt="Sarah" className="w-8 h-8 rounded-full" />,
            },
            {
                value: "james-kim",
                label: "James Kim",
                description: "james.kim@company.com",
                icon: <img src="https://i.pravatar.cc/40?img=3" alt="James" className="w-8 h-8 rounded-full" />,
            },
            {
                value: "maria-garcia",
                label: "Maria Garcia",
                description: "maria.garcia@company.com",
                icon: <img src="https://i.pravatar.cc/40?img=5" alt="Maria" className="w-8 h-8 rounded-full" />,
            },
            {
                value: "alex-johnson",
                label: "Alex Johnson",
                description: "alex.johnson@company.com",
                icon: <img src="https://i.pravatar.cc/40?img=7" alt="Alex" className="w-8 h-8 rounded-full" />,
            },
            {
                value: "emma-wilson",
                label: "Emma Wilson",
                description: "emma.wilson@company.com",
                icon: <img src="https://i.pravatar.cc/40?img=9" alt="Emma" className="w-8 h-8 rounded-full" />,
            },
            {
                value: "michael-lee",
                label: "Michael Lee",
                description: "michael.lee@company.com",
                icon: <img src="https://i.pravatar.cc/40?img=11" alt="Michael" className="w-8 h-8 rounded-full" />,
            },
            {
                value: "sophia-park",
                label: "Sophia Park",
                description: "sophia.park@company.com",
                icon: <img src="https://i.pravatar.cc/40?img=20" alt="Sophia" className="w-8 h-8 rounded-full" />,
            },
            {
                value: "david-chang",
                label: "David Chang",
                description: "david.chang@company.com",
                icon: <img src="https://i.pravatar.cc/40?img=14" alt="David" className="w-8 h-8 rounded-full" />,
            },
        ];

        return (
            <div className="w-96">
                <label className="block text-sm font-medium mb-2">Assign to team member</label>
                <Select
                    options={userOptions}
                    value={selectedUser}
                    onChange={(option) => setSelectedUser(option as IOption | null)}
                    placeholder="Select team member..."
                    isSearchable={true}
                />

                {selectedUser && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-xs text-gray-500 mb-2">Assigned to</div>
                        <div className="flex items-center gap-3">
                            {selectedUser.icon}
                            <div>
                                <div className="text-sm font-medium text-gray-900">{selectedUser.label}</div>
                                <div className="text-xs text-gray-600">{selectedUser.description}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    },
};

export const WithIconsAndCheckmark: Story = {
    render: () => {
        const [selectedOption, setSelectedOption] = useState<IOption | null>(null);

        const options: IOption[] = [
            { value: "first-filter", label: "출고요청번호", icon: <Type className="h-4 w-4 text-gray-500" /> },
            { value: "second-filter", label: "출고요청호", icon: <Type className="h-4 w-4 text-gray-500" /> },
            { value: "delivery-status", label: "출고유형", icon: <Folder className="h-4 w-4 text-gray-500" /> },
            { value: "shop", label: "샵터", icon: <Tag className="h-4 w-4 text-gray-500" /> },
            { value: "settlement", label: "세금유형", icon: <FileText className="h-4 w-4 text-gray-500" /> },
            { value: "new-user", label: "신청인", icon: <Globe className="h-4 w-4 text-gray-500" /> },
            { value: "deadline", label: "출고학년일", icon: <Calendar className="h-4 w-4 text-gray-500" /> },
            { value: "delivery", label: "출고일", icon: <Calendar className="h-4 w-4 text-gray-500" /> },
            { value: "sku", label: "대표 SKU", icon: <Hash className="h-4 w-4 text-gray-500" /> },
            { value: "sku-quantity", label: "SKU갯수", icon: <Hash className="h-4 w-4 text-gray-500" /> },
            { value: "recipient", label: "대표수신인", icon: <Type className="h-4 w-4 text-gray-500" /> },
            { value: "person-count", label: "펜터인명", icon: <Type className="h-4 w-4 text-gray-500" /> },
        ];

        return (
            <div className="w-96">
                <label className="block text-sm font-medium mb-2">Filter Option</label>
                <Select
                    options={options}
                    value={selectedOption}
                    onChange={(option) => setSelectedOption(option as IOption | null)}
                    placeholder="출고요청번호"
                    showCheckmark={true}
                    isSearchable={true}
                />

                {selectedOption && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Selected filter</div>
                        <div className="text-sm font-medium text-gray-900">{selectedOption.label}</div>
                    </div>
                )}
            </div>
        );
    },
};

export const UsageExample: Story = {
    render: () => {
        const [country, setCountry] = useState<IOption | null>(null);
        const [city, setCity] = useState<IOption | null>(null);

        const countryOptions: IOption[] = [
            { value: "kr", label: "South Korea" },
            { value: "us", label: "United States" },
            { value: "jp", label: "Japan" },
            { value: "cn", label: "China" },
        ];

        const cityOptions: Record<string, IOption[]> = {
            kr: [
                { value: "seoul", label: "Seoul" },
                { value: "busan", label: "Busan" },
                { value: "daegu", label: "Daegu" },
            ],
            us: [
                { value: "ny", label: "New York" },
                { value: "la", label: "Los Angeles" },
                { value: "chicago", label: "Chicago" },
            ],
            jp: [
                { value: "tokyo", label: "Tokyo" },
                { value: "osaka", label: "Osaka" },
                { value: "kyoto", label: "Kyoto" },
            ],
            cn: [
                { value: "beijing", label: "Beijing" },
                { value: "shanghai", label: "Shanghai" },
                { value: "guangzhou", label: "Guangzhou" },
            ],
        };

        const handleCountryChange = (option: IOption | IOption[] | null) => {
            if (Array.isArray(option)) {
                return;
            }
            setCountry(option ?? null);
            setCity(null); // Reset city when country changes
        };

        return (
            <div className="space-y-4 w-96">
                <h3 className="text-lg font-semibold">Location Selection</h3>

                <div>
                    <label className="block text-sm font-medium mb-2">Country</label>
                    <Select
                        options={countryOptions}
                        value={country}
                        onChange={handleCountryChange}
                        placeholder="Select a country..."
                    />
                </div>

                {country && (
                    <div>
                        <label className="block text-sm font-medium mb-2">City</label>
                        <Select
                            options={cityOptions[country.value as string] || []}
                            value={city}
                            onChange={(option) => {
                                if (Array.isArray(option)) {
                                    return;
                                }
                                setCity(option ?? null);
                            }}
                            placeholder="Select a city..."
                        />
                    </div>
                )}

                {country && city && (
                    <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-green-800">
                            Selected: {city.label}, {country.label}
                        </p>
                    </div>
                )}
            </div>
        );
    },
};
