from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from models import Organization, User
from database import get_db
from schemas import UserRead
from auth import get_current_user
import uuid
import os
import json
from datetime import datetime
import subprocess
import asyncio
import sys

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

@router.post("/register", response_model=dict)
async def register_organization_public(
    org_data: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint for organization registration
    Creates organization and triggers agent build process
    """
    try:
        # Validate required fields
        required_fields = ['name', 'contact_email', 'contact_phone']
        for field in required_fields:
            if not org_data.get(field):
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        # Generate unique organization identifier
        org_identifier = str(uuid.uuid4())[:8].upper()

        # Create organization record
        db_org = Organization(
            name=org_data['name'],
            description=org_data.get('description', ''),
            contact_email=org_data['contact_email'],
            contact_phone=org_data['contact_phone'],
            created_at=datetime.utcnow(),
            settings={
                'org_identifier': org_identifier,
                'agent_settings': {
                    'screenshot_interval': 300,  # 5 minutes
                    'activity_tracking': True,
                    'idle_threshold': 300,
                    'restricted_apps': [],
                    'custom_branding': {
                        'organization_name': org_data['name'],
                        'primary_color': '#4CAF50',
                        'logo_url': org_data.get('logo_url', '')
                    }
                }
            },
            is_active=True
        )

        db.add(db_org)
        await db.commit()
        await db.refresh(db_org)

        # Trigger background task to build organization-specific agent
        background_tasks.add_task(
            build_organization_agent,
            organization_id=db_org.id,
            organization_name=db_org.name,
            org_identifier=org_identifier,
            settings=db_org.settings
        )

        return {
            "success": True,
            "organization_id": db_org.id,
            "organization_name": db_org.name,
            "org_identifier": org_identifier,
            "message": "Organization registered successfully. Agent installer will be ready shortly.",
            "download_url": f"/api/organizations/{db_org.id}/agent/download"
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.get("/{org_id}/agent/download")
async def download_organization_agent(
    org_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Download organization-specific agent installer
    """
    # Get organization
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Check if agent file exists
    agent_file_path = f"agents/org_{org_id}_agent.exe"
    if not os.path.exists(agent_file_path):
        raise HTTPException(
            status_code=404,
            detail="Agent installer not ready yet. Please try again in a few minutes."
        )

    # Return file for download
    from fastapi.responses import FileResponse
    return FileResponse(
        agent_file_path,
        media_type='application/octet-stream',
        filename=f"ActivTrack_{org.name.replace(' ', '_')}_Agent.exe"
    )

@router.get("/{org_id}/agent/status")
async def get_agent_build_status(
    org_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Check agent build status for organization
    """
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    agent_file_path = f"agents/org_{org_id}_agent.exe"
    is_ready = os.path.exists(agent_file_path)

    return {
        "organization_id": org_id,
        "organization_name": org.name,
        "agent_ready": is_ready,
        "download_url": f"/api/organizations/{org_id}/agent/download" if is_ready else None,
        "estimated_ready_time": "2-3 minutes after registration" if not is_ready else None
    }

@router.get("/{org_id}/dashboard")
async def get_organization_dashboard(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get comprehensive organization dashboard data
    """
    # Check if user has access to this organization
    if current_user.organization_id != org_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get organization
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Get agent statistics
    from routers.agents import get_organization_agent_stats
    agent_stats = await get_organization_agent_stats(org_id, current_user, db)
    
    # Get agent download info
    from routers.agents import get_agent_download_info
    download_info = await get_agent_download_info(org_id, current_user, db)
    
    # Get recent agents
    from routers.agents import get_organization_agents
    agents = await get_organization_agents(org_id, current_user, db)
    recent_agents = agents[:5]  # Last 5 agents
    
    # Get user count
    user_query = select(User).where(User.organization_id == org_id)
    user_result = await db.execute(user_query)
    user_count = len(user_result.scalars().all())
    
    return {
        "organization": {
            "id": org.id,
            "name": org.name,
            "description": org.description,
            "contact_email": org.contact_email,
            "contact_phone": org.contact_phone,
            "created_at": org.created_at,
            "is_active": org.is_active,
            "settings": org.settings
        },
        "agent_management": {
            "stats": agent_stats,
            "download_info": download_info,
            "recent_agents": recent_agents,
            "total_agents": len(agents)
        },
        "users": {
            "total_users": user_count
        },
        "quick_actions": [
            {
                "action": "download_agent",
                "label": "Download Agent Installer",
                "url": f"/api/organizations/{org_id}/agent/download",
                "enabled": download_info["agent_ready"]
            },
            {
                "action": "rebuild_agent",
                "label": "Rebuild Agent",
                "url": f"/api/agents/organization/{org_id}/rebuild",
                "enabled": True
            },
            {
                "action": "view_agents",
                "label": "View All Agents",
                "url": f"/api/agents/organization/{org_id}",
                "enabled": True
            }
        ]
    }

@router.put("/{org_id}/agent-settings")
async def update_organization_agent_settings(
    org_id: int,
    agent_settings: dict,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update organization agent settings and trigger rebuild
    """
    # Check if user has access to this organization
    if current_user.organization_id != org_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get organization
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Update settings
    if not org.settings:
        org.settings = {}
    
    org.settings['agent_settings'] = agent_settings
    await db.commit()
    await db.refresh(org)
    
    # Trigger agent rebuild with new settings
    background_tasks.add_task(
        build_organization_agent,
        organization_id=org_id,
        organization_name=org.name,
        org_identifier=org.settings.get('org_identifier', f'ORG{org_id}'),
        settings=org.settings
    )
    
    return {
        "message": "Agent settings updated and rebuild triggered",
        "organization_id": org_id,
        "agent_settings": agent_settings,
        "estimated_rebuild_time": "2-3 minutes"
    }

@router.get("/{org_id}/agent-settings")
async def get_organization_agent_settings(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current organization agent settings
    """
    # Check if user has access to this organization
    if current_user.organization_id != org_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get organization
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    default_settings = {
        "screenshot_interval": 300,
        "activity_tracking": True,
        "idle_threshold": 300,
        "restricted_apps": [],
        "custom_branding": {
            "organization_name": org.name,
            "primary_color": "#4CAF50",
            "logo_url": ""
        }
    }
    
    current_settings = org.settings.get('agent_settings', {}) if org.settings else {}
    
    return {
        "organization_id": org_id,
        "organization_name": org.name,
        "current_settings": {**default_settings, **current_settings},
        "default_settings": default_settings
    }

async def build_organization_agent(
    organization_id: int,
    organization_name: str,
    org_identifier: str,
    settings: dict
):
    """
    Background task to build organization-specific agent
    """
    try:
        print(f"Building agent for organization {organization_id}: {organization_name}")

        # Create agents directory if it doesn't exist
        os.makedirs("agents", exist_ok=True)

        # Set environment variables for the build
        env = os.environ.copy()
        env['TRACKM_ORG_ID'] = str(organization_id)
        env['TRACKM_ORG_IDENTIFIER'] = org_identifier
        env['TRACKM_ORGANIZATION_NAME'] = organization_name
        env['TRACKM_SERVER_URL'] = os.getenv('TRACKM_SERVER_URL', 'http://localhost:8000')
        env['TRACKM_AGENT_SETTINGS'] = json.dumps(settings.get('agent_settings', {}))

        # Build the agent using the existing build script
        build_script_path = "../desktop-agents/python-agent/build_standalone.py"

        if os.path.exists(build_script_path):
            # Run the build script
            result = subprocess.run([
                sys.executable, build_script_path,
                '--org-id', str(organization_id),
                '--server-url', env['TRACKM_SERVER_URL']
            ],
            cwd=os.path.dirname(build_script_path),
            env=env,
            capture_output=True,
            text=True
            )

            if result.returncode == 0:
                # Move the built executable to the agents directory
                source_path = f"../desktop-agents/python-agent/dist/ActivTrack_Agent.exe"
                target_path = f"agents/org_{organization_id}_agent.exe"

                if os.path.exists(source_path):
                    import shutil
                    shutil.move(source_path, target_path)
                    print(f"Agent built successfully for organization {organization_id}")
                else:
                    print(f"Built executable not found at {source_path}")
            else:
                print(f"Agent build failed for organization {organization_id}: {result.stderr}")
        else:
            print(f"Build script not found at {build_script_path}")

    except Exception as e:
        print(f"Error building agent for organization {organization_id}: {str(e)}") 