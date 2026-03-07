# -*- coding: utf-8 -*-
import asyncio
import json
import os
import sys

# 1. 强制加入源码路径
sys.path.append("/Users/erickong/AgentSoftFactory/src")
os.environ["COPAW_DATA_DIR"] = "/Users/erickong/AgentSoftFactory/copaw-data"

from copaw.agents.factory_coordinator import SoftwareFactory

async def debug_start():
    print("--- [DEBUG] STARTING ASF MISSION 004 ---")
    
    # Load manifest
    manifest_path = "/Users/erickong/AgentSoftFactory/projects/004-data-cleaner/project_manifest.json"
    with open(manifest_path, 'r') as f:
        manifest = json.load(f)
    
    # Initialize Factory
    print(f"Initializing team for: {manifest['meta']['name']}")
    factory = SoftwareFactory("004-data-cleaner", manifest)
    
    # Run
    mission = "请在项目目录下创建一个 data.csv 文件，并填入 5 行模拟的中国 GDP 数据（2020-2024）。"
    print(f"Mission briefing sent to PM...")
    
    try:
        result = await factory.run_mission(mission)
        print("\n--- [DEBUG] MISSION FINISHED! ---")
        print(f"QA Result: {result}")
    except Exception as e:
        print(f"\n--- [FATAL ERROR] ---")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_start())
