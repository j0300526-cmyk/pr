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

    if (!access || !refresh) {
      throw new Error("로그인 응답에 토큰이 없습니다.");
    }

    // localStorage에 저장 시도
    try {
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      
      const savedAccess = localStorage.getItem("access");
      const savedRefresh = localStorage.getItem("refresh");

      if (!savedAccess || !savedRefresh) {
        throw new Error("토큰 저장에 실패했습니다. localStorage를 확인해주세요.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      throw new Error(`토큰 저장 실패: ${message}`);
    }

    return data;
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem("access");
    if (!token) return;

    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
