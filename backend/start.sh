#!/bin/sh
echo "Checking for psycopg2..."
python3 -c "import psycopg2; print('psycopg2 imported successfully')"
if [ $? -ne 0 ]; then
    echo "ERROR: psycopg2 not found!"
    exit 1
fi

echo "Starting migrations..."
alembic upgrade head
exec python3 -m uvicorn main:app --host 0.0.0.0 --port 8080