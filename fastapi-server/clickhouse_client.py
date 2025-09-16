
import os
from clickhouse_driver import Client

CLICKHOUSE_HOST = os.getenv("CLICKHOUSE_HOST", "localhost")
CLICKHOUSE_PORT = int(os.getenv("CLICKHOUSE_PORT", 9000))  # Native port for clickhouse-driver
CLICKHOUSE_USER = os.getenv("CLICKHOUSE_USER", "default")
CLICKHOUSE_PASSWORD = os.getenv("CLICKHOUSE_PASSWORD", "adm1n#Mobi")
CLICKHOUSE_DB = os.getenv("CLICKHOUSE_DB", "trackm")

def get_clickhouse_client():
    client = Client(
        host=CLICKHOUSE_HOST,
        port=CLICKHOUSE_PORT,
        user=CLICKHOUSE_USER,
        password=CLICKHOUSE_PASSWORD,
        database=CLICKHOUSE_DB
    )
    return client

def create_activities_table():
    """Create the activities table if it doesn't exist"""
    client = get_clickhouse_client()
    
    create_table_query = """
    CREATE TABLE IF NOT EXISTS activities (
        organization_id UInt32,
        user_id UInt32,
        group_id Nullable(UInt32),
        agent_id UInt32,
        start_time DateTime,
        end_time DateTime,
        duration Int32,
        idle_time Int32,
        application String,
        website Nullable(String),
        title String,
        category Nullable(String),
        is_active UInt8
    ) ENGINE = MergeTree()
    PARTITION BY toYYYYMM(start_time)
    ORDER BY (organization_id, agent_id, start_time)
    SETTINGS index_granularity = 8192
    """
    
    try:
        client.execute(create_table_query)
        print("Activities table created successfully or already exists")
    except Exception as e:
        print(f"Error creating table: {e}")

def insert_activities(activities_data):
    """Insert activities data using native ClickHouse driver"""
    client = get_clickhouse_client()
    
    # Ensure table exists
    create_activities_table()
    
    # Prepare data for insertion - match your exact table schema
    insert_query = """
    INSERT INTO activities (
        organization_id, user_id, group_id, agent_id, start_time, end_time, 
        duration, idle_time, application, website, title, category, is_active
    ) VALUES
    """
    
    try:
        # Execute insert with data
        client.execute(insert_query, activities_data)
        print(f"Successfully inserted {len(activities_data)} activities")
        return True
    except Exception as e:
        print(f"Error inserting activities: {e}")
        raise e



