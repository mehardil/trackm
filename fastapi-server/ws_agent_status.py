from fastapi import WebSocket, WebSocketDisconnect, Depends
from fastapi import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from auth import decode_access_token
from database import get_db
from models import AgentStatus, AgentConfig
from datetime import datetime

router = APIRouter()

@router.websocket("/ws/agent-status")
async def agent_status_ws(websocket: WebSocket, db: AsyncSession = Depends(get_db)):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4002)
        return
    user_id = payload.get("user_id")
    organization_id = payload.get("organization_id")
    agent_id = payload.get("agent_id")
    if not (user_id and organization_id and agent_id):
        await websocket.close(code=4003)
        return
    agent_id = int(agent_id)
    await websocket.accept()
    # Mark agent as online in DB
    result = await db.execute(select(AgentConfig).where(AgentConfig.organization_id == organization_id, AgentConfig.agent_id == agent_id))
    agent = result.scalars().first()
    if not agent:
        await websocket.close(code=4004)
        return
    status = AgentStatus(
        organization_id=organization_id,
        user_id=user_id,
        agent_id=agent_id,
        timestamp=datetime.utcnow(),
        is_running=True,
        is_connected=True,
        last_activity_time=datetime.utcnow(),
    )
    db.add(status)
    await db.commit()
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        # Mark agent as offline
        status = AgentStatus(
            organization_id=organization_id,
            user_id=user_id,
            agent_id=agent_id,
            timestamp=datetime.utcnow(),
            is_running=False,
            is_connected=False,
            last_activity_time=datetime.utcnow(),
        )
        db.add(status)
        await db.commit() 