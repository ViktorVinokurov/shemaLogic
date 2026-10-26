# Технологии

Фронтенд и бэкенд лежат в одном репозитории и общаются по REST. В разработке Vite проксирует `/api` на Django.

## Фронтенд

Каталог `frontend`.

- Vite
- Vue 3 и Composition API
- TypeScript
- Vue Router
- Pinia
- Tailwind CSS
- shadcn-vue (Reka UI)
- Vue Flow — холст, перетаскивание блоков и стрелки
- Lucide — иконки

Слои интерфейса разложены по Feature-Sliced Design: `app`, `pages`, `widgets`, `features`, `entities`, `shared`.

## Бэкенд

Каталог `backend`.

- Python
- Django
- Django REST framework
- django-cors-headers
- SQLite, файл `backend/db.sqlite3`

Зависимости бэкенда зафиксированы в `backend/requirements.txt`: Django 5.2.18, djangorestframework 3.18.3, django-cors-headers 4.9.0.

Оба сервера запускаются скриптом `start.sh` в корне: API на `http://127.0.0.1:8000`, сайт на `http://127.0.0.1:5173`.
