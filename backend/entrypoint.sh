#!/bin/sh
set -eu

cd /app

if [ -n "${SQLITE_PATH:-}" ]; then
  mkdir -p "$(dirname "$SQLITE_PATH")"
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 1 \
  --threads 4 \
  --access-logfile - \
  --error-logfile -
