# Multi-Tenant LMS Backend (FastAPI)

## 1. Project Overview
This project is a production-ready backend for a Learning Management System (LMS) supporting:
- Multi-tenant SaaS mode (multiple institutes in one deployment)
- Single-tenant/self-hosted mode (one institute per deployment via `system_settings.default_institute_id`)

Core capabilities include authentication, role-based access control, institute/user management, course hierarchy, enrollment/batch assignment, teacher mapping, and progress tracking.

## 2. Tech Stack
- Python 3.11+
- FastAPI
- PostgreSQL
- SQLAlchemy 2.0 ORM
- Alembic migrations
- Pydantic v2
- JWT auth (`python-jose`)
- Password hashing (`passlib` + bcrypt)

## 3. Setup Instructions
1. Install dependencies
```bash
cd backend
python -m venv .venv
# Windows
.venv\\Scripts\\activate
# Linux/macOS
source .venv/bin/activate
pip install -r requirements.txt
```

2. Configure environment (`.env`)
```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/lms_db
JWT_SECRET_KEY=change-me-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DEFAULT_SUPER_ADMIN_EMAIL=admin@lms.local
DEFAULT_SUPER_ADMIN_PASSWORD=Admin@12345
```

3. Generate and run migrations
```bash
alembic revision --autogenerate -m "init lms schema"
alembic upgrade head
```

4. Start server
```bash
uvicorn app.main:app --reload
```

Server URL: `http://127.0.0.1:8000`  
Swagger docs: `http://127.0.0.1:8000/docs`

## 4. API Documentation

### Auth
METHOD | ENDPOINT | DESCRIPTION
---|---|---
POST | `/auth/register` | Register user (default role student, save selected course, pending approval)
POST | `/auth/login` | Login and get JWT token
GET | `/public/courses` | Public course list for registration page
GET | `/public/subcourses?course_id=<id>` | Public subcourse list filtered by course

### Institutes
METHOD | ENDPOINT | DESCRIPTION
---|---|---
GET | `/institutes` | Get all institutes
POST | `/institutes` | Create institute

### Users
METHOD | ENDPOINT | DESCRIPTION
---|---|---
GET | `/users` | List users by tenant institute
PUT | `/users/{user_id}/approve` | Approve/reject user and convert selected courses to enrollment on approval
PUT | `/users/{user_id}/assign-institute` | Assign/change user institute (super admin)
POST | `/users/{user_id}/roles` | Assign roles to user

### Courses
METHOD | ENDPOINT | DESCRIPTION
---|---|---
GET | `/courses` | Get courses for tenant institute
POST | `/courses` | Create course
POST | `/subcourses` | Create subcourse
POST | `/modules` | Create module
POST | `/content` | Add content

### Enrollment
METHOD | ENDPOINT | DESCRIPTION
---|---|---
POST | `/enroll` | Assign user to final enrollment (`user_courses`) and module access (`user_modules`)
POST | `/assign-batch` | Assign user to batch

### Batches
METHOD | ENDPOINT | DESCRIPTION
---|---|---
POST | `/batches` | Create batch
POST | `/assign-teacher` | Assign teacher to batch

### Students
METHOD | ENDPOINT | DESCRIPTION
---|---|---
GET | `/students/enrolled-courses` | View enrolled course/subcourse list
GET | `/students/modules-content` | View module list with content

### Progress
METHOD | ENDPOINT | DESCRIPTION
---|---|---
POST | `/progress/mark-complete` | Mark module complete/update progress %
GET | `/progress/me` | View user progress

## Tenancy Behavior
- If `system_settings.allow_multi_tenant = true`, tenant context is user institute for authenticated requests.
- If `false`, all requests use `system_settings.default_institute_id`.
- Registration always assigns `default_institute_id`.

## Notes
- Startup bootstrap creates default roles and default system settings (with a seeded default institute if missing).
- Startup bootstrap creates a default super admin user if not already present.
- For production, disable `Base.metadata.create_all` and rely on migrations only.
