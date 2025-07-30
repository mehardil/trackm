from fastapi import APIRouter, HTTPException, Body
from service import login_service
import logging

router = APIRouter()

@router.post("/login/")
async def login_activetracker(loginindata:dict):
    logging.info(f"Called login_activetracker with loginindata={loginindata}")
    name = loginindata['username'] 
    password = loginindata['password']
    if not name or not password:
        logging.error("Name is required for login_activetracker")
        raise HTTPException(status_code=400, detail="Name is required")
    try:
        result = await login_service.login(name,password)
        logging.info("login_activetracker succeeded")
        return result
    except Exception as e:
        logging.error(f"login_activetracker failed: {e}")
        raise

