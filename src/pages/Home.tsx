import React from "react";
import { Plus, X } from "lucide-react";
import Confetti from "react-confetti";
import { CatalogMission, Mission, PersonalMissionEntry, WeekDay } from "../types";
import { isTodayMonday } from "../utils/date";
import { groupMissionApi } from "../api/groupMission";
import { saveDayMissions, loadDayMissions, saveWeeklyRoutineCompletion } from "../utils/personalMissionsStorage";
import { safeStorage } from "../storage";

interface Props {
  userName: string;
  profileColor: string;
  weekDays: WeekDay[];
  selectedDate: string | null;
  setSelectedDate: (d: string) => void;
  activeTab: "personal" | "group";
  setActiveTab: (t: "personal" | "group") => void;
  formatDate: () => string;
  isToday: (iso: string | null) => boolean;
  isPerfectDay: (dateStr: string) => boolean;
  currentMissions: PersonalMissionEntry[];
  allAvailableMissions: CatalogMission[];
  deleteMission: (index: number) => void;
  setShowAddMission: (b: boolean) => void;
  myGroupMissions: Mission[];
  setSelectedGroupMission: (m: Mission) => void;
  currentStreak: number;
  onProfileClick?: () => void;
  loadDay?: (dateStr: string, options?: { force?: boolean }) => Promise<void>;
}

export default function HomePage({
  userName,
  profileColor,
  weekDays,
  selectedDate,
  setSelectedDate,
  activeTab,
  setActiveTab,
  formatDate,
  isToday,
  isPerfectDay,
  currentMissions,
  allAvailableMissions,
  deleteMission,
  setShowAddMission,
  myGroupMissions,
  currentStreak,
  onProfileClick,
  loadDay,
}: Props) {
  const [checkedMissions, setCheckedMissions] = React.useState<Record<number, boolean>>({});
  const [personalMissionChecked, setPersonalMissionChecked] = React.useState<Record<string, boolean>>({});
  const [showAnnouncement, setShowAnnouncement] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [windowSize, setWindowSize] = React.useState({ width: 0, height: 0 });

  // 공지사항 표시 여부 확인
  React.useEffect(() => {
    const checkAnnouncement = async () => {
      try {
        const dismissed = await safeStorage.get("announcement_dismissed");
        if (!dismissed) {
          setShowAnnouncement(true);
        }
      } catch (error) {
        console.error("공지사항 상태 확인 실패:", error);
      }
    };
    checkAnnouncement();
  }, []);

  // 윈도우 크기 설정
  React.useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleCloseAnnouncement = async () => {
    try {
      await safeStorage.set("announcement_dismissed", "true");
      setShowAnnouncement(false);
    } catch (error) {
      console.error("공지사항 닫기 실패:", error);
      setShowAnnouncement(false);
    }
  };

  const getMissionKey = (missionEntry: PersonalMissionEntry) =>
    `${missionEntry.missionId}::${missionEntry.submission}`;

  const resolveSubmissionLabel = (missionEntry: PersonalMissionEntry) => {
    const trimmed = missionEntry.submission?.trim();
    if (trimmed) return trimmed;
    const catalog = allAvailableMissions.find((mission) => mission.id === missionEntry.missionId);
    if (catalog && catalog.submissions && catalog.submissions.length > 0) {
      // 새로운 구조: { id, label } 객체 배열
      const firstSub = catalog.submissions[0];
      if (firstSub && typeof firstSub === 'object' && 'label' in firstSub) {
        const label = (firstSub as { label: string }).label;
        if (label && typeof label === 'string' && label.trim().length > 0) {
          return label.trim();
        }
      }
    }
    if (catalog?.name) {
      return catalog.name;
    }
    return `미션-${missionEntry.missionId}`;
  };

  const handleCheck = async (id: number) => {
    if (!selectedDate) return;

    const isMyGroup = myGroupMissions.some((mission) => mission.id === id);
    if (!isMyGroup) {
      return;
    }
    
    const currentChecked = !!checkedMissions[id];
    const newChecked = !currentChecked;

    // 미션 성공 시 폭죽 효과
    if (newChecked && !currentChecked) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    // 로컬 상태 먼저 업데이트 (낙관적 업데이트)
    setCheckedMissions((prev) => ({ ...prev, [id]: newChecked }));

    try {
      await groupMissionApi.checkGroupMission(id, selectedDate, newChecked);
    } catch (error) {
      // 실패 시 로컬 상태 롤백
      setCheckedMissions((prev) => ({ ...prev, [id]: currentChecked }));
      console.error("그룹 미션 체크 상태 업데이트 실패:", error);
    }
  };

  const handlePersonalMissionCheck = async (missionEntry: PersonalMissionEntry) => {
    if (!selectedDate) return;
    
    const key = getMissionKey(missionEntry);
    const currentChecked = !!personalMissionChecked[key];
    const newChecked = !currentChecked;

    // 미션 성공 시 폭죽 효과
    if (newChecked && !currentChecked) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    // 로컬 상태 먼저 업데이트 (낙관적 업데이트)
    setPersonalMissionChecked((prev) => ({ ...prev, [key]: newChecked }));

    try {
      // 주간 루틴인 경우: 주간 루틴 완료 상태 저장
      // 일일 미션인 경우: 로컬 스토리지에 완료 상태 저장
      if (missionEntry.is_weekly_routine) {
        saveWeeklyRoutineCompletion(
          selectedDate,
          missionEntry.missionId,
          missionEntry.submission,
          newChecked
        );
      } else {
        const dayMissions = loadDayMissions(selectedDate);
        const missionIndex = dayMissions.findIndex(
          (m) => m.missionId === missionEntry.missionId && m.submission === missionEntry.submission
        );
        
        if (missionIndex >= 0) {
          dayMissions[missionIndex] = {
            ...dayMissions[missionIndex],
            completed: newChecked,
          };
          saveDayMissions(selectedDate, dayMissions);
        }
      }
      
      // 미션 목록 다시 불러오기
      if (loadDay && selectedDate) {
        await loadDay(selectedDate, { force: true });
      }
    } catch (error) {
      // 실패 시 로컬 상태 롤백
      setPersonalMissionChecked((prev) => ({ ...prev, [key]: currentChecked }));
      console.error("체크 상태 업데이트 실패:", error);
    }
  };

  // 날짜나 탭이 변경될 때 서버에서 불러온 completed 상태로 초기화
  React.useEffect(() => {
    if (selectedDate && activeTab === "personal") {
      const checkedState: Record<string, boolean> = {};
      currentMissions.forEach((missionEntry) => {
        const key = getMissionKey(missionEntry);
        checkedState[key] = missionEntry.completed || false;
      });
      setPersonalMissionChecked(checkedState);
    } else {
      setPersonalMissionChecked({});
    }
    
    // 그룹 미션 탭일 때 체크 상태 초기화
    if (selectedDate && activeTab === "group") {
        const checkedState: Record<number, boolean> = {};
        myGroupMissions.forEach((mission) => {
          checkedState[mission.id] = mission.checked || false;
        });
        setCheckedMissions(checkedState);
    } else if (activeTab !== "group") {
      setCheckedMissions({});
    }
  }, [selectedDate, activeTab, currentMissions, myGroupMissions]);

  return (
    <div className="px-6 py-6 rounded-3xl">
      {/* 폭죽 효과 */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
      
      {/* 공지사항 */}
      {showAnnouncement && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl relative">
          <button
            onClick={handleCloseAnnouncement}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="공지사항 닫기"
          >
            <X size={20} />
          </button>
          <div className="pr-6">
            <h3 className="text-sm font-bold text-green-900 mb-1">공지사항</h3>
            <div className="text-xs text-green-800 space-y-1">
              <p>
                가이드 바로가기 👉{" "}
                <a 
                  href="https://general-muscari-e49.notion.site/2b8225bc650480a98973df74230f3f1f?pvs=143" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-600 underline hover:text-green-700"
                >
                  https://general-muscari-e49.notion.site/2b8225bc650480a98973df74230f3f1f?pvs=143
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 상단 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-base text-gray-700 mb-1">
            {selectedDate ? formatDate() : "날짜를 선택해주세요"}
          </div>
          <div className="text-xl font-bold">
            미션 <span className="text-red-500">{currentStreak}</span>일째
          </div>
        </div>

        {/* 프로필 버튼 */}
        <button
          onClick={onProfileClick}
          className={`w-12 h-12 ${profileColor} rounded-full flex items-center justify-center text-white text-lg font-bold hover:shadow-md transition-shadow`}
        >
          {userName ? userName.charAt(0) : "?"}
        </button>
      </div>

      {/* 탭 버튼 */}
      <div className="flex justify-between gap-3 mb-6">
        <button
          onClick={() => setActiveTab("personal")}
          className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "personal"
              ? "bg-gray-100 text-gray-700"
              : "bg-white text-gray-400 border border-gray-200"
          }`}
        >
          개인 루틴
        </button>
        <button
          onClick={() => setActiveTab("group")}
          className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeTab === "group"
              ? "bg-gray-100 text-gray-700"
              : "bg-white text-gray-400 border border-gray-200"
          }`}
        >
          그룹 미션
        </button>
      </div>

      {/* 주간 달력 */}
      <div className="flex justify-between gap-2 mb-8">
        {weekDays.map((day) => (
          <button
            key={day.fullDate}
            onClick={() => setSelectedDate(day.fullDate)}
            className={`flex flex-col items-center justify-center w-full h-20 rounded-3xl transition-all relative ${
              selectedDate === day.fullDate
                ? "bg-green-300 text-white"
                : isPerfectDay(day.fullDate)
                ? "bg-green-200 text-gray-700"
                : "bg-gray-50 text-gray-400"
            }`}
          >
            <div className="text-2xl font-bold mb-1">{day.num}</div>
            <div className="text-xs">{day.day}</div>
            {isPerfectDay(day.fullDate) && (
              <div className="absolute bottom-2 w-1.5 h-1.5 bg-green-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ===== 개인 미션 ===== */}
      {activeTab === "personal" && (
        <div className="mb-20">
          <h3 className="text-xl font-bold mb-4">
            {isToday(selectedDate) ? "오늘의 미션" : `${formatDate()} 미션`}
          </h3>
          {currentMissions.length > 0 ? (
            currentMissions.map((missionEntry, index) => {
              const missionKey = getMissionKey(missionEntry);
              const isChecked = !!personalMissionChecked[missionKey];
              return (
                <div
                  key={missionKey}
                  className={`flex items-center justify-between mb-4 p-4 rounded-3xl border transition-all ${
                    isChecked
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() =>
                        handlePersonalMissionCheck(missionEntry)
                      }
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isChecked
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300 hover:border-green-400"
                      }`}
                    >
                      {isChecked && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                          stroke="white"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`text-base ${
                        isChecked
                          ? "text-green-700 line-through"
                          : "text-gray-700"
                      }`}
                    >
                      {missionEntry.submission ||
                        allAvailableMissions.find(
                          (m) => m.id === missionEntry.missionId
                        )?.name ||
                        "(삭제된 미션)"}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteMission(index)}
                    className="text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-400 py-8">
              등록된 미션이 없습니다
            </div>
          )}

          <button
            className={`flex items-center gap-2 mt-4 ${
              selectedDate
                ? "text-gray-600 hover:text-gray-800"
                : "text-gray-300 cursor-not-allowed"
            }`}
            onClick={() => selectedDate && setShowAddMission(true)}
            disabled={!selectedDate}
          >
            <Plus size={22} />
            <span className="text-sm">오늘부터 미션시작하기!</span>
          </button>
        </div>
      )}

      {/* ===== 그룹 미션 ===== */}
      {activeTab === "group" && (
        <div className="space-y-4">
          {myGroupMissions.length > 0 ? (
            myGroupMissions.map((mission) => (
              <div
                key={mission.id}
                className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* 상단: 그룹명 + 체크 */}
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    {(() => {
                      const leader = mission.participants[0];
                      const leaderColor =
                        leader?.profile_color || mission.color || "bg-gray-300";
                      const leaderInitial = leader?.name?.charAt(0) || "G";
                      return (
                        <div
                          className={`w-12 h-12 ${leaderColor} rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow`}
                        >
                          {leaderInitial}
                        </div>
                      );
                    })()}
                    <div className="flex-1">
                      <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">
                        {mission.participants[0]?.name || "그룹원"} 님의 그룹
                      </p>
                      <h2 className="text-base font-bold text-gray-900 mt-1">
                        {mission.name}
                      </h2>
                      <p className="text-gray-500 text-xs mt-0.5">
                        이번주 미션 • {mission.participants.length}/3명 참여
                      </p>
                    </div>
                  </div>

                  {/* 큰 노란 체크 */}
                  <button
                    onClick={() => handleCheck(mission.id)}
                    className={`w-16 h-16 border-3 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                      checkedMissions[mission.id]
                        ? "border-yellow-400 bg-yellow-100 text-yellow-500 shadow-lg"
                        : "border-yellow-300 bg-white text-yellow-400 hover:bg-yellow-50"
                    }`}
                  >
                    {checkedMissions[mission.id] ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                        className="w-8 h-8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-yellow-300" />
                    )}
                  </button>
                </div>

                {/* 참여자 섹션 */}
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    팀원 목록
                  </p>
                  <div className="flex justify-around items-center">
                    {mission.participants.slice(0, 3).map((participant, i) => {
                      const name = participant?.name || `멤버${i + 1}`;
                      const fallbackColors = ["bg-gray-300", "bg-gray-400", "bg-gray-500"];
                      const avatarColor =
                        participant?.profile_color || fallbackColors[i % fallbackColors.length];
                      return (
                        <div
                          key={participant?.id ?? `${mission.id}-${name}`}
                          className="flex flex-col items-center gap-1"
                        >
                          <div
                            className={`w-14 h-14 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow`}
                          >
                            {name.charAt(0)}
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            {name}
                          </span>
                        </div>
                      );
                    })}
                    {mission.participants.length === 0 && (
                      <div className="text-xs text-gray-400">팀원이 없습니다.</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-12 bg-gray-50 rounded-3xl">
              <p>참여한 그룹 미션이 없습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}