"""Production server startup without reload"""
import uvicorn

if __name__ == "__main__":
    # ✅ PRODUCTION: No reload, stable configuration
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # ✅ No auto-reload
        workers=1,
        timeout_keep_alive=120,
        limit_max_requests=1000,
        access_log=True
    )