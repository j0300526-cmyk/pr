// 미션 데이터에서 통계 값을 계산하는 유틸 함수 모음
import { MissionsRecord, Mission } from "../types";
import { getTodayKST } from "./date";

export const calculateStreak = (missions: MissionsRecord): number => {
  const doneDates = new Set(
    Object.keys(missions).filter((date) => (missions[date] || []).length > 0),
  );
  if (doneDates.size === 0) return 0;

  let streak = 0;
  // KST 기준 오늘 날짜 사용
  const todayISO = getTodayKST();
  const today = new Date(todayISO + "T00:00:00");

  while (true) {
    const check = new Date(today);
    check.setDate(today.getDate() - streak);
    const year = check.getFullYear();
    const month = String(check.getMonth() + 1).padStart(2, "0");
    const day = String(check.getDate()).padStart(2, "0");
    const key = `${year}-${month}-${day}`;
    if (doneDates.has(key)) streak += 1;
    else break;
  }
  return streak;
};

export const countTotalMissions = (missions: MissionsRecord): number =>
  Object.values(missions).reduce(
    (acc, arr) => acc + (arr?.length ?? 0),
    0,
  );

/**
 * 개인 미션 점수 계산
 * - 일일 개당 1점
 * - 하루 최대 3점 (3개까지)
 */
export const calculatePersonalMissionScore = (
  missions: MissionsRecord,
  dateStr: string
): number => {
  const dayMissions = missions[dateStr] || [];
  // 하루 최대 3개까지 1점씩
  return Math.min(dayMissions.length, 3);
};

/**
 * 그룹 미션 점수 계산
 * - 개당 2점, 하루 최대 2점 (1개 그룹 미션 완료 시)
 * - 특별 보너스: 본인 포함 그룹원 3명이 모두 완료하면 4점 부여
 */
export const calculateGroupMissionScore = (
  groupMission: Mission,
  dateStr: string,
  completedParticipants: string[] // 해당 날짜에 완료한 참여자 목록
): number => {
  // 기본 점수: 그룹 미션 완료 시 2점 (하루 최대 2점)
  const baseScore = completedParticipants.length > 0 ? 2 : 0;
  
  // 특별 보너스: 본인 포함 그룹원 3명이 모두 완료하면 4점
  if (groupMission.participants.length === 3 && completedParticipants.length === 3) {
    // 모든 참여자가 완료했는지 확인
    const allCompleted = groupMission.participants.every((participant) =>
      completedParticipants.includes(participant.name)
    );
    if (allCompleted) {
      return 4; // 보너스 점수 4점
    }
  }
  
  return baseScore;
};

/**
 * 특정 날짜의 총 점수 계산
 */
export const calculateDayScore = (
  missions: MissionsRecord,
  dateStr: string,
  myGroupMissions: Mission[],
  groupCompletions: Record<number, string[]> // 그룹 ID별 완료한 참여자 목록
): number => {
  // 개인 미션 점수 (최대 3점)
  const personalScore = calculatePersonalMissionScore(missions, dateStr);
  
  // 그룹 미션 점수 (최대 2점 또는 보너스 4점)
  let groupScore = 0;
  for (const groupMission of myGroupMissions) {
    const completed = groupCompletions[groupMission.id] || [];
    const score = calculateGroupMissionScore(groupMission, dateStr, completed);
    // 하루에 여러 그룹 미션을 완료해도 최대 점수만 적용
    groupScore = Math.max(groupScore, score);
  }
  
  return personalScore + groupScore;
};

/**
 * 전체 총점 계산
 */
export const calculateTotalScore = (
  missions: MissionsRecord,
  allDates: string[],
  myGroupMissions: Mission[],
  groupCompletionsByDate: Record<string, Record<number, string[]>> // 날짜별 그룹 완료 정보
): number => {
  let totalScore = 0;
  
  for (const dateStr of allDates) {
    const dayGroupCompletions = groupCompletionsByDate[dateStr] || {};
    totalScore += calculateDayScore(missions, dateStr, myGroupMissions, dayGroupCompletions);
  }
  
  return totalScore;
};


