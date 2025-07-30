from fastapi import APIRouter, HTTPException, Body
from service import organization_service
import logging

router = APIRouter()

@router.get("/organizations/{organization_id}")
async def get_organization(organization_id: int):
    logging.info(f"Called get_organization with organization_id={organization_id}")
    org = await organization_service.get_organization_by_id(organization_id)
    if not org:
        logging.error("Organization not found")
        raise HTTPException(status_code=404, detail="Organization not found")
    logging.info("get_organization succeeded")
    return org


