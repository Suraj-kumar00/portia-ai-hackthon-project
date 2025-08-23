"""Development server startup with proper configuration"""
import uvicorn
import os

if __name__ == "__main__":
    # ✅ DEVELOPMENT: Controlled reload with excludes
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_excludes=[
            "*.log",
            "*.tmp", 
            "__pycache__/*",
            ".git/*",
            "node_modules/*",
            ".next/*",
            "*.pyc"
        ],
        reload_delay=2.0,  # Wait 2 seconds before reloading
        timeout_keep_alive=30,
        access_log=True
    )