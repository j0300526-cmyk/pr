// 개인 미션 로컬 스토리지 관리 유틸리티
import { PersonalMissionEntry } from "../types";

const STORAGE_PREFIX = "personal_missions:";
const WEEKLY_ROUTINE_PREFIX = "weekly_routines:";

// 날짜별 미션 저장
export function saveDayMissions(dateStr: string, missions: PersonalMissionEntry[]): void {
  try {
    const key = `${STORAGE_PREFIX}${dateStr}`;
    localStorage.setItem(key, JSON.stringify(missions));
  } catch (error) {
    console.error("Failed to save day missions:", error);
  }
}

// 날짜별 미션 로드
export function loadDayMissions(dateStr: string): PersonalMissionEntry[] {
  try {
    const key = `${STORAGE_PREFIX}${dateStr}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    // 타입 안정성을 위한 검증
    if (!Array.isArray(parsed)) {
      console.warn(`Invalid day missions data for ${dateStr}, expected array`);
      return [];
    }
    return parsed;
  } catch (error) {
    console.error("Failed to load day missions:", error);
    return [];
  }
}

// 주간 루틴 저장 (주 시작일 기준)
export function saveWeeklyRoutine(weekStart: string, routine: {
  missionId: number;
  submission: string;
  startDate: string; // 실제 시작 날짜
}): void {
  try {
    const key = `${WEEKLY_ROUTINE_PREFIX}${weekStart}`;
    const existing = loadWeeklyRoutines(weekStart);
    // 중복 확인
    const exists = existing.some(
      (r) => r.missionId === routine.missionId && r.submission === routine.submission
    );
    if (!exists) {
      existing.push(routine);
      localStorage.setItem(key, JSON.stringify(existing));
    }
  } catch (error) {
    console.error("Failed to save weekly routine:", error);
  }
}

// 주간 루틴 로드
export function loadWeeklyRoutines(weekStart: string): Array<{
  missionId: number;
  submission: string;
  startDate: string;
}> {
  try {
    const key = `${WEEKLY_ROUTINE_PREFIX}${weekStart}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    // 타입 안정성을 위한 검증
    if (!Array.isArray(parsed)) {
      console.warn(`Invalid weekly routines data for ${weekStart}, expected array`);
      return [];
    }
    return parsed;
  } catch (error) {
    console.error("Failed to load weekly routines:", error);
    return [];
  }
}

// 주간 루틴 삭제
export function deleteWeeklyRoutine(weekStart: string, missionId: number, submission: string): void {
  try {
    const key = `${WEEKLY_ROUTINE_PREFIX}${weekStart}`;
    const existing = loadWeeklyRoutines(weekStart);
    const filtered = existing.filter(
      (r) => !(r.missionId === missionId && r.submission === submission)
    );
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete weekly routine:", error);
  }
}

// 특정 날짜에 주간 루틴 적용 (해당 날짜가 속한 주의 루틴을 해당 날짜에 적용)
export function getWeeklyRoutinesForDate(dateStr: string): PersonalMissionEntry[] {
  try {
    // 날짜가 속한 주의 월요일 계산
    const weekStart = getMondayOfWeek(dateStr);
    const routines = loadWeeklyRoutines(weekStart);
    
    return routines
      .filter((r) => r.startDate <= dateStr) // 시작일 이후인 루틴만
      .map((r, index) => {
        // 고유한 routine_id 생성 (weekStart + missionId + submission의 해시)
        const uniqueId = `${weekStart}-${r.missionId}-${r.submission}`.split('').reduce((acc, char) => {
          const hash = ((acc << 5) - acc) + char.charCodeAt(0);
          return hash & hash;
        }, 0);
        
        return {
          missionId: r.missionId,
          submission: r.submission,
          is_weekly_routine: true,
          routine_id: Math.abs(uniqueId) || (index + 1), // 고유한 숫자 ID
          completed: false,
          dayMissionId: undefined,
        };
      });
  } catch (error) {
    console.error("Failed to get weekly routines for date:", error);
    return [];
  }
}

// 주의 월요일 날짜 계산
export function getMondayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = date.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);
  return monday.toISOString().slice(0, 10);
}

// 주의 일요일 날짜 계산
export function getSundayOfWeek(dateStr: string): string {
  const monday = getMondayOfWeek(dateStr);
  const mondayDate = new Date(monday + "T00:00:00");
  const sunday = new Date(mondayDate);
  sunday.setDate(mondayDate.getDate() + 6);
  return sunday.toISOString().slice(0, 10);
}

