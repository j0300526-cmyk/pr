// 날짜 계산과 포맷을 담당하는 유틸 함수 모음
import { WeekDay } from "../types";

// KST(UTC+9) 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환
export const getTodayKST = (): string => {
  const kstTime = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kstTime.toISOString().slice(0, 10);
};

export const withMidnight = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const isSameDay = (a: Date, b: Date) => withMidnight(a).getTime() === withMidnight(b).getTime();

export const isToday = (iso: string | null): boolean => {
  if (!iso) return false;
  return iso === getTodayKST();
};

// KST 기준 오늘이 월요일인지 확인
export const isTodayMonday = (): boolean => {
  const today = getKSTDate();
  return today.getDay() === 1; // 1=월요일
};

// 특정 날짜가 월요일인지 확인
export const isMonday = (iso: string | null): boolean => {
  if (!iso) return false;
  const date = new Date(iso + "T00:00:00+09:00"); // KST 기준으로 파싱
  const kstDate = getKSTDate(date);
  return kstDate.getDay() === 1; // 1=월요일
};

export const formatDateLabel = (iso: string | null): string => {
  if (!iso) return "";
  // ISO 형식 (YYYY-MM-DD)을 직접 파싱하여 타임존 문제 방지
  const [year, month, day] = iso.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
};

// KST(UTC+9) 기준으로 Date 객체 생성
const getKSTDate = (date: Date = new Date()): Date => {
  const kstTime = date.getTime() + 9 * 60 * 60 * 1000;
  const kstDate = new Date(kstTime);
  return kstDate;
};

export const generateWeekDays = (center = new Date()): WeekDay[] => {
  // KST 기준으로 날짜 계산
  const kstCenter = getKSTDate(center);
  const today = withMidnight(kstCenter);
  const days: WeekDay[] = [];
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  
  // 오늘이 포함된 주의 월요일 찾기
  // getDay(): 0(일) ~ 6(토), 월요일은 1
  const dayOfWeek = today.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
  // 월요일까지의 차이 계산 (월요일=1, 일요일=0이므로 일요일은 -6)
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);
  
  // 월요일부터 일요일까지 7일 생성
  // KST 기준 날짜를 직접 포맷
  const formatKSTDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  
  const todayISO = getTodayKST();
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateISO = formatKSTDate(date);
    days.push({
      num: date.getDate(),
      day: dayNames[date.getDay()],
      fullDate: dateISO,
      isToday: dateISO === todayISO,
    });
  }
  return days;
};


