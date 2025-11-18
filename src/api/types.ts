// API 관련 타입 정의
// 대부분의 공통 타입은 루트 `src/types.ts`에서 관리합니다.
import type { CatalogMission, GroupParticipant } from "../types";

export interface DayMission {
  id: number; // dayMissionPk
  mission: {
    id: number;
    name: string;
    category?: string;
  };
  sub_mission: string;
  completed: boolean;
  created_at: string;
}

// `CatalogMission`는 공통 타입을 재사용합니다
export type { CatalogMission };

export interface User {
  id: number;
  name: string;
  profile_color: string;
  bio: string;
  email?: string;
}

export interface GroupMission {
  id: number;
  name: string;
  participants: GroupParticipant[];
  color: string;
  total_score?: number;
  member_count?: number;
}

// 그룹 랭킹 응답 타입
export interface GroupRanking {
  id: number;
  name: string;
  total_score: number;
  member_count: number;
  color: string;
}

export interface RankingUser {
  id: number;
  name: string;
  score: number;
  streak: number;
  profile_color: string;
}

export interface Friend {
  id: number;
  name: string;
  activeDays: number;
  profileColor?: string;
}

