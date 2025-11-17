# backend/tests/test_group_api.py
import pytest
from fastapi.testclient import TestClient
from database import SessionLocal
from models import User, GroupMission, GroupMember
from main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def db_setup():
    db = SessionLocal()
    # create a test user if not exists
    user = db.query(User).filter(User.email == "test@example.com").first()
    if not user:
        user = User(email="test@example.com", password_hash="x", name="테스트 사용자")
        db.add(user)
        db.commit()
        db.refresh(user)

    # ensure at least one group
    group = db.query(GroupMission).first()
    if not group:
        group = GroupMission(name="테스트 그룹", color="bg-green-300", created_by=user.id)
        db.add(group)
        db.commit()
        db.refresh(group)

    yield {"db": db, "user": user, "group": group}

    # teardown: do not delete data to keep fixtures simple
    db.close()


def test_join_flow(db_setup, monkeypatch):
    user = db_setup["user"]
    group = db_setup["group"]

    # override dependency to return our test user (bypass JWT)
    def fake_get_current_user():
        return user

    app.dependency_overrides = {}
    from auth import get_current_user
    app.dependency_overrides[get_current_user] = fake_get_current_user

    # ensure no membership exists
    db = SessionLocal()
    existing = db.query(GroupMember).filter(GroupMember.group_mission_id == group.id, GroupMember.user_id == user.id).first()
    if existing:
        db.delete(existing)
        db.commit()
    db.close()

    # call join endpoint
    resp = client.post(f"/api/group-missions/{group.id}/join")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == group.id

    # duplicate join should return 409
    resp2 = client.post(f"/api/group-missions/{group.id}/join")
    assert resp2.status_code == 409

    # cleanup override
    app.dependency_overrides = {}
