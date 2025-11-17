// API 모듈 통합 export
export * from "./types";
export * from "./request";
export { authApi } from "./auth";
export { userApi } from "./user";
export { missionApi } from "./mission";
export { dayMissionApi } from "./dayMission";
export { groupMissionApi } from "./groupMission";
export { friendApi } from "./friend";
export { rankingApi } from "./ranking";
export { utilApi } from "./util";

// 레거시 호환성을 위한 기본 api 함수
import { request } from "./request";
import { userApi } from "./user";
import { missionApi } from "./mission";
import { dayMissionApi } from "./dayMission";
import { utilApi } from "./util";

/**
 * 레거시 호환성을 위한 기본 api 함수
 * 기존 코드와의 호환을 위해 유지됩니다.
 * 새로운 코드는 구조화된 API를 사용하는 것을 권장합니다.
 */
export async function api(path: string, options?: RequestInit) {
  // 개발 모드에서만 콘솔 로그
  if (import.meta.env.DEV) {
    console.log("[API]", path, options);
  }

  // 기존 코드와의 호환성을 위한 라우팅
  // 구조화된 API를 사용하되, request()를 통해 토큰이 자동으로 포함됨
  if (path === "/users/me") {
    if (options?.method === "PUT") {
      const body = JSON.parse(options.body as string);
      return userApi.updateProfile(body);
    }
    return userApi.getMe();
  }

  if (path === "/missions/catalog") {
    return missionApi.getCatalog();
  }

  if (path === "/server/date") {
    return utilApi.getServerDate();
  }

  // /days/{date}/missions 패턴
  const dayMissionMatch = path.match(/^\/days\/([^\/]+)\/missions$/);
  if (dayMissionMatch) {
    const dateStr = dayMissionMatch[1];
    if (options?.method === "POST") {
      const body = JSON.parse(options.body as string);
      return dayMissionApi.addMission(dateStr, body.mission_id, body.submission);
    }
    return dayMissionApi.getDayMissions(dateStr);
  }

  // /days/{date}/missions/{id} 패턴
  const deleteMissionMatch = path.match(/^\/days\/([^\/]+)\/missions\/(\d+)$/);
  if (deleteMissionMatch) {
    const dateStr = deleteMissionMatch[1];
    const missionId = parseInt(deleteMissionMatch[2]);
    return dayMissionApi.deleteMission(dateStr, missionId);
  }

  // /days/{date} 패턴 (레거시)
  const dayMatch = path.match(/^\/days\/([^\/]+)$/);
  if (dayMatch) {
    const dateStr = dayMatch[1];
    return dayMissionApi.getDayMissions(dateStr);
  }

  // 알 수 없는 경로는 request()를 통해 직접 호출
  return request(path, options);
}

