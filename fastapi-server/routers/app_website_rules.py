from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from models import AppWebsiteRule, User
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/rules", tags=["app_website_rules"])

@router.post("/", response_model=dict)
async def create_rule(
    rule: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    db_rule = AppWebsiteRule(
        organization_id=current_user.organization_id,
        type=rule["type"],
        pattern=rule["pattern"],
        category=rule.get("category", "uncategorized"),
        description=rule.get("description"),
    )
    db.add(db_rule)
    await db.commit()
    await db.refresh(db_rule)
    return {"id": db_rule.id}

@router.get("/", response_model=List[dict])
async def list_rules(
    skip: int = 0,
    limit: int = 20,
    type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    pattern: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(AppWebsiteRule).where(AppWebsiteRule.organization_id == current_user.organization_id)
    if type:
        query = query.where(AppWebsiteRule.type == type)
    if category:
        query = query.where(AppWebsiteRule.category == category)
    if pattern:
        query = query.where(AppWebsiteRule.pattern.ilike(f"%{pattern}%"))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    rules = result.scalars().all()
    return [
        {
            "id": r.id,
            "type": r.type,
            "pattern": r.pattern,
            "category": r.category,
            "description": r.description,
        }
        for r in rules
    ]

@router.get("/{rule_id}", response_model=dict)
async def get_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rule = await db.get(AppWebsiteRule, rule_id)
    if not rule or rule.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {
        "id": rule.id,
        "type": rule.type,
        "pattern": rule.pattern,
        "category": rule.category,
        "description": rule.description,
    }

@router.put("/{rule_id}", response_model=dict)
async def update_rule(
    rule_id: int,
    rule_update: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rule = await db.get(AppWebsiteRule, rule_id)
    if not rule or rule.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Rule not found")
    for k, v in rule_update.items():
        setattr(rule, k, v)
    await db.commit()
    await db.refresh(rule)
    return {
        "id": rule.id,
        "type": rule.type,
        "pattern": rule.pattern,
        "category": rule.category,
        "description": rule.description,
    }

@router.delete("/{rule_id}", status_code=204)
async def delete_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rule = await db.get(AppWebsiteRule, rule_id)
    if not rule or rule.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Rule not found")
    await db.delete(rule)
    await db.commit()
    return None 