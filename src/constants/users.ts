// 사용자/친구 기본 데이터를 담는 상수 정의
import { Profile } from "../types";

export const INITIAL_FRIENDS: Profile[] = [
  { id: 201, name: "김민수", activeDays: 12, profileColor: "bg-yellow-300" },
  { id: 202, name: "이미란", activeDays: 5, profileColor: "bg-blue-300" },
  { id: 203, name: "이지윤", activeDays: 9, profileColor: "bg-purple-300" },
];

export const DEFAULT_USER_BIO = "친환경 실천 중!";


