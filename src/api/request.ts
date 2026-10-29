// API 요청 기본 함수
/// <reference types="vite/client" />

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

async function refreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("access", data.access);
      if (data.refresh) {
        localStorage.setItem("refresh", data.refresh);
      }
      return true;
    }
  } catch {
    // 리프레시 실패
  }
  return false;
}

export async function request<T>(
  path: string,
  options?: RequestInit,
  hasRetriedAfterRefresh = false,
): Promise<T> {
  // 토큰을 요청 직전에 다시 읽어서 최신 값 사용
  const token = localStorage.getItem("access");
  
  // 기본 헤더 설정
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // 사용자 지정 헤더 처리
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      // Headers 객체인 경우
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      // 배열인 경우
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      // 일반 객체인 경우
      Object.assign(headers, options.headers);
    }
  }
  
  // 토큰이 있으면 Authorization 헤더 추가 (항상 우선)
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // options에서 headers를 제거하고 새로 만든 headers를 사용
  const { headers: _, ...restOptions } = options || {};
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      if (!hasRetriedAfterRefresh && await refreshToken()) {
        return request<T>(path, options, true);
      }

      console.warn("[API] 인증 실패 - 토큰 삭제 및 재로그인 필요");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      const error = await response.json().catch(() => ({ detail: "인증이 만료되었습니다." }));
      throw new Error(error.detail || error.message || "인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    
    const error = await response.json().catch(() => ({ message: "요청에 실패했습니다." }));
    const msg = error.message || error.detail || `HTTP ${response.status}`;
    const err = new Error(msg) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  return response.json();
}

