from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from models import AgentConfig, AgentStatus, User
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/agents", tags=["agents"])

@router.post("/register", response_model=dict)
async def register_agent(
    agent: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    agent_id = agent.get("agent_id")
    if not agent_id or agent_id == 0:
        agent_id = None
    result = await db.execute(select(AgentConfig).where(AgentConfig.organization_id == current_user.organization_id, AgentConfig.agent_id == agent_id) if agent_id else select(AgentConfig).where(AgentConfig.organization_id == current_user.organization_id))
    existing = result.scalars().first() if agent_id else None
    if existing:
        return {"agent_id": existing.agent_id, "message": "Agent already registered"}
    db_agent = AgentConfig(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        machine_info=agent.get("machine_info"),
    )
    db.add(db_agent)
    await db.commit()
    await db.refresh(db_agent)
    return {"agent_id": db_agent.agent_id}

@router.put("/{agent_id}/config", response_model=dict)
async def update_agent_config(
    agent_id: int,
    config: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AgentConfig).where(AgentConfig.organization_id == current_user.organization_id, AgentConfig.agent_id == agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    for k, v in config.items():
        setattr(agent, k, v)
    await db.commit()
    await db.refresh(agent)
    return {"agent_id": agent.agent_id}

@router.put("/{agent_id}/status", response_model=dict)
async def update_agent_status(
    agent_id: int,
    status_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AgentConfig).where(AgentConfig.organization_id == current_user.organization_id, AgentConfig.agent_id == agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    db_status = AgentStatus(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        agent_id=agent_id,
        **status_data
    )
    db.add(db_status)
    await db.commit()
    await db.refresh(db_status)
    return {"id": db_status.id, "agent_id": db_status.agent_id}

@router.get("/", response_model=List[dict])
async def list_agents(
    skip: int = 0,
    limit: int = 20,
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(AgentConfig).where(AgentConfig.organization_id == current_user.organization_id)
    if user_id:
        query = query.where(AgentConfig.user_id == user_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    agents = result.scalars().all()
    return [
        {
            "agent_id": agent.agent_id,
            "user_id": agent.user_id,
            "machine_info": agent.machine_info,
            "created_at": agent.created_at,
            "updated_at": agent.updated_at,
        }
        for agent in agents
    ]

@router.get("/{agent_id}", response_model=dict)
async def get_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AgentConfig).where(AgentConfig.organization_id == current_user.organization_id, AgentConfig.agent_id == agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {
        "agent_id": agent.agent_id,
        "user_id": agent.user_id,
        "machine_info": agent.machine_info,
        "created_at": agent.created_at,
        "updated_at": agent.updated_at,
    }

@router.delete("/{agent_id}", status_code=204)
async def delete_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AgentConfig).where(AgentConfig.organization_id == current_user.organization_id, AgentConfig.agent_id == agent_id))
    agent = result.scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    await db.delete(agent)
    await db.commit()
    return None 