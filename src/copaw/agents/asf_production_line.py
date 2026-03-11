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
        # src/copaw/agents/asf_production_line.py -> up 4 levels to get to project root
        self.root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(file_path))))
        self.project_path = os.path.join(self.root_dir, "projects", project_id)
        
        if not os.path.exists(self.project_path):
            os.makedirs(self.project_path, exist_ok=True)
            
        self.agents = {}
        self._init_team()

    def _init_team(self):
        team = self.manifest.get("team", {}).get("agents", [])
        
        # [ULTIMATE RESOLUTION] Priority: specs.category -> meta.category -> project_id prefix
        specs = self.manifest.get("specs", {})
        meta = self.manifest.get("meta", {})
        category = (specs.get("category") or meta.get("category") or "").upper()
        
        # Safety fallback: If ID starts with infra-, it IS infra.
        if not category and self.project_id.startswith("infra-"):
            category = "INFRA"
            
        role_map = {"pm": "pm", "dev": "dev", "junior-qa": "junior-qa", "senior-qa": "senior-qa"}
        for agent_cfg in team:
            raw_role = agent_cfg.get("role", "").lower()
            role = role_map.get(raw_role, raw_role)
            if not role: continue
            
            agent_id = agent_cfg.get("id") or role.upper()
            model_name = agent_cfg.get("model")
            
            # [P5 DEFENSE] INFRA Sovereignty check
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
        
        t_path = os.path.join(self.project_path, "TIMELINE.md")
        try:
            with open(t_path, 'a', encoding='utf-8') as f:
                f.write(f"- [{now.strftime('%H:%M:%S')}] **{node_id.upper()}** ({status}): {log}\n")
                f.flush()
        except: pass

    async def _dev_stage(self, spec: str, feedback: str = "") -> str:
        """
        [P5 INFRA SOVEREIGNTY]
        In INFRA tasks, DEV is strictly the physical source delivered by IA in CLI.
        NO GENERATION ALLOWED.
        """
        specs = self.manifest.get("specs", {})
        meta = self.manifest.get("meta", {})
        category = (specs.get("category") or meta.get("category") or "").upper()
        if not category and self.project_id.startswith("infra-"): category = "INFRA"
        
        # [P5 DYNAMIC AUDIT] Use specs.target_files if defined
        target_files = specs.get("target_files", [])
        
        if category == "INFRA":
            if feedback:
                await self.push_status("dev", "failed", "Audit Rejected. IA must fix this physically in CLI.")
                raise Exception("P5 Protocol: Manual intervention required for INFRA source.")
            
            content = ""
            if target_files:
                await self.push_status("dev", "info", f"Specs defined {len(target_files)} target files. Loading...")
                for rel_path in target_files:
                    abs_path = os.path.normpath(os.path.join(self.root_dir, rel_path))
                    if os.path.exists(abs_path):
                        with open(abs_path, 'r') as f:
                            content += f"\n\n// --- FILE: {rel_path} ---\n" + f.read()
                        await self.push_status("dev", "info", f"Successfully loaded: {rel_path}")
                    else:
                        await self.push_status("dev", "error", f"Target file MISSING: {rel_path} (Full path: {abs_path})")
            else:
                # Fallback to legacy path
                await self.push_status("dev", "info", "No target_files found in specs. Using legacy InfraCenter fallback.")
                legacy_path = os.path.join(self.root_dir, "console", "src", "pages", "InfraCenter", "index.tsx")
                if os.path.exists(legacy_path):
                    with open(legacy_path, 'r') as f: content = f.read()
            
            if content:
                await self.push_status("dev", "completed", f"IA delivered physical source bundle ({len(content)} chars).")
                return content
            else:
                raise Exception(f"Critical: No valid audit targets could be loaded for INFRA mission.")
        
        # Non-INFRA still uses generation
        await self.push_status("dev", "thinking", "Non-Infra task: Calling model-based DEV...")
        return await self._get_agent_resp("dev", f"Build: {spec}. Feedback: {feedback}")

    def _evaluate_pass(self, report: str) -> bool:
        """STRICT P5 EVALUATION: Ultimate robustness with thinking support."""
        import re
        r = report.upper()
        
        # 1. Direct PASS/FAIL in response
        if "DECISION: PASS" in r or "DECISION:PASS" in r or "RESULT: PASS" in r:
            return True
        if "DECISION: FAIL" in r or "DECISION:FAIL" in r or "RESULT: FAIL" in r:
            return False
            
        # 2. JSON with decision field
        clean_report = report.replace("'", '"')
        json_matches = re.findall(r'\{.*\}', clean_report, re.DOTALL)
        for j_str in json_matches:
            try:
                data = json.loads(j_str)
                if isinstance(data, dict):
                    for key in ["decision", "status", "result", "verdict", "judgment"]:
                        val = str(data.get(key, "")).upper()
                        if "PASS" in val: return True
                        if "FAIL" in val: return False
            except: continue
        
        # 3. Extract from thinking/reasoning content (various formats)
        # Pattern: "thinking": "..." or "reason": "..." or "analysis": "..."
        think_patterns = [
            r'"thinking":\s*"([^"]+)"',
            r"'thinking':\s*'([^']+)'",
            r'"reason":\s*"([^"]+)"',
            r'"analysis":\s*"([^"]+)"',
            r'Thinking:\s*([^\n]+)',
        ]
        for pattern in think_patterns:
            matches = re.findall(pattern, report, re.IGNORECASE)
            for match in matches:
                match_upper = match.upper()
                # If reasoning clearly says PASS
                if "PASS" in match_upper and "FAIL" not in match_upper:
                    return True
                if "FAIL" in match_upper and "PASS" not in match_upper:
                    return False
                # Chinese keywords
                if "通过" in match or "合格" in match or "满足" in match:
                    if "不通过" not in match and "不合格" not in match:
                        return True
                if "不通过" in match or "失败" in match:
                    if "不" not in match or "不会失败" not in match:
                        return False
        
        # 4. Check for explicit decision in JSON
        # Look for "decision": "PASS" or 'decision': 'PASS' patterns
        json_decision_patterns = [
            r'["\']decision["\']\s*:\s*["\'](PASS|FAIL)["\']',
            r'decision["\']?\s*[:=]\s*["\']?(PASS|FAIL)',
        ]
        for pattern in json_decision_patterns:
            matches = re.findall(pattern, report, re.IGNORECASE)
            for match in matches:
                if match.upper() == "PASS":
                    return True
                if match.upper() == "FAIL":
                    return False
        
        # 5. Check for explicit decision patterns in text
        decision_patterns = [
            r'decision\s+is\s+(pass|fail)',
            r'decision:\s*(pass|fail)',
            r'verdict\s+is\s+(pass|fail)',
            r'final\s+verdict\s*[:\s]+(pass|fail)',
            r'verdict\s*[:=]\s*(pass|fail)',
            r'结论[是为]*\s*(通过|失败|合格)',
            r'判断[是为]*\s*(通过|失败|合格)',
        ]
        
        # 5. Fallback: Chinese/English keywords
        # If explicitly mentions failure/mismatch, it's a FAIL
        if ("不满足" in report or "不匹配" in report or "不符合" in report or "mismatch" in r or "violation" in r or "fail" in r) and ("通过" not in report and "pass" not in r):
            return False
            
        if ("应该通过" in report or "符合要求" in report or "合格" in report or "pass" in r) and ("不符合" not in report and "不满足" not in report and "mismatch" not in r and "violation" not in r):
            return True
            
        return False

    async def _run_p5_tiered_loop(self, briefing: str):
        specs = self.manifest.get("specs", {})
        max_total = specs.get("max_loops", self.manifest.get("meta", {}).get("max_loops", 10))
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
        specs = self.manifest.get("specs", {})
        meta = self.manifest.get("meta", {})
        process = specs.get("process") or meta.get("process") or "P1"
        try:
            if process == "P5": await self._run_p5_tiered_loop(briefing)
            else: await self._get_agent_resp("dev", briefing)
            self.manifest["meta"]["status"] = "completed"
            with open(os.path.join(self.project_path, "project_manifest.json"), 'w') as f: json.dump(self.manifest, f, indent=4, ensure_ascii=False)
            await self.push_status("user", "finished", "Mission Accomplished.")
        except Exception as e:
            await self.push_status("user", "error", f"Fatal: {str(e)}")
