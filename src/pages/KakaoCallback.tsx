// src/pages/KakaoCallback.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Props = { onSuccess: () => void };

export default function KakaoCallbackPage({ onSuccess }: Props) {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleKakaoCallback = async () => {
      try {
        // URL에서 인가 코드 추출
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (!code) {
          throw new Error("카카오 인가 코드를 받지 못했습니다.");
        }

        // 백엔드로 인가 코드 전송
        const response = await fetch("/api/auth/kakao/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: "카카오 로그인 실패" }));
          throw new Error(errorData.detail || "카카오 로그인에 실패했습니다.");
        }

        const data = await response.json();

        // JWT 토큰 저장
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        console.log("[KakaoCallback] 카카오 로그인 성공");

        // 로그인 성공 후 홈으로 이동
        onSuccess();
      } catch (err: any) {
        console.error("[KakaoCallback] 카카오 로그인 실패:", err);
        setError(err.message || "카카오 로그인 처리 중 오류가 발생했습니다.");
      }
    };

    handleKakaoCallback();
  }, [onSuccess]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="bg-white p-8 rounded-3xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">로그인 실패</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white p-8 rounded-3xl shadow-lg max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">카카오 로그인 중...</h2>
        <p className="text-gray-600">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}

