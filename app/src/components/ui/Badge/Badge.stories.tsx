import type { Meta, StoryObj } from "@storybook/react";
import { Star, ArrowRight } from "lucide-react";
import { Badge, type BadgeProps } from "./Badge";
import { TextBadge } from "./TextBadge";
import { TimeBadge } from "./TimeBadge";

const meta: Meta<Props> = {
    title: "Ui/Badge",
    component: Badge,
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

interface Props extends BadgeProps {
    darkMode: boolean;
}

const colors = [
    "success",
    "warning",
    "error",
    "info",
    "neutral",
    "primary",
    "secondary",
    "purple",
    "orange",
    "pink",
    "indigo",
    "teal",
    "amber",
] as const;

type Story = StoryObj<Props>;

const StoryBadge = (args: Props) => {
    return (
        <div className="p-8">
            <style>
                {`
          .badge-row {
            display: flex;
            margin-bottom: 10px;
            gap: 10px;
          }
        `}
            </style>

            {/* Circle badge */}
            <div className="badge-row">
                <Badge color="orange" size="circle">
                    N
                </Badge>
            </div>

            {/* With dot - lg */}
            <div className="badge-row">
                {colors.map((el) => (
                    <Badge key={el} color={el} dot size="md">
                        label
                    </Badge>
                ))}
            </div>

            {/* With dot - md */}
            <div className="badge-row">
                {colors.map((el) => (
                    <Badge key={el} color={el} dot>
                        label
                    </Badge>
                ))}
            </div>

            {/* With dot - sm */}
            <div className="badge-row">
                {colors.map((el) => (
                    <Badge key={el} color={el} size="sm" dot>
                        label
                    </Badge>
                ))}
            </div>

            {/* Without dot - lg */}
            <div className="badge-row">
                {colors.map((el) => (
                    <Badge key={el} color={el} size="md">
                        label
                    </Badge>
                ))}
            </div>

            {/* Without dot - md */}
            <div className="badge-row">
                {colors.map((el) => (
                    <Badge key={el} color={el}>
                        label
                    </Badge>
                ))}
            </div>

            {/* Without dot - sm */}
            <div className="badge-row">
                {colors.map((el) => (
                    <Badge key={el} color={el} size="sm">
                        label
                    </Badge>
                ))}
            </div>

            {/* Outline fill */}
            <div className="badge-row">
                {colors.map((el) => (
                    <Badge key={el} color={el} fill="outline">
                        label
                    </Badge>
                ))}
            </div>

            {/* Outline fill with dot */}
            <div className="badge-row">
                {colors.map((el) => (
                    <Badge key={el} color={el} dot fill="outline">
                        label
                    </Badge>
                ))}
            </div>

            {/* Transparent fill with dot */}
            <div className="badge-row">
                {colors.map((el) => (
                    <Badge key={el} color={el} fill="transparent" dot>
                        label
                    </Badge>
                ))}
            </div>

            {/* With icons */}
            <div className="badge-row">
                <Badge LeadingIcon={<Star />}>처리 중</Badge>
                <Badge
                    {...args}
                    LeadingIcon={
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src="https://res.cloudinary.com/tailwindcss/image/upload/v1635279277/nl_tpy2ab.svg"
                            alt="nl"
                            width="16"
                            height="16"
                        />
                    }
                >
                    Label
                </Badge>
                <Badge {...args} TrailingIcon={<ArrowRight />}>
                    Label
                </Badge>
                <Badge size="md" LeadingIcon={<Star />} TrailingIcon={<ArrowRight />}>
                    error, sm
                </Badge>
            </div>
        </div>
    );
};

const Default: Story = {
    render: (args) => <StoryBadge {...args} />,
    args: {
        size: "md",
        darkMode: false,
    },
    parameters: {
        controls: { exclude: ["LeadingIcon", "TrailingIcon", "className"] },
    },
};

// TimeBadge Story
const StoryTimeBadge = (_: Props) => {
    void _;
    return (
        <div className="p-8">
            <TimeBadge time={65} />
        </div>
    );
};
const TimeBadgeCase: Story = {
    render: (args) => <StoryTimeBadge {...args} />,
};

// TextBadge Story
const StoryTextBadge = (_: Props) => {
    void _;
    return (
        <div className="p-8 space-y-6">
            <div>
                <TextBadge text="토마토 소스 면적" color="red" />
            </div>
            <div>
                <TextBadge text="100점~70점" color="blue" />
            </div>
            <div>
                <TextBadge text="70점~50점" color="yellow" />
            </div>
            <div>
                <TextBadge text="50점~0점" color="orange" />
            </div>
        </div>
    );
};
const TextBadgeCase: Story = {
    render: (args) => <StoryTextBadge {...args} />,
};

// Usage Examples
export const UsageExamples: Story = {
    render: () => (
        <div className="p-8 space-y-8">
            <div>
                <h3 className="text-lg font-bold mb-4">실제 사용 예제 코드</h3>
                <p className="text-sm text-gray-600 mb-6">
                    아래는 실제 React 컴포넌트에서 Badge를 사용하는 방법입니다.
                </p>
            </div>

            <div className="space-y-6">
                {/* 기본 Badge */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">기본 Badge</h4>
                    <div className="mb-4 flex gap-2">
                        <Badge color="green">성공</Badge>
                        <Badge color="red">실패</Badge>
                        <Badge color="blue">진행중</Badge>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`import { Badge } from "@/components/ui/Badge/Badge";

<Badge color="green">성공</Badge>
<Badge color="red">실패</Badge>
<Badge color="blue">진행중</Badge>`}
                    </pre>
                </div>

                {/* Dot이 있는 Badge */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Dot이 있는 Badge</h4>
                    <div className="mb-4 flex gap-2">
                        <Badge color="green" dot>
                            온라인
                        </Badge>
                        <Badge color="gray" dot>
                            오프라인
                        </Badge>
                        <Badge color="yellow" dot>
                            대기중
                        </Badge>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`<Badge color="green" dot>온라인</Badge>
<Badge color="gray" dot>오프라인</Badge>
<Badge color="yellow" dot>대기중</Badge>`}
                    </pre>
                </div>

                {/* 아이콘이 있는 Badge */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">아이콘이 있는 Badge</h4>
                    <div className="mb-4 flex gap-2">
                        <Badge LeadingIcon={<Star />} color="yellow">
                            즐겨찾기
                        </Badge>
                        <Badge TrailingIcon={<ArrowRight />} color="blue">
                            더보기
                        </Badge>
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`import { Star, ArrowRight } from "lucide-react";

<Badge LeadingIcon={<Star />} color="yellow">
  즐겨찾기
</Badge>
<Badge TrailingIcon={<ArrowRight />} color="blue">
  더보기
</Badge>`}
                    </pre>
                </div>

                {/* TextBadge */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">TextBadge (점수, 상태 표시용)</h4>
                    <div className="mb-4 flex gap-2">
                        <TextBadge text="100점" color="blue" />
                        <TextBadge text="경고" color="yellow" />
                        <TextBadge text="오류" color="red" />
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`import { TextBadge } from "@/components/ui/Badge/TextBadge";

<TextBadge text="100점" color="blue" />
<TextBadge text="경고" color="yellow" />
<TextBadge text="오류" color="red" />`}
                    </pre>
                </div>

                {/* TimeBadge */}
                <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">TimeBadge (시간 표시용)</h4>
                    <div className="mb-4 flex gap-2">
                        <TimeBadge time={65} />
                        <TimeBadge time={180} />
                        <TimeBadge time={3600} />
                    </div>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {`import { TimeBadge } from "@/components/ui/Badge/TimeBadge";

<TimeBadge time={65} />    // 01:05
<TimeBadge time={180} />   // 03:00
<TimeBadge time={3600} />  // 60:00`}
                    </pre>
                </div>
            </div>
        </div>
    ),
    parameters: {
        docs: {
            source: {
                code: null,
            },
        },
    },
};

// 나머지 stories를 나중에 export
export { Default, TimeBadgeCase, TextBadgeCase };
