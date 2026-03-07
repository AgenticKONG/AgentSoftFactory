# -*- coding: utf-8 -*-
import uvicorn
import os
import sys

# Setup environment
sys.path.append("/Users/erickong/AgentSoftFactory/src")
os.environ["COPAW_DATA_DIR"] = "/Users/erickong/AgentSoftFactory/copaw-data"

if __name__ == "__main__":
    print("--- ASF BACKEND STARTING (RELOAD ENABLED) ---")
    
    # We use string import for reload to work
    uvicorn.run(
        "copaw.app._app:app", 
        host="127.0.0.1", 
        port=8088, 
        reload=False,  # Disabled for stability
        log_level="debug"
    )

