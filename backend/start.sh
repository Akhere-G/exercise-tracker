#!/bin/sh

# Set RUN_MIGRATIONS=false when migrations run as a separate release step
# (for example a one-off job), so concurrent instances do not race on them.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Running migrations..."
  alembic upgrade head
fi


echo "Starting Uvicorn..."
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8080