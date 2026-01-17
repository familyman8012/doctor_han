import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "리뷰 정책 | 메디허브",
    description: "메디허브 리뷰 작성 및 노출 정책",
};

export default function ReviewPolicyPage() {
    return (
        <article className="prose prose-gray max-w-none">
            <h1 className="text-2xl font-bold text-[#0a3b41] mb-6">리뷰 정책</h1>
            <p className="text-sm text-gray-500 mb-8">시행일: 2026년 1월 18일</p>

            <p className="text-gray-700 leading-relaxed mb-8">
                메디허브는 한의사와 업체 간의 신뢰할 수 있는 거래 환경을 조성하기 위해
                공정하고 투명한 리뷰 시스템을 운영합니다.
                본 정책은 리뷰 작성, 노출, 신고 및 제재에 관한 기준을 안내합니다.
            </p>

            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제1조 (리뷰 작성 자격)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>
                        리뷰는 해당 업체에 문의(리드)를 생성한 한의사 회원만 작성할 수 있습니다.
                    </li>
                    <li>
                        한의사 면허 인증이 완료된 회원만 리뷰를 작성할 수 있습니다.
                    </li>
                    <li>
                        동일 업체에 대해 하나의 문의 건당 하나의 리뷰만 작성할 수 있습니다.
                    </li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제2조 (리뷰 작성 기준)</h2>
                <p className="text-gray-700 leading-relaxed">
                    리뷰는 다음 기준에 따라 작성되어야 합니다.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-[#0a3b41] mb-2">작성 가능한 내용</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>실제 거래 경험에 기반한 솔직한 평가</li>
                        <li>서비스 품질, 응대 태도, 가격 적정성 등에 대한 의견</li>
                        <li>업체 선택에 도움이 되는 구체적인 정보</li>
                    </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg mt-4">
                    <h3 className="font-medium text-red-700 mb-2">작성 금지 내용</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>허위 또는 과장된 내용</li>
                        <li>욕설, 비방, 명예훼손 등 부적절한 표현</li>
                        <li>개인정보(연락처, 주소 등) 노출</li>
                        <li>광고, 홍보 목적의 내용</li>
                        <li>거래와 무관한 내용</li>
                    </ul>
                </div>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제3조 (리뷰 노출 정책)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>
                        작성된 리뷰는 즉시 공개되며, 업체 상세 페이지에 노출됩니다.
                    </li>
                    <li>
                        리뷰는 기본적으로 최신순으로 정렬되며, 별점순 정렬도 지원합니다.
                    </li>
                    <li>
                        본 정책에 위반되는 리뷰는 관리자에 의해 블라인드 처리될 수 있습니다.
                    </li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제4조 (블라인드 처리 기준)</h2>
                <p className="text-gray-700 leading-relaxed">
                    다음에 해당하는 리뷰는 블라인드 처리될 수 있습니다.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>허위 정보가 포함된 리뷰</li>
                    <li>욕설, 비방, 명예훼손이 포함된 리뷰</li>
                    <li>개인정보가 노출된 리뷰</li>
                    <li>스팸 또는 광고성 리뷰</li>
                    <li>실제 거래와 무관한 리뷰</li>
                    <li>기타 운영 정책에 위반되는 리뷰</li>
                </ul>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제5조 (리뷰 신고)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>
                        부적절한 리뷰를 발견한 경우, 신고 버튼을 통해 신고할 수 있습니다.
                    </li>
                    <li>
                        신고 사유를 선택하고, 필요시 상세 내용을 작성할 수 있습니다.
                    </li>
                    <li>
                        신고된 리뷰는 관리자가 검토 후 조치합니다.
                    </li>
                    <li>
                        허위 신고를 반복하는 경우 서비스 이용이 제한될 수 있습니다.
                    </li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제6조 (신고 처리 절차)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>
                        신고 접수: 회원이 리뷰 신고 시 관리자에게 검토 요청이 전달됩니다.
                    </li>
                    <li>
                        검토: 관리자가 신고 내용과 리뷰를 검토합니다.
                    </li>
                    <li>
                        조치: 정책 위반 여부에 따라 블라인드 처리 또는 기각됩니다.
                    </li>
                    <li>
                        통보: 처리 결과는 별도로 통보하지 않습니다.
                    </li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제7조 (리뷰 수정 및 삭제)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>
                        작성자는 본인이 작성한 리뷰를 수정하거나 삭제할 수 있습니다.
                    </li>
                    <li>
                        수정된 리뷰는 수정일시가 함께 표시됩니다.
                    </li>
                    <li>
                        삭제된 리뷰는 복구할 수 없습니다.
                    </li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제8조 (이의 신청)</h2>
                <p className="text-gray-700 leading-relaxed">
                    블라인드 처리된 리뷰에 대해 이의가 있는 경우,
                    고객센터(support@medihub.kr)로 문의하시기 바랍니다.
                    이의 신청은 블라인드 처리일로부터 30일 이내에 가능합니다.
                </p>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제9조 (정책 변경)</h2>
                <p className="text-gray-700 leading-relaxed">
                    본 정책은 서비스 운영 상황에 따라 변경될 수 있으며,
                    변경 시 서비스 내 공지사항을 통해 안내합니다.
                </p>
            </section>

            <div className="mt-12 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                    본 리뷰 정책은 2026년 1월 18일부터 시행됩니다.
                </p>
            </div>
        </article>
    );
}
