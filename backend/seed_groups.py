# backend/seed_groups.py
from database import SessionLocal
from models import GroupMission, User


def seed_groups():
    db = SessionLocal()
    try:
        existing = db.query(GroupMission).all()
        print("=== 현재 group_missions ===")
        for g in existing:
            print(f"- id={g.id}, name={g.name}, color={g.color}")

        if existing:
            print("이미 그룹이 있으니 시드 스킵합니다.")
            return

        # 테스트 사용자(기본 test@example.com)가 있다고 가정
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            print("테스트 사용자가 없으니 먼저 `python backend/init_data.py` 를 실행하세요.")
            return

        groups = [
            GroupMission(name="제로웨이스트 챌린지 1팀", color="bg-green-300", created_by=user.id),
            GroupMission(name="텀블러 습관 들이기", color="bg-blue-300", created_by=user.id),
            GroupMission(name="비건 런치 모임", color="bg-purple-300", created_by=user.id),
        ]

        for g in groups:
            db.add(g)

        db.commit()
        print("✅ 그룹 시드 완료!")

        new_groups = db.query(GroupMission).all()
        print("=== 시드 이후 group_missions ===")
        for g in new_groups:
            print(f"- id={g.id}, name={g.name}, color={g.color}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_groups()
