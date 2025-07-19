from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from models import Organization, User
from database import get_db
from schemas import UserRead
from auth import get_current_user

router = APIRouter(prefix="/organizations", tags=["organizations"])

@router.get("/", response_model=List[dict])
async def list_organizations(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    query = select(Organization)
    if search:
        query = query.where(Organization.name.ilike(f"%{search}%"))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    orgs = result.scalars().all()
    return [
        {
            "id": org.id,
            "name": org.name,
            "description": org.description,
            "contact_email": org.contact_email,
            "contact_phone": org.contact_phone,
            "created_at": org.created_at,
            "is_active": org.is_active,
        }
        for org in orgs
    ]

@router.post("/", response_model=dict)
async def create_organization(
    org: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    db_org = Organization(**org)
    db.add(db_org)
    await db.commit()
    await db.refresh(db_org)
    return {"id": db_org.id, "name": db_org.name}

@router.get("/{org_id}", response_model=dict)
async def get_organization(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return {"id": org.id, "name": org.name, "description": org.description}

@router.put("/{org_id}", response_model=dict)
async def update_organization(
    org_id: int,
    org_update: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    for k, v in org_update.items():
        setattr(org, k, v)
    await db.commit()
    await db.refresh(org)
    return {"id": org.id, "name": org.name}

@router.delete("/{org_id}", status_code=204)
async def delete_organization(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    await db.delete(org)
    await db.commit()
    return None 