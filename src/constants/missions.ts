// 화면에서 사용하는 기본/추천 그룹 미션 상수 정의
import { Mission } from "../types";

export const RECOMMENDED_MISSIONS: Mission[] = [
  {
    id: 3,
    name: "대중교통 이용하기",
    participants: [
      { id: 11, name: "이준호", profile_color: "bg-blue-400" },
      { id: 12, name: "박나영", profile_color: "bg-pink-400" },
    ],
    color: "bg-green-400",
  },
  {
    id: 4,
    name: "플라스틱 프리 챌린지",
    participants: [
      { id: 13, name: "김수연", profile_color: "bg-purple-400" },
      { id: 14, name: "한지우", profile_color: "bg-orange-400" },
      { id: 15, name: "윤상민", profile_color: "bg-teal-400" },
    ],
    color: "bg-purple-400",
  },
];

export const DEFAULT_GROUP_MISSIONS: Mission[] = [
  {
    id: 1,
    name: "일회용 컵 사용 안하기",
    participants: [
      { id: 1, name: "김민수", profile_color: "bg-blue-500" },
      { id: 2, name: "이영희", profile_color: "bg-red-400" },
      { id: 3, name: "박철수", profile_color: "bg-emerald-400" },
    ],
    color: "bg-blue-300",
  },
  {
    id: 2,
    name: "장바구니 들고 쇼핑하기",
    participants: [
      { id: 4, name: "홍길동", profile_color: "bg-green-400" },
      { id: 5, name: "김영수", profile_color: "bg-yellow-400" },
    ],
    color: "bg-purple-300",
  },
];


