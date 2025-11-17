// 공유 타입
export interface Mission {
  id: number;
  name: string;
  participants: string[];
  color: string;
}
export interface WeekDay {
  num: number;
  day: string;
  fullDate: string;
  isToday: boolean;
}
export interface CatalogMission {
  id: number;
  // 서버 응답에 따라 `name`이 올 수도 있고 아닐 수도 있으므로 선택적 필드로 허용
  name?: string;
  category: string;
  // 카탈로그 항목의 예시(소주제)들
  submissions: string[];
  // 아이콘 등 추가 메타정보를 허용
  icon?: string;
  // 문자열 검색 편의를 위한 예시 속성(있을 수 있음)
  example?: string;
}
export interface Profile { id: number; name: string; activeDays: number; profileColor?: string }
export interface PersonalMissionEntry {
  missionId: number;
  submission: string;
}

export type MissionsRecord = Record<string, PersonalMissionEntry[]>;
export type PageType = "home" | "groupmanage" | "invite" | "mypage" | "ranking";