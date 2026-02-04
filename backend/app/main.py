from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from .core.config import settings
from .core.database import engine
from .api import auth, devices, asset_types, network_levels, subnets, config, import_export, locations, audit, network_scan, roles, switches, vlans
from .middleware.audit import AuditMiddleware

app = FastAPI(
    title="IP Controller API",
    description="API for managing network devices and configurations",
    version="1.0.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.server.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Audit middleware
app.add_middleware(AuditMiddleware)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(devices.router, prefix="/api/devices", tags=["devices"])
app.include_router(asset_types.router, prefix="/api/asset-types", tags=["asset-types"])
app.include_router(network_levels.router, prefix="/api/network-levels", tags=["network-levels"])
app.include_router(subnets.router, prefix="/api/subnets", tags=["subnets"])
app.include_router(config.router, prefix="/api/config", tags=["configuration"])
app.include_router(import_export.router, prefix="/api/import-export", tags=["import-export"])
app.include_router(locations.router, prefix="/api/locations", tags=["locations"])
app.include_router(audit.router, prefix="/api/audit", tags=["audit"])
app.include_router(network_scan.router, prefix="/api/network", tags=["network-scan"])
app.include_router(roles.router, prefix="/api/roles", tags=["roles"])
app.include_router(switches.router, prefix="/api/switches", tags=["switches"])
app.include_router(vlans.router, prefix="/api/vlans", tags=["vlans"])

@app.get("/")
def root():
    return {"message": "IP Controller API"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": time.time()}

# Exception handler - returns proper CORS headers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Get CORS origins from settings
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in settings.server.cors_origins:
        headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers=headers,
    )
