from fastapi import APIRouter, HTTPException, Body,Query
from typing import Optional
from service import team_service


router = APIRouter()


# @router.post("/teams/")
# def create_team(payload: dict = Body(...)):
#     name = payload.get("name")
#     owner_id = payload.get("owner_id")
#     organization_id = payload.get("organization_id")

#     if not name or not owner_id or not organization_id:
#         raise HTTPException(status_code=400, detail="name, owner_id, and organization_id are required")

#     return team_service.create_team(name=name, owner_id=owner_id, organization_id=organization_id)


# # Get a team by ID
# @router.get("/teams/{team_id}")
# def get_team(team_id: int):
#     team = team_service.get_team_by_id(team_id)
#     if not team:
#         raise HTTPException(status_code=404, detail="Team not found")
#     return team


# # Get all teams
# @router.get("/teams/")
# def get_all_teams():
#     return team_service.get_all_teams()


# Get activities for a team (only for the team owner)
@router.get("/teams/{team_id}/activities")
def get_team_activities(team_id: int):
    activities = team_service.get_activities_of_team(team_id)
    if not activities:
        raise HTTPException(status_code=403, detail="Not authorized to view activities or team not found")
    return activities



# @router.get("/teams/{team_id}/activities")
# def get_team_activities(
#     team_id: int,
#     date: Optional[str] = Query(None),
#     start_time: Optional[str] = Query(None),
#     end_time: Optional[str] = Query(None),
#     duration: Optional[str] = Query(None),
#     report_type: Optional[str] = Query("Total")
#     ):
#     print("afjhbfhjsbfshjsfbfhjjbvfshjdbdvhjabdfvhjevfhjerfe db")
#     activities = team_service.get_activities_of_team_filter(team_id,date=date,start_time=start_time,end_time=end_time,duration=duration,report_type=report_type,)
#     if not activities:
#         raise HTTPException(status_code=404, detail="No activities found for this team")
#     return activities






# # Update team information
# @router.put("/teams/{team_id}")
# def update_team(team_id: int, payload: dict = Body(...)):
#     name = payload.get("name")
#     organization_id = payload.get("organization_id")

#     if not name or not organization_id:
#         raise HTTPException(status_code=400, detail="name and organization_id are required")

#     updated_team = team_service.update_team(team_id=team_id, name=name, organization_id=organization_id)
#     if not updated_team:
#         raise HTTPException(status_code=404, detail="Team not found")
#     return updated_team


# # Delete a team
# @router.delete("/teams/{team_id}")
# def delete_team(team_id: int):
#     deleted_team = team_service.delete_team(team_id)
#     if not deleted_team:
#         raise HTTPException(status_code=404, detail="Team not found")
#     return {"detail": f"Team {team_id} deleted successfully."}


# # Add user to a team
# @router.post("/teams/{team_id}/add_user")
# def add_user_to_team(team_id: int, payload: dict = Body(...)):
#     user_id = payload.get("user_id")
#     if not user_id:
#         raise HTTPException(status_code=400, detail="user_id is required")

#     result = team_service.add_user_to_team(team_id, user_id)
#     if not result:
#         raise HTTPException(status_code=404, detail="Team not found or user already in the team")
#     return {"detail": f"User {user_id} added to team {team_id}"}


# # Remove user from a team
# @router.post("/teams/{team_id}/remove_user")
# def remove_user_from_team(team_id: int, payload: dict = Body(...)):
#     user_id = payload.get("user_id")
#     if not user_id:
#         raise HTTPException(status_code=400, detail="user_id is required")

#     result = team_service.remove_user_from_team(team_id, user_id)
#     if not result:
#         raise HTTPException(status_code=404, detail="Team not found or user not in the team")
#     return {"detail": f"User {user_id} removed from team {team_id}"}
