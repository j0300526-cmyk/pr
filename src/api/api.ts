// src/api/api.ts
// 프로젝트 전체 API 엔드포인트 구현

/// <reference types="vite/client" />

// ===== 타입 정의 =====
interface DayMission {
  id: number; // dayMissionPk
  mission: {
    id: number;
    name: string;
    category?: string;
  };
  completed: boolean;
  created_at: string;
}

interface CatalogMission {
  id: number;
  name: string;
  category: string;
  icon?: string;
}

interface User {
  id: number;
  name: string;
  profile_color: string;
  bio: string;
  email?: string;
}

interface GroupMission {
  id: number;
  name: string;
  participants: string[];
  color: string;
  total_score?: number;
  member_count?: number;
}

interface RankingUser {
  id: number;
  name: string;
  score: number;
  streak: number;
  profile_color: string;
}

interface Friend {
  id: number;
  name: string;
  activeDays: number;
  profileColor?: string;
}

// ===== API 기본 설정 =====
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem("access");
  
  // 기본 헤더 설정
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // 사용자 지정 헤더 처리
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      // Headers 객체인 경우
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      // 배열인 경우
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      // 일반 객체인 경우
      Object.assign(headers, options.headers);
    }
  }
  
  // 토큰이 있으면 Authorization 헤더 추가 (항상 우선)
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // options에서 headers를 제거하고 새로 만든 headers를 사용
  const { headers: _, ...restOptions } = options || {};
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // 토큰 만료 시 리프레시 시도
      const refreshed = await refreshToken();
      if (refreshed) {
        // 재시도
        return request<T>(path, options);
      }
      // 리프레시 실패 시 에러만 throw (자동 리다이렉트는 App.tsx에서 처리)
      const error = await response.json().catch(() => ({ detail: "인증이 만료되었습니다." }));
      throw new Error(error.detail || error.message || "인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    
    const error = await response.json().catch(() => ({ message: "요청에 실패했습니다." }));
    throw new Error(error.message || error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

async function refreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("access", data.access);
      if (data.refresh) {
        localStorage.setItem("refresh", data.refresh);
      }
      return true;
    }
  } catch {
    // 리프레시 실패
  }
  return false;
}

// ===== 인증 관련 API =====
export const authApi = {
  // 로그인
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "로그인에 실패했습니다." }));
      throw new Error(error.message || "로그인에 실패했습니다.");
    }

    const data = await response.json();
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    return data;
  },

  // 소셜 로그인 (카카오, 구글, 네이버)
  socialLogin: async (provider: "kakao" | "google" | "naver", code: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/${provider}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error("소셜 로그인에 실패했습니다.");
    }

    const data = await response.json();
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    return data;
  },

  // 로그아웃
  logout: async () => {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      // 실패해도 로컬에서 토큰 제거
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
    }
  },
};

// ===== 사용자 관련 API =====
export const userApi = {
  // 현재 사용자 정보 조회
  getMe: async (): Promise<User> => {
    return request<User>("/users/me");
  },

  // 사용자 프로필 업데이트
  updateProfile: async (data: {
    name?: string;
    profile_color?: string;
    bio?: string;
  }): Promise<User> => {
    return request<User>("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

// ===== 미션 카탈로그 API =====
export const missionApi = {
  // 사용 가능한 미션 카탈로그 조회
  getCatalog: async (): Promise<CatalogMission[]> => {
    return request<CatalogMission[]>("/missions/catalog");
  },
};

// ===== 날짜별 미션 API =====
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
};

// ===== 그룹 미션 API =====
export const groupMissionApi = {
  // 내가 참여 중인 그룹 미션 목록
  getMyGroups: async (): Promise<GroupMission[]> => {
    return request<GroupMission[]>("/group-missions/my");
  },

  // 추천 그룹 미션 목록
  getRecommended: async (): Promise<GroupMission[]> => {
    return request<GroupMission[]>("/group-missions/recommended");
  },

  // 그룹 미션 상세 정보
  getGroupDetail: async (groupId: number): Promise<GroupMission> => {
    return request<GroupMission>(`/group-missions/${groupId}`);
  },

  // 그룹 미션 참여
  joinGroup: async (groupId: number): Promise<GroupMission> => {
    return request<GroupMission>(`/group-missions/${groupId}/join`, {
      method: "POST",
    });
  },

  // 그룹 미션 나가기
  leaveGroup: async (groupId: number): Promise<void> => {
    return request<void>(`/group-missions/${groupId}/leave`, {
      method: "DELETE",
    });
  },

  // 그룹 미션 완료 체크
  checkGroupMission: async (
    groupId: number,
    dateStr: string,
    completed: boolean
  ): Promise<void> => {
    return request<void>(`/group-missions/${groupId}/check`, {
      method: "POST",
      body: JSON.stringify({ date: dateStr, completed }),
    });
  },

  // 그룹 미션 삭제 (방장만 가능)
  deleteGroup: async (groupId: number): Promise<void> => {
    return request<void>(`/group-missions/${groupId}`, {
      method: "DELETE",
    });
  },
};

// ===== 친구/초대 API =====
export const friendApi = {
  // 친구 목록 조회
  getFriends: async (): Promise<Friend[]> => {
    return request<Friend[]>("/friends");
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

// ===== 랭킹 API =====
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

// ===== 유틸리티 API =====
export const utilApi = {
  // 서버 현재 날짜 조회
  getServerDate: async (): Promise<string> => {
    return request<string>("/server/date");
  },
};

// ===== 레거시 호환성을 위한 기본 api 함수 =====
export async function api(path: string, options?: RequestInit) {
  // 개발 모드에서만 콘솔 로그
  if (import.meta.env.DEV) {
    console.log("[API]", path, options);
  }

  // 기존 코드와의 호환성을 위한 라우팅
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

  // 알 수 없는 경로
  throw new Error(`Unknown API path: ${path}`);
}

// ===== 개발용 Mock 데이터 (백엔드가 없을 때) =====
if (import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL) {
  // Mock 데이터를 사용하는 경우
  const mockApi = {
    "/users/me": {
      GET: () => ({
        id: 1,
        name: "개발자",
        profile_color: "bg-green-300",
        bio: "개발용 유저입니다",
      }),
      PUT: (body: any) => ({
        id: 1,
        name: body.name || "개발자",
        profile_color: body.profile_color || "bg-green-300",
        bio: body.bio || "개발용 유저입니다",
      }),
    },
    "/missions/catalog": () => [
      { id: 101, name: "텀블러 사용하기", category: "일상" },
      { id: 102, name: "리필스테이션 이용", category: "일상" },
      { id: 103, name: "대중교통 이용하기", category: "모빌리티" },
      { id: 104, name: "에코백 사용하기", category: "일상" },
      { id: 105, name: "분리수거 철저히 하기", category: "분리배출" },
    ],
    "/server/date": () => {
      // KST(UTC+9) 기준 오늘 날짜
      const kstTime = new Date(Date.now() + 9 * 60 * 60 * 1000);
      return kstTime.toISOString().slice(0, 10);
    },
  };

  // Mock API 오버라이드
  const originalRequest = request;
  (globalThis as any).__MOCK_API__ = true;
}
