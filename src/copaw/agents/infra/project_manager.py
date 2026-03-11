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
        
        # Dynamic path resolution for rules
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.rules_path = os.path.join(base_dir, "config", "pc_rules.json")
        
        if not os.path.exists(self.projects_dir): os.makedirs(self.projects_dir)
        if not os.path.exists(self.templates_dir): os.makedirs(self.templates_dir)
        self.rules = self._load_rules()

    def _load_rules(self) -> Dict[str, Any]:
        """Loads digitized governance rules from pc_rules.json."""
        if os.path.exists(self.rules_path):
            with open(self.rules_path, 'r', encoding='utf-8') as f:
                try:
                    return json.load(f)
                except:
                    logger.error("Failed to parse pc_rules.json")
                    return {}
        return {}

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

    def list_projects(self):
        """Helper to list projects from registry."""
        registry = self._load_registry()
        return registry.get("projects", [])

    def get_pc_defaults(self, category: str, level: str) -> Dict[str, Any]:
        """Provides default T-P-F specs based on L-C selection (Contract Validation)."""
        category_info = self.rules.get("categories", {}).get(category, {})
        level_info = self.rules.get("levels", {}).get(level, {})
        
        # Base defaults
        team = "T1"
        process = "P1"
        
        # Apply auto-upgrades from rules
        for upgrade in self.rules.get("constraints", {}).get("auto_upgrades", []):
            trigger = upgrade.get("trigger", {})
            if trigger.get("category") == category and trigger.get("level") == level:
                team = upgrade.get("apply", {}).get("team", team)
                process = upgrade.get("apply", {}).get("process", process)
            elif trigger.get("level") == level and not trigger.get("category"):
                team = upgrade.get("apply", {}).get("team", team)
                process = upgrade.get("apply", {}).get("process", process)

        # Hard Rule: INFRA sovereignty
        if category == "INFRA":
            team = "T5"
            process = "P5"
            if self.rules.get("levels", {}).get(level, {}).get("rank", 0) < 3:
                level = "L3" 

        return {
            "category": category,
            "level": level,
            "team": team,
            "process": process,
            "max_loops": level_info.get("default_max_loops", 10),
            "sovereign_agent": category_info.get("sovereign_agent", "DEV")
        }

    def init_project(self, project_id: str, name: str, description: str, specs: Dict[str, Any]):
        """Initializes a project with STRICT validated L-C-T-P-F specs."""
        project_path = os.path.join(self.projects_dir, project_id)
        if os.path.exists(project_path):
            raise Exception(f"Project {project_id} already exists.")

        # PC CONTRACT VALIDATION
        category = specs.get("category", "FRONT")
        level = specs.get("level", "L1")
        team_id = specs.get("team", "T1")
        process_id = specs.get("process", "P1")
        
        # Hard Constraint: P5 requires INFRA + L3+ + T5
        if process_id == "P5":
            if category != "INFRA":
                raise Exception("Governance Error: P5 process requires INFRA category.")
            level_rank = self.rules.get("levels", {}).get(level, {}).get("rank", 0)
            if level_rank < 3:
                raise Exception("Governance Error: P5 process requires Level L3 or higher.")
            if team_id != "T5":
                raise Exception("Governance Error: P5 process requires Team T5.")
        
        for rule in self.rules.get("constraints", {}).get("hard_rules", []):
            cond = rule.get("condition", {})
            if cond.get("category") == category:
                must = rule.get("must_have", {})
                current_rank = self.rules.get("levels", {}).get(level, {}).get("rank", 0)
                min_rank = self.rules.get("levels", {}).get(must.get("min_level"), {}).get("rank", 0)
                
                violation = False
                if current_rank < min_rank: violation = True
                if must.get("dev") == "IA" and team_id != "T5": violation = True
                if must.get("process") and process_id != must["process"]: violation = True
                
                if violation:
                    raise Exception(f"Governance Error: {rule.get('error_msg')}")

        os.makedirs(project_path)
        
        team_roles = self.rules.get("teams", {}).get(team_id, ["PM", "DEV"])
        team_agents = [{"role": role} for role in team_roles]
        
        if team_id == "T5":
            team_agents = [
                {"role": "DEV", "id": "infra-agent", "name": "Infra Agent (Me)"}, 
                {"role": "Junior-QA", "id": "llama3.2"}, 
                {"role": "Senior-QA", "id": "glm-4.7"}
            ]

        manifest = {
            "project_id": project_id,
            "meta": {
                "name": name,
                "description": description,
                "status": "IDEATION",
                "created_at": datetime.now().isoformat(),
            },
            "specs": {
                "category": category,
                "level": level,
                "team": team_id,
                "process": process_id,
                "max_loops": specs.get("max_loops", 10),
                "f_memo": []
            },
            "team": {
                "structure": team_id,
                "agents": team_agents
            },
            "metrics": {"total_loops": 0, "success_rate": 0.0}
        }

        with open(os.path.join(project_path, "project_manifest.json"), 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=4, ensure_ascii=False)

        registry = self._load_registry()
        registry["projects"].append({
            "id": project_id, 
            "name": name, 
            "path": project_path,
            "category": category,
            "level": level
        })
        self._save_registry(registry)
        return manifest
