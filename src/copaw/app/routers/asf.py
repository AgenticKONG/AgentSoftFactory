# -*- coding: utf-8 -*-
import os
import json
import shutil
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Extra
from typing import Optional, List, Dict, Any
from ...agents.infra.project_manager import ASFProjectManager
from ...agents.asf_production_line import ASFFactory
from ..event_store import asf_event_queue

router = APIRouter(prefix="/asf", tags=["asf"])
mgr = ASFProjectManager()

# WebSocket connection manager for IC
class ICConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

ic_manager = ICConnectionManager()

# Helper to get Project Root safely
def get_project_root():
    # From: src/copaw/app/routers/asf.py -> Up 5 levels to root
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

class AgentConfig(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    role: str
    model: Optional[str] = "llama3.2"
    dna_prompt: Optional[str] = ""
    skills: Optional[List[str]] = []
    mcp: Optional[List[str]] = []
    class Config: extra = Extra.allow

class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    level: Optional[str] = None
    category: Optional[str] = None
    process: Optional[str] = None
    team_structure: Optional[str] = None
    mission_command: Optional[str] = None
    max_loops: Optional[int] = None
    max_sqa_loops: Optional[int] = None
    agents: Optional[List[AgentConfig]] = None

@router.get("/models/list")
async def list_available_models():
    from ...providers import list_providers, load_providers_json
    data = load_providers_json(); providers = list_providers(); all_models = []
    for p in providers:
        is_auth = False
        if p.id == "ollama":
            settings = data.providers.get(p.id)
            is_auth = bool(settings and settings.base_url)
        elif p.is_local: is_auth = True
        elif p.is_custom:
            cpd = data.custom_providers.get(p.id)
            is_auth = bool(cpd and (cpd.api_key or cpd.base_url))
        else:
            settings = data.providers.get(p.id)
            is_auth = bool(settings and settings.api_key)
        if not is_auth: continue
        models = list(p.models)
        settings = data.providers.get(p.id)
        if settings and not p.is_custom: models += list(settings.extra_models)
        for m in models:
            m_id = m if isinstance(m, str) else getattr(m, 'id', str(m))
            all_models.append({"id": m_id, "name": f"[{p.name}] {m_id}", "provider_id": p.id, "is_authorized": True})
    return all_models

@router.get("/market/list")
async def list_market_agents():
    p = os.path.join(get_project_root(), "copaw-data", "agents", "market.json")
    if os.path.exists(p): 
        with open(p, 'r') as f: return json.load(f)
    return []

@router.get("/market/agent/{agent_id}")
async def get_agent_detail(agent_id: str):
    p = os.path.join(get_project_root(), "copaw-data", "agents", agent_id, "soul.json")
    if os.path.exists(p):
        with open(p, 'r') as f: return json.load(f)
    raise HTTPException(status_code=404)
class ProjectCreateRequest(BaseModel):
    id: str
    name: str
    description: str
    specs: Dict[str, Any]

@router.get("/pc/rules")
async def get_pc_rules():
    return mgr.rules

@router.get("/pc/defaults")
async def get_pc_defaults(category: str, level: str):
    return mgr.get_pc_defaults(category, level)

@router.post("/projects/create")
async def create_project(req: ProjectCreateRequest):
    try:
        manifest = mgr.init_project(req.id, req.name, req.description, req.specs)
        return manifest
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/projects/list")
async def list_projects():
    try:
        projects = mgr.list_projects()
        return {"projects": projects}
    except Exception as e:
        print(f"Error listing projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/{project_id}")
async def get_project_detail(project_id: str):
    p_dir = mgr.projects_dir or os.path.join(get_project_root(), "projects")
    p = os.path.join(p_dir, project_id, "project_manifest.json")
    if os.path.exists(p):
        with open(p, 'r') as f: return json.load(f)
    raise HTTPException(status_code=404)

@router.post("/projects/{project_id}/update")
async def update_project(project_id: str, req: ProjectUpdateRequest):
    p_dir = mgr.projects_dir or os.path.join(get_project_root(), "projects")
    p_path = os.path.join(p_dir, project_id, "project_manifest.json")
    if not os.path.exists(p_path): raise HTTPException(status_code=404)
    with open(p_path, 'r') as f: manifest = json.load(f)
    
    if req.name: manifest["meta"]["name"] = req.name
    if req.level: manifest["meta"]["level"] = req.level
    if req.category: manifest["meta"]["category"] = req.category
    if req.process: manifest["meta"]["process"] = req.process
    if req.mission_command is not None: manifest["meta"]["mission_command"] = req.mission_command
    if req.max_loops is not None: manifest["meta"]["max_loops"] = req.max_loops
    if req.max_sqa_loops is not None: manifest["meta"]["max_sqa_loops"] = req.max_sqa_loops
    
    if req.team_structure: manifest["team"]["structure"] = req.team_structure
    if req.agents is not None:
        manifest["team"]["agents"] = [a.model_dump() for a in req.agents]
    
    with open(p_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=4, ensure_ascii=False)
    return {"status": "success"}

@router.post("/projects/{project_id}/launch")
async def launch_project(project_id: str, req: dict, background_tasks: BackgroundTasks):
    p_dir = mgr.projects_dir or os.path.join(get_project_root(), "projects")
    p_path = os.path.join(p_dir, project_id, "project_manifest.json")
    with open(p_path, 'r') as f: manifest = json.load(f)
    background_tasks.add_task(run_factory_task, project_id, manifest)
    return {"status": "success"}

@router.get("/projects/{project_id}/events/take")
async def take_project_events(project_id: str):
    """Fetch and clear events for a project (for Workstation polling)."""
    events = asf_event_queue.get(project_id, [])
    asf_event_queue[project_id] = []
    return events

async def run_factory_task(project_id: str, manifest: dict):
    try:
        factory = ASFFactory(project_id, manifest)
        await factory.run_mission(manifest['meta'].get('mission_command', ''))
    except Exception as e:
        root = get_project_root()
        t_path = os.path.join(root, "projects", project_id, "TIMELINE.md")
        try:
            with open(t_path, 'a', encoding='utf-8') as f:
                f.write(f"\n- [FATAL] {datetime.now().strftime('%H:%M:%S')} **SYSTEM**: Initialization failed: {str(e)}\n")
        except: pass
        print(f"P5 Task Failed: {str(e)}")

@router.get("/infra/info")
async def get_infra_info():
    root = get_project_root()
    soul_p = os.path.join(root, "copaw-data", "SOUL.md")
    state_p = os.path.join(root, "copaw-data", "infra", "infra_state.json")
    backlog_p = os.path.join(root, "copaw-data", "infra", "EVOLUTION_BACKLOG.md")
    info = {"soul": {"identity": "Infra Agent", "version": "1.1", "principles": []}, "state": {}, "evolution_backlog": "", "evolution_logs": []}
    if os.path.exists(soul_p):
        with open(soul_p, 'r') as f:
            lines = f.readlines()
            info["soul"]["principles"] = [l.strip().lstrip("- ").strip() for l in lines if l.strip().startswith("- ")]
    if os.path.exists(state_p):
        with open(state_p, 'r') as f:
            data = json.load(f)
            info["state"] = {"last_checkpoint": data.get("checkpoint", {}).get("id", "N/A"), "current_task": data.get("active_task", {}).get("name", "Idle"), "timestamp": data.get("checkpoint", {}).get("timestamp", "N/A")}
            # Support both old format (flat array) and new format (grouped by date)
            evolution_logs = data.get("evolution_logs", [])
            if evolution_logs and isinstance(evolution_logs[0], dict):
                if "date" in evolution_logs[0]:
                    # New grouped format: flatten with date prefix
                    flattened = []
                    for group in evolution_logs:
                        date = group.get("date", "")
                        for log in group.get("logs", []):
                            flattened.append({
                                "time": log.get("time", ""),
                                "action": log.get("action", ""),
                                "correction": log.get("correction", ""),
                                "date": date
                            })
                    info["evolution_logs"] = flattened
                else:
                    info["evolution_logs"] = evolution_logs
            else:
                info["evolution_logs"] = []
    if os.path.exists(backlog_p):
        with open(backlog_p, 'r') as f: info["evolution_backlog"] = f.read()
    return info

@router.get("/infra/chat/history")
async def get_infra_chat_history():
    root = get_project_root()
    session_path = os.path.expanduser("~/.copaw/sessions/architect_infra-governance.json")
    if not os.path.exists(session_path): return []
    try:
        with open(session_path, 'r', encoding='utf-8') as f: data = json.load(f)
        raw = data.get("agent", {}).get("memory", {}).get("content", [])
        history = []
        for turn in raw:
            if not turn or not isinstance(turn, list): continue
            msg = turn[0]
            content = msg.get("content")
            txt = content[0].get("text", "") if isinstance(content, list) else str(content)
            history.append({"role": msg.get("role"), "content": txt, "timestamp": msg.get("timestamp")})
        return history[-20:]
    except: return []

# WebSocket endpoint for real-time IC updates
@router.websocket("/infra/ws")
async def infra_websocket(websocket: WebSocket):
    """Real-time WebSocket for Infra Center updates."""
    await ic_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, wait for broadcasts
            data = await websocket.receive_text()
            # Echo back for ping/pong
            await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ic_manager.disconnect(websocket)

# SSE endpoint for streaming responses
@router.get("/infra/chat/stream")
async def infra_chat_stream():
    """SSE endpoint for streaming chat responses."""
    from fastapi.responses import StreamingResponse
    import asyncio
    
    async def event_generator():
        # Send initial event
        yield "event: connected\ndata: {\"status\":\"ready\"}\n\n"
        
        # Keep connection alive, check for new messages
        last_count = 0
        while True:
            await asyncio.sleep(2)
            # Check for new messages in session
            session_path = os.path.expanduser("~/.copaw/sessions/architect_infra-governance.json")
            if os.path.exists(session_path):
                try:
                    with open(session_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    raw = data.get("agent", {}).get("memory", {}).get("content", [])
                    if len(raw) > last_count:
                        # New messages available
                        yield f"event: update\ndata: {{\"new_count\":{len(raw)}}}\n\n"
                        last_count = len(raw)
                except: pass
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")
