# -*- coding: utf-8 -*-
import sys
import os
import asyncio

# Setup paths
sys.path.append("/Users/erickong/AgentSoftFactory/src")

from agentscope.model import OpenAIChatModel

async def run_pm_spec_generation():
    model = OpenAIChatModel(
        model_name="llama3.2",
        api_key="ollama",
        stream=False,
        client_kwargs={"base_url": "http://localhost:11434/v1"}
    )
    
    user_prompt = (
        "You are a Senior Product Manager. Translate the following requirement "
        "into a professional SPEC.md: "
        "'用D3.js V7画一个带tooltip的响应式柱状图，展示中国2000-2025年的GDP总量和人均GDP（美元计），"
        "配色方案用Observable 10，支持键盘导航，代码注释完整。'"
    )
    
    print(f"--- PM AGENT IS THINKING ---")
    
    response = await model(
        messages=[
            {"role": "system", "content": "You are a professional PM."},
            {"role": "user", "content": user_prompt}
        ]
    )
    
    # Direct access based on AgentScope ChatResponse structure
    try:
        content = response.text
    except:
        try:
            content = response['text']
        except:
            content = str(response)

    output_path = "/Users/erickong/AgentSoftFactory/projects/001-d3-gdp-viz/SPEC_AGENT.md"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    print(f"--- SPEC_AGENT.MD GENERATED SUCCESSFULLY ---")

if __name__ == "__main__":
    asyncio.run(run_pm_spec_generation())
