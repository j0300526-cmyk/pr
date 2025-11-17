// 날짜 계산과 포맷을 담당하는 유틸 함수 모음
import { WeekDay } from "../types";

export const withMidnight = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const isSameDay = (a: Date, b: Date) => withMidnight(a).getTime() === withMidnight(b).getTime();

export const isToday = (iso: string | null): boolean => {
  if (!iso) return false;
  const target = new Date(iso);
  return isSameDay(target, new Date());
};

export const formatDateLabel = (iso: string | null): string => {
  if (!iso) return "";
  // ISO 형식 (YYYY-MM-DD)을 직접 파싱하여 타임존 문제 방지
  const [year, month, day] = iso.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
};

export const generateWeekDays = (center = new Date()): WeekDay[] => {
  const today = withMidnight(center);
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
  // 타임존 문제 방지를 위해 로컬 날짜를 직접 포맷
  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  
  const todayISO = formatLocalDate(today);
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateISO = formatLocalDate(date);
    days.push({
      num: date.getDate(),
      day: dayNames[date.getDay()],
      fullDate: dateISO,
      isToday: dateISO === todayISO,
    });
  }
  return days;
};


