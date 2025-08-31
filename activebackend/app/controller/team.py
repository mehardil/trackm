import logging
from tokenize import group
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional
from service import team_service,login_service


router = APIRouter()

@router.post("/create_team")
async def create_team(request: Request, team_data: dict):
    """create new team"""
    token = request.headers.get("Authorization")
    print(token ,"here is token")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token_payload = login_service.decode_token(token.split(" ")[1])
    print(team_data)
    print("--------------------------")
    print(token_payload)
    group_input_details = {**team_data, **token_payload}
    print(group_input_details)
 
    try:
        team = team_service.create_team(group_input_details)
        if not team:
            logging.error("Not authorized to view activities or team not found")
            raise HTTPException(status_code=403, detail="Not authorized to view activities or team not found")
        logging.info("get_team_activities succeeded")
        print(team, "here is team value")
        return team
    except Exception as e:
        logging.error(f"get_team_activities failed: {e}")
        raise





@router.get("/list_teams")
async def list_of_teams(request: Request):
    """list of all teams"""
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token_payload = login_service.decode_token(token.split(" ")[1])
    print(token_payload)
    list_of_team = team_service.get_all_teams(token_payload)
    return list_of_team
 








@router.post("/assign_teams")
async def assign_users_to_team_endpoint(request: Request, payload: dict):
    """Assign users to a team by their email addresses"""
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    try:
        token_payload = login_service.decode_token(token.split(" ")[1])
        user_id = token_payload.get("user_id")
        organization_id = token_payload.get("org_id")
        
        if not user_id or not organization_id:
            raise HTTPException(status_code=400, detail="Invalid token payload")
        
        team_id = payload.get("team_id")
        user_emails = payload.get("user_emails", [])
        
        if not team_id:
            raise HTTPException(status_code=400, detail="team_id is required")
        
        if not user_emails or not isinstance(user_emails, list):
            raise HTTPException(status_code=400, detail="user_emails must be a non-empty list")
        
        # Call the service function
        result = team_service.assign_users_to_team(team_id, user_emails, organization_id)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("message", "Failed to assign users to team"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"assign_users_to_team failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")








@router.get("/team_members/{team_id}")
async def get_team_members_endpoint(request: Request, team_id: int):
    """Get all users assigned to a specific team"""
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    try:
        token_payload = login_service.decode_token(token.split(" ")[1])
        organization_id = token_payload.get("org_id")
        
        if not organization_id:
            raise HTTPException(status_code=400, detail="Invalid token payload")
        
        # Call the service function
        print(team_id ,organization_id,"here is team id and organization id")
        result = team_service.get_team_members(team_id, organization_id)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("message", "Failed to get team members"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"get_team_members failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")








@router.delete("/remove_user")
async def remove_users_from_team_endpoint(request: Request, payload: dict):
    """Remove users from a team by their email addresses"""
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    print(payload,"here is payload")
    print(token,"here is token")
    try:
        token_payload = login_service.decode_token(token.split(" ")[1])
        organization_id = token_payload.get("org_id")  # Fixed: use org_id instead of organization_id
        
        if not organization_id:
            raise HTTPException(status_code=400, detail="Invalid token payload")
        
        team_id = payload.get("team_id")
        user_emails = payload.get("user_emails", [])
        
        if not team_id:
            raise HTTPException(status_code=400, detail="team_id is required")
        
        if not user_emails or not isinstance(user_emails, list):
            raise HTTPException(status_code=400, detail="user_emails must be a non-empty list")
        
        # Call the service function
        result = team_service.remove_users_from_team(team_id, user_emails, organization_id)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("message", "Failed to remove users from team"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"remove_users_from_team failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")








@router.get("/teams_with_members")
async def get_teams_with_members_endpoint(request: Request):
    """Get all teams with their member counts for the organization"""
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    try:
        token_payload = login_service.decode_token(token.split(" ")[1])
        organization_id = token_payload.get("org_id")
        
        if not organization_id:
            raise HTTPException(status_code=400, detail="Invalid token payload")
        
        # Call the service function
        result = team_service.get_teams_with_member_counts(organization_id)
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("message", "Failed to get teams with member counts"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"get_teams_with_members failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")







