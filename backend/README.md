# IP Controller Backend

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure the database in `config.yaml`:
   - Set `type` to `postgresql` or `sqlite`
   - Configure connection parameters

4. Run database migrations:
```bash
alembic upgrade head
```

5. Start the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (form data: username, password)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Devices
- `GET /api/devices` - List all devices
- `GET /api/devices/{id}` - Get device by ID
- `POST /api/devices` - Create new device
- `PUT /api/devices/{id}` - Update device
- `DELETE /api/devices/{id}` - Delete device
- `POST /api/devices/{id}/credentials` - Add credential
- `PUT /api/devices/credentials/{id}` - Update credential
- `DELETE /api/devices/credentials/{id}` - Delete credential
- `GET /api/devices/credentials/{id}` - Get credential (decrypted)

## Security

- JWT authentication with access tokens (15 min) and refresh tokens (7 days)
- Device credentials encrypted with AES-256-GCM
- Rate limiting: 100 requests per minute
- CORS configured for frontend
