from fastapi import APIRouter, HTTPException, Body
from service import login_service
import logging

router = APIRouter()

@router.post("/login/")
async def login_activetracker(loginindata: dict):
    logging.info(f"Called login_activetracker with loginindata={loginindata}")
    email = loginindata.get('username')
    password = loginindata.get('password')
    print(loginindata)
    if not email or not password:
        logging.error("email and password are required for login")
        return {"success": False, "message": "email or password must required"}
    try:
        result = await login_service.login(email, password)
        if result.get('success'):
            logging.info("login_activetracker succeeded")
            return result
        else:
            logging.warning(f"login_activetracker failed: {result.get('message')}")
            raise HTTPException(status_code=401, detail=result.get('message', 'Login failed'))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"login_activetracker failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    







    

@router.get("/check-username/{username}")
async def check_username_availability(username: str, exclude_org_id: int = None):
    """Check if username exists in other organizations"""
    try:
        result = login_service.check_username_availability(username, exclude_org_id)
        return result
    except Exception as e:
        logging.error(f"Username check failed: {e}")
        raise HTTPException(status_code=500, detail="Error checking username availability")


        

@router.get("/user-info/{user_id}")
async def get_user_info(user_id: int):
    """Get user login information and history"""
    try:
        result = login_service.get_user_login_info(user_id)
        if result.get('success'):
            return result
        else:
            raise HTTPException(status_code=404, detail=result.get('message', 'User not found'))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Get user info failed: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving user information")

@router.get("/search-user/{search_value}")
async def search_user(search_value: str, field: str = "name"):
    """Search for user by name, username, or email"""
    try:
        if field not in ["name", "username", "email"]:
            raise HTTPException(status_code=400, detail="Field must be name, username, or email")
        
        result = login_service.search_user_by_field(search_value, field)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"User search failed: {e}")
        raise HTTPException(status_code=500, detail="Error searching for user")

@router.get("/organization-users/{org_id}")
async def get_organization_users(org_id: int):
    """Get all users in a specific organization"""
    try:
        result = login_service.get_users_in_organization(org_id)
        return result
    except Exception as e:
        logging.error(f"Get organization users failed: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving organization users")

@router.post("/get-user-details")
async def get_user_details_from_token_endpoint(token_data: dict):
    """Get complete user details from JWT token"""
    try:
        token = token_data.get('token')
        if not token:
            raise HTTPException(status_code=400, detail="Token is required")
        
        result = login_service.get_user_details_from_token(token)
        if result.get('success'):
            return result
        else:
            raise HTTPException(status_code=401, detail=result.get('message', 'Failed to get user details'))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Get user details failed: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving user details")
