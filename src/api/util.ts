// 유틸리티 API
import { request } from "./request";

export const utilApi = {
  // 서버 현재 날짜 조회
  getServerDate: async (): Promise<string> => {
    return request<string>("/server/date");
  },
};

