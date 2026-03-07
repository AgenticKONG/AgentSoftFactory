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
    """Triggers the Agent factory loop."""
    background_tasks.add_task(run_factory_task, project_id, req.mission_briefing)
    return {"status": "success", "message": "Factory launched in background."}
