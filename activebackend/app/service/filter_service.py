import logging
from database_clickhouse import clickhouse_connection

async def filter_activites_logs(filters):
    logging.info(f"Called filter_activites_logs with filters={filters}")
    client = clickhouse_connection()
    base_query = "SELECT * FROM activities"
    conditions = []
    params = {}
    column_map = {
        "organization_id": "organization_id",
        "user_id": "user_id",
        "team_id": "group_id",  
        "start_date": "start_time",
        "end_date": "start_time",
        "start_time": "start_time",
        "end_time": "end_time"
    }
    if "organization_id" in filters:
        conditions.append("organization_id = %(organization_id)s")
        params["organization_id"] = int(filters["organization_id"])
    if "user_id" in filters:
        conditions.append("user_id = %(user_id)s")
        params["user_id"] = int(filters["user_id"])
    if "team_id" in filters:
        conditions.append("group_id = %(team_id)s")
        params["team_id"] = int(filters["team_id"])
    if "start_date" in filters and "end_date" in filters:
        conditions.append("toDate(start_time) BETWEEN toDate(%(start_date)s) AND toDate(%(end_date)s)")
        params["start_date"] = filters["start_date"]
        params["end_date"] = filters["end_date"]
    elif "start_date" in filters:
        conditions.append("toDate(start_time) >= toDate(%(start_date)s)")
        params["start_date"] = filters["start_date"]
    elif "end_date" in filters:
        conditions.append("toDate(start_time) <= toDate(%(end_date)s)")
        params["end_date"] = filters["end_date"]
    if "start_time" in filters:
        conditions.append("start_time >= %(start_time)s")
        params["start_time"] = filters["start_time"]

    if "end_time" in filters:
        conditions.append("end_time <= %(end_time)s")
        params["end_time"] = filters["end_time"]

    if conditions:
        where_clause = " WHERE " + " AND ".join(conditions)
        query = base_query + where_clause
    else:
        query = base_query

    print("Executing Query:", query)
    print("With Params:", params)
    
    result = client.query(query, parameters=params)
    columns = result.column_names
    activities = [dict(zip(columns, row)) for row in result.result_rows]
    print(len(activities) ,"here is length")
    return activities



