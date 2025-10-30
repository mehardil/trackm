# routes/filter_router.py
from fastapi import APIRouter, Query
from service import organization_service, filter_service
from typing import Optional
from fastapi import HTTPException
import logging

router = APIRouter()

@router.get("/activities_logs")
async def get_user(
    organization_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    team_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    start_time: Optional[str] = Query(None),
    end_time: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
):
    logging.info(f"Called get_user with filters: user_id={user_id}, team_id={team_id}, start_date={start_date}, end_date={end_date}, limit={limit}, offset={offset}")
    
    filters = {
        "organization_id": organization_id,
        "user_id": user_id,
        "team_id": team_id,
        "start_date": start_date,
        "end_date": end_date,
        "limit": limit,
        "offset": offset,
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
        raise HTTPException(status_code=500, detail=str(e))
