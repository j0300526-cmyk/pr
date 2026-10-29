import { useEffect, useState } from "react";
import { authApi } from "../api";

const AUTO_LOGIN_DISABLED_KEY = "zero-waste:auto-login-disabled";
const AUTO_LOGIN_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_AUTO_LOGIN !== "false";
const DEMO_LOGIN_EMAIL = import.meta.env.VITE_DEMO_EMAIL || "test@example.com";
const DEMO_LOGIN_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || "test1234";

type Options = {
  onError: (message: string) => void;
};

export function useAuthBootstrap({ onError }: Options) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      const params = new URLSearchParams(window.location.search);
      const kakaoCode = params.get("code");

      try {
        if (kakaoCode) {
          const controller = new AbortController();
          const timeoutId = window.setTimeout(() => controller.abort(), 10_000);
          const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

          try {
            const response = await fetch(`${baseUrl}/auth/kakao/callback`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: kakaoCode }),
              signal: controller.signal,
            });
            if (!response.ok) {
              const error = await response.json().catch(() => ({}));
              throw new Error(error.detail || "카카오 로그인에 실패했습니다.");
            }

            const tokens = await response.json();
            localStorage.setItem("access", tokens.access);
            localStorage.setItem("refresh", tokens.refresh);
            window.history.replaceState({}, document.title, "/");
            if (!cancelled) setIsAuthed(true);
          } finally {
            window.clearTimeout(timeoutId);
          }
          return;
        }

        if (localStorage.getItem("access")) {
          if (!cancelled) setIsAuthed(true);
          return;
        }

        if (
          AUTO_LOGIN_ENABLED &&
          sessionStorage.getItem(AUTO_LOGIN_DISABLED_KEY) !== "true"
        ) {
          await authApi.login(DEMO_LOGIN_EMAIL, DEMO_LOGIN_PASSWORD);
          if (!cancelled) setIsAuthed(true);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "자동 로그인에 실패했습니다.";
          onError(message);
          window.history.replaceState({}, document.title, "/");
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [onError]);

  return { booting, isAuthed, setIsAuthed };
}

export const authStorageKeys = { autoLoginDisabled: AUTO_LOGIN_DISABLED_KEY };
