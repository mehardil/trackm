import logging
from fastapi import APIRouter, HTTPException, Query
from service import user_service

router = APIRouter()

@router.get("/user/")
async def get_user(filter_type: str = Query("user")):
    logging.info(f"Called get_user with filter_type={filter_type}")
    try:
        result = await user_service.get_all_user(filter_type)
        logging.info("get_user succeeded")
        return result
    except Exception as e:
        logging.error(f"get_user failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
