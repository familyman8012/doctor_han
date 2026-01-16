import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "이용약관 | 메디허브",
    description: "메디허브 서비스 이용약관",
};

export default function TermsPage() {
    return (
        <article className="prose prose-gray max-w-none">
            <h1 className="text-2xl font-bold text-[#0a3b41] mb-6">이용약관</h1>
            <p className="text-sm text-gray-500 mb-8">시행일: 2026년 1월 18일</p>

            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제1조 (목적)</h2>
                <p className="text-gray-700 leading-relaxed">
                    본 약관은 메디허브(이하 &quot;회사&quot;)가 제공하는 서비스의 이용과 관련하여
                    회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                </p>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제2조 (정의)</h2>
                <p className="text-gray-700 leading-relaxed">
                    본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>&quot;서비스&quot;란 회사가 제공하는 한의사-업체 매칭 플랫폼 서비스를 의미합니다.</li>
                    <li>&quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 의미합니다.</li>
                    <li>&quot;회원&quot;이란 회사와 서비스 이용계약을 체결하고 이용자 계정을 부여받은 자를 의미합니다.</li>
                    <li>&quot;한의사 회원&quot;이란 회원 중 한의사 자격을 인증받은 회원을 의미합니다.</li>
                    <li>&quot;업체 회원&quot;이란 회원 중 사업자 자격을 인증받은 회원을 의미합니다.</li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제3조 (약관의 효력 및 변경)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
                    <li>회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
                    <li>변경된 약관은 공지 후 7일이 경과한 시점부터 효력이 발생합니다.</li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제4조 (서비스의 제공)</h2>
                <p className="text-gray-700 leading-relaxed">
                    회사가 제공하는 서비스는 다음과 같습니다.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>한의사-업체 매칭 서비스</li>
                    <li>업체 정보 검색 및 조회 서비스</li>
                    <li>문의 및 견적 요청 서비스</li>
                    <li>리뷰 작성 및 조회 서비스</li>
                    <li>기타 회사가 정하는 서비스</li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제5조 (이용자의 의무)</h2>
                <p className="text-gray-700 leading-relaxed">
                    이용자는 다음 각 호의 행위를 하여서는 안 됩니다.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>타인의 정보 도용 또는 허위정보 등록</li>
                    <li>서비스를 이용하여 얻은 정보의 무단 복제, 배포, 상업적 이용</li>
                    <li>회사 또는 제3자의 지적재산권 침해</li>
                    <li>회사 또는 제3자의 명예 훼손 또는 업무 방해</li>
                    <li>기타 관련 법령 및 본 약관에서 금지하는 행위</li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제6조 (서비스 이용 제한)</h2>
                <p className="text-gray-700 leading-relaxed">
                    회사는 이용자가 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우,
                    서비스 이용을 제한하거나 이용계약을 해지할 수 있습니다.
                </p>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제7조 (면책조항)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>회사는 천재지변, 전쟁 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
                    <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
                    <li>회사는 이용자 간 또는 이용자와 제3자 간에 서비스를 매개로 발생한 분쟁에 대해 개입할 의무가 없으며, 이로 인한 손해에 대해 책임을 지지 않습니다.</li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제8조 (분쟁 해결)</h2>
                <p className="text-gray-700 leading-relaxed">
                    본 약관에 관한 분쟁은 대한민국 법률에 따라 해결하며,
                    서비스 이용으로 발생한 분쟁에 대해 소송이 제기될 경우 회사의 소재지를 관할하는 법원을 전속관할로 합니다.
                </p>
            </section>

            <div className="mt-12 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                    본 약관은 2026년 1월 18일부터 시행됩니다.
                </p>
            </div>
        </article>
    );
}
