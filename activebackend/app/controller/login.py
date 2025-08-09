from fastapi import APIRouter, HTTPException, Body
from service import login_service
import logging

router = APIRouter()

@router.post("/login/")
async def login_activetracker(loginindata: dict):
    logging.info(f"Called login_activetracker with loginindata={loginindata}")
    username = loginindata.get('username')
    password = loginindata.get('password')
    if not username or not password:
        logging.error("Username and password are required for login")
        raise HTTPException(status_code=400, detail="Username and password are required")
    try:
        result = await login_service.login(username, password)
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
