from database import SessionLocal
from models import CatalogMission

data = [
    {"category": "일회용품 줄이기", "example": "텀블러 사용하기 / 장바구니 챙기기 / 일회용 젓가락 거절하기"},
    {"category": "리필 & 재사용", "example": "세제 리필하기 / 공병 리필 / 빈병 반납하기"},
    {"category": "분리배출 개선", "example": "플라스틱 라벨 제거 / 음식물 비우기 / 투명페트 분리"},
    {"category": "음식물 쓰레기 줄이기", "example": "남은 음식 리메이크 / 유통기한 관리 / 냉장고 비우기"},
    {"category": "착한 소비 (윤리적 구매)", "example": "리필 제품 구매 / 중고 거래 / 로컬 브랜드 구매"},
    {"category": "패션 & 뷰티 루틴", "example": "헌옷 리폼 / 공병 수거 / 천연소재 제품 사용"},
    {"category": "이동 & 에너지 절약", "example": "걸어서 이동 / 자전거 출근 / 콘센트 뽑기"},
    {"category": "디지털 친환경 루틴", "example": "클라우드 정리 / 오래된 메일 삭제 / 전자기기 재활용"},
    {"category": "공유 & 나눔 문화", "example": "물건 공유 / 제로웨이스트 워크숍 참여 / 중고 나눔"},
    {"category": "제로웨이스트 챌린지 데이", "example": "하루 일회용품 0개 / 7일간 다회용 인증 / 팀별 실천 랭킹"}
]

def main():
    db = SessionLocal()

    for item in data:
        exists = db.query(CatalogMission).filter(
            CatalogMission.category == item["category"]
        ).first()

        if not exists:
            mission = CatalogMission(
                category=item["category"],
                example=item["example"]
            )
            db.add(mission)
            print(f"Added: {item['category']}")
        else:
            print(f"Skipped (already exists): {item['category']}")

    db.commit()
    db.close()
    print("Seed completed!")

if __name__ == "__main__":
    main()
