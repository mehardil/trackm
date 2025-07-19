from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from models import Screenshot, User
from database import get_db
from auth import get_current_user
import base64

router = APIRouter(prefix="/screenshots", tags=["screenshots"])

@router.post("/upload", response_model=dict)
async def upload_screenshot(
    user_id: int = Form(...),
    agent_id: int = Form(...),
    group_id: Optional[int] = Form(None),
    timestamp: str = Form(...),
    application: Optional[str] = Form(None),
    website: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Only allow upload for users/agents in the same org
    if user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")
    image_data = base64.b64encode(await image.read()).decode()
    db_screenshot = Screenshot(
        organization_id=current_user.organization_id,
        user_id=user_id,
        group_id=group_id,
        agent_id=agent_id,
        timestamp=timestamp,
        image_data=image_data,
        application=application,
        website=website,
        title=title,
    )
    db.add(db_screenshot)
    await db.commit()
    await db.refresh(db_screenshot)
    return {"id": db_screenshot.id}

@router.get("/", response_model=List[dict])
async def list_screenshots(
    skip: int = 0,
    limit: int = 20,
    user_id: Optional[int] = None,
    agent_id: Optional[int] = None,
    group_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Screenshot).where(Screenshot.organization_id == current_user.organization_id)
    if user_id is not None:
        query = query.where(Screenshot.user_id == user_id)
    if agent_id is not None:
        query = query.where(Screenshot.agent_id == agent_id)
    if group_id is not None:
        query = query.where(Screenshot.group_id == group_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    screenshots = result.scalars().all()
    return [
        {
            "id": s.id,
            "user_id": s.user_id,
            "group_id": s.group_id,
            "agent_id": s.agent_id,
            "timestamp": s.timestamp,
            "application": s.application,
            "website": s.website,
            "title": s.title,
        }
        for s in screenshots
    ]

@router.get("/{screenshot_id}", response_model=dict)
async def get_screenshot(
    screenshot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    screenshot = await db.get(Screenshot, screenshot_id)
    if not screenshot or screenshot.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    return {
        "id": screenshot.id,
        "user_id": screenshot.user_id,
        "group_id": screenshot.group_id,
        "agent_id": screenshot.agent_id,
        "timestamp": screenshot.timestamp,
        "application": screenshot.application,
        "website": screenshot.website,
        "title": screenshot.title,
        "image_data": screenshot.image_data,
    }

@router.delete("/{screenshot_id}", status_code=204)
async def delete_screenshot(
    screenshot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    screenshot = await db.get(Screenshot, screenshot_id)
    if not screenshot or screenshot.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    await db.delete(screenshot)
    await db.commit()
    return None 