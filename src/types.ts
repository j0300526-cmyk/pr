// 공유 타입
export interface Mission {
  id: number;
  name: string;
  participants: string[];
  color: string;
  // 완료 상태 (옵셔널, 서버에서 불러올 때 포함)
  checked?: boolean;
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
  // 주간 루틴 관련 필드 (옵셔널)
  is_weekly_routine?: boolean;
  routine_id?: number;
  // 완료 상태 (옵셔널, 서버에서 불러올 때 포함)
  completed?: boolean;
  // dayMissionId (일일 미션의 경우, API 호출에 필요)
  dayMissionId?: number;
}

export type MissionsRecord = Record<string, PersonalMissionEntry[]>;
export type PageType = "home" | "groupmanage" | "invite" | "mypage" | "ranking";