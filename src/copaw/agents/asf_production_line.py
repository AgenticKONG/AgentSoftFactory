# -*- coding: utf-8 -*-
import json
import asyncio
import os
import logging
from typing import List, Dict, Any
from datetime import datetime
from ..app.event_store import asf_event_queue
from .model_factory import create_model_and_formatter

logger = logging.getLogger(__name__)

class ASFFactory:
    """The Sovereign Production Line for AgentSoft Factory."""

    def __init__(self, project_id: str, manifest: Dict[str, Any]):
        self.project_id = project_id
        self.manifest = manifest
        # Default model for common tasks
        self.model, self.formatter = create_model_and_formatter()
        self.project_path = os.path.join("/Users/erickong/AgentSoftFactory/projects", project_id)

    async def push_status(self, node_id: str, status: str, log: str):
        """Pushes events to UI and persists to project TIMELINE.md."""
        now = datetime.now()
        timestamp = now.isoformat()
        display_time = now.strftime("%Y-%m-%d %H:%M:%S")
        
        event = {
            "type": "asf_event",
            "project_id": self.project_id,
            "node_id": node_id,
            "status": status,
            "log": log,
            "timestamp": timestamp
        }
        
        if self.project_id not in asf_event_queue:
            asf_event_queue[self.project_id] = []
        asf_event_queue[self.project_id].append(json.dumps(event))
        
        # Physical archive
        timeline_path = os.path.join(self.project_path, "TIMELINE.md")
        if not os.path.exists(timeline_path):
            with open(timeline_path, 'w', encoding='utf-8') as f:
                f.write(f"# ⏳ Project Timeline: {self.project_id}\n\n")
        with open(timeline_path, 'a', encoding='utf-8') as f:
            icon = "🧠" if node_id == "pm" else "🎨" if node_id == "vd" else "💻" if node_id == "dev" else "🧪" if node_id == "qa" else "🚀"
            f.write(f"- [{display_time}] {icon} **{node_id.upper()}** ({status}): {log}\n")
        logger.info(f"[{node_id.upper()}] {status}: {log}")

    async def run_mission(self, briefing: str):
        """Routes to the correct topology based on Level."""
        level = self.manifest.get("meta", {}).get("level", "L1")
        category = self.manifest.get("meta", {}).get("category", "CLI")
        await self.push_status("user", "running", f"Mission Started. Level: {level}, Category: {category}")

        try:
            if level == "L1":
                await self._run_l1_linear(briefing)
            elif level == "L2":
                await self._run_l2_linear_qa(briefing)
            elif level in ["L3", "L4", "L5"]:
                if category in ["VIZ", "WEB"]: await self._run_design_flow(briefing)
                else: await self._run_l3_loop(briefing)
            
            # Save final manifest
            self.manifest["meta"]["status"] = "completed"
            with open(os.path.join(self.project_path, "project_manifest.json"), 'w') as f:
                json.dump(self.manifest, f, indent=4, ensure_ascii=False)
            await self.push_status("user", "finished", "Mission Accomplished.")
        except Exception as e:
            await self.push_status("user", "error", f"Fatal Error: {str(e)}")

    # --- STAGES WITH METRICS ---

    async def _pm_stage(self, briefing: str) -> str:
        await self.push_status("pm", "thinking", "Strategic Spec Drafting...")
        # (Future: Dynamic model selection based on manifest)
        resp = await self.model([{"role": "user", "content": f"Create SPEC for: {briefing}"}])
        content = resp.content[0]["text"]
        with open(os.path.join(self.project_path, "SPEC.md"), 'w') as f: f.write(content)
        await self.push_status("pm", "completed", "SPEC.md ready.")
        return content

    async def _dev_stage(self, spec: str, feedback: str = "") -> str:
        start_time = datetime.now()
        await self.push_status("dev", "thinking", "Coding in progress...")
        resp = await self.model([{"role": "user", "content": f"Build this: {spec}. Feedback: {feedback}"}])
        content = resp.content[0]["text"].replace("```html", "").replace("```", "").strip()
        
        # Write Main & Version
        with open(os.path.join(self.project_path, "index.html"), 'w') as f: f.write(content)
        h_dir = os.path.join(self.project_path, "history")
        os.makedirs(h_dir, exist_ok=True)
        v = len([f for f in os.listdir(h_dir) if f.endswith(".html")]) + 1
        with open(os.path.join(h_dir, f"v{v}_index.html"), 'w') as f: f.write(content)
        
        dur = (datetime.now() - start_time).total_seconds()
        await self.push_status("dev", "completed", f"Code v{v} ready. Took {dur}s")
        return content

    async def _qa_stage(self, code: str) -> str:
        await self.push_status("qa", "thinking", "Auditing...")
        resp = await self.model([{"role": "user", "content": f"Audit: {code}. End with DECISION: PASS or FAIL."}])
        content = resp.content[0]["text"]
        with open(os.path.join(self.project_path, "QA_REPORT.md"), 'w') as f: f.write(content)
        await self.push_status("qa", "completed", "Audit finished.")
        return content

    # --- FLOWS ---
    async def _run_l1_linear(self, b):
        s = await self._pm_stage(b)
        await self._dev_stage(s)

    async def _run_l2_linear_qa(self, b):
        s = await self._pm_stage(b)
        c = await self._dev_stage(s)
        await self._qa_stage(c)

    async def _run_l3_loop(self, b):
        max_i = 10
        s = await self._pm_stage(b)
        curr, passed, feedback = 1, False, ""
        while curr <= max_i and not passed:
            await self.push_status("dev", "loop", f"Iteration {curr}/{max_i}")
            c = await self._dev_stage(s, feedback)
            r = await self._qa_stage(c)
            if "DECISION: PASS" in r.upper(): passed = True
            else: feedback = r; curr += 1
        if not passed: raise Exception("Max iterations reached.")

    async def _run_design_flow(self, b):
        s = await self._pm_stage(b)
        await self.push_status("vd", "thinking", "Designing Style...")
        # (VD logic...)
        await self._dev_stage(s)
        await self._qa_stage("...")
