// src/api/auth.ts
import { API_BASE_URL } from "./request";

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.detail || "로그인에 실패했습니다.");
    }

    const data = await res.json();
    console.log("[Auth] 로그인 응답:", data);
    console.log("[Auth] 응답 타입:", typeof data);
    console.log("[Auth] 응답 키:", Object.keys(data));
    console.log("[Auth] JSON 문자열:", JSON.stringify(data));

    // 🔑 응답 키 여러 경우 다 커버
    const access =
      data.access ??
      data.access_token ??
      data.token ??
      data.accessToken;

    const refresh =
      data.refresh ??
      data.refresh_token ??
      data.refreshToken;

    console.log("[Auth] 추출된 access:", access ? access.substring(0, 30) + "..." : "❌ NULL");
    console.log("[Auth] 추출된 refresh:", refresh ? refresh.substring(0, 30) + "..." : "❌ NULL");
    console.log("[Auth] hasAccess:", !!access);
    console.log("[Auth] hasRefresh:", !!refresh);

    if (!access || !refresh) {
      console.error("❌ 로그인 응답에 토큰 필드가 없습니다!");
      console.error("❌ 전체 응답:", data);
      console.error("❌ data.access:", data.access);
      console.error("❌ data.refresh:", data.refresh);
      throw new Error("로그인 응답에 토큰이 없습니다.");
    }

    // localStorage에 저장 시도
    try {
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      
      // 저장 직후 즉시 확인
      const savedAccess = localStorage.getItem("access");
      const savedRefresh = localStorage.getItem("refresh");
      
      console.log("[Auth] 저장 직후 확인:");
      console.log("  savedAccess:", savedAccess ? savedAccess.substring(0, 30) + "..." : "❌ NULL");
      console.log("  savedRefresh:", savedRefresh ? savedRefresh.substring(0, 30) + "..." : "❌ NULL");
      
      if (!savedAccess || !savedRefresh) {
        console.error("❌ localStorage 저장 실패!");
        console.error("  localStorage 지원 여부:", typeof Storage !== "undefined");
        console.error("  localStorage 사용 가능:", typeof localStorage !== "undefined");
        throw new Error("토큰 저장에 실패했습니다. localStorage를 확인해주세요.");
      }
      
      console.log("[Auth] ✅ 토큰 저장 성공!");
    } catch (e: any) {
      console.error("❌ localStorage 저장 중 에러:", e);
      throw new Error(`토큰 저장 실패: ${e.message}`);
    }

    return data;
  },
};
