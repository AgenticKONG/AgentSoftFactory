# -*- coding: utf-8 -*-
import sys
import os
import asyncio

# Setup paths
sys.path.append("/Users/erickong/AgentSoftFactory/src")

from agentscope.model import OpenAIChatModel

async def run_dev_refactor():
    model = OpenAIChatModel(
        model_name="llama3.2",
        api_key="ollama",
        stream=False,
        client_kwargs={"base_url": "http://localhost:11434/v1"}
    )
    
    # Read context
    dir_path = "/Users/erickong/AgentSoftFactory/projects/001-d3-gdp-viz/"
    with open(os.path.join(dir_path, "SPEC_ARCHITECT.md"), 'r') as f: spec = f.read()
    with open(os.path.join(dir_path, "index_agent.html"), 'r') as f: old_code = f.read()
    with open(os.path.join(dir_path, "QA_REPORT.md"), 'r') as f: qa_report = f.read()

    refactor_prompt = (
        f"You are a Senior Frontend Developer. You need to REFACOR the existing code based on a QA REPORT. "
        f"CRITICAL INSTRUCTIONS:\n"
        f"1. Fix the a11y violations (add tabindex and aria-label).\n"
        f"2. Fix the D3 Tooltip logic (DO NOT append <div> inside <svg>).\n"
        f"3. IGNORE the QA advice about adding d3.max(year) to width - it is mathematically wrong.\n"
        f"4. Ensure Keyboard Navigation actually works to show tooltips.\n\n"
        f"--- ORIGINAL SPEC ---\n{spec}\n\n"
        f"--- QA REPORT ---\n{qa_report}\n\n"
        f"--- OLD CODE ---\n{old_code}\n\n"
        f"Output ONLY the fixed, complete HTML code inside ```html ... ``` blocks."
    )
    
    print(f"--- DEV AGENT IS REFACTORING index_agent_v2.html ---")
    
    response = await model(
        messages=[
            {"role": "system", "content": "You are a senior D3.js developer with strong a11y knowledge."},
            {"role": "user", "content": refactor_prompt}
        ]
    )
    
    # Extract code
    try:
        raw_text = response.text if hasattr(response, 'text') else str(response)
        if "```html" in raw_text:
            code = raw_text.split("```html")[1].split("```")[0].strip()
        else:
            code = raw_text
    except:
        code = str(response)

    output_path = os.path.join(dir_path, "index_agent_v2.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(code)
    
    print(f"--- index_agent_v2.html GENERATED SUCCESSFULLY ---")

if __name__ == "__main__":
    asyncio.run(run_dev_refactor())
