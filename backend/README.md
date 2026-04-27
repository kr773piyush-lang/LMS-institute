# LMS Backend

FastAPI backend for the Institute LMS platform.

## Stack

- FastAPI
- SQLAlchemy 2.x
- PostgreSQL
- Alembic
- Pydantic Settings
- JWT authentication

## Local Setup

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
```

Update `backend/.env.example` values in your local `.env`, especially:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `DEFAULT_SUPER_ADMIN_EMAIL`
- `DEFAULT_SUPER_ADMIN_PASSWORD`
- `CORS_ORIGINS`

Run migrations:

```bash
alembic upgrade head
```

Start the API:

```bash
uvicorn app.main:app --reload
```

Docs:

- Swagger: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

## Cloudinary Storage

Content uploads are stored in Cloudinary instead of PostgreSQL. Configure:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`

Uploaded assets are organized institute-wise with this folder pattern:

```text
<CLOUDINARY_FOLDER>/institutes/<institute_id>/modules/<module_id>
```

The database stores the returned Cloudinary URL plus deletion metadata, while the actual file stays in Cloudinary.

## Production Notes

- Set `APP_ENV=production`
- Set `DEBUG=false`
- Set `AUTO_CREATE_TABLES=false`
- Use PostgreSQL, not SQLite
- Run `alembic upgrade head` before starting the app
- Set `CORS_ORIGINS` to your deployed frontend domain

## Production Start Command

Linux container / VPS:

```bash
gunicorn app.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --workers 2 --timeout 120
```

## Docker

Build:

```bash
docker build -t institute-lms-backend ./backend
```

Run:

```bash
docker run --env-file backend/.env -p 8000:8000 institute-lms-backend
```

## Recommended Deploy Targets

- Render
- Railway
- DigitalOcean App Platform
- Any VPS with Docker + PostgreSQL

## Required Environment Variables

| Variable | Required | Example |
|---|---|---|
| `APP_ENV` | Yes | `production` |
| `DEBUG` | Yes | `false` |
| `AUTO_CREATE_TABLES` | Yes | `false` |
| `DATABASE_URL` | Yes | `postgresql+psycopg://user:pass@host:5432/dbname` |
| `JWT_SECRET_KEY` | Yes | `long-random-secret` |
| `JWT_ALGORITHM` | Yes | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | `1440` |
| `CLOUDINARY_CLOUD_NAME` | For uploads | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | For uploads | `123456789012345` |
| `CLOUDINARY_API_SECRET` | For uploads | `your-secret` |
| `CLOUDINARY_FOLDER` | For uploads | `institute-lms` |
| `DEFAULT_SUPER_ADMIN_EMAIL` | Yes | `admin@example.com` |
| `DEFAULT_SUPER_ADMIN_PASSWORD` | Yes | `StrongPassword123!` |
| `CORS_ORIGINS` | Yes | `https://your-frontend-domain.com` |

## Deployment Checklist

1. Provision PostgreSQL.
2. Set backend environment variables.
3. Run `alembic upgrade head`.
4. Start the backend with `gunicorn`.
5. Verify `/health` returns `{"status":"ok"}`.
6. Point the frontend `NEXT_PUBLIC_API_BASE_URL` to the backend URL.
