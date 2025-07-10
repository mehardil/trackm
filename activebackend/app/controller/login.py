

from fastapi import APIRouter, HTTPException, Body
from service import login_service

router = APIRouter()
@router.post("/login/")

def login_activetracker(loginindata:dict):
    name = loginindata['username'] 
    password = loginindata['password']
    if not name or not password:
        raise HTTPException(status_code=400, detail="Name is required")
    return login_service.login(name,password)

