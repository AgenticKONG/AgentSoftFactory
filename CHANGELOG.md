# 📜 ASF ChangeLog

All notable changes to the AgentSoft Factory project will be documented in this file.

## [2026-03-07] - UI Sovereign & Infra Alignment

### Added
- **Infra Center:** A sovereign entry point for the Infra Agent (Architect) to display its Soul, principles, and system state.
- **Project Registry:** Re-implemented project initialization using dynamic templates (`viz-d3-v1`, `scraper-python-v1`).
- **Shared Memory:** Added `copaw-data/SOUL.md` and `infra_state.json` to bridge Gemini CLI and ASF internal agents.

### Fixed
- **ModuleNotFoundError:** Resolved `ollama` dependency missing in the virtual environment.
- **UI Header:** Fixed the issue where Workstation, Registry, and Infra pages displayed as "Chat".
- **Backend Stability:** Fixed backend crash on startup due to improper registry loading.
- **Routing:** Added ID validation in `ProjectDashboard` to prevent white screens on invalid IDs.

### Changed
- **Sidebar Reorganization:** Prioritized "Infra Center" and unified project management layout.
- **Repository Links:** Updated all GitHub references to the ASF repository: `https://github.com/AgenticKONG/AgentSoftFactory`.
- **Identity:** Formally established the "Infra Agent" as the primary architect and history keeper.
