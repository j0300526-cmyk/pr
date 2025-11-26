// 프론트엔드에서 사용하는 미션 카탈로그 데이터
// 서버 호출 없이 직접 사용
import { CatalogMission, Mission, CatalogSubMission } from "../types";

export const FRONTEND_MISSIONS: CatalogMission[] = [
  {
    id: 1,
    category: "일회용품 줄이기",
    name: "일회용품 줄이기",
    submissions: [
      { id: 10001, label: "텀블러 사용하기" },
      { id: 10002, label: "장바구니 챙기기" },
      { id: 10003, label: "일회용 젓가락 안 받기" },
      { id: 10004, label: "물티슈 대신 손수건 사용하기" },
    ],
  },
  {
    id: 2,
    category: "리필 & 재사용",
    name: "리필 & 재사용",
    submissions: [
      { id: 20001, label: "세제 리필하기" },
      { id: 20002, label: "공병 리필" },
      { id: 20003, label: "빈병 반납하기" },
    ],
  },
  {
    id: 3,
    category: "분리배출 개선",
    name: "분리배출 개선",
    submissions: [
      { id: 30001, label: "플라스틱 라벨 제거" },
      { id: 30002, label: "투명페트 분리" },
      { id: 30003, label: "플라스틱 물로 헹구고 분리수거하기" },
    ],
  },
  {
    id: 4,
    category: "음식물 쓰레기 줄이기",
    name: "음식물 쓰레기 줄이기",
    submissions: [
      { id: 40001, label: "남은 음식 리메이크" },
      { id: 40002, label: "유통기한 관리" },
      { id: 40003, label: "냉장고 비우기" },
      { id: 40004, label: "음식 남기지 않기" },
    ],
  },
  {
    id: 5,
    category: "학교 기반 활동",
    name: "학교 기반 활동",
    submissions: [
      { id: 50001, label: "중앙도서관 텀블러 세척기 사용하기" },
      { id: 50002, label: "기숙사 분리수거함 이용 인증" },
      { id: 50003, label: "캠퍼스 식당 종이컵 사용 안 하기" },
    ],
  },
  {
    id: 6,
    category: "착한 소비 (윤리적 구매)",
    name: "착한 소비 (윤리적 구매)",
    submissions: [
      { id: 60001, label: "리필 제품 구매" },
      { id: 60002, label: "중고 거래" },
      { id: 60003, label: "로컬 브랜드 구매" },
    ],
  },
  {
    id: 7,
    category: "패션 & 뷰티 루틴",
    name: "패션 & 뷰티 루틴",
    submissions: [
      { id: 70001, label: "헌옷 리폼" },
      { id: 70002, label: "공병 수거" },
      { id: 70003, label: "천연소재 제품 사용" },
    ],
  },
  {
    id: 8,
    category: "이동 & 에너지 절약",
    name: "이동 & 에너지 절약",
    submissions: [
      { id: 80001, label: "걸어서 이동" },
      { id: 80002, label: "자전거 출근" },
      { id: 80003, label: "콘센트 뽑기" },
    ],
  },
  {
    id: 9,
    category: "디지털 친환경 루틴",
    name: "디지털 친환경 루틴",
    submissions: [
      { id: 90001, label: "클라우드 정리" },
      { id: 90002, label: "오래된 메일 삭제" },
      { id: 90003, label: "전자기기 재활용" },
    ],
  },
  {
    id: 10,
    category: "공유 & 나눔 문화",
    name: "공유 & 나눔 문화",
    submissions: [
      { id: 100001, label: "물건 공유" },
      { id: 100002, label: "제로웨이스트 워크숍 참여" },
      { id: 100003, label: "중고 나눔" },
    ],
  },
  {
    id: 11,
    category: "제로웨이스트 챌린지 데이",
    name: "제로웨이스트 챌린지 데이",
    submissions: [
      { id: 110001, label: "하루 일회용품 0개" },
      { id: 110002, label: "7일간 다회용 인증" },
    ],
  },
];

// 그룹 미션 기본 데이터 (폴백용)
export const DEFAULT_GROUP_MISSIONS: Mission[] = [];

// 추천 그룹 미션 데이터 (폴백용)
export const RECOMMENDED_MISSIONS: Mission[] = [];
