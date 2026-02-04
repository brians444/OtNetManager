# IP Controller

A web-based system for tracking and managing network devices with subnet information.

## Features

- Device management (create, read, update, delete)
- Store device information: name, location, sector, model, brand, MAC address, IP address, default gateway
- Credential management per device (username/password encrypted)
- JWT-based authentication
- Support for PostgreSQL or SQLite databases
- Configurable via YAML file

## Tech Stack

### Backend
- Python + FastAPI
- SQLAlchemy ORM
- JWT authentication
- AES-256-GCM encryption for credentials
- PyYAML for configuration

### Frontend
- Next.js 14
- TypeScript
- TanStack Query
- shadcn/ui components
- Tailwind CSS

## Quick Start

### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure the database in `config.yaml` (set type to `sqlite` for development or `postgresql` for production)

5. Run database migrations:
```bash
alembic upgrade head
```

6. Start the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8005
```

### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure the API URL:
```bash
cp .env.local.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Default Setup

For a quick start, use SQLite (default in `config.yaml`):
- The backend will create `ipcontroller.db` file
- You'll need to create the first user via the API or add a script to do so

## Security

- JWT access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Device passwords are encrypted with AES-256-GCM
- Rate limiting: 100 requests per minute
- CORS configured for frontend origin

## Project Structure

```
ipController/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routes
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── core/         # security, config, deps
│   │   └── crud/         # DB operations
│   ├── config.yaml       # Configuration file
│   ├── requirements.txt
│   └── alembic/
└── frontend/
    ├── src/
    │   ├── app/          # Next.js pages
    │   ├── components/   # React components
    │   ├── lib/          # Utilities and API client
    │   └── types/
```
