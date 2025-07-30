from fastapi import APIRouter, Query
from service import organization_service
from typing import Optional
from service import filter_service
from fastapi import HTTPException
import logging


router = APIRouter()

@router.get("/filter/api/activities")
async def get_user(
    organization_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    team_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    start_time: Optional[str] = Query(None),
    end_time: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    logging.info(f"Called get_user with filters: user_id={user_id}, team_id={team_id}, start_date={start_date}, start_time={start_time}, end_time={end_time}, end_date={end_date}")
    filters = {
        "organization_id": organization_id,
        "user_id": user_id,
        "team_id": team_id,
        "start_date": start_date,
        "start_time": start_time,
        "end_time": end_time,
        "end_date": end_date,
    }
    if filters["organization_id"] is not None:
        organization = await organization_service.get_organization_by_id(filters["organization_id"])
        if not organization:
            logging.error("Organization not found")
            raise HTTPException(status_code=404, detail="Organization not found") 
    filters = {k: v for k, v in filters.items() if v is not None}
    try:
        result = await filter_service.filter_activites_logs(filters)
        logging.info("get_user (filter activities) succeeded")
        return result
    except Exception as e:
        logging.error(f"get_user (filter activities) failed: {e}")
        raise
