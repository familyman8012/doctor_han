---
name: generate-image
description: Replicate MCP를 사용하여 이미지를 생성하는 스킬. 실사 사진, 아이콘, SVG 벡터 등 용도에 맞는 최적 모델을 자동 선택하고 한국인/한국 배경 기준으로 프롬프트를 구성한다. 이미지가 필요할 때 언제든 사용. "이미지 만들어줘", "사진 생성", "아이콘 만들어", "SVG 만들어", "배너 만들어" 등.
tools: mcp__replicate__create_models_predictions, mcp__replicate__get_predictions, Read
---

# Image Generation Skill (Replicate MCP)

Replicate MCP를 통해 용도에 맞는 최적의 AI 이미지 모델을 선택하고 이미지를 생성한다.

## 핵심 원칙

1. **한국 기본값**: 모든 프롬프트에 한국인, 한국 배경을 기본 적용. 서양인/서양 배경 절대 금지.
2. **모델 자동 선택**: 용도, 예산, 품질 요구사항에 따라 최적 모델 선택.
3. **프롬프트 영어 작성**: 모든 모델의 프롬프트는 영어로 작성하되, 한국 컨텍스트를 명시.

## 모델 선택 가이드

### 실사 이미지 (Photorealistic)

| 우선순위 | 모델 | 비용 | 용도 |
|---------|------|------|------|
| 1 | `google/nano-banana-2` | $0.067 | 한글 텍스트 포함, 고품질 실사, 최대 4K |
| 2 | `openai/gpt-image-1.5` | $0.05 (medium) | 현실적이면서 외모 뛰어난 인물, 텍스트 레이아웃 |
| 3 | `google/nano-banana` | $0.039 | 빠른 이터레이션, 이미지 편집 |
| 4 | `google/imagen-4` | $0.04 | 인스타 감성, 비현실적으로 예쁜/잘생긴 인물, 풍경 |

### 특수 용도 선택

| 상황 | 모델 | 이유 |
|------|------|------|
| 대량 생성 / 임시 이미지 | `google/imagen-4-fast` ($0.02) | 최저가, 2.7초, 빠른 프로토타이핑 |
| 한글 텍스트 필수 | `google/nano-banana-2` 또는 `openai/gpt-image-1.5` | 한글 렌더링 최상 |
| 현실감 높은 인물 | `google/nano-banana-2` > `openai/gpt-image-1.5` | 자연스러운 피부톤, 표정 |
| 인스타 감성 / 모델급 외모 | `google/imagen-4` | 비현실적으로 뛰어난 외모 생성에 강점 |
| 현실적 + 외모 뛰어난 인물 | `openai/gpt-image-1.5` | 현실감과 미적 균형 최상 |
| 아이콘 (래스터) | `google/imagen-4` ($0.04) | 깔끔한 그래픽 스타일 |
| 아이콘/로고 (SVG) | `recraft-ai/recraft-v4-svg` ($0.08) | 유일한 네이티브 SVG 생성 모델 |

## 모델별 호출 방법

### 1. google/nano-banana-2 (Gemini 3.1 Flash Image)

```
model_owner: "google"
model_name: "nano-banana-2"
input: {
  "prompt": "...",
  "aspect_ratio": "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3",
  "output_format": "jpg" | "png",
  "safety_filter_level": "block_low_and_above" | "block_medium_and_above" | "block_only_high"
}
```
- 해상도: 자동 (최대 4K)
- 이미지 입력 지원 (편집/참조): `image_input` 파라미터

### 2. openai/gpt-image-1.5

```
model_owner: "openai"
model_name: "gpt-image-1.5"
input: {
  "prompt": "...",
  "aspect_ratio": "1:1" | "16:9" | "9:16" | "4:3" | "3:2",
  "quality": "low" | "medium" | "high",
  "output_format": "png" | "jpg" | "webp",
  "n": 1
}
```
- quality: medium 권장 ($0.05/장). high는 $0.17/장.
- 최대 해상도: 1536px

### 3. google/nano-banana (Gemini 2.5 Flash Image)

```
model_owner: "google"
model_name: "nano-banana"
input: {
  "prompt": "...",
  "aspect_ratio": "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3",
  "output_format": "jpg" | "png"
}
```
- 이미지 편집 지원: `image_input` 파라미터
- nano-banana-2 대비 저렴 ($0.039 vs $0.067)

### 4. google/imagen-4

```
model_owner: "google"
model_name: "imagen-4"
input: {
  "prompt": "...",
  "aspect_ratio": "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3",
  "output_format": "jpg" | "png",
  "safety_filter_level": "block_low_and_above" | "block_medium_and_above" | "block_only_high"
}
```
- 최대 2048x2048
- 한글 텍스트 렌더링 약함 (라틴 문자는 강함)

### 5. google/imagen-4-fast

```
model_owner: "google"
model_name: "imagen-4-fast"
input: {
  "prompt": "...",
  "aspect_ratio": "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3",
  "output_format": "jpg" | "png",
  "safety_filter_level": "block_low_and_above" | "block_medium_and_above" | "block_only_high"
}
```
- ~2.7초, $0.02/장
- 최대 1408x768

### 6. recraft-ai/recraft-v4-svg

```
model_owner: "recraft-ai"
model_name: "recraft-v4-svg"
input: {
  "prompt": "...",
  "size": "1024x1024" | "1365x1024" | "1024x1365" | "1536x1024" | "1024x1536" | "1820x1024" | "1024x1820"
}
```
- 네이티브 SVG 출력
- 아이콘, 로고, 일러스트, 인포그래픽에 최적

## 프롬프트 작성 규칙

### 한국 컨텍스트 필수 삽입

모든 프롬프트에 다음 중 적절한 요소를 포함:

- 인물: `Korean`, `East Asian` 명시. `Asian`만 쓰면 다양한 아시안이 나올 수 있음.
- 배경: `in Seoul`, `Korean cityscape`, `traditional Korean hanok`, `Korean cafe` 등 구체적 한국 장소
- 음식: `Korean food`, `Korean restaurant` 등
- 패션: `Korean fashion`, `Korean street style` 등

### 인물 묘사 가이드

| 목적 | 프롬프트 키워드 |
|------|----------------|
| 현실적 일반인 | `natural-looking Korean man/woman, casual, everyday setting` |
| 모델급 외모 (인스타) | `stunning Korean model, flawless skin, fashion editorial, soft lighting` |
| 전문직 | `Korean professional, doctor/business, confident, modern office` |
| 커플 | `Korean couple, stylish, romantic atmosphere` |

### 품질 키워드

- 실사: `photorealistic, high resolution, professional photography, natural lighting`
- 아이콘: `flat design icon, minimal, clean lines, solid colors, centered composition`
- SVG: `vector illustration, flat design, clean geometry, minimal detail`

## 실행 워크플로우

1. **용도 파악**: 실사? 아이콘? SVG? 텍스트 포함 여부? 대량인지?
2. **모델 선택**: 위 가이드에 따라 최적 모델 결정
3. **프롬프트 작성**: 영어로, 한국 컨텍스트 포함, 품질 키워드 추가
4. **생성 호출**: `create_models_predictions` 사용 (Prefer: "wait" 헤더 포함)
5. **결과 확인**: 예측 상태 확인, 필요시 `get_predictions`로 폴링
6. **URL 전달**: 생성된 이미지 URL을 사용자에게 전달

### 호출 예시

```
mcp__replicate__create_models_predictions({
  model_owner: "google",
  model_name: "nano-banana-2",
  Prefer: "wait",
  input: {
    prompt: "A Korean woman in her late 20s sitting at a modern Seoul cafe, drinking latte, natural makeup, warm afternoon sunlight through large windows, photorealistic, high resolution",
    aspect_ratio: "16:9",
    output_format: "jpg"
  }
})
```

### 결과 처리

- 결과의 `output` 필드에 이미지 URL이 포함됨
- `status: "succeeded"` 확인
- `status: "starting"` 또는 `"processing"`이면 `get_predictions`로 폴링
- 이미지 URL은 `replicate.delivery` 도메인

## 비용 요약

| 모델 | 비용/장 | $1당 생성 수 |
|------|---------|-------------|
| imagen-4-fast | $0.02 | 50장 |
| nano-banana | $0.039 | ~25장 |
| imagen-4 | $0.04 | 25장 |
| gpt-image-1.5 (medium) | $0.05 | 20장 |
| nano-banana-2 | $0.067 | ~14장 |
| recraft-v4-svg | $0.08 | ~12장 |
| gpt-image-1.5 (high) | $0.17 | ~6장 |
