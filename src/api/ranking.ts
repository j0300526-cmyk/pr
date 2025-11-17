// 랭킹 API
import { request } from "./request";
import type { RankingUser, GroupMission } from "./types";

export const rankingApi = {
  // 개인 랭킹 조회
  getPersonalRanking: async (): Promise<RankingUser[]> => {
    return request<RankingUser[]>("/ranking/personal");
  },

  // 그룹 랭킹 조회
  getGroupRanking: async (): Promise<GroupMission[]> => {
    return request<GroupMission[]>("/ranking/group");
  },

  // 내 순위 조회
  getMyRank: async (): Promise<{
    personal_rank: number;
    group_ranks: Array<{ group_id: number; rank: number }>;
  }> => {
    return request("/ranking/my");
  },
};

