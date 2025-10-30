
import logging
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse,FileResponse
from pathlib import Path
from service import login_service, user_service,agentdownload_service,common_service


router = APIRouter()
@router.post("/download-agent-email/")
async def agentdownload(request: Request,download_data: dict):
    logging.info("Called agentdownload")
    token = request.headers.get("Authorization")
    token_value = token.split(" ")[1]
    user_id,organization_id,role = common_service.token_return_values(token)
    agent_email = download_data.get("email")
    source = download_data.get("source")
    print(agent_email , "here is agent email")
    role = user_service.user_role_check(user_id)
    if role.lower() not in {"admin", "editor"}:
        raise HTTPException(status_code=403, detail="User is not allowed to download agent")
    if not organization_id:
        raise HTTPException(status_code=400, detail="Invalid token payload")
    status =  agentdownload_service.send_agent_link_email(agent_email,token_value)
    return status


@router.post("/download-agent-click/")
async def agentdownload(request: Request,download_data: dict):
    logging.info("Called agentdownload")
    token = request.headers.get("Authorization")
    print(token ,"here is token")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token_value = token.split(" ")[1]
    token_payload = login_service.decode_token(token.split(" ")[1])
    source = download_data.get("source")
    base_dir = Path("/home/mehar-dil/Documents/work/active/trackmbackend/agent_download_file/")
    file_map = {
        "windows": base_dir / "activtrak-agent-installer.exe",
        "macs": base_dir / "activtrak-agent-macos.pkg",
        "linux": base_dir / "activtrak-agent-linux.deb",
    }
    file_path = file_map.get(source.lower())
    if not file_path:
        raise HTTPException(status_code=400, detail="Invalid source. Must be one of: windows, macs, linux.")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"{source} installer not found on server.")
    logging.info(f"🎉 Preparing download for {source}.")
    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/octet-stream"
    )







@router.post("/generate_agent_link/")
async def generate_agent_link(request: Request,download_data: dict):
    logging.info("Called agentdownload")
    token = request.headers.get("Authorization")
    token_value = token.split(" ")[1]
    user_id,organization_id,role = common_service.token_return_values(token)
    source = download_data.get("source")
    role = user_service.user_role_check(user_id)
    if role.lower() not in {"admin", "editor"}:
        raise HTTPException(status_code=403, detail="User is not allowed to download agent")
    if not organization_id:
        raise HTTPException(status_code=400, detail="Invalid token payload")
    download_link =  agentdownload_service.generate_agent_download_link(source,token_value)
    return {"success": True, 
    "message": "Agent download link generated successfully", 
    "url": download_link}
    