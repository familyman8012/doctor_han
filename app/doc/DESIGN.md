## 📐 디자인 토큰

### 색상 팔레트
```
Primary: #0a3b41 (다크 틸)
Secondary: #62e3d5 (민트)
Background: #f4f7fa (라이트 그레이)
Text Primary: #0a3b41
Text Secondary: #5f6b6d
Border: #e5e7eb (gray-200)
```

### Badge 색상
```
success: bg-emerald-50, text-emerald-700, border-emerald-200
warning: bg-yellow-50, text-yellow-700, border-yellow-200  
danger: bg-red-50, text-red-700, border-red-200
primary: bg-blue-50, text-blue-700, border-blue-200
purple: bg-purple-50, text-purple-700, border-purple-200
teal: bg-teal-50, text-teal-700, border-teal-200
neutral: bg-gray-50, text-gray-700, border-gray-200
```

## 📦 UI 컴포넌트 (기본 요소)

### 🔘 Button
**용도**: 클릭 액션이 필요한 모든 곳
```typescript
import { Button } from '@/components/ui/Button/button';

// Props
variant: 'primary' | 'secondary' | 'ghostPrimary' | 'ghostSecondary' | 
         'selectItem' | 'selectItem_on' | 'transparent' | 'danger' | 
         'list' | 'listActive'
size: 'xs'(28px) | 'sm'(32px) | 'md'(36px) | 'lg'(40px)
LeadingIcon?: ReactElement  // 앞쪽 아이콘
TrailingIcon?: ReactElement // 뒤쪽 아이콘 (selectItem에서 X 버튼)
IconOnly?: ReactElement     // 아이콘만 있는 버튼
disabled?: boolean
isLoading?: boolean
className?: string
asChild?: boolean  // Radix Slot 사용시

// 기본값
variant: 'primary'
size: 'sm'
```
**사용 예시**: 
- primary: 메인 액션 (저장, 확인)
- secondary: 보조 액션 (취소, 닫기)
- danger: 삭제, 위험한 작업
- list/listActive: 리스트 페이지 필터 토글

### 📝 Input
**용도**: 텍스트 입력이 필요한 곳
```typescript
import { Input } from '@/components/ui/Input/Input';

// Props
size: 'xs'(34px) | 'sm'(38px) | 'md'(40px) | 'lg'(44px)
variant: 'default' | 'error'
label?: string              // 상단 라벨
leadingText?: string        // 왼쪽 텍스트 (예: https://)
LeadingIcon?: ReactElement  // 왼쪽 아이콘
TrailingIcon?: ReactElement // 오른쪽 아이콘
error?: string              // 에러 메시지
helperText?: string         // 도움말 텍스트
placeholder?: string
disabled?: boolean
className?: string

// 기본값
size: 'sm'
variant: 'default'
type: 'text'
```
**특징**:
- 에러 상태시 빨간 테두리 + 에러 메시지
- leadingText와 함께 사용시 왼쪽 붙어서 표시
- 포커스시 민트색 아웃라인

### 🏷️ Badge
**용도**: 상태 표시, 라벨링
```typescript
variant: 'success' | 'warning' | 'danger' | 'primary' | 'purple' | 'teal' | 'neutral'
size: 'xs' | 'sm' | 'md'
icon?: ReactNode
```
**사용 예시**: 출고완료, 작성중, 본사샘플, 영업샘플 등

### 🎛️ Select
**용도**: 옵션 선택이 필요한 곳
```typescript
import { Select } from '@/components/ui/Select/Select';

// Props
options: IOption[]  // {value, label, description?, status?, icon?}
value?: IOption | IOption[] | string | number | null
onChange?: (option: IOption | IOption[] | null) => void
size: 'xs' | 'sm' | 'md' | 'lg'
placeholder?: string
LeadingIcon?: ReactElement
prefixLabel?: string        // 셀렉트 앞 텍스트
isSearchable?: boolean      // 검색 가능
isDisabled?: boolean
isMulti?: boolean          // 다중 선택
isClearable?: boolean      // X 버튼 표시
showCheckmark?: boolean    // 선택시 체크 표시
formatOptionLabel?: (option: IOption) => ReactNode
className?: string
```
**특징**:
- react-select 기반
- 커스텀 드롭다운 스타일
- 옵션에 아이콘, 설명 추가 가능

### ✅ Checkbox
**용도**: 다중 선택, 동의/체크
```typescript
checked?: boolean
disabled?: boolean
label?: string
size: 'sm' | 'md' | 'lg'
```

### 🔘 Radio
**용도**: 단일 선택 (여러 옵션 중 하나)
```typescript
checked?: boolean
disabled?: boolean
label?: string
name: string
```

### 🔀 Toggle
**용도**: ON/OFF 스위치
```typescript
checked?: boolean
disabled?: boolean
size: 'sm' | 'md' | 'lg'
label?: string
```

### 📑 Tab
**용도**: 콘텐츠 섹션 전환
```typescript
tabs: { key: string; label: string; content?: ReactNode }[]
activeKey?: string
onChange?: (key: string) => void
variant: 'default' | 'underline'
```
**사용 예시**: 기본정보/파일관리/품목추가 탭

### 💬 Tooltip
**용도**: 추가 정보 제공
```typescript
content: string | ReactNode
placement: 'top' | 'bottom' | 'left' | 'right'
trigger: 'hover' | 'click'
```

### 🔄 Spinner
**용도**: 로딩 상태 표시
```typescript
size: 'sm' | 'md' | 'lg'
color?: string
```

### 💀 Skeleton
**용도**: 콘텐츠 로딩 플레이스홀더
```typescript
width?: string | number
height?: string | number
variant: 'text' | 'rectangular' | 'circular'
animation: 'pulse' | 'wave' | 'none'
```

### 📭 Empty
**용도**: 데이터 없음 상태
```typescript
message?: string
description?: string
icon?: ReactNode
action?: ReactNode
```

### ❌ ErrorText
**용도**: 에러 메시지 표시
```typescript
message: string
className?: string
```

### 🎯 ButtonGroup
**용도**: 관련 버튼들을 그룹핑
```typescript
buttons: ButtonProps[]
orientation: 'horizontal' | 'vertical'
```

## 🧩 Widgets (복합 컴포넌트)



### 📄 Pagination
**용도**: 페이지 네비게이션
```typescript
currentPage: number
totalPages: number
onPageChange: (page: number) => void
showInfo?: boolean
```

### 📅 DatePicker
**용도**: 날짜 선택
```typescript
value?: Date | string
onChange?: (date: Date) => void
format?: string
placeholder?: string
disabled?: boolean
```

### 📆 DateRange
**용도**: 날짜 범위 선택
```typescript
startDate?: Date
endDate?: Date
onChange?: (start: Date, end: Date) => void
```

### 📤 Upload
**용도**: 파일 업로드
```typescript
accept?: string
multiple?: boolean
maxSize?: number
onUpload?: (files: File[]) => void
```

### 🖼️ ImageUploader
**용도**: 이미지 업로드 및 미리보기
```typescript
value?: string[]
onChange?: (urls: string[]) => void
maxCount?: number
accept?: string
```

### ☑️ CheckBoxGroup
**용도**: 다중 체크박스 그룹
```typescript
options: { value: string; label: string }[]
value?: string[]
onChange?: (values: string[]) => void
orientation: 'horizontal' | 'vertical'
```

### 🔘 RadioGroup
**용도**: 라디오 버튼 그룹
```typescript
options: { value: string; label: string }[]
value?: string
onChange?: (value: string) => void
orientation: 'horizontal' | 'vertical'
```

### 📍 AddressSearch
**용도**: 주소 검색 및 입력
```typescript
onAddressSelect?: (address: any) => void
placeholder?: string
```

## 🪟 Modal 컴포넌트

### 🔲 Modal (기본)
**용도**: 팝업 다이얼로그, 폼 입력, 확인 창
```typescript
import Modal from '@/components/modal/Modal';

// Props
isOpen: boolean
onClose: () => void
title?: string
onFormSubmit?: () => void
onCancel?: () => void
disabledFormSubmit?: boolean
submitButtonText?: string    // 기본: '확인'
cancelButtonText?: string     // 기본: '취소'
showCloseButton?: boolean     // X 버튼 표시 (기본: false)
showCancelButton?: boolean    // 취소 버튼 표시 (기본: true)
showButtons?: boolean         // 버튼영역 표시 (기본: true)
className?: string
children?: ReactNode
```
**특징**:
- ESC 키로 닫기 지원
- 배경 딤드 처리
- 애니메이션 효과 (framer-motion)
- body 스크롤 자동 방지

### ⚠️ AlertModal
**용도**: 단순 알림 메시지
```typescript
import AlertModal from '@/components/modal/AlertModal';

// Props
isOpen?: boolean
title?: string
content?: string
onClose?: () => void
className?: string
```
**특징**: 확인 버튼만 표시

### ❓ ConfirmModal
**용도**: 전역 확인 다이얼로그 (Zustand 연동)
```typescript
import ConfirmModal from '@/components/modal/ConfirmModal';
import { useConfirmModalStore } from '@/stores/confirmModalStore';

// Store 사용법
const { openModal, closeModal } = useConfirmModalStore();

openModal({
  title: '삭제 확인',
  content: '정말 삭제하시겠습니까?',
  onFormSubmit: () => { /* 확인 동작 */ },
  onCancel: () => { /* 취소 동작 */ }
});
```
**특징**: 
- 전역 상태 관리
- Enter/ESC 키보드 단축키

## 📊 Chart 컴포넌트

### 📊 BarChart
**용도**: 막대 차트
```typescript
data: { label: string; value: number }[]
width?: number
height?: number
color?: string
```

### 🍩 DonutBasicLegend
**용도**: 도넛 차트 (범례 포함)
```typescript
data: { label: string; value: number; color: string }[]
width?: number
height?: number
showLegend?: boolean
```

### 💡 BasicTooltip
**용도**: 차트 툴팁
```typescript
content: string | ReactNode
```