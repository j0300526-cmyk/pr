import pytest
from fastapi.testclient import TestClient

from database import SessionLocal
from main import app
from models import User

client = TestClient(app)


@pytest.fixture(scope="module")
def test_user():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "week-summary-tester@example.com").first()
    if not user:
        user = User(
            email="week-summary-tester@example.com",
            password_hash="dummy",
            name="Week Summary Tester",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    yield user
    db.close()


@pytest.fixture(autouse=True)
def override_current_user(test_user):
    from auth import get_current_user

    app.dependency_overrides = {}
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield
    app.dependency_overrides = {}


@pytest.mark.parametrize(
    "query_suffix",
    [
        "",
        "?date=2025-11-20",
        "?date=undefined",
        "?date=not-a-date",
    ],
)
def test_week_summary_returns_defaults_for_any_input(query_suffix):
    response = client.get(f"/api/days/week-summary{query_suffix}")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 7

    for entry in data:
        assert set(entry.keys()) == {
            "date",
            "total_missions",
            "completed_missions",
            "completion_rate",
            "is_day_perfectly_complete",
        }
        assert entry["total_missions"] >= 0
        assert entry["completed_missions"] >= 0
        assert 0.0 <= entry["completion_rate"] <= 1.0

