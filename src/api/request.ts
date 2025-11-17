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
  options?: RequestInit
): Promise<T> {
  // 토큰을 요청 직전에 다시 읽어서 최신 값 사용
  const token = localStorage.getItem("access");
  
  // 토큰이 없으면 경고 (로그인 직후 요청인 경우)
  if (!token && import.meta.env.DEV) {
    console.warn("[API Request] ⚠️ 토큰이 없습니다. localStorage 확인:", {
      access: localStorage.getItem("access"),
      refresh: localStorage.getItem("refresh"),
      allKeys: Object.keys(localStorage),
    });
  }
  
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
  } else {
    // 토큰이 없으면 경고
    if (import.meta.env.DEV) {
      console.warn("[API Request] 토큰이 없습니다:", path);
    }
  }

  // 디버깅: 토큰이 있는지 확인
  if (import.meta.env.DEV) {
    console.log("[API Request]", path, {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : "none",
      tokenLength: token?.length || 0,
      headers: Object.keys(headers),
      authorizationHeader: headers["Authorization"] ? `${headers["Authorization"].substring(0, 30)}...` : "none",
      allHeaders: { ...headers }, // 실제 헤더 값 확인
      localStorageAccess: localStorage.getItem("access") ? "exists" : "missing",
    });
  }

  // options에서 headers를 제거하고 새로 만든 headers를 사용
  const { headers: _, ...restOptions } = options || {};
  
  // 최종 헤더 확인 (디버깅)
  if (import.meta.env.DEV && path === "/users/me") {
    console.log("[API Request] 최종 헤더:", {
      Authorization: headers["Authorization"] ? `${headers["Authorization"].substring(0, 50)}...` : "없음",
      ContentType: headers["Content-Type"],
      allHeaders: headers,
    });
  }
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers,
  });

  // 응답 상태 로깅
  if (import.meta.env.DEV) {
    console.log("[API Response]", path, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });
  }

  if (!response.ok) {
    if (response.status === 401) {
      // 토큰 만료 시 리프레시 시도
      const refreshed = await refreshToken();
      if (refreshed) {
        // 재시도
        return request<T>(path, options);
      }
      // 리프레시 실패 시 토큰 삭제 (서명 검증 실패 등)
      console.warn("[API] 인증 실패 - 토큰 삭제 및 재로그인 필요");
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      const error = await response.json().catch(() => ({ detail: "인증이 만료되었습니다." }));
      throw new Error(error.detail || error.message || "인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    
    const error = await response.json().catch(() => ({ message: "요청에 실패했습니다." }));
    const msg = error.message || error.detail || `HTTP ${response.status}`;
    const err: any = new Error(msg);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

