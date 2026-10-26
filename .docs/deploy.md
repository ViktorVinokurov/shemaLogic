# Деплой: GitHub → GHCR → VPS

Пуш в `main` собирает Docker-образы, публикует их в GitHub Container Registry и по SSH поднимает контейнеры на VPS. Сайт слушает HTTP на порту 80.

Локально по-прежнему: `docker compose up --build` из [docker-compose.yml](../docker-compose.yml).

## GitHub Secrets

В репозитории: **Settings → Secrets and variables → Actions**.

| Secret | Обязательный | Описание |
| --- | --- | --- |
| `VPS_HOST` | да | IP или hostname VPS |
| `VPS_USER` | да | Linux-пользователь с правом Docker и SSH-ключом |
| `VPS_SSH_KEY` | да | Приватный ключ целиком (`-----BEGIN ... PRIVATE KEY-----`) |
| `VPS_PORT` | нет | Порт SSH, по умолчанию `22` |
| `DEPLOY_PATH` | нет | Каталог на сервере, по умолчанию `/opt/shemaLogic` |

`GITHUB_TOKEN` выдаёт Actions сам: им логинятся в GHCR и на VPS при `docker pull`.

## Один раз на VPS

1. Установить Docker Engine и Compose plugin. Пользователя деплоя добавить в группу `docker`.
2. Сгенерировать SSH-ключ (если нет) и положить публичную часть в `~/.ssh/authorized_keys`. Приватный ключ — в секрет `VPS_SSH_KEY`.
3. Создать каталог и `.env` (секреты не коммитить):

```sh
sudo mkdir -p /opt/shemaLogic
sudo chown "$USER:$USER" /opt/shemaLogic
cd /opt/shemaLogic
cp .env.example .env   # или создать вручную по шаблону из репозитория
```

4. В `.env` заменить плейсхолдеры:

- `GHCR_IMAGE=ghcr.io/<owner>/<repo>` — owner и repo в нижнем регистре (как на GitHub).
- `DJANGO_SECRET_KEY` — длинная случайная строка, не дефолт из Django.
- `DJANGO_ALLOWED_HOSTS` — IP VPS (и hostname, если есть), через запятую.
- `CSRF_TRUSTED_ORIGINS=http://<VPS_IP>` — тот же origin, с которого открывают сайт и `/admin/`.
- `WEB_PORT` — внешний порт nginx, по умолчанию `80`. Если 80 уже занят другим проектом, поставить свободный и добавить `:<порт>` в `CSRF_TRUSTED_ORIGINS`.

5. Firewall: открыть `80` (HTTP) и SSH. Backend наружу не публикуется, только nginx на 80.
6. После первого успешного workflow: `http://<VPS_IP>/`.

SQLite лежит в Docker volume `scheme-data` и переживает повторные `compose up`.

## Если GHCR private

Пакеты в GHCR по умолчанию привязаны к репозиторию. Workflow логинится на сервере токеном job’а перед `pull`. Если `pull` падает с 401 — проверить, что образ `ghcr.io/<owner>/<repo>/backend` существует и пользователь деплоя не перетирает `~/.docker/config.json` чужими учётками.

## Ручной откат на сервере

```sh
cd /opt/shemaLogic
export GHCR_IMAGE=ghcr.io/<owner>/<repo>
export IMAGE_TAG=<git-sha>
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```
