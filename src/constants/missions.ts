// 프론트엔드에서 사용하는 미션 카탈로그 데이터
// 서버 호출 없이 직접 사용
import { CatalogMission, Mission } from "../types";

export const FRONTEND_MISSIONS: CatalogMission[] = [
  {
    id: 1,
    category: "일회용품 줄이기",
    name: "일회용품 줄이기",
    submissions: [
      "텀블러 사용하기",
      "장바구니 챙기기",
      "일회용 젓가락 안 받기",
      "물티슈 대신 손수건 사용하기",
    ],
  },
  {
    id: 2,
    category: "리필 & 재사용",
    name: "리필 & 재사용",
    submissions: [
      "세제 리필하기",
      "공병 리필",
      "빈병 반납하기",
    ],
  },
  {
    id: 3,
    category: "분리배출 개선",
    name: "분리배출 개선",
    submissions: [
      "플라스틱 라벨 제거",
      "투명페트 분리",
      "플라스틱 물로 헹구고 분리수거하기",
    ],
  },
  {
    id: 4,
    category: "음식물 쓰레기 줄이기",
    name: "음식물 쓰레기 줄이기",
    submissions: [
      "남은 음식 리메이크",
      "유통기한 관리",
      "냉장고 비우기",
      "음식 남기지 않기",
    ],
  },
  {
    id: 5,
    category: "학교 기반 활동",
    name: "학교 기반 활동",
    submissions: [
      "중앙도서관 텀블러 세척기 사용하기",
      "기숙사 분리수거함 이용 인증",
      "캠퍼스 식당 종이컵 사용 안 하기",
    ],
  },
  {
    id: 6,
    category: "착한 소비 (윤리적 구매)",
    name: "착한 소비 (윤리적 구매)",
    submissions: [
      "리필 제품 구매",
      "중고 거래",
      "로컬 브랜드 구매",
    ],
  },
  {
    id: 7,
    category: "패션 & 뷰티 루틴",
    name: "패션 & 뷰티 루틴",
    submissions: [
      "헌옷 리폼",
      "공병 수거",
      "천연소재 제품 사용",
    ],
  },
  {
    id: 8,
    category: "이동 & 에너지 절약",
    name: "이동 & 에너지 절약",
    submissions: [
      "걸어서 이동",
      "자전거 출근",
      "콘센트 뽑기",
    ],
  },
  {
    id: 9,
    category: "디지털 친환경 루틴",
    name: "디지털 친환경 루틴",
    submissions: [
      "클라우드 정리",
      "오래된 메일 삭제",
      "전자기기 재활용",
    ],
  },
  {
    id: 10,
    category: "공유 & 나눔 문화",
    name: "공유 & 나눔 문화",
    submissions: [
      "물건 공유",
      "제로웨이스트 워크숍 참여",
      "중고 나눔",
    ],
  },
  {
    id: 11,
    category: "제로웨이스트 챌린지 데이",
    name: "제로웨이스트 챌린지 데이",
    submissions: [
      "하루 일회용품 0개",
      "7일간 다회용 인증",
    ],
  },
];

// 그룹 미션 기본 데이터 (폴백용)
export const DEFAULT_GROUP_MISSIONS: Mission[] = [];

// 추천 그룹 미션 데이터 (폴백용)
export const RECOMMENDED_MISSIONS: Mission[] = [];
