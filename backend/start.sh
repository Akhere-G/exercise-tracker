#!/bin/sh

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Running migrations..."
  alembic upgrade head
fi


echo "Starting Uvicorn..."
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8080