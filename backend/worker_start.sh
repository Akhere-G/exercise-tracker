#!/bin/sh
echo "Running run_reminder..."

# The image runs from /app, where `app` is the package.
python3 -m app.run_reminder

echo "Success"
