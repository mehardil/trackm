# service/filter_service.py
import logging
from database_clickhouse import clickhouse_connection

async def filter_activites_logs(filters):
    logging.info(f"Called filter_activites_logs with filters={filters}")
    client = clickhouse_connection()

    base_query = "SELECT * FROM activities"
    conditions = []
    params = {}

    # Conditions
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

    # WHERE clause
    where_clause = f" WHERE {' AND '.join(conditions)}" if conditions else ""
    limit = filters.get("limit", 10)
    offset = filters.get("offset", 0)

    query = f"{base_query}{where_clause} ORDER BY start_time DESC LIMIT {limit} OFFSET {offset}"
    logging.info(f"Executing Query: {query} with Params: {params}")

    result = client.query(query, parameters=params)
    columns = result.column_names
    activities = [dict(zip(columns, row)) for row in result.result_rows]

    # For frontend pagination
    total_count_query = f"SELECT count() FROM activities{where_clause}"
    total_result = client.query(total_count_query, parameters=params)
    total_count = total_result.result_rows[0][0] if total_result.result_rows else 0

    return {"activities": activities, "total": total_count}
