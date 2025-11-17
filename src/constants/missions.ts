// 화면에서 사용하는 기본/추천 그룹 미션 상수 정의
import { Mission } from "../types";

export const RECOMMENDED_MISSIONS: Mission[] = [
  { id: 3, name: "대중교통 이용하기", participants: ["이준호", "박나영"], color: "bg-green-400" },
  { id: 4, name: "플라스틱 프리 챌린지", participants: ["김수연", "한지우", "윤상민"], color: "bg-purple-400" },
];

export const DEFAULT_GROUP_MISSIONS: Mission[] = [
  { id: 1, name: "일회용 컵 사용 안하기", participants: ["김민수", "이영희", "박철수"], color: "bg-blue-300" },
  { id: 2, name: "장바구니 들고 쇼핑하기", participants: ["홍길동", "김영수"], color: "bg-purple-300" },
];


