import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import ImageUploader from "./ImageUploader";

const meta: Meta<typeof ImageUploader> = {
    title: "Widgets/ImageUploader",
    component: ImageUploader,
    tags: ["autodocs"],
    parameters: {
        docs: {
            story: { inline: true },
            canvas: { sourceState: "shown" },
            source: { type: "code" },
        },
    },
    argTypes: {
        pageMode: {
            control: "select",
            options: ["add", "edit"],
            description: "페이지 모드",
        },
        isReadOnly: {
            control: "boolean",
            description: "읽기 전용 모드",
        },
        productImage: {
            control: "text",
            description: "초기 이미지 URL",
        },
        maxSizeMB: {
            control: "number",
            description: "최대 파일 크기 (MB)",
        },
        acceptTypes: {
            control: "text",
            description: "허용할 파일 타입",
        },
        maxWidth: {
            control: "text",
            description: "컨테이너 최대 너비",
        },
        height: {
            control: "text",
            description: "컨테이너 높이",
        },
    },
};

export default meta;

type Story = StoryObj<typeof ImageUploader>;

// 기본 사용 예제
export const Default: Story = {
    render: () => {
        const BasicUploader = () => {
            const [uploadedFile, setUploadedFile] = useState<File | null>(null);

            const handleImageChange = (file: File) => {
                setUploadedFile(file);
                console.log("Uploaded file:", file);
            };

            return (
                <div className="space-y-4">
                    <ImageUploader onImageChange={handleImageChange} pageMode="add" />
                    {uploadedFile && (
                        <div className="p-4 bg-gray-100 rounded">
                            <h4 className="font-semibold mb-2">업로드된 파일 정보:</h4>
                            <ul className="text-sm space-y-1">
                                <li>파일명: {uploadedFile.name}</li>
                                <li>크기: {(uploadedFile.size / 1024).toFixed(2)} KB</li>
                                <li>타입: {uploadedFile.type}</li>
                            </ul>
                        </div>
                    )}
                </div>
            );
        };

        return <BasicUploader />;
    },
};

// 초기 이미지가 있는 경우
export const WithInitialImage: Story = {
    render: () => (
        <ImageUploader
            productImage="https://via.placeholder.com/400x300"
            pageMode="edit"
            onImageChange={(file) => console.log("Changed to:", file)}
        />
    ),
};

// 읽기 전용 모드
export const ReadOnly: Story = {
    render: () => (
        <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">읽기 전용 모드에서는 이미지를 변경할 수 없습니다.</p>
            </div>
            <ImageUploader productImage="https://via.placeholder.com/400x300" isReadOnly={true} pageMode="edit" />
        </div>
    ),
};

// React Hook Form 통합
interface FormData {
    title: string;
    description: string;
    image: File | null;
}

const FormExample = () => {
    const {
        control,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        defaultValues: {
            title: "",
            description: "",
            image: null,
        },
    });

    const watchedValues = watch();

    const onSubmit = (data: FormData) => {
        console.log("Form submitted:", data);
        alert("폼이 제출되었습니다. 콘솔을 확인하세요.");
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">제품명 *</label>
                <Controller
                    name="title"
                    control={control}
                    rules={{ required: "제품명을 입력해주세요" }}
                    render={({ field }) => (
                        <input
                            {...field}
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="제품명을 입력하세요"
                        />
                    )}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">설명</label>
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <textarea
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={3}
                            placeholder="제품 설명을 입력하세요"
                        />
                    )}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">제품 이미지 *</label>
                <Controller
                    name="image"
                    control={control}
                    rules={{ required: "이미지를 업로드해주세요" }}
                    render={({ field }) => (
                        <ImageUploader
                            onImageChange={(file) => {
                                field.onChange(file);
                                setValue("image", file);
                            }}
                            pageMode="add"
                        />
                    )}
                />
                {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>}
            </div>

            <div className="p-4 bg-gray-100 rounded">
                <h4 className="font-semibold mb-2">Form Values:</h4>
                <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(
                        {
                            title: watchedValues.title,
                            description: watchedValues.description,
                            image: watchedValues.image
                                ? {
                                      name: watchedValues.image.name,
                                      size: watchedValues.image.size,
                                      type: watchedValues.image.type,
                                  }
                                : null,
                        },
                        null,
                        2,
                    )}
                </pre>
            </div>

            <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    제출
                </button>
                <button
                    type="button"
                    onClick={() => reset()}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    초기화
                </button>
            </div>
        </form>
    );
};

export const WithReactHookForm: Story = {
    render: () => <FormExample />,
};

// 다양한 크기 옵션
export const CustomSizes: Story = {
    render: () => (
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold mb-2">Small (20rem x 15rem)</h3>
                <ImageUploader maxWidth="20rem" height="15rem" onImageChange={(file) => console.log("Small:", file)} />
            </div>

            <div>
                <h3 className="font-semibold mb-2">Default (40rem x 24.8rem)</h3>
                <ImageUploader onImageChange={(file) => console.log("Default:", file)} />
            </div>

            <div>
                <h3 className="font-semibold mb-2">Large (60rem x 35rem)</h3>
                <ImageUploader maxWidth="60rem" height="35rem" onImageChange={(file) => console.log("Large:", file)} />
            </div>
        </div>
    ),
};

// 파일 제한 옵션
export const WithFileRestrictions: Story = {
    render: () => {
        const RestrictedUploader = () => {
            const [error, setError] = useState<string>("");

            return (
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                        <h4 className="font-semibold text-blue-900 mb-2">파일 제한 사항:</h4>
                        <ul className="text-sm text-blue-800 list-disc list-inside">
                            <li>최대 파일 크기: 1MB</li>
                            <li>허용 형식: JPG, PNG만 가능</li>
                        </ul>
                    </div>

                    <ImageUploader
                        maxSizeMB={1}
                        acceptTypes="image/jpeg,image/png"
                        onImageChange={(file) => {
                            console.log("Uploaded:", file);
                            setError("");
                        }}
                    />

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                </div>
            );
        };

        return <RestrictedUploader />;
    },
};

// 사용 예제
export const UsageExamples: Story = {
    render: () => (
        <div className="p-8 space-y-8 bg-gray-50">
            <div>
                <h2 className="text-2xl font-bold mb-4">ImageUploader Component Usage</h2>
                <p className="text-gray-600 mb-6">
                    이미지 업로드 컴포넌트로 미리보기, 파일 크기 제한, 읽기 전용 모드 등을 지원합니다.
                </p>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-3">Basic Usage</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
                        <code>{`import ImageUploader from '@/components/widgets/ImageUploader';

const [file, setFile] = useState<File | null>(null);

<ImageUploader
  onImageChange={setFile}
  pageMode="add"
  maxSizeMB={2}
/>`}</code>
                    </pre>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-3">With Initial Image</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
                        <code>{`<ImageUploader
  productImage="/path/to/image.jpg"
  pageMode="edit"
  onImageChange={handleImageChange}
/>`}</code>
                    </pre>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-3">Features</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>이미지 미리보기</li>
                        <li>드래그 앤 드롭 지원 (클릭으로 업로드)</li>
                        <li>파일 크기 제한</li>
                        <li>파일 타입 제한</li>
                        <li>읽기 전용 모드</li>
                        <li>이미지 수정 및 제거</li>
                        <li>React Hook Form 통합 지원</li>
                        <li>커스텀 크기 설정</li>
                        <li>에러 메시지 표시</li>
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-3">Props</h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2">Prop</th>
                                <th className="text-left py-2">Type</th>
                                <th className="text-left py-2">Default</th>
                                <th className="text-left py-2">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="py-2">pageMode</td>
                                <td className="py-2">&apos;add&apos; | &apos;edit&apos;</td>
                                <td className="py-2">&apos;add&apos;</td>
                                <td className="py-2">페이지 모드</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">isReadOnly</td>
                                <td className="py-2">boolean</td>
                                <td className="py-2">false</td>
                                <td className="py-2">읽기 전용 모드</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">productImage</td>
                                <td className="py-2">string | null</td>
                                <td className="py-2">null</td>
                                <td className="py-2">초기 이미지 URL</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">onImageChange</td>
                                <td className="py-2">(file: File) =&gt; void</td>
                                <td className="py-2">-</td>
                                <td className="py-2">이미지 변경 콜백</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">maxSizeMB</td>
                                <td className="py-2">number</td>
                                <td className="py-2">2</td>
                                <td className="py-2">최대 파일 크기 (MB)</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">acceptTypes</td>
                                <td className="py-2">string</td>
                                <td className="py-2">&apos;image/*&apos;</td>
                                <td className="py-2">허용 파일 타입</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">maxWidth</td>
                                <td className="py-2">string</td>
                                <td className="py-2">&apos;40rem&apos;</td>
                                <td className="py-2">컨테이너 최대 너비</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">height</td>
                                <td className="py-2">string</td>
                                <td className="py-2">&apos;24.8rem&apos;</td>
                                <td className="py-2">컨테이너 높이</td>
                            </tr>
                        </tbody>
                    </table>
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
