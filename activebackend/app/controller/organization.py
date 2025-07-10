from fastapi import APIRouter, HTTPException, Body
from service import organization_service

router = APIRouter()
@router.post("/organizations/")
def create_organization(payload: dict = Body(...)):
    name = payload.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    return organization_service.create_organization(name=name)


@router.get("/organizations/")
def get_organizations():
    return organization_service.get_all_organizations()



@router.get("/organizations/{organization_id}")
def get_organization(organization_id: int):
    org = organization_service.get_organization_by_id(organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.put("/organizations/{organization_id}")
def update_organization(organization_id: int, payload: dict = Body(...)):
    name = payload.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    updated = organization_service.update_organization(organization_id, name=name)
    if not updated:
        raise HTTPException(status_code=404, detail="Organization not found")
    return updated
