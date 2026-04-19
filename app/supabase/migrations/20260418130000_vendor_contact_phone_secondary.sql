-- 업체 대표번호(유선) 컬럼 추가
-- 담당자 휴대폰은 profiles.phone에 저장되고, 이 컬럼은 업체 대표번호(일반전화) 저장용

alter table public.vendors
    add column if not exists contact_phone_secondary text;

comment on column public.vendors.contact_phone_secondary is '업체 대표번호(유선) — 담당자 개인 휴대폰(profiles.phone)과 구분';
