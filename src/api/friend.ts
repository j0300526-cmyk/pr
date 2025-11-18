// 친구/초대 API
import { request } from "./request";
import type { Friend, GroupMission } from "./types";

export const friendApi = {
  // 친구 목록 조회
  getFriends: async (): Promise<Friend[]> => {
    return request<Friend[]>("/friends");
  },

  // 랜덤 초대 후보 조회
  getRandomCandidates: async (limit: number = 3): Promise<Friend[]> => {
    const params = new URLSearchParams({ limit: String(limit) });
    return request<Friend[]>(`/users/random?${params.toString()}`);
  },

  // 그룹 미션 초대 보내기
  sendInvite: async (groupId: number, friendIds: number[]): Promise<void> => {
    return request<void>(`/group-missions/${groupId}/invite`, {
      method: "POST",
      body: JSON.stringify({ friend_ids: friendIds }),
    });
  },

  // 받은 초대 목록
  getInvites: async (): Promise<Array<{
    id: number;
    group_mission: GroupMission;
    from_user: Friend;
    created_at: string;
  }>> => {
    return request("/invites/received");
  },

  // 초대 수락
  acceptInvite: async (inviteId: number): Promise<void> => {
    return request<void>(`/invites/${inviteId}/accept`, {
      method: "POST",
    });
  },

  // 초대 거절
  declineInvite: async (inviteId: number): Promise<void> => {
    return request<void>(`/invites/${inviteId}/decline`, {
      method: "DELETE",
    });
  },
};

