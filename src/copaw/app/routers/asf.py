# -*- coding: utf-8 -*-
import os
import json
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ...agents.infra.project_manager import ASFProjectManager
from ...agents.asf_production_line import ASFFactory
from ..event_store import asf_event_queue

router = APIRouter(prefix="/asf", tags=["asf"])
mgr = ASFProjectManager()

class ProjectInitRequest(BaseModel):
    project_id: str
    name: str
    description: Optional[str] = ""
    template: Optional[str] = "L1-script-python"
    level: Optional[str] = "L1"
    category: Optional[str] = "CLI"

class AgentConfig(BaseModel):
    role: str
    model: Optional[str] = "llama3.2"
    dna_prompt: Optional[str] = ""

class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    level: Optional[str] = None
    category: Optional[str] = None
    mission_command: Optional[str] = None
    agents: Optional[List[AgentConfig]] = None

class LaunchRequest(BaseModel):
    mission_briefing: str

@router.get("/models/list")
async def list_available_models():
    """Returns a flat list of all models from all providers."""
    from ...providers import list_providers, load_providers_json
    data = load_providers_json()
    providers = list_providers()
    all_models = []
    for p in providers:
        models = list(p.models)
        settings = data.providers.get(p.id)
        if settings and not p.is_custom:
            models += list(settings.extra_models)
        for m in models:
            m_id = m if isinstance(m, str) else getattr(m, 'id', str(m))
            all_models.append({"id": m_id, "name": f"{p.name}: {m_id}", "provider_id": p.id})
    return all_models

@router.get("/market/list")
async def list_market_agents():
    """Returns the list of all master agents available in the market."""
    market_path = "/Users/erickong/AgentSoftFactory/copaw-data/agents/market.json"
    if not os.path.exists(market_path):
        return []
    with open(market_path, 'r', encoding='utf-8') as f:
        return json.load(f)

@router.get("/projects/templates")
async def list_templates():
    return mgr.list_templates()

@router.post("/projects/init")
async def init_project(req: ProjectInitRequest):
    try:
        mgr.init_project(req.project_id, req.name, req.description, req.template, level=req.level, category=req.category)
        return {"status": "success", "message": f"Project {req.name} initialized."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/list")
async def list_projects():
    return mgr.list_projects()

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
    if req.level: manifest["meta"]["level"] = req.level
    if req.category: manifest["meta"]["category"] = req.category
    if req.mission_command: manifest["meta"]["mission_command"] = req.mission_command
    if req.agents: manifest["team"]["agents"] = [a.dict() for a in req.agents]
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=4, ensure_ascii=False)
    return {"status": "success", "message": "Project configuration updated."}

@router.get("/infra/chat/history")
async def get_infra_chat_history():
    from ..runner.runner import WORKING_DIR
    session_path = WORKING_DIR / "sessions" / "architect_infra-governance.json"
    if not session_path.exists(): return []
    try:
        with open(session_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        raw_content = data.get("agent", {}).get("memory", {}).get("content", [])
        history = []
        for turn in raw_content:
            if not turn or not isinstance(turn, list) or len(turn) == 0: continue
            msg = turn[0]
            content = msg.get("content")
            text_parts = []
            if isinstance(content, list):
                for block in content:
                    if block.get("type") == "text": text_parts.append(block.get("text", ""))
            elif isinstance(content, str): text_parts.append(content)
            history.append({"role": msg.get("role"), "content": "\n".join(text_parts), "timestamp": msg.get("timestamp")})
        return history[-20:]
    except: return []

@router.get("/projects/{project_id}/events/take")
async def take_events(project_id: str):
    if project_id not in asf_event_queue: return []
    events = asf_event_queue[project_id][:]
    asf_event_queue[project_id] = []
    return [{"text": e} for e in events]

async def run_factory_task(project_id: str, briefing: str):
    project_path = os.path.join(mgr.projects_dir, project_id)
    manifest_path = os.path.join(project_path, "project_manifest.json")
    with open(manifest_path, 'r') as f:
        manifest = json.load(f)
    factory = ASFFactory(project_id, manifest)
    await factory.run_mission(briefing)

@router.post("/projects/{project_id}/launch")
async def launch_project(project_id: str, req: LaunchRequest, background_tasks: BackgroundTasks):
    print(f"--- 🚀 ASF FACTORY: BACKGROUND MISSION START [{project_id}] ---")
    project_path = os.path.join(mgr.projects_dir, project_id)
    manifest_path = os.path.join(project_path, "project_manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        manifest["meta"]["mission_command"] = req.mission_briefing
        manifest["meta"]["status"] = "running"
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=4, ensure_ascii=False)
    background_tasks.add_task(run_factory_task, project_id, req.mission_briefing)
    return {"status": "success", "message": f"Factory launched for {project_id}."}

@router.get("/infra/info")
async def get_infra_info():
    soul_path = "/Users/erickong/AgentSoftFactory/copaw-data/SOUL.md"
    state_path = "/Users/erickong/AgentSoftFactory/copaw-data/infra/infra_state.json"
    backlog_path = "/Users/erickong/AgentSoftFactory/copaw-data/infra/EVOLUTION_BACKLOG.md"
    info = {"soul": {"identity": "Infra Agent", "version": "1.0", "principles": []}, "state": {}, "evolution_backlog": "", "evolution_logs": []}
    if os.path.exists(soul_path):
        with open(soul_path, 'r') as f:
            content = f.read()
            info["soul"]["principles"] = [l.strip("- ") for l in content.split("\n") if l.strip().startswith("- ")]
    if os.path.exists(state_path):
        with open(state_path, 'r') as f:
            data = json.load(f)
            info["state"] = data.get("checkpoint", {})
            info["evolution_logs"] = data.get("actions", [])
    if os.path.exists(backlog_path):
        with open(backlog_path, 'r') as f:
            info["evolution_backlog"] = f.read()
    return info
