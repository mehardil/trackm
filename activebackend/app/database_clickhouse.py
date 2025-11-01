import os
import logging
from dotenv import load_dotenv
from clickhouse_driver import Client

# Load environment variables from .env file
load_dotenv()

def clickhouse_connection():
    """
    Establish and return a ClickHouse connection using native TCP protocol (port 9000).
    Reads credentials from .env file and includes safe error handling.
    """
    try:
        host = os.getenv('CLICKHOUSE_HOST', '127.0.0.1')  # Force IPv4
        port = int(os.getenv('CLICKHOUSE_PORT', 9000))
        user = os.getenv('CLICKHOUSE_USER', 'default')
        password = os.getenv('CLICKHOUSE_PASSWORD', '')
        database = os.getenv('CLICKHOUSE_DB', 'trackm')

        logging.info(f"Connecting to ClickHouse at {host}:{port} (DB: {database})")

        client = Client(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            connect_timeout=5,
            send_receive_timeout=10,
            compression=True
        )

        # Quick health check
        client.execute('SELECT 1')
        logging.info("✅ Connected to ClickHouse successfully!")

        return client

    except Exception as e:
        logging.error(f"❌ Failed to connect to ClickHouse: {e}")
        raise e
