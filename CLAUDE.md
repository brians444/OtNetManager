# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands

### Backend (Python/FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
npm run lint
npx tsc --noEmit
```

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Create Admin User
```bash
cd backend
python create_admin.py
```

## Architecture Overview

**Full-stack network device management system** with:
- **Backend**: FastAPI + SQLAlchemy + Alembic (Python 3.11+)
- **Frontend**: Next.js 14 + TypeScript + TanStack Query + shadcn/ui + Tailwind CSS
- **Database**: SQLite (dev) or PostgreSQL (prod)
- **Auth**: JWT with access tokens (15 min) and refresh tokens (7 days)
- **Encryption**: AES-256-GCM for device credentials

### Key Directories
- `backend/app/api/` - FastAPI route handlers
- `backend/app/core/` - Config, security, database, dependencies
- `backend/app/models/` - SQLAlchemy models
- `backend/app/schemas/` - Pydantic request/response schemas
- `backend/app/crud/` - Database operations
- `frontend/src/app/` - Next.js App Router pages
- `frontend/src/components/` - React components (shadcn/ui based)
- `frontend/src/lib/` - API client and services (api.ts, services.ts)
- `frontend/src/types/` - TypeScript type definitions

### Data Models
User, Device, Credential, Location, Sector, Subnet, AssetType, NetworkLevel

## Code Style

### Python
- **2 spaces for indentation** (project convention)
- Max 88 character line length
- Type hints required on all functions
- Absolute imports from `app` package

### TypeScript/React
- `"use client";` directive for components using hooks
- TanStack Query for all API calls with query keys as arrays
- shadcn/ui components with Tailwind CSS
- Absolute imports with `@/` alias

## Important Patterns

### Backend Authentication
```python
from app.core.deps import get_current_user, get_current_active_user, get_current_admin_user
# Use as: Depends(get_current_user) or Depends(get_current_admin_user)
```

### Backend Database Operations
```python
from app.core.database import get_db
# Use as: db: Session = Depends(get_db)
```

### Backend Security
```python
from app.core.security import get_password_hash, verify_password, encrypt_sensitive_data
```

### Frontend Data Fetching
```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { deviceService } from "@/lib/services";
// Invalidate after mutations: queryClient.invalidateQueries({ queryKey: ["devices"] })
```

### Frontend API Client
The API client in `src/lib/api.ts` handles token refresh automatically on 401 responses.

## Configuration

- Backend: `backend/config.yaml` (database, JWT, CORS, rate limiting)
- Frontend: `frontend/.env.local` with `NEXT_PUBLIC_API_URL`
- API docs: `/api/docs` (Swagger) and `/api/redoc`
