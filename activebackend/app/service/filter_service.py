import logging
from database_clickhouse import clickhouse_connection


async def filter_activites_logs(filters):
    logging.info(f"Called filter_activites_logs with filters={filters}")
    client = clickhouse_connection()

    base_query = "SELECT * FROM activities"
    conditions = []

    # Build query conditions
    if "organization_id" in filters:
        conditions.append(f"organization_id = {int(filters['organization_id'])}")
    if "user_id" in filters:
        conditions.append(f"user_id = {int(filters['user_id'])}")
    if "team_id" in filters:
        conditions.append(f"group_id = {int(filters['team_id'])}")
    if "start_date" in filters and "end_date" in filters:
        conditions.append(f"toDate(start_time) BETWEEN toDate('{filters['start_date']}') AND toDate('{filters['end_date']}')")
    elif "start_date" in filters:
        conditions.append(f"toDate(start_time) >= toDate('{filters['start_date']}')")
    elif "end_date" in filters:
        conditions.append(f"toDate(start_time) <= toDate('{filters['end_date']}')")

    # Combine conditions
    where_clause = f" WHERE {' AND '.join(conditions)}" if conditions else ""
    limit = filters.get("limit", 10)
    offset = filters.get("offset", 0)

    # Final query
    query = f"{base_query}{where_clause} ORDER BY start_time DESC LIMIT {limit} OFFSET {offset}"
    logging.info(f"Executing Query: {query}")

    # Run main query
    result = client.execute(query)
    columns = [desc[0] for desc in client.execute("DESCRIBE TABLE activities")]
    activities = [dict(zip(columns, row)) for row in result]

    # Count total rows
    total_count_query = f"SELECT count() FROM activities{where_clause}"
    total_result = client.execute(total_count_query)
    total_count = total_result[0][0] if total_result else 0

    return {"activities": activities, "total": total_count}
