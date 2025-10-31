# routes/filter_router.py
from fastapi import APIRouter
from fastapi import Request,HTTPException
import logging
from service import login_service,user_service
from service import categories_service

router = APIRouter()


@router.get("/web_categories_list")
async def get_categories(request: Request, categories_data: dict):
    logging.info("asign website to categories")
    token = request.headers.get("Authorization")
    print(token, "here is token")
    if not token:
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    try:
        token_payload = login_service.decode_token(token.split(" ")[1])
        organization_id = token_payload.get("org_id")
        user_id = token_payload.get("user_id")
        role = user_service.user_role_check(user_id)
        if not organization_id:
            raise HTTPException(status_code=400, detail="Invalid token payload")
        if not role or role.lower() not in {"admin", "editor"}:
            raise HTTPException(status_code=403, detail="User is not allowed to remove agent from teams")
        website_url = categories_data.get("website_url")
        categories = categories_data.get("categories")
        if not website_url:
            raise HTTPException(status_code=400, detail="website_url is required")
        if not categories:
            raise HTTPException(status_code=400, detail="categories is required")
        result = categories_service.asign_website_to_categories(website_url, categories, organization_id)
        if result is not None and result.get("success"):
            result.update({"org id": organization_id, "userid": user_id, "role": role, "organization_id": organization_id   })
        return result
    except Exception as e:
        logging.error(f"asign_website_to_categories failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/update_categories")
async def update_web_categories(request: Request, categories_data: dict):
    logging.info("update web categories")
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    try:
        token_payload = login_service.decode_token(token.split(" ")[1])
        organization_id = token_payload.get("org_id")     
        user_id = token_payload.get("user_id")
        role = user_service.user_role_check(user_id)
        if not organization_id:
            raise HTTPException(status_code=400, detail="Invalid token payload")
        if not role or role.lower() not in {"admin", "editor"}:
            raise HTTPException(status_code=403, detail="User is not allowed to remove agent from teams")
        website_url = categories_data.get("website_url")
        categories = categories_data.get("categories")

        if not website_url or not categories:
            raise HTTPException(status_code=400, detail="website_url and categories are required")
        result = categories_service.update_web_categories(website_url, categories, organization_id)
        if result is not None and result.get("success"):
            result.update({"org id": organization_id, "userid": user_id, "role": role, "organization_id": organization_id   })
        return result
    except Exception as e:
        logging.error(f"update_web_categories failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))