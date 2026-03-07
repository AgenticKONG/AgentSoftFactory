# -*- coding: utf-8 -*-
import sys
import os
import asyncio
import logging

# Setup paths
sys.path.append("/Users/erickong/AgentSoftFactory/src")
os.environ["COPAW_DATA_DIR"] = "/Users/erickong/AgentSoftFactory/copaw-data"

logging.basicConfig(level=logging.INFO)

from copaw.agents.factory_coordinator import SoftwareFactory
import agentscope

async def run_direct_mission():
    print("--- 1. Initializing AgentScope (Direct Mode) ---")
    model_configs = "/Users/erickong/AgentSoftFactory/src/copaw/config/model_config.json"
    
    # Corrected model config loading for AS 1.x
    from agentscope.models import load_model_configs
    load_model_configs(model_configs)
    
    project_id = "001-d3-gdp-viz"
    manifest = {
        "project_id": project_id,
        "meta": {"name": "GDP Viz Direct Test"},
        "team": {"agents": []} # Simplified
    }
    
    print("--- 2. Starting Factory Mission ---")
    factory = SoftwareFactory(project_id, manifest)
    briefing = "D3.js v7 bar chart, China GDP 2000-2025, tooltips, keyboard nav, Observable 10 colors."
    
    try:
        # We wrap it in a custom run to avoid the asf_event_queue dependency if needed
        # But let's see if the queue actually works first
        from copaw.app.routers.asf import asf_event_queue
        asf_event_queue[project_id] = []
        
        print("--- 3. Running Production Loop... ---")
        res = await factory.run_mission(briefing)
        print("--- 4. FINISHED! Output: ---")
        print(res.content[:200])
    except Exception as e:
        print(f"--- FAILED: {str(e)} ---")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_direct_mission())
