#!/usr/bin/env python3
"""
카탈로그 시드 (sqlite3 직접 삽입)
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "zero_waste.db")

data = [
    ("일회용품 줄이기", "텀블러 사용하기 / 장바구니 챙기기 / 일회용 젓가락 거절하기"),
    ("리필 & 재사용", "세제 리필하기 / 공병 리필 / 빈병 반납하기"),
    ("분리배출 개선", "플라스틱 라벨 제거 / 음식물 비우기 / 투명페트 분리"),
    ("음식물 쓰레기 줄이기", "남은 음식 리메이크 / 유통기한 관리 / 냉장고 비우기"),
    ("착한 소비 (윤리적 구매)", "리필 제품 구매 / 중고 거래 / 로컬 브랜드 구매"),
    ("패션 & 뷰티 루틴", "헌옷 리폼 / 공병 수거 / 천연소재 제품 사용"),
    ("이동 & 에너지 절약", "걸어서 이동 / 자전거 출근 / 콘센트 뽑기"),
    ("디지털 친환경 루틴", "클라우드 정리 / 오래된 메일 삭제 / 전자기기 재활용"),
    ("공유 & 나눔 문화", "물건 공유 / 제로웨이스트 워크숍 참여 / 중고 나눔"),
    ("제로웨이스트 챌린지 데이", "하루 일회용품 0개 / 7일간 다회용 인증 / 팀별 실천 랭킹"),
]

def main():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print(f"DB path: {db_path}")
    
    for category, example in data:
        try:
            cursor.execute("""
                INSERT INTO catalog_missions (category, example)
                VALUES (?, ?)
            """, (category, example))
            print(f"✓ Added: {category}")
        except sqlite3.IntegrityError:
            print(f"✗ Skipped: {category} (already exists)")
    
    conn.commit()
    conn.close()
    print("\n✓ Seed completed!")

if __name__ == "__main__":
    main()
