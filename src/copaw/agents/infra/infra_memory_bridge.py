# -*- coding: utf-8 -*-
"""Infra Memory Bridge - The shared context for Gemini CLI and ASF.

This module persists the strategic goals, operating principles, and 
infrastructure constraints agreed upon by the Digital Partner (Gemini CLI) 
and the Human Partner (User).
"""

import json
import os
import logging
from datetime import datetime
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class InfraMemoryBridge:
    """The memory bridge between Gemini CLI and ASF Infra Agent."""

    def __init__(self, data_dir: str = "/Users/erickong/AgentSoftFactory/copaw-data/infra"):
        self.data_dir = data_dir
        self.memory_path = os.path.join(self.data_dir, "infra_memory.json")
        self.state_path = os.path.join(self.data_dir, "infra_state.json")
        self.principles_path = os.path.join(self.data_dir, "operating_principles_v1.json")
        
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

    def checkpoint_state(self, task_name: str, goal: str, progress: str, next_steps: List[str]):
        """Persists a snapshot of the current architectural state."""
        state = {
            "checkpoint": {
                "id": f"CHK_{int(datetime.now().timestamp())}",
                "timestamp": datetime.now().isoformat(),
                "last_known_status": "Active"
            },
            "active_task": {
                "name": task_name,
                "goal": goal,
                "progress": progress
            },
            "next_strategic_steps": next_steps
        }
        
        with open(self.state_path, 'w', encoding='utf-8') as f:
            json.dump(state, f, indent=4, ensure_ascii=False)
        logger.info(f"Memory Checkpoint established: {task_name}")

    def persist_principles(self, principles: Dict[str, Any]):
        """Persists the agreed-upon operating principles."""
        with open(self.principles_path, 'w', encoding='utf-8') as f:
            json.dump({
                "version": "1.0",
                "last_updated": datetime.now().isoformat(),
                "principles": principles
            }, f, indent=4, ensure_ascii=False)
        logger.info(f"Operating Principles v1.0 persisted at {self.principles_path}")

    def update_strategic_context(self, task_name: str, goal: str, constraints: List[str]):
        """Updates the current mission context for the Infra Agent."""
        context = {
            "current_task": task_name,
            "overall_goal": goal,
            "constraints": constraints,
            "timestamp": datetime.now().isoformat()
        }
        
        # Load existing memory if exists
        memory = {}
        if os.path.exists(self.memory_path):
            with open(self.memory_path, 'r', encoding='utf-8') as f:
                memory = json.load(f)
        
        memory["strategic_context"] = context
        
        with open(self.memory_path, 'w', encoding='utf-8') as f:
            json.dump(memory, f, indent=4, ensure_ascii=False)
        logger.info(f"Strategic context updated for task: {task_name}")

    def load_memory(self) -> Dict[str, Any]:
        """Loads the entire infra memory for the Agent to read."""
        if not os.path.exists(self.memory_path):
            return {}
        with open(self.memory_path, 'r', encoding='utf-8') as f:
            return json.load(f)
