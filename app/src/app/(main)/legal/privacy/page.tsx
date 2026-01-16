import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "개인정보처리방침 | 메디허브",
    description: "메디허브 개인정보처리방침",
};

export default function PrivacyPage() {
    return (
        <article className="prose prose-gray max-w-none">
            <h1 className="text-2xl font-bold text-[#0a3b41] mb-6">개인정보처리방침</h1>
            <p className="text-sm text-gray-500 mb-8">시행일: 2026년 1월 18일</p>

            <p className="text-gray-700 leading-relaxed mb-8">
                메디허브(이하 &quot;회사&quot;)는 이용자의 개인정보를 중요시하며,
                「개인정보 보호법」을 준수하고 있습니다.
                회사는 개인정보처리방침을 통하여 이용자가 제공하는 개인정보가
                어떠한 용도와 방식으로 이용되고 있으며,
                개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
            </p>

            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제1조 (수집하는 개인정보 항목)</h2>
                <p className="text-gray-700 leading-relaxed">
                    회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-[#0a3b41] mb-2">필수 수집 항목</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>이메일 주소</li>
                        <li>비밀번호 (암호화 저장)</li>
                        <li>이름, 닉네임</li>
                        <li>연락처 (휴대폰 번호)</li>
                    </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                    <h3 className="font-medium text-[#0a3b41] mb-2">한의사 회원 추가 수집 항목</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>한의사 면허번호</li>
                        <li>면허증 사본 (인증 후 삭제)</li>
                    </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                    <h3 className="font-medium text-[#0a3b41] mb-2">업체 회원 추가 수집 항목</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>사업자등록번호</li>
                        <li>사업자등록증 사본 (인증 후 삭제)</li>
                        <li>업체명, 대표자명</li>
                        <li>사업장 주소</li>
                    </ul>
                </div>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제2조 (개인정보의 수집 및 이용목적)</h2>
                <p className="text-gray-700 leading-relaxed">
                    회사는 수집한 개인정보를 다음의 목적을 위해 이용합니다.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>회원 가입 및 관리: 회원 가입의사 확인, 본인 식별·인증, 회원자격 유지·관리</li>
                    <li>서비스 제공: 한의사-업체 매칭, 문의 연결, 견적 요청 처리</li>
                    <li>마케팅 및 광고: 이벤트 정보 제공, 서비스 안내 (동의 시에 한함)</li>
                    <li>서비스 개선: 서비스 이용 기록 분석, 서비스 개선 및 신규 서비스 개발</li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제3조 (개인정보의 보유 및 이용기간)</h2>
                <p className="text-gray-700 leading-relaxed">
                    회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
                    단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-[#0a3b41] mb-2">관련 법령에 의한 보존</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                        <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
                        <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
                        <li>웹사이트 방문 기록: 3개월 (통신비밀보호법)</li>
                    </ul>
                </div>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제4조 (개인정보의 파기절차 및 방법)</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>파기절차: 이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로 옮겨져 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.</li>
                    <li>파기방법: 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제5조 (개인정보의 제3자 제공)</h2>
                <p className="text-gray-700 leading-relaxed">
                    회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
                    다만, 아래의 경우에는 예외로 합니다.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>이용자가 사전에 동의한 경우</li>
                    <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제6조 (이용자의 권리와 행사방법)</h2>
                <p className="text-gray-700 leading-relaxed">
                    이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며,
                    가입 해지를 요청할 수 있습니다.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>개인정보 조회/수정: 마이페이지 &gt; 프로필 설정</li>
                    <li>회원 탈퇴: 마이페이지 &gt; 계정 설정</li>
                    <li>개인정보 관련 문의: support@medihub.kr</li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제7조 (개인정보의 안전성 확보조치)</h2>
                <p className="text-gray-700 leading-relaxed">
                    회사는 이용자의 개인정보를 취급함에 있어 개인정보가 분실, 도난, 누출, 변조 또는 훼손되지 않도록
                    안전성 확보를 위하여 다음과 같은 기술적/관리적 대책을 강구하고 있습니다.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>비밀번호 암호화: 이용자의 비밀번호는 암호화되어 저장 및 관리됩니다.</li>
                    <li>해킹 등에 대비한 대책: 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위해 보안 프로그램을 설치하고 있습니다.</li>
                    <li>개인정보 취급 직원의 최소화 및 교육: 개인정보를 취급하는 직원을 최소화하고, 수시 교육을 통해 개인정보보호 의무를 숙지시키고 있습니다.</li>
                </ol>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제8조 (개인정보 보호책임자)</h2>
                <p className="text-gray-700 leading-relaxed">
                    회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고,
                    개인정보 처리와 관련한 이용자의 불만처리 및 피해구제 등을 위하여
                    아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700"><strong>개인정보 보호책임자</strong></p>
                    <ul className="list-none space-y-1 text-gray-700 mt-2">
                        <li>성명: 대표이사</li>
                        <li>연락처: support@medihub.kr</li>
                    </ul>
                </div>
            </section>

            <section className="space-y-4 mt-8">
                <h2 className="text-lg font-semibold text-[#0a3b41]">제9조 (개인정보처리방침의 변경)</h2>
                <p className="text-gray-700 leading-relaxed">
                    본 개인정보처리방침은 법령이나 서비스의 변경사항을 반영하기 위해 개정될 수 있습니다.
                    개인정보처리방침이 변경되는 경우 회사는 변경 사항을 서비스 내 공지사항을 통해 공지합니다.
                </p>
            </section>

            <div className="mt-12 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                    본 개인정보처리방침은 2026년 1월 18일부터 시행됩니다.
                </p>
            </div>
        </article>
    );
}
