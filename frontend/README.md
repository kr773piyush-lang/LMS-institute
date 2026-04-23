# LMS Frontend (Next.js + TypeScript)

## 1. Project Overview
Production-ready frontend for a multi-tenant LMS with role-based dashboards:
- Super Admin
- Institute Admin
- Teacher
- Student

The app connects to a FastAPI backend and supports:
- JWT authentication
- Protected routes
- Role-based routing
- Course, batch, user, and progress workflows
- Multi-tenant operational structure

## 2. Tech Stack
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Axios
- React Query
- Zustand

## 3. Setup Instructions
1. Install dependencies:
```bash
cd frontend
npm install
```

2. Configure environment:
```bash
cp .env.example .env.local
```

3. Update `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm run start
```

## 4. Folder Structure
```text
frontend/
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── courses/
│   ├── batches/
│   ├── users/
│   ├── settings/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── forms/
│   ├── tables/
│   └── layout/
├── services/
├── hooks/
├── store/
├── utils/
├── types/
├── constants/
└── middleware.ts
```

## 5. API Integration Guide
Axios base client:
- `services/client.ts`
- Uses `NEXT_PUBLIC_API_BASE_URL`
- Adds JWT `Authorization: Bearer <token>` via interceptor

Service modules:
- `services/auth.ts`
- `services/institutes.ts`
- `services/users.ts`
- `services/courses.ts`
- `services/batches.ts`
- `services/progress.ts`

React Query hooks:
- `hooks/useLmsQueries.ts`
- `hooks/useAuth.ts`

## 6. Environment Variables
Required:
- `NEXT_PUBLIC_API_BASE_URL`: FastAPI backend base URL

## Auth & Security Notes
- JWT is stored in Zustand + browser storage and mirrored to secure/same-site cookie for middleware route protection.
- For strict production hardening, prefer server-issued `httpOnly` cookies from backend auth endpoints.
