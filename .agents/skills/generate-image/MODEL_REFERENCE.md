# Replicate 이미지 모델 레퍼런스

> 최종 업데이트: 2026-03-21

## 모델 상세 비교

### google/nano-banana-2 (Gemini 3.1 Flash Image)

- **출시**: 2026년 2월
- **강점**: Artificial Analysis Image Arena 1위. 한글/CJK 텍스트 렌더링 최상. 4K 해상도. 이미지 편집 지원.
- **약점**: 가격이 상대적으로 높음 ($0.067)
- **한글 지원**: 최고 (10+ 언어, 한/중/일 명시 지원, 폰트 스타일링 가능)
- **해상도**: 512px ~ 4K
- **aspect_ratio**: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3, 21:9, 1:4, 4:1, 1:8, 8:1
- **특수 기능**: `image_input`으로 최대 14장 참조 이미지 지원 (편집/스타일 전이)
- **베스트 유즈케이스**: 한글 포함 마케팅 이미지, 고품질 제품 사진, 다국어 배너

### openai/gpt-image-1.5

- **출시**: 2025년 12월
- **강점**: LM Arena Elo 1,264 (벤치마크 최고). 현실적+아름다운 인물 균형 최상. 텍스트 레이아웃 정교.
- **약점**: OpenAI API 키 별도 필요 (Replicate 통해 대리 호출). 최대 1536px. 10-20초 생성.
- **한글 지원**: 양호 (라틴 문자 최강, CJK도 좋으나 nano-banana-2보다는 약간 아래)
- **해상도**: 최대 1536px
- **quality 옵션**: low ($0.01), medium ($0.05), high ($0.17)
- **특수 기능**: 이미지 편집, 합성, n 파라미터로 다중 생성
- **베스트 유즈케이스**: 현실적이면서 외모 뛰어난 인물, 인포그래픽, 텍스트 중심 디자인

### google/nano-banana (Gemini 2.5 Flash Image)

- **출시**: 2025년
- **강점**: 88.7M 런 (가장 많은 사용량). 빠르고 안정적. 가성비 좋음.
- **약점**: nano-banana-2 대비 품질 낮음. 작은 얼굴/세밀한 철자 약함.
- **한글 지원**: 양호
- **해상도**: 자동
- **aspect_ratio**: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3
- **특수 기능**: 이미지 편집 (`image_input`)
- **베스트 유즈케이스**: 빠른 이터레이션, 이미지 편집, 가성비 실사

### google/imagen-4

- **출시**: 2025년 5월
- **강점**: 포토리얼리즘 강점. 스타일 다양성. 2048x2048. 인스타 감성 인물에 탁월.
- **약점**: 한글/CJK 텍스트 약함 (라틴은 강함). 텍스트-투-이미지만 (편집 불가).
- **한글 지원**: 약함 (라틴 문자 전용으로 훈련)
- **해상도**: 최대 2048x2048
- **aspect_ratio**: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3
- **베스트 유즈케이스**: 인스타 감성 장소/인물, 풍경, 비현실적으로 예쁜 외모, 아이콘

### google/imagen-4-fast

- **출시**: 2025년
- **강점**: 2.7초 생성, $0.02/장 최저가. 10x 빠름.
- **약점**: 낮은 해상도 (1408x768 max). 품질 타협.
- **한글 지원**: 약함 (imagen-4와 동일)
- **해상도**: 최대 1408x768
- **aspect_ratio**: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3
- **베스트 유즈케이스**: 대량 생성, 프로토타이핑, 임시 이미지, A/B 테스트

### recraft-ai/recraft-v4-svg

- **출시**: 2026년 2월
- **강점**: 유일한 네이티브 SVG 생성 모델. 프로덕션 레디 벡터. Figma/Illustrator 호환.
- **약점**: 실사 불가. 15초 생성. 한글 미검증.
- **한글 지원**: 미검증 ("most languages" 주장, CJK 테스트 필요)
- **출력 형식**: SVG, PNG, JPG, PDF, TIFF, Lottie
- **size**: 1024x1024, 1365x1024, 1024x1365, 1536x1024, 1024x1536, 1820x1024, 1024x1820
- **베스트 유즈케이스**: 아이콘, 로고, 일러스트, 인포그래픽, 브랜드 에셋

## 의사결정 플로우차트

```
이미지 필요
├── SVG/벡터 필요?
│   └── YES → recraft-v4-svg
├── 한글 텍스트 포함?
│   ├── YES → nano-banana-2 (최우선) 또는 gpt-image-1.5
│   └── NO → 계속
├── 인물 사진?
│   ├── 현실적 일반인 → nano-banana-2
│   ├── 현실적 + 외모 뛰어남 → gpt-image-1.5
│   ├── 인스타 감성 / 모델급 → imagen-4
│   └── 대량 / 임시 → imagen-4-fast
├── 풍경/장소?
│   ├── 고품질 → imagen-4 또는 nano-banana-2
│   └── 임시 → imagen-4-fast
├── 아이콘?
│   ├── 래스터 → imagen-4
│   └── SVG → recraft-v4-svg
└── 대량 / 저예산?
    └── imagen-4-fast ($0.02)
```

## 프롬프트 템플릿

### 한국인 인물 (현실적)
```
A natural-looking Korean [man/woman] in [his/her] [20s/30s/40s], [행동], [장소 in Seoul/Korea], wearing [의상], [표정/분위기], photorealistic, natural lighting, high resolution, shot on Canon EOS R5
```

### 한국인 인물 (인스타 감성)
```
A stunning Korean [man/woman], [나이대], [행동], [장소], perfect skin, editorial lighting, fashion photography, shallow depth of field, dreamy bokeh, Instagram aesthetic
```

### 한국 배경 풍경
```
[장소 설명] in Seoul/Busan/Jeju, Korea, [시간대] light, [계절], atmospheric, cinematic composition, high resolution landscape photography
```

### 아이콘
```
Flat design icon of [아이콘 설명], minimal style, clean lines, [색상 팔레트], solid background, centered, no shadows, vector-like quality
```

### SVG 아이콘
```
A clean minimal vector icon of [아이콘 설명], flat design, geometric shapes, [색상], suitable for UI/app icon, simple and recognizable
```

### 마케팅 배너 (한글 포함)
```
Professional marketing banner for [제품/서비스], Korean text "[한글 텍스트]" prominently displayed, modern design, [색상 스킴], clean layout, Korean target audience
```
