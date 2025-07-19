from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models import User
from auth import get_current_user
from clickhouse_client import get_clickhouse_client
import datetime

router = APIRouter(prefix="/activities", tags=["activities"])

@router.post("/ingest", status_code=201)
async def ingest_activities(
    activities: List[dict],
    current_user: User = Depends(get_current_user),
):
    # Each activity should include org/user/agent context
    client = get_clickhouse_client()
    rows = []
    required_keys = [
        "organization_id", "user_id", "group_id", "agent_id", "start_time", "end_time", "duration", "idle_time", "application", "website", "title", "category", "is_active"
    ]
    now_str = datetime.datetime.now().isoformat(sep=' ', timespec='seconds')
    for activity in activities:
        # Map 'timestamp' to 'start_time' and 'end_time' if present and those fields are missing
        if 'timestamp' in activity:
            if 'start_time' not in activity or not activity['start_time']:
                activity['start_time'] = activity['timestamp']
            if 'end_time' not in activity or not activity['end_time']:
                activity['end_time'] = activity['timestamp']
        # Enforce org/user/agent isolation
        if (
            activity.get("organization_id") != current_user.organization_id
            or activity.get("user_id") != current_user.id
        ):
            raise HTTPException(status_code=403, detail="Invalid org/user context")
        # Ensure all required keys are present
        for key in required_keys:
            if key not in activity or (key in ["start_time", "end_time"] and not activity.get(key)):
                if key in ["start_time", "end_time"]:
                    activity[key] = now_str
                else:
                    activity[key] = None
        # Convert start_time and end_time to datetime if they are strings
        for key in ["start_time", "end_time"]:
            if isinstance(activity.get(key), str):
                try:
                    activity[key] = datetime.datetime.fromisoformat(activity[key])
                except Exception:
                    # fallback: try parsing with 'T' separator
                    try:
                        activity[key] = datetime.datetime.fromisoformat(activity[key].replace('T', ' '))
                    except Exception:
                        pass  # leave as is if cannot parse
        # Convert types for ClickHouse
        for int_key in ["duration", "idle_time"]:
            if int_key in activity and activity[int_key] is not None:
                try:
                    activity[int_key] = int(activity[int_key])
                except Exception:
                    activity[int_key] = 0
        if "is_active" in activity:
            activity["is_active"] = int(bool(activity["is_active"]))
        rows.append(activity)
    # Insert into ClickHouse (assume table 'activities' exists)
    if rows:
        client.execute(
            "INSERT INTO activities VALUES",
            rows
        )
    return {"inserted": len(rows)} 