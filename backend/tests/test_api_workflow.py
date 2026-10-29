import json
from datetime import datetime
from uuid import uuid4
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient

from auth import get_password_hash
from database import SessionLocal
from main import app
from models import CatalogMission, User


client = TestClient(app)


def create_user(email: str, name: str) -> User:
    db = SessionLocal()
    try:
        user = User(email=email, name=name, password_hash=get_password_hash("test-password"))
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def login_headers(email: str) -> tuple[dict[str, str], str]:
    response = client.post("/api/auth/login", json={"email": email, "password": "test-password"})
    assert response.status_code == 200
    payload = response.json()
    return {"Authorization": f"Bearer {payload['access']}"}, payload["refresh"]


def test_authenticated_api_workflow():
    suffix = uuid4().hex
    owner = create_user(f"workflow-owner-{suffix}@example.com", "워크플로우 사용자")
    invitee = create_user(f"workflow-invitee-{suffix}@example.com", "초대 사용자")
    decliner = create_user(f"workflow-decliner-{suffix}@example.com", "거절 사용자")

    db = SessionLocal()
    try:
        db.add(
            CatalogMission(
                category=f"테스트 카테고리 {suffix}",
                submissions=json.dumps(["테스트 미션"], ensure_ascii=False),
            )
        )
        db.commit()
    finally:
        db.close()

    owner_headers, refresh_token = login_headers(owner.email)
    invitee_headers, _ = login_headers(invitee.email)
    decliner_headers, _ = login_headers(decliner.email)

    assert client.post("/api/auth/refresh", json={"refresh": refresh_token}).status_code == 200
    assert client.get("/api/users/me", headers=owner_headers).json()["id"] == owner.id
    assert client.get("/api/users/random?limit=3", headers=owner_headers).status_code == 200
    assert client.get("/api/friends", headers=owner_headers).status_code == 200
    assert client.get("/api/server/date", headers=owner_headers).status_code == 200
    assert client.put(
        "/api/users/me", headers=owner_headers, json={"name": "수정된 사용자"}
    ).json()["name"] == "수정된 사용자"

    catalog = client.get("/api/missions/catalog", headers=owner_headers)
    assert catalog.status_code == 200
    assert any(item["category"].endswith(suffix) for item in catalog.json())

    mission_date = datetime.now(ZoneInfo("Asia/Seoul")).date().isoformat()
    created_mission = client.post(
        f"/api/days/{mission_date}/missions",
        headers=owner_headers,
        json={"mission_id": 1, "submission": "테스트 미션"},
    )
    assert created_mission.status_code == 200
    mission_id = created_mission.json()["id"]
    assert client.patch(
        f"/api/days/{mission_date}/missions/{mission_id}/complete",
        headers=owner_headers,
        json={"completed": True},
    ).status_code == 200
    assert client.get(f"/api/days/{mission_date}/missions", headers=owner_headers).status_code == 200
    assert client.get(f"/api/days/{mission_date}", headers=owner_headers).status_code == 200
    assert len(client.get(f"/api/days/week-summary?date={mission_date}", headers=owner_headers).json()) == 7

    routine = client.post(
        "/api/personal-routines",
        headers=owner_headers,
        json={"mission_id": 2, "submission": "주간 테스트", "date": mission_date},
    )
    assert routine.status_code == 200
    assert client.get("/api/personal-routines", headers=owner_headers).status_code == 200
    assert client.get(
        f"/api/personal-routines/week/{mission_date}", headers=owner_headers
    ).status_code == 200
    assert client.delete(f"/api/personal-routines/{routine.json()['id']}", headers=owner_headers).status_code == 200

    group = client.post(
        "/api/group-missions",
        headers=owner_headers,
        json={"name": f"테스트 그룹 {suffix}", "color": "bg-green-300"},
    )
    assert group.status_code == 200
    group_id = group.json()["id"]
    assert client.post(f"/api/group-missions/{group_id}/join", headers=owner_headers).status_code == 200
    assert client.get("/api/group-missions", headers=owner_headers).status_code == 200
    assert client.get(f"/api/group-missions/{group_id}", headers=owner_headers).status_code == 200
    assert client.get("/api/group-missions/recommended", headers=owner_headers).status_code == 200
    assert client.post(
        f"/api/group-missions/{group_id}/check",
        headers=owner_headers,
        json={"date": mission_date, "completed": True},
    ).status_code == 200
    assert client.get("/api/group-missions/my", headers=owner_headers).status_code == 200

    assert client.post(
        f"/api/group-missions/{group_id}/invite",
        headers=owner_headers,
        json={"friend_ids": [invitee.id]},
    ).status_code == 200
    invites = client.get("/api/invites/received", headers=invitee_headers)
    assert invites.status_code == 200
    assert client.post(
        f"/api/invites/{invites.json()[0]['id']}/accept", headers=invitee_headers
    ).status_code == 200
    assert client.post(
        f"/api/group-missions/{group_id}/invite",
        headers=owner_headers,
        json={"friend_ids": [decliner.id]},
    ).status_code == 200
    declined_invite = client.get("/api/invites/received", headers=decliner_headers).json()[0]
    assert client.delete(
        f"/api/invites/{declined_invite['id']}/decline", headers=decliner_headers
    ).status_code == 200

    assert client.get("/api/ranking/personal", headers=owner_headers).status_code == 200
    assert client.get("/api/ranking/group", headers=owner_headers).status_code == 200
    assert client.get("/api/ranking/my", headers=owner_headers).status_code == 200
    assert client.delete(f"/api/days/{mission_date}/missions/{mission_id}", headers=owner_headers).status_code == 200
    assert client.delete(f"/api/group-missions/{group_id}/leave", headers=owner_headers).status_code == 200
    assert client.delete(f"/api/group-missions/{group_id}", headers=owner_headers).status_code == 200
    assert client.post("/api/auth/logout", headers=owner_headers).status_code == 200
