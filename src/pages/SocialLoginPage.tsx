// src/pages/SocialLoginPage.tsx
import React from "react";
import { Leaf, ShieldCheck, Smile } from "lucide-react";

export default function SocialLoginPage() {
  const handleKakao = () => {
    alert("카카오 로그인 연동 예정입니다 😊");
  };

  const handleGoogle = () => {
    alert("구글 로그인 연동 예정입니다 😊");
  };

  const handleNaver = () => {
    alert("네이버 로그인 연동 예정입니다 😊");
  };

  const handleGuest = () => {
    alert("게스트 모드(임시 사용)로 입장합니다");
  };

  return (
    // 📌 App.tsx 카드 안에 들어가니까 화면 전체가 아니라 h-full로만 차지
    <div className="px-6 py-6 flex flex-col h-full">
      {/* 상단 로고/타이틀 영역 */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-2xl bg-green-200 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-green-700" />
          </div>
          <span className="text-sm font-semibold text-green-700 tracking-tight">
            Zero Waste Routine
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-snug text-gray-900 mb-2">
          오늘도 <span className="text-green-500">미션</span>으로<br />
          지구를 가볍게 만들어요
        </h1>
        <p className="text-sm text-gray-500">
          한 번의 로그인으로 개인 루틴과 팀 미션을<br />
          한 곳에서 관리해보세요.
        </p>
      </header>

      {/* 미리보기 카드 (앱 소개 느낌) */}
      <section className="mb-8">
        <div className="rounded-3xl bg-gradient-to-br from-green-50 via-emerald-50 to-amber-50 p-4 border border-green-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-green-700 mb-1">
                오늘의 제로웨이스트
              </p>
              <p className="text-sm font-bold text-gray-900">
                미션 3일째 달성 중 👏
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm">
              <Smile className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-700">
            <div className="rounded-2xl bg-white/80 px-3 py-2 flex flex-col gap-1">
              <span className="font-semibold text-xs text-gray-800">
                텀블러 사용
              </span>
              <span className="text-[10px] text-green-600">이번 주 4/5</span>
            </div>
            <div className="rounded-2xl bg-white/80 px-3 py-2 flex flex-col gap-1">
              <span className="font-semibold text-xs text-gray-800">
                장바구니 챙기기
              </span>
              <span className="text-[10px] text-emerald-600">
                오늘 미션 완료!
              </span>
            </div>
            <div className="rounded-2xl bg-white/80 px-3 py-2 flex flex-col gap-1">
              <span className="font-semibold text-xs text-gray-800">
                리필스테이션
              </span>
              <span className="text-[10px] text-gray-500">
                주말에 함께 가요
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 로그인 버튼들 */}
      <section className="space-y-3 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">
          소셜 계정으로 빠르게 시작하기
        </h2>

        {/* 카카오 로그인 */}
        <button
          onClick={handleKakao}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#FEE500] text-gray-900 font-medium shadow-sm active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-black/80 flex items-center justify-center">
              <span className="text-[11px] font-bold text-[#FEE500]">Ka</span>
            </div>
            <span className="text-sm">카카오로 계속하기</span>
          </div>
          <span className="text-xs text-gray-800">추천</span>
        </button>

        {/* 구글 로그인 */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white text-gray-800 font-medium border border-gray-200 shadow-sm active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[11px]">
              G
            </div>
            <span className="text-sm">Google 계정으로 로그인</span>
          </div>
        </button>

        {/* 네이버 로그인 */}
        <button
          onClick={handleNaver}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#03C75A] text-white font-medium shadow-sm active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[11px] font-bold">
              N
            </div>
            <span className="text-sm">네이버로 로그인</span>
          </div>
        </button>
      </section>

      {/* 하단 안내 + 게스트 */}
      <section className="mt-auto pt-3 border-t border-gray-100">
        <div className="flex items-start gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500">
            소셜 로그인은 <span className="font-semibold">이름 / 프로필 이미지</span> 정도만
            사용하며, 동의 없이 게시물을 올리거나 메시지를 보내지 않아요.
          </p>
        </div>

        <button
          onClick={handleGuest}
          className="w-full py-2.5 text-xs text-gray-500 underline underline-offset-2"
        >
          일단 둘러보기 (로그인 없이 사용)
        </button>
      </section>
    </div>
  );
}
