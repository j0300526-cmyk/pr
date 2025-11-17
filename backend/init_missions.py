#!/usr/bin/env python
"""미션 카탈로그 데이터 초기화 스크립트"""
from database import SessionLocal
from models import CatalogMission
import json

def init_missions():
    db = SessionLocal()
    
    # 기존 미션 확인
    existing_count = db.query(CatalogMission).count()
    print(f"기존 미션 개수: {existing_count}")
    
    if existing_count > 0:
        print("이미 미션 데이터가 존재합니다. 초기화를 건너뜁니다.")
        print("강제로 초기화하려면 zero_waste.db 파일을 삭제하세요.")
        db.close()
        return
    
    # 미션 데이터
    missions_data = [
        {
            "category": "일회용품 줄이기",
            "submissions": [
                "텀블러 사용하기",
                "장바구니 챙기기",
                "개인 수저/빨대 사용하기"
            ]
        },
        {
            "category": "리필 스테이션 이용",
            "submissions": [
                "공병 리필",
                "세제 리필",
                "화장품 리필"
            ]
        },
        {
            "category": "중고 거래",
            "submissions": [
                "중고 물품 구매",
                "안 쓰는 물건 판매",
                "물물교환"
            ]
        },
        {
            "category": "친환경 제품 사용",
            "submissions": [
                "친환경 세제 사용",
                "대나무 칫솔 사용",
                "비건 화장품 사용"
            ]
        },
        {
            "category": "분리수거",
            "submissions": [
                "분리수거 철저히 하기",
                "플라스틱 라벨 제거",
                "음식물 쓰레기 줄이기"
            ]
        },
        {
            "category": "에너지 절약",
            "submissions": [
                "대중교통 이용",
                "계단 이용하기",
                "전기 절약하기"
            ]
        },
        {
            "category": "음식물 쓰레기 줄이기",
            "submissions": [
                "남기지 않고 먹기",
                "채소 껍질 활용",
                "음식 계획적으로 구매"
            ]
        },
        {
            "category": "DIY 만들기",
            "submissions": [
                "수세미 만들기",
                "천 마스크 만들기",
                "업사이클링"
            ]
        },
        {
            "category": "기타",
            "submissions": [
                "환경 관련 콘텐츠 보기",
                "제로웨이스트 챌린지 참여",
                "친구에게 실천 알리기"
            ]
        }
    ]
    
    print("\n미션 데이터 추가 중...")
    for idx, mission_data in enumerate(missions_data, start=101):
        mission = CatalogMission(
            id=idx,
            category=mission_data["category"],
            submissions=json.dumps(mission_data["submissions"], ensure_ascii=False)
        )
        db.add(mission)
        print(f"✅ {mission_data['category']} (ID: {idx})")
    
    db.commit()
    print(f"\n🎉 총 {len(missions_data)}개의 미션이 추가되었습니다!")
    
    # 확인
    total = db.query(CatalogMission).count()
    print(f"현재 데이터베이스에 {total}개의 미션이 있습니다.\n")
    
    db.close()

if __name__ == "__main__":
    init_missions()

