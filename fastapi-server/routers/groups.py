from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from models import Group, UserGroup, User
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/groups", tags=["groups"])

@router.post("/", response_model=dict)
async def create_group(
    group: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    db_group = Group(
        organization_id=current_user.organization_id,
        name=group["name"],
        description=group.get("description"),
    )
    db.add(db_group)
    await db.commit()
    await db.refresh(db_group)
    return {"id": db_group.id, "name": db_group.name}

@router.get("/", response_model=List[dict])
async def list_groups(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Group).where(Group.organization_id == current_user.organization_id)
    if search:
        query = query.where(Group.name.ilike(f"%{search}%"))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    groups = result.scalars().all()
    return [
        {"id": g.id, "name": g.name, "description": g.description}
        for g in groups
    ]

@router.get("/{group_id}", response_model=dict)
async def get_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    group = await db.get(Group, group_id)
    if not group or group.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"id": group.id, "name": group.name, "description": group.description}

@router.put("/{group_id}", response_model=dict)
async def update_group(
    group_id: int,
    group_update: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    group = await db.get(Group, group_id)
    if not group or group.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Group not found")
    for k, v in group_update.items():
        setattr(group, k, v)
    await db.commit()
    await db.refresh(group)
    return {"id": group.id, "name": group.name}

@router.delete("/{group_id}", status_code=204)
async def delete_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    group = await db.get(Group, group_id)
    if not group or group.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Group not found")
    await db.delete(group)
    await db.commit()
    return None

@router.post("/{group_id}/add_user", response_model=dict)
async def add_user_to_group(
    group_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    group = await db.get(Group, group_id)
    if not group or group.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Group not found")
    user = await db.get(User, user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="User not found")
    result = await db.execute(select(UserGroup).where(UserGroup.user_id == user_id, UserGroup.group_id == group_id))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=409, detail="User already in group")
    user_group = UserGroup(
        user_id=user_id,
        group_id=group_id,
        organization_id=current_user.organization_id,
    )
    db.add(user_group)
    await db.commit()
    await db.refresh(user_group)
    return {"user_id": user_id, "group_id": group_id}

@router.post("/{group_id}/remove_user", response_model=dict)
async def remove_user_from_group(
    group_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UserGroup).where(UserGroup.user_id == user_id, UserGroup.group_id == group_id, UserGroup.organization_id == current_user.organization_id))
    user_group = result.scalars().first()
    if not user_group:
        raise HTTPException(status_code=404, detail="User not in group")
    await db.delete(user_group)
    await db.commit()
    return {"user_id": user_id, "group_id": group_id}

@router.get("/{group_id}/members", response_model=List[dict])
async def list_group_members(
    group_id: int,
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    group = await db.get(Group, group_id)
    if not group or group.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Group not found")
    result = await db.execute(
        select(UserGroup).where(UserGroup.group_id == group_id, UserGroup.organization_id == current_user.organization_id).offset(skip).limit(limit)
    )
    user_groups = result.scalars().all()
    user_ids = [ug.user_id for ug in user_groups]
    if not user_ids:
        return []
    result = await db.execute(select(User).where(User.id.in_(user_ids)))
    users = result.scalars().all()
    return [
        {"id": u.id, "username": u.username, "name": u.name, "email": u.email, "role": u.role}
        for u in users
    ] 