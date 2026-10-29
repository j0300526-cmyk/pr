# Mission catalog routes.
import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import CatalogMission
from schemas import CatalogMissionResponse


router = APIRouter(prefix="/missions", tags=["missions"])


@router.get("/catalog", response_model=list[CatalogMissionResponse])
async def get_catalog(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return the mission catalog stored in the database."""
    missions = db.query(CatalogMission).order_by(CatalogMission.id).all()
    result = []

    for mission in missions:
        try:
            submissions = json.loads(mission.submissions)
        except (TypeError, json.JSONDecodeError):
            submissions = []

        if not isinstance(submissions, list):
            submissions = []

        normalized_submissions = [str(item) for item in submissions]
        result.append(
            CatalogMissionResponse(
                id=mission.id,
                category=mission.category,
                submissions=normalized_submissions,
                name=normalized_submissions[0] if normalized_submissions else mission.category,
            )
        )

    return result
