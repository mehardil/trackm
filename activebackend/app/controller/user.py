import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from service import user_service,organization_service,login_service
from config import config  
router = APIRouter()

@router.post("/create_user/")
async def create_user(request: Request, user_data: dict):
    """in this function we create a new user if role is admin"""
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token_payload = login_service.decode_token(token.split(" ")[1])
    if token_payload.get("role") != "admin":
        return {"success": False,"message": "User is not admin so unable to create new user"}
    logging.info(f"create_user called by {token_payload.get('username')} with {user_data}")
    print(user_data ,"here is user data")
    required_fields = ['username', 'business_email', 'password', 'department', 'userrole']
    missing_fields = [f for f in required_fields if not user_data.get(f)]
    if missing_fields:
        raise HTTPException(status_code=400, detail=f"Missing fields: {', '.join(missing_fields)}")
    
    email = user_data['business_email']
    if '@' not in email or '.' not in email:
        raise HTTPException(status_code=400, detail="Invalid email format")
    if len(user_data['password']) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    user_data.update(token_payload)
    print(token_payload)
    print(user_data ,"HERE IS USER DATA")
    try:
        result = await user_service.create_user(user_data)
        print(result)
        if not result.get('success', True):
            raise HTTPException(status_code=400, detail=result.get('message', 'User creation failed'))
        return {
            "success": True,
            "message": "User created successfully",
            "user": {
                "id": result['user']['id'],
                "username": result['user']['username'],
                "business_email": result['user']['email'],
                "userrole": result['user']['role'],
                "organization": {
                    "id": result['organization_id']
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"create_user failed: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    


@router.get("/list_user_organization/")
async def create_user(request: Request):
    """in this we show all user inside organiztion"""
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token_payload = login_service.decode_token(token.split(" ")[1])
    org_id = token_payload.get('org_id')
    agent_role = 'false'
    user_list = user_service.get_users_in_organization(org_id,agent_role)
    return user_list



@router.get("/list_agent_organization/")
async def create_user(request: Request):
    """in this we show all user inside organiztion"""
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token_payload = login_service.decode_token(token.split(" ")[1])
    org_id = token_payload.get('org_id')
    agent_role = 'true'
    agent_list = user_service.get_users_in_organization(org_id,agent_role)
    return agent_list




    
    


    




