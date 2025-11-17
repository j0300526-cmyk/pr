// 사용자 관련 API
import { request } from "./request";
import type { User } from "./types";

export const userApi = {
  // 현재 사용자 정보 조회
  getMe: async (): Promise<User> => {
    return request<User>("/users/me");
  },

  // 사용자 프로필 업데이트
  updateProfile: async (data: {
    name?: string;
    profile_color?: string;
    bio?: string;
  }): Promise<User> => {
    return request<User>("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

