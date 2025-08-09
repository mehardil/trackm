import logging
from fastapi import APIRouter, HTTPException, Body,Query
from typing import Optional
from service import team_service


router = APIRouter()

@router.get("/create_team")
async def get_team_activities(userdata: dict):
    """create new team"""
    org_id = userdata.get('user_id')
    otp = userdata.get('organization_id')
    logging.info(f"get ")
    try:
        activities = "check here why we used activitives"
        if not activities:
            logging.error("Not authorized to view activities or team not found")
            raise HTTPException(status_code=403, detail="Not authorized to view activities or team not found")
        logging.info("get_team_activities succeeded")
        return activities
    except Exception as e:
        logging.error(f"get_team_activities failed: {e}")
        raise











# @router.get("/teams/{team_id}/activities")
# async def get_team_activities(team_id: int):
#     """get team by team id"""
#     logging.info(f"Called get_team_activities with team_id={team_id}")
#     try:
#         activities = await team_service.get_activities_of_team(team_id)
#         if not activities:
#             logging.error("Not authorized to view activities or team not found")
#             raise HTTPException(status_code=403, detail="Not authorized to view activities or team not found")
#         logging.info("get_team_activities succeeded")
#         return activities
#     except Exception as e:
#         logging.error(f"get_team_activities failed: {e}")
#         raise







