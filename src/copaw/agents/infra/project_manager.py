# -*- coding: utf-8 -*-
"""ASF Project Manager - The orchestrator for Multi-Agent Projects.

This module handles project lifecycle: initialization, team assembly, 
and status monitoring.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class ASFProjectManager:
    def __init__(self, root_dir: str = "/Users/erickong/AgentSoftFactory"):
        self.root_dir = root_dir
        self.projects_dir = os.path.join(self.root_dir, "projects")
        self.registry_path = os.path.join(self.projects_dir, "registry.json")
        
        if not os.path.exists(self.projects_dir):
            os.makedirs(self.projects_dir)

    def _load_registry(self) -> Dict[str, Any]:
        if os.path.exists(self.registry_path):
            with open(self.registry_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {"projects": []}

    def _save_registry(self, registry: Dict[str, Any]):
        with open(self.registry_path, 'w', encoding='utf-8') as f:
            json.dump(registry, f, indent=4, ensure_ascii=False)

    def init_project(self, project_id: str, name: str, description: str, team_template: str = "standard-v1"):
        """Initializes a new project directory and manifest."""
        project_path = os.path.join(self.projects_dir, project_id)
        if os.path.exists(project_path):
            print(f"Error: Project {project_id} already exists.")
            return

        os.makedirs(project_path)
        
        manifest = {
            "project_id": project_id,
            "meta": {
                "name": name,
                "description": description,
                "created_at": datetime.now().isoformat(),
                "status": "active"
            },
            "team": {
                "template": team_template,
                "agents": self._get_template_agents(team_template)
            },
            "metrics": {
                "total_loops": 0,
                "success_rate": 0.0,
                "avg_debug_cycles": 0
            }
        }

        manifest_path = os.path.join(project_path, "project_manifest.json")
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=4, ensure_ascii=False)

        # Update registry
        registry = self._load_registry()
        registry["projects"].append({
            "id": project_id,
            "name": name,
            "path": project_path
        })
        self._save_registry(registry)
        
        print(f"✅ Project '{name}' ({project_id}) initialized at {project_path}")

    def _get_template_agents(self, template: str) -> List[Dict[str, Any]]:
        """Returns agent configurations based on template."""
        if template == "visualization-team-v1":
            return [
                {"role": "PM", "skills": ["file_reader", "spec_gen"]},
                {"role": "DEV", "skills": ["file_io", "code_exec", "browser"]},
                {"role": "QA", "skills": ["playwright", "linter"]}
            ]
        # Default fallback
        return [{"role": "PM"}, {"role": "DEV"}, {"role": "QA"}]

    def list_projects(self):
        registry = self._load_registry()
        print("\n--- ASF Active Projects ---")
        for p in registry["projects"]:
            print(f"- [{p['id']}] {p['name']} (Path: {p['path']})")
        print("---------------------------\n")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="ASF Project Manager CLI")
    parser.add_argument("command", choices=["init", "list", "start"])
    parser.add_argument("--id", help="Project ID")
    parser.add_argument("--name", help="Project Name")
    parser.add_argument("--desc", help="Description")
    parser.add_argument("--template", default="standard-v1", help="Team template")

    args = parser.parse_args()
    mgr = ASFProjectManager()

    if args.command == "init":
        if not args.id or not args.name:
            print("Error: --id and --name are required for init.")
        else:
            mgr.init_project(args.id, args.name, args.desc or "", args.template)
    elif args.command == "list":
        mgr.list_projects()
