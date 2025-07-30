import clickhouse_connect
def clickhouse_connection():
    client = clickhouse_connect.get_client(
        host='localhost',
        port=8123,
        username='default',
        password='',  
        database='trackm'
    )
    return client

