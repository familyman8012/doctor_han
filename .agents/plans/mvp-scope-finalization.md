# Feature: MVP Scope Finalization & Release Checklist

## Feature Description

현재 구현된 범위(`app/doc/todo.md`)를 기준으로 “1차 릴리즈(MVP)”의 포함/제외를 확정하고, QA 가능한 체크리스트/완료 기준(AC)을 문서로 고정한다.

## User Story

As a builder/admin  
I want a frozen MVP scope and release checklist  
So that the team can ship without scope creep

## Problem Statement

MVP 범위가 모호하면 개발 우선순위가 흔들리고, QA/운영 준비가 늦어진다.

## Solution Statement

`.claude/PRD.md`와 `app/doc/todo.md`의 MVP 섹션을 정리하고, 릴리즈 체크리스트를 추가한다.  
“승인 게이팅 + 리드 루프 + 리뷰”를 핵심 수치/시나리오 기반으로 검증 가능하게 만든다.

## Feature Metadata

**Feature Type**: Enhancement (Documentation / Process)  
**Estimated Complexity**: Low  
**Primary Systems Affected**: `app/doc`, `.claude`, `.agents`  
**Dependencies**: 없음

---

## CONTEXT REFERENCES (MUST READ)

- `app/doc/business.md`
- `app/doc/todo.md`
- `app/doc/domains/**/prd.md`
- `.claude/PRD.md`

---

## New Files to Create (proposal)

- `app/doc/release-checklist-mvp.md`

---

## IMPLEMENTATION PLAN

### Phase 1: Freeze MVP
- 포함/제외 항목 확정(한 줄 기준)
- “P1+” 항목을 명확히 분리

### Phase 2: QA Scenarios
- doctor/vender/admin 핵심 시나리오를 “재현 가능”하게 작성
- 각 시나리오별 기대 결과(AC) 명시

### Phase 3: Update AI Assets
- `.claude/PRD.md`의 MVP 스코프/성공 기준 갱신
- `.claude/reference/todo-open-items.md`가 의미 있게 유지되도록 todo 정리(옵션)

---

## STEP-BY-STEP TASKS

1) MVP 포함/제외 확정 및 PRD 반영
2) 릴리즈 체크리스트 문서 추가
3) QA 시나리오 작성(doctor/vendor/admin)
4) 문서 정합성 점검

