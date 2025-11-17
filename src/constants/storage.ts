// safeStorage에서 사용하는 키 값을 한곳에 모아둔 상수
export const STORAGE_KEYS = {
  availableMissions: "availableMissions",
  missions: "missions",
  userName: "userName",
  userBio: "userBio",
  profileColor: "profileColor",
  myGroupMissions: "myGroupMissions",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];


