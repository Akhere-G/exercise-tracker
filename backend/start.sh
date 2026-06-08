#!/bin/sh

echo "Running migrations..."
alembic upgrade head

echo "Running database seed..."
python3 seed.py

echo "Starting Uvicorn..."
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8080