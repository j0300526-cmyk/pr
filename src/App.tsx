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
import { api } from "./api";
import RankingPage from "./pages/Ranking"; // 파일명 맞춰서
import KakaoCallbackPage from "./pages/KakaoCallback";

function App() {
  // ===== State =====
  const [userName, setUserName] = useState("");
  const [profileColor, setProfileColor] = useState("bg-green-300");
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [missions, setMissions] = useState<MissionsRecord>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddMission, setShowAddMission] = useState(false);

  const [availableMissions, setAvailableMissions] = useState<CatalogMission[]>(
    []
  );
  const [allAvailableMissions, setAllAvailableMissions] = useState<
    CatalogMission[]
  >([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  // (missionId + submission) -> dayMissionPk 매핑
  const pkMapRef = useRef<Map<string, number>>(new Map());
  const makeMissionKey = (missionId: number, submission: string) =>
    `${missionId}::${submission}`;

  const normalizeParticipants = (participants: any): GroupParticipant[] => {
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
  };

  const normalizeMissionParticipants = (mission: Mission | any): Mission => {
    return {
      ...(mission || {}),
      participants: normalizeParticipants(mission?.participants),
    } as Mission;
  };
  
  // API 호출 중복 방지를 위한 로딩 상태 추적
  const loadingDatesRef = useRef<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<"personal" | "group">("personal");
  const [selectedGroupMission, setSelectedGroupMission] =
    useState<Mission | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [myGroupMissions, setMyGroupMissions] = useState<Mission[]>([]);
  const [recommendedGroupMissions, setRecommendedGroupMissions] = useState<Mission[]>([]);
  const [leaveTarget, setLeaveTarget] = useState<Mission | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
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

  // ===== 헬퍼 함수들 =====
  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 3000);
  }, []);

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

  const loadFriends = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const { friendApi } = await import("./api");
      const list = await friendApi.getFriends();
      const normalized = Array.isArray(list)
        ? list.map((friend) => ({
            id: friend.id,
            name: friend.name,
            activeDays: friend.activeDays ?? 0,
            profileColor: friend.profileColor || "bg-gray-300",
          }))
        : [];
      setFriends(normalized);
    } catch (error) {
      console.error("친구 목록 로드 실패:", error);
      showError("친구 목록을 불러오지 못했어요");
    } finally {
      setLoadingFriends(false);
    }
  }, [showError]);

  // ★ 수정 포인트: 이미 선택된 날짜가 있으면 덮어쓰지 않기
  const initializeWeekDays = async (serverDate?: string) => {
    // 서버 날짜가 있으면 사용, 없으면 KST 기준 클라이언트 날짜 사용
    const centerDate = serverDate ? new Date(serverDate) : new Date(getTodayKST());
    const days = createWeekDays(centerDate);
    setWeekDays(days);
    // 오늘이 포함된 날짜를 기본 선택 (없으면 월요일)
    const todayDay = days.find(d => d.isToday);
    setSelectedDate((prev) => prev ?? todayDay?.fullDate ?? days[0]?.fullDate ?? null);
  };

  const loadDay = useCallback(async (dateStr: string) => {
    // 중복 호출 방지: 이미 로딩 중인 날짜는 무시
    if (loadingDatesRef.current.has(dateStr)) {
      return;
    }
    
    // 로딩 상태 추가
    loadingDatesRef.current.add(dateStr);
    
    // 날짜 변경 시 즉시 빈 배열로 초기화하여 이전 날짜 미션이 보이지 않도록 함
    setMissions((prev) => ({ ...prev, [dateStr]: [] }));
    
    try {
      const data: any = await api(`/days/${dateStr}`);
      const entries =
        Array.isArray(data)
          ? data.map((x: any) => {
              const fallbackName =
                x?.mission?.name ||
                (Array.isArray(x?.mission?.submissions) && x.mission.submissions.length
                  ? x.mission.submissions[0]
                  : x?.mission?.category ||
                    `미션-${x?.mission?.id ?? ""}`);
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

      const map = new Map<string, number>();
      if (Array.isArray(data)) {
        data.forEach((x: any) => {
          const fallbackName =
            x?.mission?.name ||
            (Array.isArray(x?.mission?.submissions) && x.mission.submissions.length
              ? x.mission.submissions[0]
              : x?.mission?.category ||
                `미션-${x?.mission?.id ?? ""}`);
          const submission = x?.sub_mission || fallbackName;
          // dayMissionId가 있는 경우에만 매핑 (주간 루틴은 id가 없을 수 있음)
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
      // 실패해도 빈 배열로 유지하여 이전 날짜 미션이 보이지 않도록 함
      setMissions((prev) => ({ ...prev, [dateStr]: [] }));
      showError("해당 날짜의 미션을 불러오지 못했어요");
    } finally {
      // 로딩 상태 제거
      loadingDatesRef.current.delete(dateStr);
    }
  }, []);

  const fetchAvailableMissions = async () => {
    try {
      setLoadingAvailable(true);
      let list: CatalogMission[] | null = null;

      // 1) 서버 시도
      try {
        const server = await api("/missions/catalog");
        if (Array.isArray(server)) list = server as CatalogMission[];
      } catch {
        /* 캐시로 fallback */
      }

      // 2) 캐시 시도
      if (!list) {
        const cachedR = await safeStorage.get(
          STORAGE_KEYS.availableMissions
        );
        const cached = getVal(cachedR);
        if (cached) {
          const arr = JSON.parse(cached) as CatalogMission[];
          if (Array.isArray(arr)) list = arr;
        }
      }

      // 3) 목 데이터 폴백
      if (!list) {
        list = [
          { id: 101, name: "텀블러 사용하기", category: "일상", submissions: ["텀블러 사용하기"] },
          { id: 102, name: "리필스테이션 이용", category: "일상", submissions: ["리필스테이션 이용"] },
          { id: 103, name: "대중교통 이용하기", category: "모빌리티", submissions: ["대중교통 이용하기"] },
          { id: 104, name: "에코백 사용하기", category: "일상", submissions: ["에코백 사용하기"] },
          { id: 105, name: "분리수거 철저히 하기", category: "분리배출", submissions: ["분리수거 철저히 하기"] },
          { id: 106, name: "플라스틱 프리 챌린지", category: "캠페인", submissions: ["플라스틱 프리 챌린지"] },
          { id: 107, name: "비닐봉투 거절하기", category: "일상", submissions: ["비닐봉투 거절하기"] },
          { id: 108, name: "리유저블 식기 사용", category: "일상", submissions: ["리유저블 식기 사용"] },
          { id: 109, name: "잔반 남기지 않기", category: "식생활", submissions: ["잔반 남기지 않기"] },
        ];
      }

      setAvailableMissions(list);
      setAllAvailableMissions(list);
      await safeStorage.set(
        STORAGE_KEYS.availableMissions,
        JSON.stringify(list)
      );
    } catch {
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
            await loadDay(day.fullDate);
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
      }
    } catch {
      showError("미션 삭제에 실패했어요");
      return;
    }
  };

  const addMission = async ({
    missionId,
    submission,
  }: {
    missionId: number;
    submission: string;
  }) => {
    if (!selectedDate) {
      showError("날짜를 선택해주세요.");
      return;
    }

    if (import.meta.env.DEV) {
      console.log("[DEBUG addMission] selectedDate:", selectedDate);
      console.log("[DEBUG addMission] missionId:", missionId);
      console.log("[DEBUG addMission] submission:", submission);
    }

    const exists = allAvailableMissions.some((m) => m.id === missionId);
    if (!exists) {
      showError("서버에 등록된 미션만 추가할 수 있어요.");
      return;
    }

    if (!submission || !submission.trim()) {
      showError("소주제를 선택해주세요.");
      return;
    }

    // 주간 루틴 API 사용 (selectedDate부터 그 주 일요일까지 자동 생성)
    try {
      const response: any = await api(`/personal-routines`, {
        method: "POST",
        body: JSON.stringify({ 
          mission_id: missionId, 
          date: selectedDate  // 선택한 날짜 기준으로 루틴 생성
        }),
      });
      
      if (import.meta.env.DEV) {
        console.log("[DEBUG addMission] 주간 루틴 추가 성공:", response);
      }
      
      showError("주간 루틴이 추가되었어요!");
      
      // 현재 주의 모든 날짜의 미션 다시 로드
      if (weekDays && weekDays.length > 0) {
        for (const day of weekDays) {
          await loadDay(day.fullDate);
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
      return;
    }

    setShowAddMission(false);
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
        loadDay(selectedDate);
      }
      // 주간의 다른 날짜들도 로드
      weekDays.forEach((day) => {
        if (day.fullDate !== selectedDate) {
          loadDay(day.fullDate);
        }
      });
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

  const handleMissionSearch = (q: string) => {
    const query = q.trim().toLowerCase();
    const filtered = allAvailableMissions.filter((x) =>
      x.category.toLowerCase().includes(query) || x.submissions.some(sub => sub.toLowerCase().includes(query))
    );
    setAvailableMissions(query ? filtered : allAvailableMissions);
  };

  const formatSelectedDate = () => formatDateLabel(selectedDate);
  const hasMissions = (dateStr: string): boolean =>
    !!(missions[dateStr] && missions[dateStr].length > 0);
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
        const { groupMissionApi } = await import("./api");
        const groups = await groupMissionApi.getMyGroups();
        const normalizedGroups = groups.map((mission: Mission) =>
          normalizeMissionParticipants(mission)
        );
        setMyGroupMissions(normalizedGroups);
        saveMyGroups(normalizedGroups);

        // 추천 그룹 목록도 가져오기
        try {
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
    await loadFriends();

    // 3) ★ 서버 날짜가 있으면 사용, 없으면 클라이언트 날짜로 달력 초기화
    // selectedDate가 없으면 무조건 초기화
    if (!selectedDate) {
      await initializeWeekDays(serverDate);
    }
  };

  loadInitialData();
}, [isAuthed, loadFriends]);


  // 날짜 변경 시 해당 날짜 미션 로드 및 그룹 미션 체크 상태 불러오기
  useEffect(() => {
    if (selectedDate && isAuthed) {
      // 날짜가 변경되면 즉시 해당 날짜의 미션을 초기화
      setMissions((prev) => {
        // 이미 해당 날짜의 미션이 있으면 유지, 없으면 빈 배열로 초기화
        if (prev[selectedDate] === undefined) {
          return { ...prev, [selectedDate]: [] };
        }
        return prev;
      });
      loadDay(selectedDate);
      
      // 그룹 미션 체크 상태 불러오기
      const loadGroupMissions = async () => {
        try {
          const { groupMissionApi } = await import("./api/groupMission");
          const groups = await groupMissionApi.getMyGroups(selectedDate);
          const normalized = groups.map((mission: Mission) =>
            normalizeMissionParticipants(mission)
          );
          setMyGroupMissions(normalized);
        } catch (error) {
          console.error("그룹 미션 체크 상태 불러오기 실패:", error);
        }
      };
      loadGroupMissions();
    }
  }, [selectedDate, isAuthed, loadDay]);

  // 모달 열릴 때 모든 미션으로 초기화
  useEffect(() => {
    if (showAddMission) {
      setAvailableMissions(allAvailableMissions);
    }
  }, [showAddMission, allAvailableMissions]);

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
              setSelectedDate={setSelectedDate}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              formatDate={formatSelectedDate}
              isToday={isTodayDate}
              hasMissions={hasMissions}
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
              onRefreshFriends={loadFriends}
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
        onSearch={handleMissionSearch}
        onAdd={addMission}
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
