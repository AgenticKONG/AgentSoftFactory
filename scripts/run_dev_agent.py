# -*- coding: utf-8 -*-
import sys
import os
import asyncio

# Setup paths
sys.path.append("/Users/erickong/AgentSoftFactory/src")

from agentscope.model import OpenAIChatModel

async def run_dev_generation(spec_path, output_name):
    model = OpenAIChatModel(
        model_name="llama3.2",
        api_key="ollama",
        stream=False,
        client_kwargs={"base_url": "http://localhost:11434/v1"}
    )
    
    with open(spec_path, 'r', encoding='utf-8') as f:
        spec_content = f.read()

    dev_prompt = (
        f"You are a Senior Frontend Developer. Based on the following SPEC, "
        f"implement a complete, single-file HTML (including CSS and D3.js V7 code). "
        f"Ensure the code is clean, well-commented, and fulfills all requirements.\n\n"
        f"--- SPEC START ---\n{spec_content}\n--- SPEC END ---"
    )
    
    print(f"--- DEV AGENT IS CODING FOR {output_name} ---")
    
    response = await model(
        messages=[
            {"role": "system", "content": "You are a senior D3.js developer. Output ONLY code inside ```html ... ``` blocks."},
            {"role": "user", "content": dev_prompt}
        ]
    )
    
    # Extract content from ChatResponse
    try:
        raw_text = response.text if hasattr(response, 'text') else str(response)
        # Simple extraction of code block
        if "```html" in raw_text:
            code = raw_text.split("```html")[1].split("```")[0].strip()
        else:
            code = raw_text
    except:
        code = str(response)

    output_path = f"/Users/erickong/AgentSoftFactory/projects/001-d3-gdp-viz/{output_name}"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(code)
    
    print(f"--- {output_name} GENERATED ---")

async def main():
    # Run both in parallel or sequence
    await run_dev_generation("/Users/erickong/AgentSoftFactory/projects/001-d3-gdp-viz/SPEC_ARCHITECT.md", "index_architect.html")
    await run_dev_generation("/Users/erickong/AgentSoftFactory/projects/001-d3-gdp-viz/SPEC_AGENT.md", "index_agent.html")

if __name__ == "__main__":
    asyncio.run(main())
