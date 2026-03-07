# 🛠️ AgentSoft Factory (ASF) Engineering Log: From 0 to 1

> **Project Vision:** Building an autonomous, multi-agent software engineering team with long-term memory and self-evolving infrastructure.
> **Human Partner:** Eric Kong
> **Digital Partner:** Gemini CLI (Infra Agent / Architect)
> **Last Updated:** 2026-03-07

---

## 🏗️ 1. Architectural Strategy

### 1.1 The Skeleton
- **Base Framework:** [CoPaw](https://github.com/AgenticKONG/AgentSoftFactory) (Forked from AgentScope).
- **Core Orchestration:** State-machine driven workflow (PM -> Dev -> QA).
- **Persistence Layer:** Shared memory using CoPaw's `MemoryManager` and `InfraMemoryBridge`.

### 1.2 The "Infra Agent" Concept
A unique hybrid role where the **Gemini CLI (External)** and **ASF Infra Agent (Internal)** share the same strategic context. The Infra Agent acts as the architect, process auditor, and security gatekeeper.

---

## 📜 2. Operating Principles (The Constitution) v1.0

To ensure safety in a non-containerized (Local Host) environment:
1.  **Scope Control:** All autonomous actions are restricted to `/Users/erickong/AgentSoftFactory`.
2.  **Cross-Border Approval:** Any system-level changes (e.g., `brew install` outside venv) require explicit human confirmation.
3.  **Destructive Actions:** Silent `rm -rf` is forbidden; deletions must go to a `.trash` buffer.
4.  **Secrets Protection:** Zero persistence of API Keys/Tokens in long-term memory.

---

## 🛠️ 3. Execution Roadmap (0 to 1 Phase)

### ✅ Step 1: Repository & Environment
- **Repo:** `AgentSoftFactory` forked and cloned.
- **Python:** Upgraded to 3.11 (via Homebrew).
- **Isolation:** Created `.venv` virtual environment.
- **Dependencies:** Installed `agentscope`, `copaw[dev,llamacpp]`, `mcp`, etc.

### ✅ Step 2: Multi-Agent Skeleton
- Injected `src/copaw/agents/factory_coordinator.py`.
- Defined roles: `ProductManager`, `Developer`, `QA`.
- Integrated AgentScope's `msghub` for inter-agent communication.

### ✅ Step 3: Soul Binding (Memory Bridge)
- Created `src/copaw/agents/infra/infra_memory_bridge.py`.
- Initialized `copaw-data/infra/` with:
    - `operating_principles_v1.json` (The Constitution)
    - `infra_memory.json` (Strategic Context)

### ⏳ Step 4: AI Infrastructure (Current Task)
- **Engine:** Ollama (Local LLM Provider).
- **Model Target:** `llama3.2` / `deepseek-coder-v2`.
- **Status:** Installing Ollama on host machine.

---

## 📂 4. How to Reproduce on a New Host

1.  **Install Homebrew:**
    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```
2.  **Install Python 3.11:**
    ```bash
    brew install python@3.11
    ```
3.  **Clone & Setup Venv:**
    ```bash
    git clone https://github.com/AgenticKONG/AgentSoftFactory.git
    cd AgentSoftFactory
    python3.11 -m venv .venv
    source .venv/bin/activate
    pip install -e .[dev,llamacpp]
    ```
4.  **Initialize Memory:**
    ```bash
    python scripts/init_infra_memory.py
    ```

---

## 🚀 5. Future Evolution
- [ ] **Process Metrics:** Audit agent performance and bug rates.
- [ ] **Toolchain Optimization:** Automate MCP tool integration.
- [ ] **Visualization Dashboard:** Real-time topology of agent thought chains.
- [ ] **Self-Improvement:** Infra Agent refines System Prompts based on historical success rates.
