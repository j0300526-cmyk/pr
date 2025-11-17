import React from "react";
import { Plus, X } from "lucide-react";
import { CatalogMission, Mission, PersonalMissionEntry, WeekDay } from "../types";

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
  hasMissions: (dateStr: string) => boolean;
  currentMissions: PersonalMissionEntry[];
  allAvailableMissions: CatalogMission[];
  deleteMission: (index: number) => void;
  setShowAddMission: (b: boolean) => void;
  myGroupMissions: Mission[];
  setSelectedGroupMission: (m: Mission) => void;
  currentStreak: number;
  onProfileClick?: () => void;
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
  hasMissions,
  currentMissions,
  allAvailableMissions,
  deleteMission,
  setShowAddMission,
  myGroupMissions,
  currentStreak,
  onProfileClick,
}: Props) {
  const [checkedMissions, setCheckedMissions] = React.useState<Record<number, boolean>>({});
  const [checkedParticipants, setCheckedParticipants] = React.useState<Record<string, boolean>>({});
  const [personalMissionChecked, setPersonalMissionChecked] = React.useState<Record<string, boolean>>({});

  const getMissionKey = (missionEntry: PersonalMissionEntry) =>
    `${missionEntry.missionId}::${missionEntry.submission}`;

  const handleCheck = (id: number) =>
    setCheckedMissions((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleParticipantCheck = (missionId: number, name: string) => {
    const key = `${missionId}-${name}`;
    setCheckedParticipants((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePersonalMissionCheck = (missionEntry: PersonalMissionEntry) => {
    const key = getMissionKey(missionEntry);
    setPersonalMissionChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 날짜나 탭이 변경될 때만 체크 상태 초기화
  React.useEffect(() => {
    setPersonalMissionChecked({});
  }, [selectedDate, activeTab]);

  return (
    <div className="px-6 py-6 rounded-3xl">
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
                : hasMissions(day.fullDate)
                ? "bg-green-200 text-gray-700"
                : "bg-gray-50 text-gray-400"
            }`}
          >
            <div className="text-2xl font-bold mb-1">{day.num}</div>
            <div className="text-xs">{day.day}</div>
            {hasMissions(day.fullDate) && (
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
              isToday(selectedDate)
                ? "text-gray-600 hover:text-gray-800"
                : "text-gray-300 cursor-not-allowed"
            }`}
            onClick={() => isToday(selectedDate) && setShowAddMission(true)}
            disabled={!isToday(selectedDate)}
          >
            <Plus size={22} />
            <span className="text-sm">
              {isToday(selectedDate)
                ? "개인 미션 추가하기"
                : "오늘만 추가할 수 있어요"}
            </span>
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
                    <img
                      src={`https://randomuser.me/api/portraits/women/${mission.id * 2}.jpg`}
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                      alt="대표"
                    />
                    <div className="flex-1">
                      <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider">
                        {mission.participants[0]} 님의 그룹
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
                    팀원 진행상황
                  </p>
                  <div className="flex justify-around items-center">
                    {mission.participants.slice(0, 2).map((p, i) => {
                      const key = `${mission.id}-${p}`;
                      const checked = checkedParticipants[key];
                      return (
                        <div key={p} className="flex flex-col items-center">
                          <div className="relative mb-2">
                            <img
                              src={`https://randomuser.me/api/portraits/${
                                i % 2 === 0 ? "women" : "men"
                              }/${mission.id * (i + 4)}.jpg`}
                              className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                              alt={p}
                            />
                            {checked && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={3}
                                  stroke="white"
                                  className="w-3 h-3"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 12.75l6 6 9-13.5"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-medium text-gray-700 mb-2">
                            {p}
                          </span>
                          <button
                            onClick={() => handleParticipantCheck(mission.id, p)}
                            className={`w-8 h-8 border-2 rounded-full flex items-center justify-center transition-all ${
                              checked
                                ? "border-green-400 bg-green-100 text-green-500"
                                : "border-gray-300 bg-gray-50 hover:border-green-300"
                            }`}
                          >
                            {checked ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={3}
                                stroke="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4.5 12.75l6 6 9-13.5"
                                />
                              </svg>
                            ) : null}
                          </button>
                        </div>
                      );
                    })}
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