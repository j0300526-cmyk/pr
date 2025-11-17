// 미션 카탈로그 API
import { request } from "./request";
import type { CatalogMission } from "./types";

export const missionApi = {
  // 사용 가능한 미션 카탈로그 조회
  getCatalog: async (): Promise<CatalogMission[]> => {
    return request<CatalogMission[]>("/missions/catalog");
  },
};

