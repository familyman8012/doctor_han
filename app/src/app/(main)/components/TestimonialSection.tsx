"use client";

import { Quote } from "lucide-react";

interface Testimonial {
    id: string;
    name: string;
    role: string;
    comment: string;
    initial: string;
    bgColor: string;
}

const testimonials: Testimonial[] = [
    {
        id: "1",
        name: "김OO 원장",
        role: "한의원 · 서울 강남",
        comment:
            "개원 준비할 때 원외탕전 업체를 여러 곳 비교해야 했는데, 메디허브 덕분에 리뷰 기반으로 빠르게 결정할 수 있었어요.",
        initial: "김",
        bgColor: "bg-blue-100 text-blue-700",
    },
    {
        id: "2",
        name: "이OO 원장",
        role: "치과의원 · 경기 성남",
        comment:
            "의료기기 업체를 한눈에 비교할 수 있어서 좋았습니다. 견적 요청도 간편하고 응답도 빨라서 만족합니다.",
        initial: "이",
        bgColor: "bg-green-100 text-green-700",
    },
    {
        id: "3",
        name: "박OO 원장",
        role: "한의원 · 부산 해운대",
        comment:
            "인테리어부터 간판, 세무까지 개원에 필요한 모든 업체를 한 곳에서 찾을 수 있어서 시간을 많이 절약했어요.",
        initial: "박",
        bgColor: "bg-purple-100 text-purple-700",
    },
];

export function TestimonialSection() {
    return (
        <section>
            <h2 className="text-lg font-bold text-gray-900 mb-6 text-center">
                메디허브를 이용하는 의료인들
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {testimonials.map((t) => (
                    <div
                        key={t.id}
                        className="relative bg-white border border-gray-100 rounded-xl p-6 shadow-sm"
                    >
                        {/* Quote decoration */}
                        <Quote className="w-8 h-8 text-gray-100 mb-3" />

                        {/* Comment */}
                        <p className="text-sm text-gray-600 leading-relaxed mb-5">
                            {t.comment}
                        </p>

                        {/* Author */}
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-full ${t.bgColor} flex items-center justify-center text-sm font-bold`}
                            >
                                {t.initial}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {t.name}
                                </p>
                                <p className="text-xs text-gray-400">{t.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
