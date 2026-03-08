# -*- coding: utf-8 -*-
import os
import json
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ...agents.infra.project_manager import ASFProjectManager
from ...agents.factory_coordinator import SoftwareFactory

router = APIRouter(prefix="/asf", tags=["ASF"])
mgr = ASFProjectManager()

class ProjectInitRequest(BaseModel):
    project_id: str
    name: str
    description: Optional[str] = ""
    template: Optional[str] = "standard-v1"

class AgentConfig(BaseModel):
    role: str
    model: Optional[str] = "llama3.2"
    skills: List[str] = []

class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    agents: Optional[List[AgentConfig]] = None

class LaunchRequest(BaseModel):
    mission_briefing: str

async def run_factory_task(project_id: str, briefing: str):
    """Background task to run the agent loop."""
    project_path = os.path.join(mgr.projects_dir, project_id)
    manifest_path = os.path.join(project_path, "project_manifest.json")
    with open(manifest_path, 'r') as f:
        manifest = json.load(f)
    
    factory = SoftwareFactory(project_id, manifest)
    await factory.run_mission(briefing)

from ..event_store import asf_event_queue

from ..runner.runner import WORKING_DIR

@router.get("/infra/chat/history")
async def get_infra_chat_history():
    """Returns the persistent chat history for the infra-governance session."""
    session_path = WORKING_DIR / "sessions" / "architect_infra-governance.json"
    if not session_path.exists():
        return []

    try:
        with open(session_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Extract messages from AgentScope JSON format
        # Format: data['agent']['memory']['content'] = [[MsgUser, []], [MsgAssistant, []], ...]
        raw_content = data.get("agent", {}).get("memory", {}).get("content", [])

        history = []
        for turn in raw_content:
            if not turn or not isinstance(turn, list) or len(turn) == 0:
                continue

            msg = turn[0]
            role = msg.get("role")

            # Extract text from blocks
            text_parts = []
            content = msg.get("content")
            if isinstance(content, list):
                for block in content:
                    if block.get("type") == "text":
                        text_parts.append(block.get("text", ""))
                    elif block.get("type") == "tool_use":
                        text_parts.append(f"[Tool Call: {block.get('name')}]")
                    elif block.get("type") == "tool_result":
                        text_parts.append(f"[Tool Result: {block.get('name')}]")
            elif isinstance(content, str):
                text_parts.append(content)

            history.append({
                "role": role,
                "content": "\\n".join(text_parts),
                "timestamp": msg.get("timestamp")
            })

        # Return only last 20 messages for UI performance
        return history[-20:]

    except Exception as e:
        print(f"Error reading history: {e}")
        return []

@router.get("/infra/info")

async def get_infra_info():
    """Returns the unified identity, state, and evolution backlog of the Infra Agent."""
    soul_path = "/Users/erickong/AgentSoftFactory/copaw-data/SOUL.md"
    state_path = "/Users/erickong/AgentSoftFactory/copaw-data/infra/infra_state.json"
    backlog_path = "/Users/erickong/AgentSoftFactory/copaw-data/infra/EVOLUTION_BACKLOG.md"
    
    # 1. Parse SOUL.md
    principles = []
    identity = "Infra Agent"
    if os.path.exists(soul_path):
        with open(soul_path, 'r') as f:
            lines = f.readlines()
            for line in lines:
                if "Identity:" in line: identity = line.split("Identity:")[-1].strip()
                if line.strip().startswith("- **") or line.strip().startswith("1."):
                    principles.append(line.strip())
    
    # 2. Load State
    state = {}
    if os.path.exists(state_path):
        with open(state_path, 'r') as f:
            state = json.load(f)
    
    # 3. Load Backlog
    backlog_content = ""
    if os.path.exists(backlog_path):
        with open(backlog_path, 'r') as f:
            backlog_content = f.read()
            
    return {
        "soul": {
            "version": "1.0",
            "identity": identity,
            "principles": principles if principles else ["Safety", "Audit", "Evolution"]
        },
        "state": {
            "last_checkpoint": state.get("checkpoint", {}).get("id", "UNKNOWN"),
            "timestamp": state.get("checkpoint", {}).get("timestamp", "N/A"),
            "current_task": state.get("active_task", {}).get("name", "Idle")
        },
        "evolution_backlog": backlog_content,
        "evolution_logs": state.get("evolution_logs", [])
    }


@router.get("/projects/{project_id}/events/take")
async def take_events(project_id: str):
    """Pops all available events for the given project."""
    if project_id not in asf_event_queue:
        return []
    events = asf_event_queue[project_id][:]
    asf_event_queue[project_id] = []
    return [{"text": e} for e in events]

@router.get("/projects/templates")
async def list_templates():
    """Returns the list of available project blueprints."""
    return mgr.list_templates()

@router.post("/projects/init")
async def init_project(req: ProjectInitRequest):

    try:
        mgr.init_project(req.project_id, req.name, req.description, req.template)
        return {"status": "success", "message": f"Project {req.name} initialized."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/list")
async def list_projects():
    registry = mgr._load_registry()
    return registry["projects"]

@router.get("/projects/{project_id}")
async def get_project_detail(project_id: str):
    project_path = os.path.join(mgr.projects_dir, project_id)
    manifest_path = os.path.join(project_path, "project_manifest.json")
    if not os.path.exists(manifest_path):
        raise HTTPException(status_code=404, detail="Project manifest not found.")
    with open(manifest_path, 'r', encoding='utf-8') as f:
        return json.load(f)

@router.post("/projects/{project_id}/update")
async def update_project(project_id: str, req: ProjectUpdateRequest):
    project_path = os.path.join(mgr.projects_dir, project_id)
    manifest_path = os.path.join(project_path, "project_manifest.json")
    if not os.path.exists(manifest_path):
        raise HTTPException(status_code=404, detail="Project not found.")
    
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    
    if req.name: manifest["meta"]["name"] = req.name
    if req.description: manifest["meta"]["description"] = req.description
    if req.agents: manifest["team"]["agents"] = [a.dict() for a in req.agents]
    
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=4, ensure_ascii=False)
    
    return {"status": "success", "message": "Project configuration updated."}

@router.post("/projects/{project_id}/launch")
async def launch_project(project_id: str, req: LaunchRequest, background_tasks: BackgroundTasks):
    """Triggers the Agent factory loop in the background."""
    print(f"--- 🚀 ASF FACTORY: BACKGROUND MISSION START [{project_id}] ---")
    background_tasks.add_task(run_factory_task, project_id, req.mission_briefing)
    return {"status": "success", "message": "Factory launched in background."}


