// 날짜별 미션 API
import { request } from "./request";
import type { DayMission, DayCompletionSummary } from "./types";

export const dayMissionApi = {
  // 특정 날짜의 미션 목록 조회
  getDayMissions: async (dateStr: string): Promise<DayMission[]> => {
    return request<DayMission[]>(`/days/${dateStr}/missions`);
  },

  // 특정 날짜에 미션 추가
  addMission: async (
    dateStr: string,
    missionId: number,
    submission: string
  ): Promise<DayMission> => {
    return request<DayMission>(`/days/${dateStr}/missions`, {
      method: "POST",
      body: JSON.stringify({ mission_id: missionId, submission }),
    });
  },

  // 특정 날짜의 미션 삭제
  deleteMission: async (dateStr: string, dayMissionId: number): Promise<void> => {
    return request<void>(`/days/${dateStr}/missions/${dayMissionId}`, {
      method: "DELETE",
    });
  },

  // 특정 날짜의 미션 완료 상태 토글
  toggleComplete: async (
    dateStr: string,
    dayMissionId: number,
    completed: boolean
  ): Promise<DayMission> => {
    return request<DayMission>(`/days/${dateStr}/missions/${dayMissionId}/complete`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    });
  },

  // 주간 완료 현황 조회
  getWeekSummary: async (dateStr?: string): Promise<DayCompletionSummary[]> => {
    const normalized = dateStr?.trim();
    let safeDate: string | undefined;
    if (normalized) {
      const candidate = normalized.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
        safeDate = candidate;
      }
    }
    const query = safeDate ? `?date=${encodeURIComponent(safeDate)}` : "";
    return request<DayCompletionSummary[]>(`/days/week-summary${query}`);
  },
};

