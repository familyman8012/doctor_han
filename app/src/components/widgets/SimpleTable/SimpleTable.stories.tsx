import type { Meta, StoryObj } from "@storybook/react";
import SimpleTable from "./SimpleTable";

const meta: Meta<typeof SimpleTable> = {
    title: "Widgets/SimpleTable",
    component: SimpleTable,
    tags: ["autodocs"],
    parameters: {
        layout: "fullscreen",
    },
};

export default meta;

type Story = StoryObj<typeof SimpleTable>;

const demoColumns = [
    "ID",
    "Title",
    "Status",
    "Owner",
    "Start",
    "Due",
    "Priority",
    "Progress",
    "Category",
    "Region",
    "Notes",
];

const demoData = [
    [
        "1",
        "Design Guidelines",
        "In Progress",
        "Jane Doe",
        "2024-06-01",
        "2024-06-10",
        "High",
        "65%",
        "Product",
        "Seoul",
        "Waiting on review",
    ],
    [
        "2",
        "API Contract",
        "Blocked",
        "John Kim",
        "2024-05-28",
        "2024-06-05",
        "Critical",
        "20%",
        "Engineering",
        "Busan",
        "Needs backend support",
    ],
    [
        "3",
        "Marketing Copy",
        "Done",
        "Alex Park",
        "2024-05-15",
        "2024-05-22",
        "Medium",
        "100%",
        "Marketing",
        "Incheon",
        "Approved and published",
    ],
    [
        "4",
        "QA Checklist",
        "In Progress",
        "Leah Choi",
        "2024-06-03",
        "2024-06-12",
        "High",
        "40%",
        "Quality",
        "Seoul",
        "Draft ready",
    ],
    [
        "5",
        "Customer Feedback",
        "In Review",
        "Mina Lee",
        "2024-06-02",
        "2024-06-18",
        "Medium",
        "55%",
        "Support",
        "Daegu",
        "Summarizing comments",
    ],
    [
        "6",
        "Security Audit",
        "In Progress",
        "Chris Han",
        "2024-05-20",
        "2024-06-30",
        "Critical",
        "30%",
        "Security",
        "Seoul",
        "Scanning third-party tools",
    ],
    [
        "7",
        "Partnership Deck",
        "Planning",
        "Jisu Park",
        "2024-06-08",
        "2024-06-20",
        "Low",
        "10%",
        "Business",
        "Daejeon",
        "Collecting slides",
    ],
    [
        "8",
        "Hiring Pipeline",
        "In Progress",
        "Emma Kwon",
        "2024-05-10",
        "2024-06-25",
        "High",
        "75%",
        "HR",
        "Seoul",
        "Final interviews scheduled",
    ],
    [
        "9",
        "Data Cleanup",
        "Blocked",
        "Noah Jung",
        "2024-06-01",
        "2024-06-15",
        "Medium",
        "15%",
        "Data",
        "Suwon",
        "Awaiting script approval",
    ],
    [
        "10",
        "Release Notes",
        "Done",
        "Soojin Lim",
        "2024-05-01",
        "2024-05-07",
        "Low",
        "100%",
        "Product",
        "Busan",
        "Sent to customers",
    ],
    [
        "11",
        "Training Session",
        "Scheduled",
        "Daniel Cho",
        "2024-06-12",
        "2024-06-12",
        "Medium",
        "0%",
        "Operations",
        "Seoul",
        "Invite drafted",
    ],
    [
        "12",
        "Vendor Review",
        "In Progress",
        "Hana Lee",
        "2024-05-25",
        "2024-06-15",
        "Medium",
        "45%",
        "Procurement",
        "Gwangju",
        "Comparing offers",
    ],
];

export const Default: Story = {
    args: {
        columns: demoColumns,
        data: demoData,
        caption: "Project Status Dashboard",
        maxBodyHeight: "24rem",
    },
};

export const ResizableColumns: Story = {
    args: {
        columns: demoColumns,
        data: demoData,
        caption: "열 헤더 오른쪽 경계를 드래그해서 각 열 너비를 조절할 수 있습니다.",
        maxBodyHeight: "24rem",
        resizable: true,
        minColumnWidth: 50,
    },
};

export const ResizableWithCustomWidths: Story = {
    args: {
        columns: ["ID", "Name", "Description", "Status", "Actions"],
        data: [
            [
                "1",
                "Task A",
                "This is a very long description that needs more space to display properly without wrapping too much",
                "Active",
                "Edit | Delete",
            ],
            ["2", "Task B", "Short desc", "Pending", "Edit | Delete"],
            ["3", "Task C", "Medium length description for this task", "Complete", "Edit | Delete"],
            ["4", "Task D", "Another task with some description text", "Active", "Edit | Delete"],
            ["5", "Task E", "Final task in the list", "Pending", "Edit | Delete"],
        ],
        caption: "초기 열 너비가 설정되어 있습니다. (50, 150, 300, 100, 120)",
        maxBodyHeight: "16rem",
        resizable: true,
        minColumnWidth: 50,
        initialColumnWidths: [50, 150, 300, 100, 120],
    },
};

export const WithoutCaption: Story = {
    args: {
        columns: demoColumns,
        data: demoData,
        maxBodyHeight: "24rem",
    },
};

export const SmallDataset: Story = {
    args: {
        columns: ["Name", "Age", "City"],
        data: [
            ["Alice", "28", "Seoul"],
            ["Bob", "32", "Busan"],
            ["Charlie", "25", "Incheon"],
        ],
        caption: "Simple Table Example",
        resizable: true,
        minColumnWidth: 80,
    },
};

export const EditableTable: Story = {
    args: {
        columns: ["ID", "Name", "Email", "Role", "Status"],
        data: [
            ["001", "Alice Kim", "alice@example.com", "Developer", "Active"],
            ["002", "Bob Lee", "bob@example.com", "Designer", "Active"],
            ["003", "Charlie Park", "charlie@example.com", "Manager", "On Leave"],
            ["004", "Diana Choi", "diana@example.com", "Developer", "Active"],
            ["005", "Eve Jung", "eve@example.com", "QA Engineer", "Active"],
        ],
        caption: "첫 번째 열(ID)을 제외한 모든 셀을 클릭하여 편집 가능. Enter로 저장, ESC로 취소.",
        maxBodyHeight: "20rem",
        resizable: true,
        editable: true,
        minColumnWidth: 80,
    },
};

export const EditableAndResizable: Story = {
    args: {
        columns: demoColumns,
        data: demoData,
        caption: "열 리사이즈와 셀 편집이 모두 가능한 테이블 (ID 열 제외)",
        maxBodyHeight: "24rem",
        resizable: true,
        editable: true,
        minColumnWidth: 50,
        initialColumnWidths: [50, 150, 100, 100, 100, 100, 80, 80, 100, 80, 200],
    },
};

export const SelectableTable: Story = {
    args: {
        columns: ["ID", "Name", "Email", "Role", "Status"],
        data: [
            ["001", "Alice Kim", "alice@example.com", "Developer", "Active"],
            ["002", "Bob Lee", "bob@example.com", "Designer", "Active"],
            ["003", "Charlie Park", "charlie@example.com", "Manager", "On Leave"],
            ["004", "Diana Choi", "diana@example.com", "Developer", "Active"],
            ["005", "Eve Jung", "eve@example.com", "QA Engineer", "Active"],
        ],
        caption: "체크박스로 행 선택 가능. 헤더의 체크박스로 전체 선택/해제.",
        maxBodyHeight: "20rem",
        selectable: true,
        minColumnWidth: 80,
    },
};

export const FullFeatured: Story = {
    args: {
        columns: demoColumns,
        data: demoData,
        caption: "모든 기능 활성화: 체크박스 선택, 열 리사이즈, 셀 편집 (체크박스와 ID 열 제외)",
        maxBodyHeight: "24rem",
        resizable: true,
        editable: true,
        selectable: true,
        minColumnWidth: 50,
    },
};
