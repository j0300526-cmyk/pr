// src/pages/Login.tsx
import React, { useState } from "react";
import { Leaf, ShieldCheck } from "lucide-react";
import { authApi } from "../api";

type Props = { onSuccess: () => void };

export default function LoginPage({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error("이메일과 비밀번호를 입력해주세요.");
      }

      // 실제 백엔드 API 호출
      await authApi.login(email, password); // 여기서 토큰 저장까지 끝

      onSuccess();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleKakao = () => {
    // 카카오 로그인 페이지로 리다이렉트
    const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID || "";
    const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI || "http://localhost:5173/auth/kakao/callback";
    
    if (!KAKAO_CLIENT_ID) {
      setErr("카카오 클라이언트 ID가 설정되지 않았습니다. .env 파일을 확인해주세요.");
      return;
    }
    
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  return (
    <div className="px-6 py-6 flex flex-col h-full rounded-3xl">
      {/* 헤더 영역 - 앱 컨셉 맞게 */}
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
          다시 만나서 반가워요 👋
        </h1>
        <p className="text-sm text-gray-500">
          오늘도 미션으로 지구를 가볍게 만들어볼까요?
        </p>
      </header>

      {/* 소셜 로그인 버튼들 */}
      <section className="space-y-3 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">
          소셜 계정으로 빠르게 시작하기
        </h2>

        <button
          onClick={handleKakao}
          className="w-full flex items-center justify-between px-4 py-3 rounded-3xl bg-[#FEE500] text-gray-900 font-medium shadow-sm active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-black/80 flex items-center justify-center">
              <span className="text-[11px] font-bold text-[#FEE500]">Ka</span>
            </div>
            <span className="text-sm">카카오로 계속하기</span>
          </div>
          <span className="text-xs text-gray-800">추천</span>
        </button>

        <button
          disabled
          className="w-full flex items-center justify-between px-4 py-3 rounded-3xl bg-gray-50 text-gray-400 font-medium border border-gray-200 cursor-not-allowed"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[11px]">
              G
            </div>
            <span className="text-sm">Google 로그인 (준비 중)</span>
          </div>
        </button>

        <button
          disabled
          className="w-full flex items-center justify-between px-4 py-3 rounded-3xl bg-green-300 text-white font-medium cursor-not-allowed"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[11px] font-bold">
              N
            </div>
            <span className="text-sm">네이버 로그인 (준비 중)</span>
          </div>
        </button>
      </section>

      {/* 구분선 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-[11px] text-gray-400">또는 이메일로 로그인</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      {/* 이메일/비밀번호 로그인 폼 */}
      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="login-email" className="text-xs text-gray-600">
            이메일
          </label>
          <input
            id="login-email"
            name="email"
            className="border border-gray-200 rounded-3xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all"
            type="email"
            placeholder="example@gachon.ac.kr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="login-password" className="text-xs text-gray-600">
            비밀번호
          </label>
          <input
            id="login-password"
            name="password"
            className="border border-gray-200 rounded-3xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {err && (
          <p role="alert" className="text-red-500 text-xs bg-red-50 rounded-xl px-3 py-2">
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full py-2.5 rounded-3xl bg-green-500 text-white text-sm font-semibold shadow-sm active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-transform"
        >
          {loading ? "로그인 중..." : "이메일로 로그인"}
        </button>
      </form>

      {/* 하단 안내 */}
      <section className="mt-auto pt-4 border-t border-gray-100">
        <div className="flex items-start gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
          </div>
          <p className="text-[11px] leading-relaxed text-gray-500">
            소셜 로그인은 <span className="font-semibold">이름 / 프로필 이미지</span> 정도만
            사용하며, 동의 없이 임의로 게시물을 올리거나 메시지를 보내지 않아요.
          </p>
        </div>

        <p className="text-[11px] text-gray-400">
          아직 계정이 없다면, 팀에서 발급해주는 초대 링크로 회원가입할 수 있어요.
        </p>
      </section>
    </div>
  );
}
