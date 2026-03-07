# -*- coding: utf-8 -*-
import logging
import json
import asyncio
import os
from typing import List, Dict, Any
from agentscope.message import Msg
from .react_agent import CoPawAgent
from ..app import console_push_store

logger = logging.getLogger(__name__)

class SoftwareFactory:
    """Orchestrates a project-specific team of agents (AgentScope 1.x Compatible)."""

    def __init__(self, project_id: str, manifest: Dict[str, Any]):
        self.project_id = project_id
        self.manifest = manifest
        
        # Initialize agents without prohibited 'name' argument
        self.pm = CoPawAgent()
        self.pm.name = "ProductManager"
        
        self.dev = CoPawAgent()
        self.dev.name = "Developer"
        
        self.qa = CoPawAgent()
        self.qa.name = "QA"

    async def push_status(self, node_id: str, status: str, log: str):
        """Pushes event to CoPaw's message store."""
        event = {
            "type": "asf_event",
            "project_id": self.project_id,
            "node_id": node_id,
            "status": status,
            "log": log
        }
        await console_push_store.append(self.project_id, json.dumps(event))

    async def run_mission(self, mission_briefing: str):
        """The main production loop."""
        
        # Stage 1: PM Analysis
        await self.push_status("pm", "thinking", f"PM analyzing: {mission_briefing[:30]}...")
        msg = Msg("User", mission_briefing, role="user")
        spec = await self.pm.reply(msg)
        await self.push_status("pm", "completed", "SPEC.md generated.")

        # Stage 2: DEV Implementation
        await self.push_status("dev", "thinking", "DEV implementing code...")
        # Pass the content of the PM's response to DEV
        code_res = await self.dev.reply(spec)
        await self.push_status("dev", "completed", "Coding finished.")

        # Stage 3: QA Review
        await self.push_status("qa", "thinking", "QA verifying...")
        review = await self.qa.reply(code_res)
        await self.push_status("qa", "completed", "QA Review completed.")

        await self.push_status("user", "finished", "Mission accomplished!")
        return review
