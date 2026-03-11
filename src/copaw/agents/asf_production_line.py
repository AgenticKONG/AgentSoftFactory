# -*- coding: utf-8 -*-
import json
import asyncio
import os
import logging
import re
from typing import List, Dict, Any
from datetime import datetime
from ..app.event_store import asf_event_queue
from .model_factory import create_model_and_formatter

logger = logging.getLogger(__name__)

class ASFFactory:
    def __init__(self, project_id: str, manifest: Dict[str, Any]):
        self.project_id = project_id
        self.manifest = manifest
        file_path = os.path.abspath(__file__)
        self.root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(file_path))))
        if not self.root_dir or self.root_dir == "/":
            raise Exception("Critical: Could not resolve PROJECT_ROOT dynamically.")
        self.project_path = os.path.join(self.root_dir, "projects", project_id)
        self.agents = {}
        self._init_team()

    def _init_team(self):
        team = self.manifest.get("team", {}).get("agents", [])
        category = self.manifest.get("meta", {}).get("category", "").upper()
        role_map = {"pm": "pm", "dev": "dev", "junior-qa": "junior-qa", "senior-qa": "senior-qa"}
        for agent_cfg in team:
            raw_role = agent_cfg.get("role", "").lower()
            role = role_map.get(raw_role, raw_role)
            if not role: continue
            
            agent_id = agent_cfg.get("id") or role.upper()
            model_name = agent_cfg.get("model")
            
            # [P5 DEFENSE] If INFRA and role is DEV, DO NOT assign a model
            if category == "INFRA" and role == "dev":
                self.agents[role] = {"id": agent_id, "model": None, "formatter": None, "dna": "IA_CLI_DELIVERY"}
                continue

            soul = self._load_soul(agent_id)
            m_name = model_name or soul.get("capabilities", {}).get("models", ["llama3.2"])[0]
            model, formatter = create_model_and_formatter(model_id=m_name) 
            self.agents[role] = {
                "id": agent_id, "model": model, "formatter": formatter,
                "dna": agent_cfg.get("dna_prompt") or soul.get("dna_prompt", f"You are a {role}.")
            }

    def _load_soul(self, agent_id: str) -> Dict[str, Any]:
        if not agent_id: return {}
        soul_path = os.path.join(self.root_dir, "copaw-data", "agents", agent_id, "soul.json")
        if os.path.exists(soul_path):
            with open(soul_path, 'r', encoding='utf-8') as f:
                try: return json.load(f)
                except: return {}
        return {}

    async def _get_agent_resp(self, role: str, prompt: str) -> str:
        agent = self.agents.get(role)
        if not agent or not agent.get("model"):
            raise ValueError(f"Role {role} has no model assigned (Infra Sovereignty Protected).")
        try:
            full_prompt = f"SYSTEM: {agent['dna']}\nCONTEXT: {prompt}"
            resp = await agent["model"]([{"role": "user", "content": full_prompt}])
            if not resp or not hasattr(resp, 'content') or len(resp.content) == 0:
                raise ValueError(f"Empty response from {role}.")
            content = resp.content[0]
            if isinstance(content, dict):
                return content.get("text", content.get("content", str(content)))
            return getattr(content, "text", getattr(content, "content", str(content)))
        except Exception as e:
            logger.error(f"Agent {role} response error: {str(e)}")
            return f"ERROR: {str(e)}"

    async def push_status(self, node_id: str, status: str, log: str):
        now = datetime.now()
        event = {"type": "asf_event", "project_id": self.project_id, "node_id": node_id, "status": status, "log": log, "timestamp": now.isoformat()}
        if self.project_id not in asf_event_queue: asf_event_queue[self.project_id] = []
        asf_event_queue[self.project_id].append(json.dumps(event))
        os.makedirs(self.project_path, exist_ok=True)
        try:
            with open(os.path.join(self.project_path, "TIMELINE.md"), 'a', encoding='utf-8') as f:
                f.write(f"- [{now.strftime('%H:%M:%S')}] **{node_id.upper()}** ({status}): {log}\n")
        except: pass

    async def _dev_stage(self, spec: str, feedback: str = "") -> str:
        """
        [P5 INFRA SOVEREIGNTY]
        In INFRA tasks, DEV is strictly the physical source delivered by IA in CLI.
        NO GENERATION ALLOWED.
        """
        category = self.manifest.get("meta", {}).get("category", "").upper()
        target_path = os.path.join(self.root_dir, "console", "src", "pages", "InfraCenter", "index.tsx")
        
        if category == "INFRA":
            if feedback:
                await self.push_status("dev", "failed", "Audit Rejected. IA must fix this physically in CLI.")
                raise Exception("P5 Protocol: Manual intervention required for INFRA source.")
            
            if os.path.exists(target_path):
                with open(target_path, 'r') as f: content = f.read()
                await self.push_status("dev", "completed", "IA Brain delivered source from CLI.")
                return content
            else:
                raise Exception(f"Critical: Infra source path missing at {target_path}")
        
        # Non-INFRA still uses generation
        await self.push_status("dev", "thinking", "Non-Infra task: Calling model-based DEV...")
        return await self._get_agent_resp("dev", f"Build: {spec}. Feedback: {feedback}")

    def _evaluate_pass(self, report: str) -> bool:
        """STRICT P5 EVALUATION: Ultimate robustness with thinking support."""
        import re
        r = report.upper()
        if "DECISION: PASS" in r or "DECISION:PASS" in r or "RESULT: PASS" in r: return True
        clean_report = report.replace("'", '"')
        
        # Try to extract JSON from thinking content
        if "'thinking':" in report:
            think_match = re.search(r"'thinking':\s*'([^']+)'", report)
            if think_match:
                think_content = think_match.group(1).upper()
                if "PASS" in think_content and "FAIL" not in think_content:
                    return True
        
        json_matches = re.findall(r'\{.*\}', clean_report, re.DOTALL)
        for j_str in json_matches:
            try:
                data = json.loads(j_str)
                if isinstance(data, dict):
                    for key in ["decision", "status", "result", "verdict"]:
                        val = str(data.get(key, "")).upper()
                        if "PASS" in val: return True
                    thinking = str(data.get("thinking", "")).upper()
                    if "RESULT: PASS" in thinking or "DECISION: PASS" in thinking or "应该通过" in thinking or "结论应该是 PASS" in thinking:
                        return True
            except: continue
        if ("应该通过" in report or "符合要求" in report or "PASS" in r or "合格" in report) and ("不符合" not in report and "FAIL" not in r and "不合格" not in report):
            return True
        return False

    async def _run_p5_tiered_loop(self, briefing: str):
        max_total = self.manifest.get("meta", {}).get("max_loops", 10)
        max_sqa_loops = self.manifest.get("meta", {}).get("max_sqa_loops", 3)
        spec_path = os.path.join(self.project_path, "SPEC.md")
        with open(spec_path, 'r', encoding='utf-8') as f: spec = f.read()
        
        await self.push_status("user", "info", "P5 Loop Initialized (Sovereignty Mode).")
        curr_total, curr_sqa, passed, feedback = 1, 1, False, ""
        report_dir = os.path.join(self.project_path, "history")
        os.makedirs(report_dir, exist_ok=True)

        while curr_total <= max_total and curr_sqa <= max_sqa_loops and not passed:
            await self.push_status("user", "info", f"P5 Tiered Iteration (Total:{curr_total}, SQA:{curr_sqa})")
            code = await self._dev_stage(spec, feedback)
            
            await self.push_status("junior-qa", "thinking", "L1: Physical Consistency Check...")
            j_prompt = f"JSON_TASK: Audit CODE against SPEC. ONLY OUTPUT JSON: {{\"decision\": \"PASS\"/\"FAIL\", \"reason\": \"...\"}}\n\nCODE: {code}\nSPEC: {spec}"
            j_report = await self._get_agent_resp("junior-qa", j_prompt)
            
            with open(os.path.join(report_dir, f"P5_REPORT_T{curr_total}_STEP1_JQA.json"), 'w', encoding='utf-8') as f:
                json.dump({"iteration": curr_total, "step": "JQA", "report": j_report, "timestamp": datetime.now().isoformat()}, f, indent=4, ensure_ascii=False)

            if not self._evaluate_pass(j_report):
                await self.push_status("junior-qa", "failed", "L1 Filter Rejected.")
                feedback = j_report; continue
            
            await self.push_status("junior-qa", "completed", "L1 Filter Passed.")
            await self.push_status("senior-qa", "thinking", f"L2: Final Logic Audit (Attempt {curr_sqa})...")
            s_prompt = f"JSON_TASK: Audit LIVE URL against SPEC and CODE. ONLY OUTPUT JSON: {{\"decision\": \"PASS\"/\"FAIL\", \"reason\": \"...\"}}\n\nCODE: {code}\nSPEC: {spec}"
            s_report = await self._get_agent_resp("senior-qa", s_prompt)
            
            suffix = "PASS" if self._evaluate_pass(s_report) else "SFAIL"
            with open(os.path.join(report_dir, f"P5_REPORT_T{curr_total}_STEP2_SQA_{suffix}.json"), 'w', encoding='utf-8') as f:
                json.dump({"iteration": curr_total, "step": "SQA", "report": s_report, "timestamp": datetime.now().isoformat()}, f, indent=4, ensure_ascii=False)

            if self._evaluate_pass(s_report):
                passed = True
                await self.push_status("senior-qa", "completed", "L2 Logic PASS.")
            else:
                await self.push_status("senior-qa", "failed", "L2 Filter Rejected.")
                feedback = s_report; curr_sqa += 1
        
        if not passed: raise Exception("P5 Protocol Failed.")

    async def run_mission(self, briefing: str):
        process = self.manifest.get("meta", {}).get("process", "P1")
        try:
            if process == "P5": await self._run_p5_tiered_loop(briefing)
            else: await self._get_agent_resp("dev", briefing)
            self.manifest["meta"]["status"] = "completed"
            with open(os.path.join(self.project_path, "project_manifest.json"), 'w') as f: json.dump(self.manifest, f, indent=4, ensure_ascii=False)
            await self.push_status("user", "finished", "Mission Accomplished.")
        except Exception as e:
            await self.push_status("user", "error", f"Fatal: {str(e)}")
