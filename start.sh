#!/bin/sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [ ! -d "$ROOT/.venv" ]; then
  python3 -m venv "$ROOT/.venv"
fi

. "$ROOT/.venv/bin/activate"

python -m pip install -r "$ROOT/backend/requirements.txt"
python "$ROOT/backend/manage.py" migrate

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  npm install --prefix "$ROOT/frontend"
fi

python "$ROOT/backend/manage.py" runserver 127.0.0.1:8000 &
backend_pid=$!

cleanup() {
  kill "$backend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "API:  http://127.0.0.1:8000"
echo "Сайт: http://127.0.0.1:5173"

npm run dev --prefix "$ROOT/frontend" -- --host 127.0.0.1 --port 5173
