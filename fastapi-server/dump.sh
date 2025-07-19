#!/bin/bash

DB="trackm"
DUMP_FILE="trackm_dump.sql"

echo "-- ClickHouse SQL Dump for DB: $DB" > "$DUMP_FILE"

TABLES=$(clickhouse-client --query="SHOW TABLES FROM $DB")

for TABLE in $TABLES; do
  echo "Dumping $TABLE..."
  
  # Dump schema
  clickhouse-client --query="SHOW CREATE TABLE $DB.$TABLE" >> "$DUMP_FILE"
  echo ";" >> "$DUMP_FILE"
  echo "" >> "$DUMP_FILE"

  # Dump data
  clickhouse-client --query="SELECT * FROM $DB.$TABLE FORMAT SQLInsert" >> "$DUMP_FILE"
  echo "" >> "$DUMP_FILE"
done

echo "✅ Dump complete: $DUMP_FILE"
