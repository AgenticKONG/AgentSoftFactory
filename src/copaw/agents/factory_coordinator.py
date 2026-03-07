# -*- coding: utf-8 -*-
import json
import asyncio
import os
import logging
from typing import List, Dict, Any
from agentscope.message import Msg
from ..app.event_store import asf_event_queue
from .model_factory import create_model_and_formatter

logger = logging.getLogger(__name__)

class SoftwareFactory:
    """Orchestrates a project-specific team with automated Refinement Loops."""

    def __init__(self, project_id: str, manifest: Dict[str, Any]):
        self.project_id = project_id
        self.manifest = manifest
        self.model, self.formatter = create_model_and_formatter()

    async def push_status(self, node_id: str, status: str, log: str):
        """Pushes event to the centralized Event Store."""
        event = {
            "type": "asf_event",
            "project_id": self.project_id,
            "node_id": node_id,
            "status": status,
            "log": log
        }
        if self.project_id not in asf_event_queue:
            asf_event_queue[self.project_id] = []
        asf_event_queue[self.project_id].append(json.dumps(event))

    async def run_mission(self, mission_briefing: str):
        """Production loop with DEV <-> QA Refinement Loop."""
        import random
        session_id = random.randint(1000, 9999)
        print(f"--- 🚀 ASF FACTORY: GOVERNANCE MISSION [{session_id}] STARTING ---")
        
        # 0. Initial Cleanup
        from ..app.event_store import asf_event_queue
        asf_event_queue[self.project_id] = []
        
        try:
            # --- 1. PM STAGE ---
            print("[PM] Analyzing requirements...")
            await self.push_status("pm", "thinking", "PM is drafting SPEC...")
            
            pm_prompt = f"You are a Product Manager. Create a detailed technical SPEC for: {mission_briefing}. Focus on D3.js v7, tooltips, and data data/gdp_china.csv."
            pm_response = await self.model([{"role": "user", "content": pm_prompt}])
            spec_content = pm_response.content[0]["text"]
            
            spec_path = os.path.join("/Users/erickong/AgentSoftFactory/projects", self.project_id, "SPEC.md")
            with open(spec_path, 'w', encoding='utf-8') as f:
                f.write(spec_content)
            
            await self.push_status("pm", "completed", "SPEC.md is ready.")
            print(f"--- ✅ PM DONE ---")

            # --- REFINEMENT LOOP (DEV <-> QA) ---
            max_iterations = 3
            current_iteration = 1
            is_passed = False
            last_qa_report = ""
            current_code = ""

            while current_iteration <= max_iterations and not is_passed:
                print(f"--- 🔄 ITERATION {current_iteration}/{max_iterations} STARTING ---")
                
                # 2. DEV STAGE
                await self.push_status("dev", "thinking", f"DEV is coding (Iteration {current_iteration})...")
                
                if current_iteration == 1:
                    dev_prompt = (
                        f"You are a Senior D3.js Developer. Based on this SPEC: {spec_content}, write a complete index.html.\n"
                        "STRICT RULES:\n"
                        "1. ALL CSS must be inside <style> tags.\n"
                        "2. ALL JavaScript must be inside <script> tags.\n"
                        "3. NO external files like script.js or style.css.\n"
                        "4. Use d3.v7.min.js from CDN.\n"
                        "5. Data is at 'data/gdp_china.csv'.\n"
                        "Output ONLY the full HTML code."
                    )
                else:
                    dev_prompt = (
                        f"Your previous code had issues. FIX them based on this QA Report: \n\n{last_qa_report}\n\n"
                        "STRICT RULE: Output ONLY the full fixed index.html code as a SINGLE FILE."
                    )
                
                dev_response = await self.model([{"role": "user", "content": dev_prompt}])
                current_code = dev_response.content[0]["text"].replace("```html", "").replace("```", "").strip()
                
                html_path = os.path.join("/Users/erickong/AgentSoftFactory/projects", self.project_id, "index.html")
                with open(html_path, 'w', encoding='utf-8') as f:
                    f.write(current_code)
                
                await self.push_status("dev", "completed", f"Code generated (v{current_iteration}).")

                # 3. QA STAGE
                await self.push_status("qa", "thinking", f"QA is auditing Iteration {current_iteration}...")
                
                qa_prompt = (
                    f"You are a strict QA Engineer. Review this code: \n\n{current_code}\n\n"
                    "At the end of your report, YOU MUST include exactly one of these lines:\n"
                    "DECISION: PASS\n"
                    "DECISION: FAIL"
                )
                
                qa_response = await self.model([{"role": "user", "content": qa_prompt}])
                last_qa_report = qa_response.content[0]["text"]
                
                report_path = os.path.join("/Users/erickong/AgentSoftFactory/projects", self.project_id, "QA_REPORT.md")
                with open(report_path, 'w', encoding='utf-8') as f:
                    f.write(last_qa_report)
                
                # Enhanced matching logic
                report_upper = last_qa_report.upper()
                if "DECISION" in report_upper and "PASS" in report_upper.split("DECISION")[-1]:
                    is_passed = True
                    await self.push_status("qa", "completed", "QA PASSED! Code is production-ready.")
                else:
                    await self.push_status("qa", "error", f"QA FAILED (Iter {current_iteration}). Re-routing to DEV...")
                    current_iteration += 1


            if not is_passed:
                await self.push_status("user", "error", "Max iterations reached without QA PASS. Human intervention required.")
                print("--- 🛑 MISSION STALLED: Max Iterations Reached ---")
            else:
                await self.push_status("user", "finished", "Mission Accomplished after refinement!")
                print("--- 🏆 ASF FACTORY: MISSION COMPLETED ---")
            
        except Exception as e:
            print(f"--- ❌ MISSION FAILED: {str(e)} ---")
            await self.push_status("user", "error", f"Factory Error: {str(e)}")
