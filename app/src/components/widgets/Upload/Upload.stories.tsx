import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import Upload, { type UploadedFile } from "./Upload";

const meta: Meta<typeof Upload> = {
    title: "Widgets/Upload",
    component: Upload,
    tags: ["autodocs"],
    parameters: {
        docs: {
            story: { inline: true },
            canvas: { sourceState: "shown" },
            source: { type: "code" },
        },
    },
    argTypes: {
        multiple: {
            control: "boolean",
            description: "다중 파일 업로드 허용",
        },
        maxSize: {
            control: "number",
            description: "최대 파일 크기 (bytes)",
        },
        maxFiles: {
            control: "number",
            description: "최대 파일 개수",
        },
        disabled: {
            control: "boolean",
            description: "비활성화 상태",
        },
        showPreview: {
            control: "boolean",
            description: "미리보기 표시 여부",
        },
        showFileList: {
            control: "boolean",
            description: "업로드된 파일 목록 표시",
        },
    },
};

export default meta;

type Story = StoryObj<typeof Upload>;

// 기본 사용 예제
export const Default: Story = {
    render: () => {
        const BasicUpload = () => {
            const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

            const handleFileUpload = (files: File[]) => {
                setUploadedFiles((prev) => [...prev, ...files]);
                console.log("Uploaded files:", files);
            };

            return (
                <div className="space-y-4">
                    <Upload onFileUpload={handleFileUpload} multiple={true} showPreview={true} showFileList={true} />

                    {uploadedFiles.length > 0 && (
                        <div className="p-4 bg-gray-100 rounded">
                            <h4 className="font-semibold mb-2">업로드된 파일 정보:</h4>
                            <ul className="text-sm space-y-1">
                                {uploadedFiles.map((file, index) => (
                                    <li key={index}>
                                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );
        };

        return <BasicUpload />;
    },
};

// 단일 파일 업로드
export const SingleFile: Story = {
    render: () => (
        <Upload
            multiple={false}
            onFileUpload={(files) => {
                console.log("Single file:", files[0]);
                alert(`파일 선택됨: ${files[0].name}`);
            }}
        />
    ),
};

// 이미지 파일만 허용
export const ImagesOnly: Story = {
    render: () => (
        <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">이미지 파일(JPG, PNG, GIF)만 업로드할 수 있습니다.</p>
            </div>
            <Upload
                accept={{
                    "image/*": [".jpeg", ".jpg", ".png", ".gif"],
                }}
                multiple={true}
                showPreview={true}
                onFileUpload={(files) => console.log("Images:", files)}
            />
        </div>
    ),
};

// 문서 파일만 허용
export const DocumentsOnly: Story = {
    render: () => (
        <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">문서 파일(PDF, DOC, DOCX, TXT)만 업로드할 수 있습니다.</p>
            </div>
            <Upload
                accept={{
                    "application/pdf": [".pdf"],
                    "application/msword": [".doc"],
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
                    "text/plain": [".txt"],
                }}
                multiple={true}
                showPreview={false}
                onFileUpload={(files) => console.log("Documents:", files)}
            />
        </div>
    ),
};

// 파일 크기 제한
export const WithSizeLimit: Story = {
    render: () => (
        <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">최대 파일 크기: 1MB</p>
            </div>
            <Upload
                maxSize={1024 * 1024} // 1MB
                multiple={true}
                onFileUpload={(files) => console.log("Files:", files)}
            />
        </div>
    ),
};

// 파일 개수 제한
export const WithFileLimit: Story = {
    render: () => (
        <div className="space-y-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                <p className="text-sm text-purple-800">최대 3개의 파일만 업로드할 수 있습니다.</p>
            </div>
            <Upload multiple={true} maxFiles={3} onFileUpload={(files) => console.log("Files:", files)} />
        </div>
    ),
};

// 비활성화 상태
export const Disabled: Story = {
    render: () => (
        <div className="space-y-4">
            <div className="p-4 bg-gray-100 border border-gray-300 rounded">
                <p className="text-sm text-gray-600">업로드가 비활성화되어 있습니다.</p>
            </div>
            <Upload disabled={true} onFileUpload={() => {}} />
        </div>
    ),
};

// 고급 파일 상태 관리
export const AdvancedFileManagement: Story = {
    render: () => {
        const AdvancedUpload = () => {
            const [files, setFiles] = useState<UploadedFile[]>([]);
            const [isUploading, setIsUploading] = useState(false);

            const handleFilesChange = (uploadedFiles: UploadedFile[]) => {
                setFiles(uploadedFiles);
            };

            const simulateUpload = async () => {
                setIsUploading(true);

                // 각 파일에 대해 업로드 시뮬레이션
                const updatedFiles = [...files];
                for (let i = 0; i < updatedFiles.length; i++) {
                    if (updatedFiles[i].status === "pending") {
                        updatedFiles[i] = { ...updatedFiles[i], status: "uploading", progress: 0 };
                        setFiles([...updatedFiles]);

                        // 업로드 진행 시뮬레이션
                        for (let progress = 0; progress <= 100; progress += 20) {
                            await new Promise((resolve) => setTimeout(resolve, 200));
                            updatedFiles[i] = { ...updatedFiles[i], progress };
                            setFiles([...updatedFiles]);
                        }

                        // 랜덤하게 성공 또는 실패
                        const success = Math.random() > 0.2;
                        updatedFiles[i] = {
                            ...updatedFiles[i],
                            status: success ? "success" : "error",
                            error: success ? undefined : "업로드 실패",
                        };
                        setFiles([...updatedFiles]);
                    }
                }

                setIsUploading(false);
            };

            return (
                <div className="space-y-4">
                    <Upload multiple={true} onFilesChange={handleFilesChange} showPreview={true} showFileList={true} />

                    {files.length > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={simulateUpload}
                                disabled={isUploading || files.every((f) => f.status !== "pending")}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? "업로드 중..." : "서버에 업로드"}
                            </button>
                            <button
                                onClick={() => setFiles([])}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                모두 제거
                            </button>
                        </div>
                    )}

                    {files.length > 0 && (
                        <div className="p-4 bg-gray-100 rounded">
                            <h4 className="font-semibold mb-2">파일 상태:</h4>
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center gap-2 mb-2">
                                    <span className="text-sm">{file.file.name}:</span>
                                    <span
                                        className={`text-sm font-medium ${
                                            file.status === "success"
                                                ? "text-green-600"
                                                : file.status === "error"
                                                  ? "text-red-600"
                                                  : file.status === "uploading"
                                                    ? "text-blue-600"
                                                    : "text-gray-600"
                                        }`}
                                    >
                                        {file.status === "uploading" && file.progress !== undefined
                                            ? `업로드 중 ${file.progress}%`
                                            : file.status}
                                    </span>
                                    {file.error && <span className="text-sm text-red-600">({file.error})</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        };

        return <AdvancedUpload />;
    },
};

// 사용 예제
export const UsageExamples: Story = {
    render: () => (
        <div className="p-8 space-y-8 bg-gray-50">
            <div>
                <h2 className="text-2xl font-bold mb-4">Upload Component Usage</h2>
                <p className="text-gray-600 mb-6">
                    react-dropzone 기반의 파일 업로드 컴포넌트로 드래그 앤 드롭과 파일 관리 기능을 제공합니다.
                </p>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-3">Basic Usage</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
                        <code>{`import Upload from '@/components/widgets/Upload';

const [files, setFiles] = useState<File[]>([]);

<Upload
  onFileUpload={setFiles}
  multiple={true}
  maxSize={5 * 1024 * 1024} // 5MB
/>`}</code>
                    </pre>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-3">With File Type Restrictions</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
                        <code>{`<Upload
  accept={{
    'image/*': ['.jpeg', '.jpg', '.png'],
    'application/pdf': ['.pdf']
  }}
  onFileUpload={handleUpload}
/>`}</code>
                    </pre>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-3">Features</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li>드래그 앤 드롭 지원</li>
                        <li>다중 파일 업로드</li>
                        <li>파일 타입 제한</li>
                        <li>파일 크기 제한</li>
                        <li>파일 개수 제한</li>
                        <li>이미지 미리보기</li>
                        <li>업로드된 파일 목록 관리</li>
                        <li>파일별 상태 관리 (pending, uploading, success, error)</li>
                        <li>개별 파일 제거</li>
                        <li>전체 파일 제거</li>
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
                                <td className="py-2">onFileUpload</td>
                                <td className="py-2">(files: File[]) =&gt; void</td>
                                <td className="py-2">-</td>
                                <td className="py-2">파일 업로드 콜백</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">onFilesChange</td>
                                <td className="py-2">(files: UploadedFile[]) =&gt; void</td>
                                <td className="py-2">-</td>
                                <td className="py-2">파일 상태 변경 콜백</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">multiple</td>
                                <td className="py-2">boolean</td>
                                <td className="py-2">false</td>
                                <td className="py-2">다중 파일 업로드</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">accept</td>
                                <td className="py-2">object</td>
                                <td className="py-2">-</td>
                                <td className="py-2">허용 파일 타입</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">maxSize</td>
                                <td className="py-2">number</td>
                                <td className="py-2">5MB</td>
                                <td className="py-2">최대 파일 크기</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">maxFiles</td>
                                <td className="py-2">number</td>
                                <td className="py-2">10</td>
                                <td className="py-2">최대 파일 개수</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">disabled</td>
                                <td className="py-2">boolean</td>
                                <td className="py-2">false</td>
                                <td className="py-2">비활성화 상태</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">showPreview</td>
                                <td className="py-2">boolean</td>
                                <td className="py-2">true</td>
                                <td className="py-2">미리보기 표시</td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-2">showFileList</td>
                                <td className="py-2">boolean</td>
                                <td className="py-2">true</td>
                                <td className="py-2">파일 목록 표시</td>
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
