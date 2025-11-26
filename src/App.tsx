// 앱 전역 상태와 페이지 전환을 관리하는 루트 컴포넌트
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import HomePage from "./pages/Home";
import GroupManagePage from "./pages/GroupManage";
import InvitePage from "./pages/Invite";
import MyPage from "./pages/MyPage";
import LoginPage from "./pages/Login";
import BottomTab from "./components/BottomTab";
import {
  CatalogMission,
  Mission,
  MissionsRecord,
  PersonalMissionEntry,
  PageType,
  WeekDay,
  GroupParticipant,
  Profile,
} from "./types";
import { safeStorage } from "./storage";
import ErrorToast from "./components/ErrorToast";
import AddMissionModal from "./components/AddMissionModal";
import GroupDetailModal from "./components/GroupDetailModal";
import InviteReceiveModal from "./components/InviteReceiveModal";
import LeaveConfirmModal from "./components/LeaveConfirmModal";
import {
  generateWeekDays as createWeekDays,
  isToday as isTodayDate,
  formatDateLabel,
  getTodayKST,
  isTodayMonday,
} from "./utils/date";
import {
  DEFAULT_GROUP_MISSIONS,
  RECOMMENDED_MISSIONS,
} from "./constants/missions";
import { calculateStreak, countTotalMissions } from "./utils/missions";
import { INITIAL_FRIENDS } from "./constants/users";
import { STORAGE_KEYS } from "./constants/storage";
import { api, dayMissionApi } from "./api";
import type { DayCompletionSummary } from "./api/types";
import RankingPage from "./pages/Ranking"; // 파일명 맞춰서
import KakaoCallbackPage from "./pages/KakaoCallback";

const DAY_CACHE_TTL = 30 * 1000;
const GROUP_CACHE_TTL = 30 * 1000;
const WEEK_SUMMARY_TTL = 60 * 1000;
const GROUP_CACHE_BASE_KEY = "group:base";

const summaryListToMap = (summary: DayCompletionSummary[]) => {
  return summary.reduce<Record<string, DayCompletionSummary>>((acc, item) => {
    acc[item.date] = item;
    return acc;
  }, {});
};

function App() {
  // ===== State =====
  const [userName, setUserName] = useState("");
  const [profileColor, setProfileColor] = useState("bg-green-300");
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [missions, setMissions] = useState<MissionsRecord>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddMission, setShowAddMission] = useState(false);

  const [allAvailableMissions, setAllAvailableMissions] = useState<
    CatalogMission[]
  >([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  // (missionId + submission) -> dayMissionPk 매핑
  const pkMapRef = useRef<Map<string, number>>(new Map());
  const makeMissionKey = useCallback(
    (missionId: number, submission: string) => `${missionId}::${submission}`,
    []
  );

  const normalizeParticipants = useCallback((participants: any): GroupParticipant[] => {
    if (!Array.isArray(participants)) return [];
    return (
      participants
        .map((participant, index) => {
        if (!participant) return null;
        if (typeof participant === "string") {
          return {
            id: index,
            name: participant,
            profile_color: "bg-gray-300",
          };
        }
        const name =
          typeof participant.name === "string" && participant.name.trim().length > 0
            ? participant.name
            : `그룹원 ${index + 1}`;
        return {
          id: Number(participant.id ?? index),
          name,
          profile_color:
            participant.profile_color ||
            participant.color ||
            "bg-gray-300",
        };
        })
        .filter(Boolean) as GroupParticipant[]
    );
  }, []);

  const normalizeMissionParticipants = useCallback((mission: Mission | any): Mission => {
    return {
      ...(mission || {}),
      participants: normalizeParticipants(mission?.participants),
    } as Mission;
  }, [normalizeParticipants]);
  
  // API 호출 중복 방지를 위한 로딩 상태 추적
  const loadingDatesRef = useRef<Set<string>>(new Set());
  const dayCacheRef = useRef<Map<string, { data: PersonalMissionEntry[]; timestamp: number }>>(new Map());
  const groupMissionCacheRef = useRef<Map<string, { data: Mission[]; timestamp: number }>>(new Map());
  const groupMissionLoadingRef = useRef<Set<string>>(new Set());
  const weekSummaryCacheRef = useRef<Map<string, { data: DayCompletionSummary[]; timestamp: number }>>(new Map());
  const weekSummaryLoadingRef = useRef<Set<string>>(new Set());
  const followTodayRef = useRef(true);

  const [activeTab, setActiveTab] = useState<"personal" | "group">("personal");
  const [selectedGroupMission, setSelectedGroupMission] =
    useState<Mission | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [myGroupMissions, setMyGroupMissions] = useState<Mission[]>([]);
  const [recommendedGroupMissions, setRecommendedGroupMissions] = useState<Mission[]>([]);
  const [leaveTarget, setLeaveTarget] = useState<Mission | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [dayCompletionMap, setDayCompletionMap] = useState<
    Record<string, DayCompletionSummary>
  >({});
  const [friends, setFriends] = useState<Profile[]>(INITIAL_FRIENDS);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedInvitees, setSelectedInvitees] = useState<number[]>([]);
  const [selectedInviteGroupId, setSelectedInviteGroupId] = useState<number | null>(null);
  const [sendingInvites, setSendingInvites] = useState(false);

  const [isAuthed, setIsAuthed] = useState(false);
  const [booting, setBooting] = useState(true);

  const currentMissionsMemo = useMemo(
    () => (selectedDate ? missions[selectedDate] || [] : []),
    [selectedDate, missions]
  );

  const updateSelectedDate = useCallback(
    (nextDate: string | null, options?: { followToday?: boolean }) => {
      if (typeof nextDate === "string") {
        if (options?.followToday) {
          followTodayRef.current = true;
        } else {
          followTodayRef.current = nextDate === getTodayKST();
        }
      } else {
        followTodayRef.current = false;
      }
      setSelectedDate(nextDate);
    },
    [setSelectedDate]
  );

  // ===== 헬퍼 함수들 =====
  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 3000);
  }, []);

  const getWeekDates = useCallback((iso: string | null) => {
    if (!iso) return [];
    const parts = iso.split("-");
    if (parts.length !== 3) return [];
    const numericParts = parts.map((value) => Number(value));
    if (numericParts.some((value) => Number.isNaN(value))) {
      return [];
    }

    const [year, month, day] = numericParts;
    const baseDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = baseDate.getUTCDay(); // 0=일요일
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(baseDate);
    monday.setUTCDate(baseDate.getUTCDate() + diff);

    const dates: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      const current = new Date(monday);
      current.setUTCDate(monday.getUTCDate() + i);
      dates.push(current.toISOString().slice(0, 10));
    }
    return dates;
  }, []);

  const buildEmptyWeekSummary = useCallback(
    (iso: string | null) => {
      const weekDates = getWeekDates(iso);
      if (!weekDates.length) return {};
      return weekDates.reduce<Record<string, DayCompletionSummary>>((acc, current) => {
        acc[current] = {
          date: current,
          total_missions: 0,
          completed_missions: 0,
          completion_rate: 0,
          is_day_perfectly_complete: false,
        };
        return acc;
      }, {});
    },
    [getWeekDates]
  );

  const getVal = (res: unknown): string | null => {
    if (typeof res === "string") return res;
    if (
      res &&
      typeof res === "object" &&
      "value" in (res as any) &&
      typeof (res as any).value === "string"
    ) {
      return (res as any).value;
    }
    return null;
  };

  const refreshWeekSummary = useCallback(
    async (dateStr: string, options?: { force?: boolean }) => {
      if (!dateStr) return;
      const weekDates = getWeekDates(dateStr);
      if (!weekDates.length) return;

      const weekKey = weekDates[0];
      const forceReload = options?.force ?? false;

      if (forceReload) {
        weekSummaryCacheRef.current.delete(weekKey);
      } else {
        const cached = weekSummaryCacheRef.current.get(weekKey);
        if (cached && Date.now() - cached.timestamp < WEEK_SUMMARY_TTL) {
          setDayCompletionMap((prev) => ({
            ...prev,
            ...summaryListToMap(cached.data),
          }));
          return;
        }
      }

      if (weekSummaryLoadingRef.current.has(weekKey)) {
        return;
      }

      weekSummaryLoadingRef.current.add(weekKey);

      try {
        const summary = await dayMissionApi.getWeekSummary(dateStr);
        weekSummaryCacheRef.current.set(weekKey, {
          data: summary,
          timestamp: Date.now(),
        });
        setDayCompletionMap((prev) => ({
          ...prev,
          ...summaryListToMap(summary),
        }));
      } catch (error) {
        console.error("주간 완료 상태를 불러오지 못했어요:", error);
        const fallback = buildEmptyWeekSummary(dateStr);
        if (Object.keys(fallback).length > 0) {
          setDayCompletionMap((prev) => ({ ...prev, ...fallback }));
        }
        showError("주간 완료 상태를 불러오지 못했어요");
      } finally {
        weekSummaryLoadingRef.current.delete(weekKey);
      }
    },
    [buildEmptyWeekSummary, getWeekDates, showError]
  );

  const loadInviteCandidates = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const { friendApi } = await import("./api");
      const list = await friendApi.getRandomCandidates(3);
      const normalized = Array.isArray(list)
        ? list.map((friend) => ({
            id: friend.id,
            name: friend.name,
            activeDays: friend.activeDays ?? 0,
            profileColor: friend.profileColor || "bg-gray-300",
          }))
        : [];
      setFriends(normalized);
      setSelectedInvitees([]);
    } catch (error) {
      console.error("초대 후보 로드 실패:", error);
      showError("초대 후보를 불러오지 못했어요");
    } finally {
      setLoadingFriends(false);
    }
  }, [showError]);

  const initializeWeekDays = async (serverDate?: string) => {
    const normalizeDate = (value?: string | null) => {
      if (!value) return null;
      const iso = value.slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
      return iso;
    };
    const serverDateStr = normalizeDate(serverDate);
    const clientDateStr = getTodayKST();
    // 서버 시간이 과거로 고정되어 있으면 클라이언트 날짜를 우선 사용
    const effectiveDateStr =
      serverDateStr && serverDateStr > clientDateStr ? serverDateStr : clientDateStr;
    const centerDate = new Date(`${effectiveDateStr}T00:00:00Z`);
    const days = createWeekDays(centerDate);
    setWeekDays(days);
    // 오늘이 포함된 날짜를 기본 선택 (없으면 월요일)
    const todayDay = days.find(d => d.isToday);
    if (!selectedDate) {
      const defaultDate = todayDay?.fullDate ?? days[0]?.fullDate ?? null;
      if (defaultDate) {
        updateSelectedDate(defaultDate, { followToday: true });
      } else {
        updateSelectedDate(null);
      }
    }
  };

  const loadDay = useCallback(
    async (dateStr: string, options?: { force?: boolean }) => {
      const forceReload = options?.force ?? false;
      if (!dateStr) return;

      if (forceReload) {
        dayCacheRef.current.delete(dateStr);
      } else {
        const cached = dayCacheRef.current.get(dateStr);
        if (cached && Date.now() - cached.timestamp < DAY_CACHE_TTL) {
          setMissions((prev) => ({ ...prev, [dateStr]: cached.data }));
          return;
        }
      }

      // 중복 호출 방지: 이미 로딩 중인 날짜는 무시
      if (loadingDatesRef.current.has(dateStr)) {
        return;
      }

      loadingDatesRef.current.add(dateStr);

      // 캐시가 없을 때만 UI를 비워 깜빡임 최소화
      if (!dayCacheRef.current.has(dateStr)) {
        setMissions((prev) => ({ ...prev, [dateStr]: [] }));
      }

      try {
        const data: any = await api(`/days/${dateStr}`);
        const entries = Array.isArray(data)
          ? data.map((x: any) => {
              const fallbackName =
                x?.mission?.name ||
                (Array.isArray(x?.mission?.submissions) && x.mission.submissions.length
                  ? (typeof x.mission.submissions[0] === 'object' && x.mission.submissions[0]?.label
                      ? x.mission.submissions[0].label
                      : typeof x.mission.submissions[0] === 'string'
                      ? x.mission.submissions[0]
                      : null)
                  : null) ||
                x?.mission?.category || `미션-${x?.mission?.id ?? ""}`;
              return {
                missionId: Number(x?.mission?.id),
                submission: x?.sub_mission || fallbackName,
                is_weekly_routine: x?.is_weekly_routine || false,
                routine_id: x?.routine_id || undefined,
                completed: x?.completed || false,
                dayMissionId: x?.id ? Number(x.id) : undefined,
              };
            })
          : [];
        setMissions((prev) => ({ ...prev, [dateStr]: entries }));
        dayCacheRef.current.set(dateStr, {
          data: entries,
          timestamp: Date.now(),
        });

        const map = new Map<string, number>();
        if (Array.isArray(data)) {
          data.forEach((x: any) => {
            const fallbackName =
              x?.mission?.name ||
              (Array.isArray(x?.mission?.submissions) && x.mission.submissions.length
                ? (typeof x.mission.submissions[0] === 'object' && x.mission.submissions[0]?.label
                    ? x.mission.submissions[0].label
                    : typeof x.mission.submissions[0] === 'string'
                    ? x.mission.submissions[0]
                    : null)
                : null) ||
              x?.mission?.category || `미션-${x?.mission?.id ?? ""}`;
            const submission = x?.sub_mission || fallbackName;
            if (x?.id) {
              map.set(
                makeMissionKey(Number(x?.mission?.id), submission),
                Number(x.id)
              );
            }
          });
        }
        pkMapRef.current = map;
      } catch {
        if (forceReload) {
          dayCacheRef.current.delete(dateStr);
        }
        showError("해당 날짜의 미션을 불러오지 못했어요");
      } finally {
        loadingDatesRef.current.delete(dateStr);
      }
    },
    [makeMissionKey, showError]
  );

  const fetchAvailableMissions = async () => {
    try {
      setLoadingAvailable(true);
      
      // 프론트엔드에서 직접 사용 (서버 호출 없음)
      const { FRONTEND_MISSIONS } = await import("./constants/missions");
      const list = FRONTEND_MISSIONS;

      setAllAvailableMissions(list);
      await safeStorage.set(
        STORAGE_KEYS.availableMissions,
        JSON.stringify(list)
      );
    } catch (error) {
      console.error("미션 목록 로드 실패:", error);
      showError("허용된 미션 목록을 불러오지 못했어요");
    } finally {
      setLoadingAvailable(false);
    }
  };

  const loadUserData = async () => {
    try {
      const nameResult = await safeStorage.get(STORAGE_KEYS.userName);
      const name = getVal(nameResult);
      if (name !== null) setUserName(name);

      const colorResult = await safeStorage.get(STORAGE_KEYS.profileColor);
      const color = getVal(colorResult);
      if (color !== null) setProfileColor(color);

      const missionsResult = await safeStorage.get(STORAGE_KEYS.missions);
      const missionsRaw = getVal(missionsResult);
      if (missionsRaw !== null) {
        try {
          // 저장된 데이터가 숫자 배열/객체일 수 있으므로 통합
          const parsed = JSON.parse(missionsRaw) as Record<string, any>;
          const normalized: MissionsRecord = {};
          Object.entries(parsed).forEach(([k, v]) => {
            if (Array.isArray(v)) {
              normalized[k] = v
                .map((item: any) => {
                  if (typeof item === "number") {
                    return {
                      missionId: Number(item),
                      submission: `legacy-${item}`,
                    };
                  }
                  if (item && typeof item === "object") {
                    const missionId = Number(
                      item.missionId ?? item.mission_id ?? item.id ?? 0
                    );
                    const submissionRaw =
                      item.submission ??
                      item.sub_mission ??
                      item.name ??
                      item.title ??
                      "";
                    const submission =
                      typeof submissionRaw === "string"
                        ? submissionRaw
                        : String(submissionRaw ?? "");
                    return {
                      missionId,
                      submission: submission || `legacy-${missionId}`,
                    };
                  }
                  return null;
                })
                .filter(
                  (entry): entry is PersonalMissionEntry => entry !== null
                );
            } else {
              normalized[k] = [];
            }
          });
          setMissions(normalized);
        } catch {
          showError("미션 데이터를 불러오는데 실패했어요");
        }
      }

      const myGroupsResult = await safeStorage.get(
        STORAGE_KEYS.myGroupMissions
      );
      if (myGroupsResult) {
        try {
          const parsed = JSON.parse(getVal(myGroupsResult) || "[]");
          if (Array.isArray(parsed)) {
            const normalized = parsed.map((mission: Mission) =>
              normalizeMissionParticipants(mission)
            );
            setMyGroupMissions(normalized);
          }
        } catch {
          setMyGroupMissions([]);
        }
      } else {
        setMyGroupMissions([]);
      }
    } catch {
      showError("데이터 로딩 중 오류가 발생했어요");
      setMyGroupMissions([...DEFAULT_GROUP_MISSIONS]);
    }
  };

  const saveUserData = async (newMissions: MissionsRecord) => {
    try {
      await safeStorage.set(
        STORAGE_KEYS.missions,
        JSON.stringify(newMissions)
      );
    } catch {
      showError("저장에 실패했어요");
    }
  };

  const saveMyGroups = async (groups: Mission[]) => {
    try {
      await safeStorage.set(
        STORAGE_KEYS.myGroupMissions,
        JSON.stringify(groups)
      );
    } catch {
      showError("그룹 저장에 실패했어요");
    }
  };

  const saveUserProfile = async (
    name: string,
    color: string,
    bio: string
  ) => {
    try {
      await api("/users/me", {
        method: "PUT",
        body: JSON.stringify({ name, profile_color: color, bio }),
      });
      setUserName(name);
      setProfileColor(color);
      await safeStorage.set(STORAGE_KEYS.userName, name);
      await safeStorage.set(STORAGE_KEYS.profileColor, color);
      await safeStorage.set(STORAGE_KEYS.userBio, bio);
    } catch {
      showError("프로필 저장에 실패했어요");
    }
  };

  const getCurrentMissions = (): PersonalMissionEntry[] => {
    if (!selectedDate) return [];
    return missions[selectedDate] || [];
  };

  const getGroupCacheKey = (dateStr?: string | null) =>
    dateStr ? `group:${dateStr}` : GROUP_CACHE_BASE_KEY;

  const fetchMyGroups = useCallback(
    async (dateStr?: string | null, options?: { force?: boolean }) => {
      const forceReload = options?.force ?? false;
      const cacheKey = getGroupCacheKey(dateStr);

      if (!forceReload) {
        const cached = groupMissionCacheRef.current.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < GROUP_CACHE_TTL) {
          setMyGroupMissions(cached.data);
          return cached.data;
        }
      } else {
        groupMissionCacheRef.current.delete(cacheKey);
      }

      if (groupMissionLoadingRef.current.has(cacheKey)) {
        return groupMissionCacheRef.current.get(cacheKey)?.data ?? [];
      }

      groupMissionLoadingRef.current.add(cacheKey);

      try {
        const { groupMissionApi } = await import("./api/groupMission");
        const groups = await groupMissionApi.getMyGroups(dateStr || undefined);
        const normalized = groups.map((mission: Mission) =>
          normalizeMissionParticipants(mission)
        );
        groupMissionCacheRef.current.set(cacheKey, {
          data: normalized,
          timestamp: Date.now(),
        });
        setMyGroupMissions(normalized);
        return normalized;
      } finally {
        groupMissionLoadingRef.current.delete(cacheKey);
      }
    },
    [normalizeMissionParticipants]
  );

  const deleteMission = async (index: number) => {
    if (!selectedDate) return;
    const current = getCurrentMissions();
    const target = current[index];
    if (!target) return;

    // 서버에서 삭제 시도
    try {
      // 주간 루틴인 경우 personal-routines 엔드포인트 사용
      if (target.is_weekly_routine && target.routine_id) {
        await api(`/personal-routines/${target.routine_id}`, {
          method: "DELETE",
        });
        // 주간 루틴 삭제 후 전체 주간 미션 다시 로드
        if (weekDays && weekDays.length > 0) {
          for (const day of weekDays) {
            await loadDay(day.fullDate, { force: true });
          }
        }
      } else {
        // 일일 미션인 경우 기존 로직 사용
        const key = makeMissionKey(target.missionId, target.submission);
        const pk = pkMapRef.current.get(key);
        if (pk) {
          await api(`/days/${selectedDate}/missions/${pk}`, {
            method: "DELETE",
          });
          pkMapRef.current.delete(key);
        }
        // 로컬 상태 업데이트
        const updated = current.filter((_, i) => i !== index);
        const next = { ...missions, [selectedDate]: updated };
        setMissions(next);
        saveUserData(next);
        dayCacheRef.current.set(selectedDate, {
          data: updated,
          timestamp: Date.now(),
        });
      }
    } catch {
      showError("미션 삭제에 실패했어요");
      return;
    }
  };

  const addMission = async (
    {
      missionId,
      submission,
    }: {
      missionId: number;
      submission: string;
    },
    options?: { autoClose?: boolean }
  ): Promise<boolean> => {
    if (!selectedDate) {
      showError("날짜를 선택해주세요.");
      return false;
    }

    if (import.meta.env.DEV) {
      console.log("[DEBUG addMission] selectedDate:", selectedDate);
      console.log("[DEBUG addMission] missionId:", missionId);
      console.log("[DEBUG addMission] submission:", submission);
    }

    const exists = allAvailableMissions.some((m) => m.id === missionId);
    if (!exists) {
      showError("서버에 등록된 미션만 추가할 수 있어요.");
      return false;
    }

    const trimmedSubmission = submission?.trim();
    if (!trimmedSubmission) {
      showError("소주제를 선택해주세요.");
      return false;
    }

    // 주간 루틴 API 사용 (selectedDate부터 그 주 일요일까지 자동 생성)
    try {
      const response: any = await api(`/personal-routines`, {
        method: "POST",
        body: JSON.stringify({
          mission_id: missionId,
          date: selectedDate, // 선택한 날짜 기준으로 루틴 생성
          submission: trimmedSubmission,
        }),
      });

      if (import.meta.env.DEV) {
        console.log("[DEBUG addMission] 주간 루틴 추가 성공:", response);
      }

      showError("주간 루틴이 추가되었어요!");

      // 현재 주의 모든 날짜의 미션 다시 로드
      if (weekDays && weekDays.length > 0) {
        for (const day of weekDays) {
          await loadDay(day.fullDate, { force: true });
        }
      }
    } catch (error: any) {
      if (error?.status === 400) {
        showError(error.message || "주간 루틴을 추가할 수 없습니다.");
      } else if (error?.status === 409) {
        showError("이미 추가된 루틴이에요.");
      } else {
        showError("루틴 추가에 실패했어요");
      }
      return false;
    }

    if (options?.autoClose ?? true) {
      setShowAddMission(false);
    }
    return true;
  };

  const handleAddMissionSelections = async ({
    missionIds,
  }: {
    missionIds: number[];
  }) => {
    if (!missionIds || missionIds.length === 0) {
      showError("소주제를 선택해주세요.");
      return;
    }

    // ID로 소주제 정보 찾기
    const { FRONTEND_MISSIONS } = await import("./constants/missions");
    const subMissionMap = new Map<number, { missionId: number; label: string }>();
    
    for (const mission of FRONTEND_MISSIONS) {
      for (const subMission of mission.submissions) {
        subMissionMap.set(subMission.id, {
          missionId: mission.id,
          label: subMission.label,
        });
      }
    }

    let successCount = 0;
    for (const subMissionId of missionIds) {
      const subMissionInfo = subMissionMap.get(subMissionId);
      if (!subMissionInfo) {
        console.warn(`소주제 ID ${subMissionId}를 찾을 수 없습니다.`);
        continue;
      }
      
      const success = await addMission(
        { missionId: subMissionInfo.missionId, submission: subMissionInfo.label },
        { autoClose: false }
      );
      if (success) {
        successCount += 1;
      }
    }

    if (successCount > 0) {
      setShowAddMission(false);
    }
  };

  const addWeeklyRoutine = async ({
    missionId,
    submission,
  }: {
    missionId: number;
    submission: string;
  }) => {
    // 월요일에만 추가 가능
    if (!isTodayMonday()) {
      showError("주간 루틴은 월요일에만 추가할 수 있어요.");
      return;
    }

    const trimmedSubmission = submission.trim();

    if (import.meta.env.DEV) {
      console.log("[DEBUG addWeeklyRoutine] missionId:", missionId);
      console.log("[DEBUG addWeeklyRoutine] submission:", trimmedSubmission);
    }

    const exists = allAvailableMissions.some((m) => m.id === missionId);
    if (!exists) {
      showError("서버에 등록된 미션만 추가할 수 있어요.");
      return;
    }

    if (!trimmedSubmission) {
      showError("소주제를 선택해주세요.");
      return;
    }

    // 서버에 추가 시도
    try {
      await api(`/personal-routine/add`, {
        method: "POST",
        body: JSON.stringify({ mission_id: missionId, submission: trimmedSubmission }),
      });
      showError("주간 루틴이 추가되었어요!");
      // 모든 날짜의 미션 다시 로드 (주간 루틴이 모든 날짜에 표시되도록)
      if (selectedDate) {
        await loadDay(selectedDate, { force: true });
      }
      for (const day of weekDays) {
        if (day.fullDate !== selectedDate) {
          await loadDay(day.fullDate, { force: true });
        }
      }
    } catch (error: any) {
      if (error?.status === 400) {
        showError(error.message || "주간 루틴을 추가할 수 없습니다.");
      } else {
        showError("주간 루틴 추가에 실패했어요");
      }
      return;
    }

    setShowAddMission(false);
  };

  const formatSelectedDate = () => formatDateLabel(selectedDate);
  const isPerfectDay = useCallback(
    (dateStr: string): boolean =>
      !!dayCompletionMap[dateStr]?.is_day_perfectly_complete,
    [dayCompletionMap]
  );
  const isInMyGroups = (id: number): boolean =>
    myGroupMissions.some((m) => m.id === id);

  const joinGroup = async (mission: Mission) => {
    if (isInMyGroups(mission.id)) return;
    if (mission.participants.length >= 3) {
      showError("그룹 미션은 최대 3명까지 참여할 수 있어요");
      return;
    }
    
    try {
      const { groupMissionApi } = await import("./api");
      const updatedGroup = await groupMissionApi.joinGroup(mission.id);
      const normalized = normalizeMissionParticipants(updatedGroup);
      const next = [...myGroupMissions, normalized];
      setMyGroupMissions(next);
      saveMyGroups(next);
      groupMissionCacheRef.current.clear();
    } catch (error: any) {
      const status = (error as any)?.status;
      if (status === 409) {
        showError("이미 이 그룹에 참여 중입니다.");
      } else if (status === 400) {
        showError(error.message || "그룹 참여 조건을 만족하지 않습니다.");
      } else if (status === 404) {
        showError("그룹을 찾을 수 없습니다.");
      } else {
        showError(error.message || "그룹 참여에 실패했어요");
      }
    }
  };

  const leaveGroup = async (missionId: number) => {
    try {
      const { groupMissionApi } = await import("./api");
      await groupMissionApi.leaveGroup(missionId);
      const next = myGroupMissions.filter((m) => m.id !== missionId);
      setMyGroupMissions(next);
      saveMyGroups(next);
      groupMissionCacheRef.current.clear();
      if (selectedGroupMission && selectedGroupMission.id === missionId) {
        setSelectedGroupMission(null);
      }
    } catch (error: any) {
      showError(error.message || "그룹 나가기에 실패했어요");
    }
  };

  const createGroup = async (name: string, color: string) => {
    try {
      const { groupMissionApi } = await import("./api/groupMission");
      
      // 그룹 생성
      const newGroup = await groupMissionApi.createGroup(name, color);
      
      // 생성 후 자동으로 참여
      const joinedGroup = await groupMissionApi.joinGroup(newGroup.id);
      const normalizedJoined = normalizeMissionParticipants(joinedGroup);
      
      // 내 그룹 목록에 추가
      const next = [...myGroupMissions, normalizedJoined];
      setMyGroupMissions(next);
      saveMyGroups(next);
      groupMissionCacheRef.current.clear();
      
      // 추천 그룹 목록 새로고침
      try {
        const recommended = await groupMissionApi.getRecommended();
        setRecommendedGroupMissions(
          recommended.map((mission: Mission) => normalizeMissionParticipants(mission))
        );
      } catch (err) {
        console.warn("추천 그룹 목록 새로고침 실패", err);
      }
      
      showError("그룹이 생성되고 참여되었어요!");
    } catch (error: any) {
      const status = (error as any)?.status;
      if (status === 400) {
        showError(error.message || "그룹 생성 조건을 만족하지 않습니다.");
      } else {
        showError(error.message || "그룹 생성에 실패했어요");
      }
      throw error;
    }
  };

  const deleteGroup = async (missionId: number) => {
    if (!window.confirm("정말 이 그룹을 삭제하시겠어요? 삭제된 그룹은 복구할 수 없습니다.")) {
      return;
    }

    try {
      const { groupMissionApi } = await import("./api");
      await groupMissionApi.deleteGroup(missionId);
      
      // 내 그룹 목록에서 제거
      const next = myGroupMissions.filter((m) => m.id !== missionId);
      setMyGroupMissions(next);
      saveMyGroups(next);
      groupMissionCacheRef.current.clear();
      
      // 선택된 그룹이 삭제된 경우 초기화
      if (selectedGroupMission && selectedGroupMission.id === missionId) {
        setSelectedGroupMission(null);
      }
      
      showError("그룹이 삭제되었어요");
    } catch (error: any) {
      const status = (error as any)?.status;
      if (status === 403) {
        showError("그룹을 만든 사람만 삭제할 수 있어요");
      } else if (status === 404) {
        showError("그룹을 찾을 수 없습니다");
      } else {
        showError(error.message || "그룹 삭제에 실패했어요");
      }
    }
  };

  const logout = async () => {
    try {
      const { authApi } = await import("./api");
      // authApi may not implement logout in this project; call if exists
      if ((authApi as any).logout) {
        await (authApi as any).logout();
      }
    } catch {
      // API 실패해도 로컬에서 토큰 제거
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
    }
    setIsAuthed(false);
  };

  const toggleInvitee = (id: number) => {
    setSelectedInvitees((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const handleSelectInviteGroup = (groupId: number) => {
    if (selectedInviteGroupId === groupId) return;
    setSelectedInviteGroupId(groupId);
    setSelectedInvitees([]);
  };

  const handleSelectDate = useCallback(
    (date: string) => {
      updateSelectedDate(date);
    },
    [updateSelectedDate]
  );

  const handleSendInvites = async () => {
    if (!selectedInviteGroupId) {
      showError("초대할 그룹을 선택해주세요.");
      return;
    }
    if (selectedInvitees.length === 0) {
      showError("초대할 친구를 선택해주세요.");
      return;
    }

    try {
      setSendingInvites(true);
      const { friendApi } = await import("./api");
      await friendApi.sendInvite(selectedInviteGroupId, selectedInvitees);
      showError("초대를 보냈어요!");
      setSelectedInvitees([]);
    } catch (error: any) {
      console.error("초대 전송 실패:", error);
      showError(error?.message || "초대 전송에 실패했어요");
    } finally {
      setSendingInvites(false);
    }
  };

  // ===== Effects =====

  // 앱 초기화 (토큰 체크 + 카카오 콜백 처리)
  useEffect(() => {
    const init = async () => {
      // 카카오 콜백 처리 (URL에 code 파라미터가 있는 경우)
      const urlParams = new URLSearchParams(window.location.search);
      const kakaoCode = urlParams.get("code");
      
      if (kakaoCode) {
        console.log("[App] 카카오 인가 코드 감지, 백엔드로 전송 중...");
        try {
          // 타임아웃 설정 (10초)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
          const response = await fetch(`${API_BASE_URL}/auth/kakao/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: kakaoCode }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: "카카오 로그인 실패" }));
            throw new Error(errorData.detail || "카카오 로그인에 실패했습니다.");
          }

          const data = await response.json();
          localStorage.setItem("access", data.access);
          localStorage.setItem("refresh", data.refresh);
          
          console.log("[App] 카카오 로그인 성공");
          
          // URL에서 code 파라미터 제거하고 홈으로 리다이렉트
          window.location.href = "/";
        } catch (err: any) {
          console.error("[App] 카카오 로그인 실패:", err);
          if (err.name === 'AbortError') {
            showError("백엔드 서버 응답 시간이 초과되었습니다. 백엔드 서버가 실행 중인지 확인해주세요.");
          } else {
            showError(err.message || "카카오 로그인 처리 중 오류가 발생했습니다.");
          }
          // 에러 발생 시 URL에서 code 파라미터 제거
          window.history.replaceState({}, document.title, "/");
          setBooting(false);
        }
      } else {
        // 일반 토큰 체크
        const token = localStorage.getItem("access");
        if (token) {
          setIsAuthed(true);
        }
      }
      
      setBooting(false);
    };
    init();
  }, []);

  // 날짜가 바뀌면 달력/선택 날짜를 자동 진행 (오늘을 보고 있는 경우)
  useEffect(() => {
    if (!isAuthed) {
      return;
    }

    let lastKnownToday = getTodayKST();

    const checkDayChange = () => {
      const currentToday = getTodayKST();
      if (currentToday === lastKnownToday) {
        return;
      }

      lastKnownToday = currentToday;
      setWeekDays(createWeekDays(new Date(currentToday)));

      if (followTodayRef.current) {
        updateSelectedDate(currentToday, { followToday: true });
      }
    };

    const intervalId = window.setInterval(checkDayChange, 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, [isAuthed, updateSelectedDate]);

  // 인증 후 데이터 로드
  useEffect(() => {
  if (!isAuthed) return;

  const loadInitialData = async () => {
    // 토큰이 있는지 확인
    const token = localStorage.getItem("access");
    if (!token) {
      console.warn("토큰이 없습니다. 로그인을 다시 시도해주세요.");
      setIsAuthed(false);
      return;
    }

    // 디버깅: 토큰 확인
    if (import.meta.env.DEV) {
      console.log("[App] 초기 데이터 로드 시작", {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : "none",
      });
    }

    let serverDate: string | undefined;
    
    try {
      // 1) 서버에서 사용자 정보 시도
      if (import.meta.env.DEV) {
        console.log("[App] /users/me 요청 시작");
      }
      const me: any = await api("/users/me");
      setUserName(me?.name ?? userName);
      setProfileColor(me?.profile_color ?? profileColor);
      if (me?.id) {
        setUserId(me.id);
      }
      
      // bio도 서버에서 가져오기
      if (me?.bio) {
        await safeStorage.set(STORAGE_KEYS.userBio, me.bio);
      }
      
      // 서버에서 현재 날짜 가져오기 시도 (백엔드에 /server/date 엔드포인트가 있다면)
      try {
        const dateResponse = await api("/server/date");
        if (dateResponse && typeof dateResponse === "string") {
          serverDate = dateResponse;
        }
      } catch {
        // 서버 날짜 API가 없으면 클라이언트 날짜 사용
      }
      
      // 2) 서버에서 그룹 미션 목록 가져오기 시도
      try {
        const normalizedGroups = await fetchMyGroups(undefined, { force: true });
        saveMyGroups(normalizedGroups);

        // 추천 그룹 목록도 가져오기
        try {
          const { groupMissionApi } = await import("./api/groupMission");
          const recommended = await groupMissionApi.getRecommended();
          setRecommendedGroupMissions(
            recommended.map((mission: Mission) => normalizeMissionParticipants(mission))
          );
        } catch (err) {
          console.warn("추천 그룹 로드 실패", err);
          setRecommendedGroupMissions([...RECOMMENDED_MISSIONS]);
        }
      } catch {
        // 실패하면 로컬 데이터 사용 (아래 loadUserData에서 처리)
      }
    } catch (error: any) {
      console.error("초기 데이터 로드 실패 (users/me):", error);
      
      // 401 에러인 경우 (인증 실패)
      if (error?.message?.includes("인증") || error?.message?.includes("401")) {
        console.warn("인증 실패 - 로그인 페이지로 이동");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setIsAuthed(false);
        return;
      }
      
      // 다른 에러는 무시하고 계속 진행 (로컬 데이터 사용)
    }

    // 2) 로컬/캐시 데이터 로드 (이 함수들 안에 자체 try/catch 있음)
    await loadUserData();
    await fetchAvailableMissions();
    await loadInviteCandidates();

    // 3) ★ 서버 날짜가 있으면 사용, 없으면 클라이언트 날짜로 달력 초기화
    // selectedDate가 없으면 무조건 초기화
    if (!selectedDate) {
      await initializeWeekDays(serverDate);
    }
  };

  loadInitialData();
}, [isAuthed, loadInviteCandidates]);


  // 날짜가 바뀌었을 때만 개인/그룹 미션 데이터를 새로 불러온다.
  useEffect(() => {
    if (!selectedDate || !isAuthed) {
      return;
    }

    setMissions((prev) => {
      if (prev[selectedDate] === undefined) {
        return { ...prev, [selectedDate]: [] };
      }
      return prev;
    });
    void loadDay(selectedDate);
    fetchMyGroups(selectedDate).catch((error) => {
      console.error("그룹 미션 체크 상태 불러오기 실패:", error);
    });
  }, [selectedDate, isAuthed, loadDay, fetchMyGroups]);

  // 주간 요약은 선택된 날짜(또는 주)가 바뀔 때만 새로 불러온다.
  useEffect(() => {
    if (!selectedDate || !isAuthed) return;
    void refreshWeekSummary(selectedDate);
  }, [selectedDate, isAuthed, refreshWeekSummary]);

  useEffect(() => {
    if (!isAuthed) {
      dayCacheRef.current.clear();
      groupMissionCacheRef.current.clear();
      groupMissionLoadingRef.current.clear();
      weekSummaryCacheRef.current.clear();
      weekSummaryLoadingRef.current.clear();
    }
  }, [isAuthed]);

  useEffect(() => {
    if (myGroupMissions.length === 0) {
      setSelectedInviteGroupId(null);
      setSelectedInvitees([]);
      return;
    }

    if (!selectedInviteGroupId) {
      setSelectedInviteGroupId(myGroupMissions[0].id);
      return;
    }

    const exists = myGroupMissions.some(
      (mission) => mission.id === selectedInviteGroupId
    );
    if (!exists) {
      setSelectedInviteGroupId(myGroupMissions[0].id);
      setSelectedInvitees([]);
    }
  }, [myGroupMissions, selectedInviteGroupId]);

  // ===== 렌더 =====
  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm bg-white rounded-3xl shadow-xl flex flex-col"
          style={{ aspectRatio: "9/16", maxHeight: "90vh" }}
        >
          <LoginPage onSuccess={() => setIsAuthed(true)} />
        </div>
      </div>
    );
  }

  const totalMissionsCount = countTotalMissions(missions);
  const currentStreak = calculateStreak(missions);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <ErrorToast message={errorMessage} />

      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl flex flex-col"
        style={{ aspectRatio: "9/16", maxHeight: "90vh" }}
      >
        <div className="flex-1 overflow-y-auto">
          {currentPage === "home" && (
            <HomePage
              userName={userName}
              profileColor={profileColor}
              weekDays={weekDays}
              selectedDate={selectedDate}
              setSelectedDate={handleSelectDate}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              formatDate={formatSelectedDate}
              isToday={isTodayDate}
              isPerfectDay={isPerfectDay}
              currentMissions={currentMissionsMemo}
              allAvailableMissions={allAvailableMissions}
              deleteMission={deleteMission}
              setShowAddMission={setShowAddMission}
              myGroupMissions={myGroupMissions}
              setSelectedGroupMission={setSelectedGroupMission}
              currentStreak={currentStreak}
              onProfileClick={() => setCurrentPage("mypage")}
              loadDay={loadDay}
            />
          )}

          {currentPage === "groupmanage" && (
              <GroupManagePage
                myGroupMissions={myGroupMissions}
                recommendedMissions={recommendedGroupMissions}
              isInMyGroups={isInMyGroups}
              joinGroup={joinGroup}
              setSelectedGroupMission={setSelectedGroupMission}
              setLeaveTarget={setLeaveTarget}
              onCreateGroup={createGroup}
              onDeleteGroup={deleteGroup}
              currentUserId={userId}
            />
          )}

          {currentPage === "ranking" && (
            <RankingPage
              userName={userName}
              currentStreak={currentStreak}
              totalMissionsCount={totalMissionsCount}
              userId={userId}
            />
          )}

          

          {currentPage === "invite" && (
            <InvitePage
              friends={friends}
              selectedInvitees={selectedInvitees}
              toggleInvitee={toggleInvitee}
              sendingInvites={sendingInvites}
              sendInvites={handleSendInvites}
              groups={myGroupMissions}
              selectedGroupId={selectedInviteGroupId}
              onSelectGroup={handleSelectInviteGroup}
              loadingFriends={loadingFriends}
              onRefreshFriends={loadInviteCandidates}
            />
          )}

          {currentPage === "mypage" && (
            <MyPage
              userName={userName}
              totalMissionsCount={totalMissionsCount}
              currentStreak={currentStreak}
              profileColor={profileColor}
              onSaveProfile={saveUserProfile}
              onLogout={logout}
            />
          )}
        </div>

        <BottomTab currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </div>

      <AddMissionModal
        visible={showAddMission}
        loading={loadingAvailable}
        availableMissions={allAvailableMissions}
        onAdd={handleAddMissionSelections}
        onClose={() => {
          setShowAddMission(false);
        }}
      />

      <GroupDetailModal
        mission={selectedGroupMission}
        isInMyGroups={isInMyGroups}
        onJoin={joinGroup}
        onLeave={leaveGroup}
        onClose={() => setSelectedGroupMission(null)}
      />

     <InviteReceiveModal
  profile={null}
  onAccept={(id: number) => {
    // TODO: id로 그룹/초대 처리
    console.log("accept invite", id);
  }}
  onDecline={(id: number) => {
    console.log("decline invite", id);
  }}
/>

      <LeaveConfirmModal
        mission={leaveTarget}
        onCancel={() => setLeaveTarget(null)}
        onConfirm={(id) => {
          leaveGroup(id);
          setLeaveTarget(null);
        }}
      />
    </div>
  );
}

export default App;
