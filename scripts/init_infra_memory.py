# -*- coding: utf-8 -*-
import sys
import os

# Add src to sys.path
sys.path.append("/Users/erickong/AgentSoftFactory/src")

from copaw.agents.infra.infra_memory_bridge import InfraMemoryBridge

def initialize_infra_agent():
    bridge = InfraMemoryBridge()
    
    # 1. Operating Principles v1.0
    principles = {
        "logic_isolation": {
            "scope": "/Users/erickong/AgentSoftFactory",
            "cross_border_approval": True,
            "forbidden_paths": ["~/.ssh", "~/.gnupg", "~/Documents"]
        },
        "environment_safety": {
            "impact_report_required": True,
            "explicit_confirmation_required": True
        },
        "destructive_actions": {
            "silent_rm_forbidden": True,
            "buffer_trash_dir": ".trash"
        },
        "audit": {
            "host_audit_log": "host_audit.log",
            "traceability": True
        },
        "secrets": {
            "forbidden_persistence": ["API_KEY", "TOKEN"]
        }
    }
    
    bridge.persist_principles(principles)
    
    # 2. Strategic Context
    bridge.update_strategic_context(
        task_name="Initialize ASF Infrastructure",
        goal="Establish a multi-agent software engineering team with shared infra memory and strict local safety constraints.",
        constraints=["Python 3.11", "No Docker", "Mac Silicon", "Digital Partner Integration"]
    )
    
    print("Infra Memory Initialized Successfully!")

if __name__ == "__main__":
    initialize_infra_agent()
