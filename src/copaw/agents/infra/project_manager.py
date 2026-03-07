# -*- coding: utf-8 -*-
"""ASF Project Manager - The orchestrator for Multi-Agent Projects."""

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
        self.templates_dir = os.path.join(self.root_dir, "copaw-data", "templates")
        self.registry_path = os.path.join(self.projects_dir, "registry.json")
        
        if not os.path.exists(self.projects_dir): os.makedirs(self.projects_dir)
        if not os.path.exists(self.templates_dir): os.makedirs(self.templates_dir)

    def _load_registry(self) -> Dict[str, Any]:
        """Loads the projects registry from disk."""
        if os.path.exists(self.registry_path):
            with open(self.registry_path, 'r', encoding='utf-8') as f:
                try:
                    return json.load(f)
                except Exception as e:
                    logger.error(f"Failed to load registry: {e}")
                    return {"projects": []}
        return {"projects": []}

    def _save_registry(self, registry: Dict[str, Any]):
        """Saves the projects registry to disk."""
        with open(self.registry_path, 'w', encoding='utf-8') as f:
            json.dump(registry, f, indent=4, ensure_ascii=False)

    def list_templates(self) -> List[Dict[str, Any]]:
        """Scans the templates directory and returns all valid blueprints."""
        templates = []
        if os.path.exists(self.templates_dir):
            for filename in os.listdir(self.templates_dir):
                if filename.endswith(".json"):
                    with open(os.path.join(self.templates_dir, filename), 'r') as f:
                        try:
                            templates.append(json.load(f))
                        except Exception as e:
                            logger.warning(f"Failed to load template {filename}: {e}")
                            continue
        return templates

    def init_project(self, project_id: str, name: str, description: str, team_template: str = "viz-d3-v1"):
        """Initializes a new project directory using a template."""
        project_path = os.path.join(self.projects_dir, project_id)
        if os.path.exists(project_path):
            raise Exception(f"Project {project_id} already exists.")

        os.makedirs(project_path)
        
        # Load template data
        template_data = self._load_template(team_template)
        
        manifest = {
            "project_id": project_id,
            "meta": {
                "name": name,
                "description": description,
                "created_at": datetime.now().isoformat(),
                "status": "active"
            },
            "team": {
                "template_id": template_data.get("id", "default"),
                "agents": template_data.get("team", [])
            },
            "metrics": {"total_loops": 0, "success_rate": 0.0}
        }

        with open(os.path.join(project_path, "project_manifest.json"), 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=4, ensure_ascii=False)

        # Update registry
        registry = self._load_registry()
        registry["projects"].append({"id": project_id, "name": name, "path": project_path})
        self._save_registry(registry)
        return manifest

    def _load_template(self, template_id: str) -> Dict[str, Any]:
        """Loads a specific template JSON."""
        path = os.path.join(self.templates_dir, f"{template_id}.json")
        if os.path.exists(path):
            with open(path, 'r') as f:
                return json.load(f)
        return {
            "id": "default",
            "team": [{"role": "PM", "dna_prompt": "Generic PM"}, {"role": "DEV", "dna_prompt": "Generic DEV"}]
        }

    def list_projects(self):
        """Helper to list projects."""
        registry = self._load_registry()
        return registry.get("projects", [])
