# -*- coding: utf-8 -*-
import sys
import os
import asyncio

# Setup paths
sys.path.append("/Users/erickong/AgentSoftFactory/src")

from agentscope.model import OpenAIChatModel

async def run_qa_review():
    model = OpenAIChatModel(
        model_name="llama3.2",
        api_key="ollama",
        stream=False,
        client_kwargs={"base_url": "http://localhost:11434/v1"}
    )
    
    # Read Architect Spec and Agent's Code
    spec_path = "/Users/erickong/AgentSoftFactory/projects/001-d3-gdp-viz/SPEC_ARCHITECT.md"
    code_path = "/Users/erickong/AgentSoftFactory/projects/001-d3-gdp-viz/index_agent.html"
    
    with open(spec_path, 'r', encoding='utf-8') as f:
        spec = f.read()
    with open(code_path, 'r', encoding='utf-8') as f:
        code = f.read()

    qa_prompt = (
        f"You are a Senior QA Engineer. Your task is to review the following D3.js code "
        f"against the Architect's SPEC. Identify critical bugs, missing features, and "
        f"accessibility (a11y) violations.\n\n"
        f"--- ARCHITECT SPEC ---\n{spec}\n\n"
        f"--- DEVELOPER CODE ---\n{code}\n\n"
        f"Please provide a structured QA REPORT in Markdown format."
    )
    
    print(f"--- QA AGENT IS REVIEWING CODE ---")
    
    response = await model(
        messages=[
            {"role": "system", "content": "You are a meticulous QA Engineer specialized in Data Visualization and a11y."},
            {"role": "user", "content": qa_prompt}
        ]
    )
    
    # Extract content
    try:
        content = response.text if hasattr(response, 'text') else str(response)
    except:
        content = str(response)

    output_path = "/Users/erickong/AgentSoftFactory/projects/001-d3-gdp-viz/QA_REPORT.md"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"--- QA_REPORT.MD GENERATED SUCCESSFULLY ---")

if __name__ == "__main__":
    asyncio.run(run_qa_review())
