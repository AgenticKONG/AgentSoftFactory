# -*- coding: utf-8 -*-
import sys
import os
import asyncio
import logging

# Setup paths
sys.path.append("/Users/erickong/AgentSoftFactory/src")
os.environ["COPAW_DATA_DIR"] = "/Users/erickong/AgentSoftFactory/copaw-data"

logging.basicConfig(level=logging.INFO)

from copaw.agents.react_agent import CoPawAgent
from agentscope.message import Msg
import agentscope

async def test():
    print("--- 1. Initializing AgentScope ---")
    # Load model config
    model_configs = "/Users/erickong/AgentSoftFactory/src/copaw/config/model_config.json"
    agentscope.init(model_configs=model_configs)
    
    print("--- 2. Creating PM Agent ---")
    pm = CoPawAgent()
    pm.name = "ProductManager"
    
    print("--- 3. Testing Reply (Ollama) ---")
    msg = Msg("User", "Hello, are you ready to plan the GDP project?", role="user")
    try:
        response = await pm.reply(msg)
        print(f"--- 4. Success! Response: {response.content[:100]}... ---")
    except Exception as e:
        print(f"--- 4. Error: {str(e)} ---")

if __name__ == "__main__":
    asyncio.run(test())
