import logging
from fastapi import APIRouter
from service import signup_service
router = APIRouter()

@router.post("/signup/")
async def signup(signupdata:dict):
    logging.info(f"Called signup with signupdata={signupdata}")
    try:
        result = signup_service.create_organization(signupdata)
        logging.info("signup succeeded")
        return result
    except Exception as e:
        logging.error(f"signup failed: {e}")
        raise
