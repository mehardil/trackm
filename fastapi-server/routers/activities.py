from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models import User
from auth import get_current_user
from clickhouse_client import insert_activities
import datetime

router = APIRouter(prefix="/activities", tags=["activities"])

@router.post("/ingest", status_code=201)
async def ingest_activities(
    activities: List[dict],
    current_user: User = Depends(get_current_user),
):
    # Prepare data for ClickHouse native driver
    rows = []
    now_str = datetime.datetime.now().isoformat(sep=' ', timespec='seconds')
    
    for activity in activities:
        # Map 'timestamp' to 'start_time' and 'end_time' if present and those fields are missing
        start_time = None
        end_time = None
        
        if 'timestamp' in activity:
            if 'start_time' not in activity or not activity['start_time']:
                start_time = activity['timestamp']
            else:
                start_time = activity['start_time']
            if 'end_time' not in activity or not activity['end_time']:
                end_time = activity['timestamp']
            else:
                end_time = activity['end_time']
        else:
            start_time = now_str
            end_time = now_str
        
        # Convert timestamps to datetime objects
        try:
            if isinstance(start_time, str):
                start_time = datetime.datetime.fromisoformat(start_time.replace('T', ' '))
            if isinstance(end_time, str):
                end_time = datetime.datetime.fromisoformat(end_time.replace('T', ' '))
        except Exception:
            start_time = datetime.datetime.now()
            end_time = datetime.datetime.now()
        
        # Prepare row data as tuple for ClickHouse native driver
        # Match your exact table schema with all 13 columns
        row_data = (
            int(activity.get('organization_id') or 0),
            int(activity.get('user_id') or 0),
            int(activity.get('group_id') or 0),  # Can be None/nullable
            int(activity.get('agent_id') or 0),
            start_time,
            end_time,
            int(float(activity.get('duration', 0))),  # Handle float duration
            int(activity.get('idle_time') or 0),
            str(activity.get('application') or ''),
            str(activity.get('website') or '') if activity.get('website') else None,  # Nullable
            str(activity.get('title') or ''),
            str(activity.get('category') or '') if activity.get('category') else None,  # Nullable
            int(bool(activity.get('is_active', False)))
        )
        
        rows.append(row_data)
    
    # Debug: Print the first row to see the structure
    if rows:
        print(f"Debug - First row structure: {rows[0]}")
        print(f"Debug - Row data types: {[type(val) for val in rows[0]]}")
        print(f"Debug - Original activity data: {activities[0] if activities else 'No activities'}")
        print(f"Debug - Number of rows to insert: {len(rows)}")
    
    # Insert into ClickHouse using the updated client
    if rows:
        try:
            insert_activities(rows)
        except Exception as e:
            print(f"ClickHouse insert error: {e}")
            print(f"Error details: {type(e).__name__}")
            raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")
    
    return {"inserted": len(rows)} 