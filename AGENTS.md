# AGENTS.md

This file provides guidelines for agentic coding assistants working on this IP Controller project.

## Build/Lint/Test Commands

### Backend (Python)
```bash
cd backend

# Install dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Create admin user
python create_admin.py
```

### Frontend (Next.js)
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check (if TypeScript issues)
npx tsc --noEmit
```

## Code Style Guidelines

### Python (Backend)

**Indentation & Formatting:**
- Use 2 spaces for indentation (this project's convention)
- Max line length: 88 characters
- No trailing whitespace

**Imports:**
- Group imports: stdlib → third-party → local
- Use absolute imports from `app` package (e.g., `from ..core.config import settings`)
- Keep import order consistent

**Type Hints:**
- Always include type hints for function parameters and return values
- Use `Optional[T]` from `typing` for nullable fields
- Use `List[T]` for lists

**Naming Conventions:**
- Classes: `PascalCase` (e.g., `UserCreate`, `DeviceUpdate`)
- Functions/variables: `snake_case` (e.g., `get_user_by_id`, `user_id`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_DEVICES`)
- Private functions/methods: prefix with `_`

**Error Handling:**
- Use `HTTPException` from FastAPI for API errors
- Use status codes from `status.HTTP_*`
- Always return meaningful error messages in `detail` field
- Example:
```python
raise HTTPException(
  status_code=status.HTTP_404_NOT_FOUND,
  detail="Device not found"
)
```

**Database Operations:**
- Use CRUD functions in `app/crud/crud.py` for DB operations
- Always use dependency injection for `Session`: `db: Session = Depends(get_db)`
- Commit changes after modifications: `db.commit()` and `db.refresh(object)`
- Use cascading deletes for related data (configured in models)

**Security:**
- Never log sensitive data (passwords, tokens)
- Use `get_password_hash()` and `verify_password()` from `app/core/security.py`
- Encrypt sensitive data with `encrypt_sensitive_data()` before DB storage
- Use `Depends(get_current_user)` or `Depends(get_current_active_user)` for auth
- Use `Depends(get_current_admin_user)` for admin-only endpoints

**API Routes:**
- Use routers in `app/api/` directory
- Define response models with `response_model=SchemaType`
- Set appropriate status codes for operations (201 for create, 204 for delete)
- Use `prefix` and `tags` when including routers in `main.py`

### TypeScript/React (Frontend)

**File Structure:**
- App Router: Pages in `src/app/` directory
- Components: Reusable UI in `src/components/`
- Lib: Utilities and API client in `src/lib/`
- Types: TypeScript types in `src/types/`

**Imports:**
- Use absolute imports with `@/` alias
- Group imports: React → third-party → local
- Example:
```typescript
"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { deviceService } from "@/lib/services";
```

**Component Patterns:**
- Add `"use client";` at the top of files using hooks
- Use functional components with hooks
- Define types inline for complex component props or in `src/types/`
- Example:
```typescript
function CreateDeviceForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
```

**Data Fetching:**
- Use TanStack Query (`@tanstack/react-query`) for all API calls
- Service functions in `src/lib/services.ts` for API calls
- Query keys should be arrays: `["devices"]`, `["devices", id]`
- Invalidate queries after mutations: `queryClient.invalidateQueries({ queryKey: ["devices"] })`

**Styling:**
- Use Tailwind CSS utility classes
- Use `cn()` utility for conditional classes
- Use shadcn/ui components from `@/components/ui/`
- Use semantic colors: `bg-background`, `text-foreground`, `border-border`
- Use `@layer` directives in Tailwind config for custom styles

**State Management:**
- Use `useState` for local component state
- Use TanStack Query for server state
- Store auth tokens in `localStorage` (`access_token`, `refresh_token`)

**Error Handling:**
- Handle API errors gracefully in mutation callbacks
- Show user-friendly error messages
- Redirect to login on 401 errors (handled in API interceptor)

**Forms:**
- Use controlled components with value/onChange
- Handle form submission with `onSubmit` event
- Prevent default form behavior: `e.preventDefault()`
- Validate required fields with HTML attributes (`required`)

**Naming Conventions:**
- Components: `PascalCase` (e.g., `DeviceList`, `CreateDeviceForm`)
- Functions: `camelCase` (e.g., `handleSubmit`, `handleDelete`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_URL`)
- Files: `kebab-case` (e.g., `device-list.tsx`, `api-client.ts`)

**TypeScript:**
- Use interfaces for object shapes: `interface Device { ... }`
- Use type for unions/intersections: `type Status = "active" | "inactive"`
- Avoid `any` - use `unknown` or specific types
- Use strict mode - all type errors must be resolved

## Project Configuration

### Backend Configuration
- Config file: `backend/config.yaml`
- Database type: Set `type: sqlite` or `type: postgresql`
- JWT secrets: Change default keys in production
- CORS: Add frontend URL to `cors_origins`

### Frontend Configuration
- API URL: Set `NEXT_PUBLIC_API_URL` in `.env.local`
- Default: `http://localhost:8000`
