// src/api/groupMission.ts
import { request } from "./request";
import type { GroupMission } from "./types";

export const groupMissionApi = {
  // 전체 그룹 목록 조회
  getAll: async (): Promise<GroupMission[]> => {
    return request("/group-missions");
  },

  // 특정 그룹 상세 조회
  getOne: async (id: number): Promise<GroupMission> => {
    return request(`/group-missions/${id}`);
  },

  // 추천 그룹 목록
  getRecommended: async (): Promise<GroupMission[]> => {
    return request(`/group-missions/recommended`);
  },

  // 그룹 참여 (join)
  join: async (id: number): Promise<any> => {
    return request(`/group-missions/${id}/join`, {
      method: "POST",
    });
  },

  // (호환성) 기존 코드에서 groupMissionApi.joinGroup()로 접근하는 경우를 위해 alias 제공
  joinGroup: async (id: number): Promise<any> => {
    return request(`/group-missions/${id}/join`, {
      method: "POST",
    });
  },

  // 그룹 탈퇴 (leave)
  leave: async (id: number): Promise<any> => {
    return request(`/group-missions/${id}/leave`, {
      method: "DELETE",
    });
  },

  // (호환성) 기존 코드에서 groupMissionApi.leaveGroup()로 접근하는 경우를 위해 alias 제공
  leaveGroup: async (id: number): Promise<any> => {
    return request(`/group-missions/${id}/leave`, {
      method: "DELETE",
    });
  },

  // 내가 속한 그룹들 조회
  getMyGroups: async (date?: string): Promise<GroupMission[]> => {
    const url = date ? `/group-missions/my?date=${date}` : "/group-missions/my";
    return request(url);
  },

  // 그룹 미션 완료 체크
  checkGroupMission: async (
    groupId: number,
    dateStr: string,
    completed: boolean
  ): Promise<void> => {
    return request(`/group-missions/${groupId}/check`, {
      method: "POST",
      body: JSON.stringify({ date: dateStr, completed }),
    });
  },

  // 그룹 미션 생성
  createGroup: async (
    name: string,
    color: string = "bg-blue-300"
  ): Promise<GroupMission> => {
    return request("/group-missions", {
      method: "POST",
      body: JSON.stringify({ name, color }),
    });
  },
};
