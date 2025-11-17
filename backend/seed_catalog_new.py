import sqlite3
import json
from datetime import datetime

db = sqlite3.connect('zero_waste.db')
cursor = db.cursor()

# 기존 catalog_missions 테이블 삭제
cursor.execute('DROP TABLE IF EXISTS catalog_missions')
db.commit()
print('✓ 기존 catalog_missions 테이블 삭제')

# 새로운 catalog_missions 테이블 생성
cursor.execute('''
CREATE TABLE catalog_missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category VARCHAR NOT NULL,
    submissions TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')
db.commit()
print('✓ 새 catalog_missions 테이블 생성')

# 데이터 삽입
data = [
    {
        "category": "일회용품 줄이기",
        "submissions": [
            "텀블러 사용하기",
            "장바구니 챙기기",
            "일회용 젓가락 안 받기"
        ]
    },
    {
        "category": "리필 & 재사용",
        "submissions": [
            "세제 리필하기",
            "공병 리필",
            "빈병 반납하기"
        ]
    },
    {
        "category": "분리배출 개선",
        "submissions": [
            "플라스틱 라벨 제거",
            "음식물 비우기",
            "투명페트 분리"
        ]
    },
    {
        "category": "음식물 쓰레기 줄이기",
        "submissions": [
            "남은 음식 리메이크",
            "유통기한 관리",
            "냉장고 비우기"
        ]
    },
    {
        "category": "착한 소비 (윤리적 구매)",
        "submissions": [
            "리필 제품 구매",
            "중고 거래",
            "로컬 브랜드 구매"
        ]
    },
    {
        "category": "패션 & 뷰티 루틴",
        "submissions": [
            "헌옷 리폼",
            "공병 수거",
            "천연소재 제품 사용"
        ]
    },
    {
        "category": "이동 & 에너지 절약",
        "submissions": [
            "걸어서 이동",
            "자전거 출근",
            "콘센트 뽑기"
        ]
    },
    {
        "category": "디지털 친환경 루틴",
        "submissions": [
            "클라우드 정리",
            "오래된 메일 삭제",
            "전자기기 재활용"
        ]
    },
    {
        "category": "공유 & 나눔 문화",
        "submissions": [
            "물건 공유",
            "제로웨이스트 워크숍 참여",
            "중고 나눔"
        ]
    },
    {
        "category": "제로웨이스트 챌린지 데이",
        "submissions": [
            "하루 일회용품 0개",
            "7일간 다회용 인증",
            "팀별 실천 랭킹"
        ]
    }
]

for item in data:
    submissions_json = json.dumps(item["submissions"], ensure_ascii=False)
    cursor.execute(
        'INSERT INTO catalog_missions (category, submissions) VALUES (?, ?)',
        (item["category"], submissions_json)
    )
    print(f'✓ {item["category"]} 추가')

db.commit()
print('\n✓ 모든 카테고리 시드 완료!')
db.close()
