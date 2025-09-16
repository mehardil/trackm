from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from models import AgentConfig, AgentStatus, Organization, User
from database import get_db
from auth import get_current_user
import json
import os
from datetime import datetime, timedelta

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

@router.get("/organization/{org_id}", response_model=List[dict])
async def get_organization_agents(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all agents for an organization"""
    # Check if user has access to this organization
    if current_user.organization_id != org_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get organization
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Get all agent configs for the organization
    query = select(AgentConfig).where(AgentConfig.organization_id == org_id)
    result = await db.execute(query)
    agent_configs = result.scalars().all()
    
    # Get agent statuses
    status_query = select(AgentStatus).where(AgentStatus.organization_id == org_id)
    status_result = await db.execute(status_query)
    agent_statuses = {status.agent_id: status for status in status_result.scalars().all()}
    
    agents = []
    for config in agent_configs:
        status = agent_statuses.get(config.agent_id)
        agents.append({
            "agent_id": config.agent_id,
            "organization_id": config.organization_id,
            "user_id": config.user_id,
            "machine_info": config.machine_info,
            "created_at": config.created_at,
            "updated_at": config.updated_at,
            "status": {
                "is_running": status.is_running if status else False,
                "is_connected": status.is_connected if status else False,
                "last_activity_time": status.last_activity_time if status else None,
                "cpu_usage": status.cpu_usage if status else 0,
                "memory_usage": status.memory_usage if status else 0,
                "disk_space": status.disk_space if status else 0,
                "version": status.version if status else "Unknown",
                "platform": status.platform if status else "Unknown"
            } if status else None
        })
    
    return agents

@router.get("/organization/{org_id}/download-info")
async def get_agent_download_info(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get agent download information for organization"""
    # Check if user has access to this organization
    if current_user.organization_id != org_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get organization
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Check if agent file exists
    agent_file_path = f"agents/org_{org_id}_agent.exe"
    is_ready = os.path.exists(agent_file_path)
    
    return {
        "organization_id": org_id,
        "organization_name": org.name,
        "agent_ready": is_ready,
        "download_url": f"/api/organizations/{org_id}/agent/download" if is_ready else None,
        "download_filename": f"ActivTrack_{org.name.replace(' ', '_')}_Agent.exe" if is_ready else None,
        "build_status": "ready" if is_ready else "building",
        "estimated_ready_time": "2-3 minutes after registration" if not is_ready else None,
        "installation_instructions": [
            "1. Download the agent installer",
            "2. Run the installer as administrator",
            "3. Follow the installation wizard",
            "4. The agent will start automatically",
            "5. Agent will appear in your organization dashboard"
        ]
    }

@router.post("/organization/{org_id}/rebuild")
async def rebuild_organization_agent(
    org_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rebuild agent for organization"""
    # Check if user has access to this organization
    if current_user.organization_id != org_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get organization
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Trigger rebuild
    background_tasks.add_task(
        rebuild_agent_for_organization,
        organization_id=org_id,
        organization_name=org.name,
        settings=org.settings or {}
    )
    
    return {
        "message": "Agent rebuild started",
        "organization_id": org_id,
        "organization_name": org.name,
        "estimated_completion": "2-3 minutes"
    }

@router.get("/organization/{org_id}/stats")
async def get_organization_agent_stats(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get agent statistics for organization"""
    # Check if user has access to this organization
    if current_user.organization_id != org_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get organization
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Get agent counts
    config_query = select(AgentConfig).where(AgentConfig.organization_id == org_id)
    config_result = await db.execute(config_query)
    total_agents = len(config_result.scalars().all())
    
    # Get active agents (connected in last 5 minutes)
    five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
    active_query = select(AgentStatus).where(
        AgentStatus.organization_id == org_id,
        AgentStatus.last_activity_time >= five_minutes_ago
    )
    active_result = await db.execute(active_query)
    active_agents = len(active_result.scalars().all())
    
    # Get platform distribution
    platform_query = select(AgentStatus.platform).where(AgentStatus.organization_id == org_id)
    platform_result = await db.execute(platform_query)
    platforms = [row[0] for row in platform_result.fetchall() if row[0]]
    platform_distribution = {}
    for platform in platforms:
        platform_distribution[platform] = platform_distribution.get(platform, 0) + 1
    
    return {
        "organization_id": org_id,
        "organization_name": org.name,
        "total_agents": total_agents,
        "active_agents": active_agents,
        "inactive_agents": total_agents - active_agents,
        "platform_distribution": platform_distribution,
        "last_updated": datetime.utcnow()
    }

@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an agent"""
    # Get agent config
    agent_config = await db.get(AgentConfig, agent_id)
    if not agent_config:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Check if user has access to this agent's organization
    if current_user.organization_id != agent_config.organization_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete agent status
    status_query = select(AgentStatus).where(AgentStatus.agent_id == agent_id)
    status_result = await db.execute(status_query)
    agent_status = status_result.scalar_one_or_none()
    if agent_status:
        await db.delete(agent_status)
    
    # Delete agent config
    await db.delete(agent_config)
    await db.commit()
    
    return {"message": "Agent deleted successfully"}

async def rebuild_agent_for_organization(
    organization_id: int,
    organization_name: str,
    settings: dict
):
    """Background task to rebuild agent for organization"""
    try:
        print(f"Rebuilding agent for organization {organization_id}: {organization_name}")
        
        # Import the build function from organizations router
        from routers.organizations import build_organization_agent
        
        # Extract organization identifier from settings
        org_identifier = settings.get('org_identifier', f'ORG{organization_id}')
        
        # Call the build function
        await build_organization_agent(
            organization_id=organization_id,
            organization_name=organization_name,
            org_identifier=org_identifier,
            settings=settings
        )
        
        print(f"Agent rebuild completed for organization {organization_id}")
        
    except Exception as e:
        print(f"Error rebuilding agent for organization {organization_id}: {str(e)}") 