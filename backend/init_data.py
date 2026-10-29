# 초기 데이터 삽입 스크립트
import json

from database import Base, SessionLocal, engine, ensure_day_mission_schema
from models import CatalogMission, User
from models import GroupMission, GroupMember
from auth import get_password_hash


def initialize_database():
    """Create the schema before inserting local sample data."""
    Base.metadata.create_all(bind=engine, checkfirst=True)
    ensure_day_mission_schema()

def init_catalog_missions():
    """미션 카탈로그 초기 데이터"""
    db = SessionLocal()
    try:
        # 이미 데이터가 있으면 스킵
        if db.query(CatalogMission).count() > 0:
            print("미션 카탈로그 데이터가 이미 존재합니다.")
            return
        
        missions = [
            ("일회용품 줄이기", ["텀블러 사용하기", "장바구니 챙기기", "일회용 젓가락 안 받기"]),
            ("리필 & 재사용", ["세제 리필하기", "공병 리필", "빈병 반납하기"]),
            ("분리배출 개선", ["플라스틱 라벨 제거", "음식물 비우기", "투명페트 분리"]),
            ("음식물 쓰레기 줄이기", ["남은 음식 리메이크", "유통기한 관리", "냉장고 비우기"]),
            ("착한 소비", ["리필 제품 구매", "중고 거래", "로컬 브랜드 구매"]),
            ("이동 & 에너지 절약", ["걸어서 이동", "자전거 출근", "콘센트 뽑기"]),
        ]
        
        for category, submissions in missions:
            db.add(
                CatalogMission(
                    category=category,
                    submissions=json.dumps(submissions, ensure_ascii=False),
                )
            )
        
        db.commit()
        print(f"{len(missions)}개의 미션 카탈로그가 추가되었습니다.")
    except Exception as e:
        print(f"오류 발생: {e}")
        db.rollback()
    finally:
        db.close()

def init_test_user():
    """테스트 사용자 생성"""
    db = SessionLocal()
    try:
        # 이미 테스트 사용자가 있으면 스킵
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if test_user:
            print("테스트 사용자가 이미 존재합니다.")
            return
        
        # 비밀번호 해싱 (bcrypt 버전 호환성 고려)
        password = "test1234"
        password_hash = get_password_hash(password)
        
        user = User(
            email="test@example.com",
            password_hash=password_hash,
            name="테스트 사용자",
            profile_color="bg-green-300",
            bio="테스트 계정입니다"
        )
        db.add(user)
        db.commit()
        print("테스트 사용자가 생성되었습니다. (이메일: test@example.com, 비밀번호: test1234)")
    except Exception as e:
        print(f"오류 발생: {e}")
        db.rollback()
    finally:
        db.close()


def init_group_missions():
    """테스트용 그룹 미션 및 멤버 초기화"""
    db = SessionLocal()
    try:
        # 이미 그룹이 있으면 스킵
        if db.query(GroupMission).count() > 0:
            print("그룹 미션 데이터가 이미 존재합니다.")
            return

        # 테스트 사용자 확인(생성되어 있어야 함)
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            print("테스트 사용자가 없어서 그룹을 생성할 수 없습니다. init_test_user를 먼저 실행하세요.")
            return

        groups = [
            GroupMission(name="가천대 제로웨이스트 1반", color="bg-green-300", created_by=user.id),
            GroupMission(name="텀블러 챌린지", color="bg-blue-300", created_by=user.id),
            GroupMission(name="비건 런치", color="bg-purple-300", created_by=user.id),
        ]

        for g in groups:
            db.add(g)

        db.commit()

        # (선택) 첫 그룹에 테스트 사용자 바로 추가
        first = db.query(GroupMission).order_by(GroupMission.id.asc()).first()
        if first:
            member = GroupMember(group_mission_id=first.id, user_id=user.id)
            db.add(member)
            db.commit()

        print(f"{len(groups)}개의 그룹 미션이 추가되었습니다.")
    except Exception as e:
        print(f"오류 발생: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("초기 데이터 삽입을 시작합니다...")
    initialize_database()
    init_catalog_missions()
    init_test_user()
    init_group_missions()
    print("완료되었습니다!")

