"use client";

import Image from "next/image";
import { Star, CheckCircle2 } from "lucide-react";

interface Testimonial {
    id: string;
    name: string;
    clinicType: string;
    location: string;
    comment: string;
    image: string;
    stars: number;
    category: string;
}

const testimonials: Testimonial[] = [
    {
        id: "1",
        name: "김OO 원장",
        clinicType: "한의원",
        location: "서울 강남",
        comment:
            "개원 준비할 때 원외탕전 업체를 여러 곳 비교해야 했는데, 메디허브 덕분에 리뷰 기반으로 빠르게 결정할 수 있었어요. 시간을 정말 많이 아꼈습니다.",
        image: "/images/experts/testimonial-kim.jpg",
        stars: 5,
        category: "원외탕전",
    },
    {
        id: "2",
        name: "이OO 원장",
        clinicType: "한의원",
        location: "경기 성남",
        comment:
            "의료기기 업체를 한눈에 비교할 수 있어서 정말 좋았어요. 견적 요청도 간편하고 응답도 빠르고, 결국 기대 이상의 업체를 찾았습니다.",
        image: "/images/experts/testimonial-lee.jpg",
        stars: 5,
        category: "의료기기",
    },
    {
        id: "3",
        name: "박OO 원장",
        clinicType: "한의원",
        location: "부산 해운대",
        comment:
            "인테리어부터 간판, 세무까지 개원에 필요한 모든 업체를 한 곳에서 찾을 수 있어서 시간을 많이 절약했어요. 강력 추천합니다.",
        image: "/images/experts/testimonial-park.jpg",
        stars: 5,
        category: "인테리어·간판·세무",
    },
];

export function TestimonialSection() {
    return (
        <section>
            {/* Header */}
            <div className="flex flex-col items-center mb-8 md:mb-10">
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary-600 mb-3">
                    REVIEWS
                </p>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-2">
                    메디허브를 이용하는 의료인들
                </h2>
                <p className="text-sm text-gray-500">실제 이용 원장님들의 솔직한 후기</p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {testimonials.map((t) => (
                    <div
                        key={t.id}
                        className="relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                    >
                        {/* Top row: stars + category badge */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-0.5">
                                {Array.from({ length: t.stars }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className="w-4 h-4 fill-amber-400 text-amber-400"
                                    />
                                ))}
                            </div>
                            <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {t.category}
                            </span>
                        </div>

                        {/* Comment */}
                        <p className="text-sm text-gray-700 leading-relaxed flex-1 mb-5">
                            &ldquo;{t.comment}&rdquo;
                        </p>

                        {/* Divider */}
                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-3">
                                {/* Avatar photo */}
                                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
                                    <Image
                                        src={t.image}
                                        alt={t.name}
                                        width={44}
                                        height={44}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                        {t.name}
                                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {t.clinicType} · {t.location}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
