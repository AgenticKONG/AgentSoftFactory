# -*- coding: utf-8 -*-
# pylint: disable=unused-argument too-many-branches too-many-statements
import asyncio
import json
import logging
from pathlib import Path

from agentscope.pipeline import stream_printing_messages
from agentscope.tool import Toolkit
from agentscope_runtime.engine.runner import Runner
from agentscope_runtime.engine.schemas.agent_schemas import AgentRequest
from dotenv import load_dotenv

from .command_dispatch import (
    _get_last_user_text,
    _is_command,
    run_command_path,
)
from .query_error_dump import write_query_error_dump
from .session import SafeJSONSession
from .utils import build_env_context
from ..channels.schema import DEFAULT_CHANNEL
from ...agents.memory import MemoryManager
from ...agents.model_factory import create_model_and_formatter
from ...agents.react_agent import CoPawAgent
from ...agents.tools import read_file, write_file, edit_file
from ...agents.utils.token_counting import _get_token_counter
from ...config import load_config
from ...constant import (
    MEMORY_COMPACT_RATIO,
    WORKING_DIR,
)

logger = logging.getLogger(__name__)


class AgentRunner(Runner):
    def __init__(self) -> None:
        super().__init__()
        self.framework_type = "agentscope"
        self._chat_manager = None  # Store chat_manager reference
        self._mcp_manager = None  # MCP client manager for hot-reload
        self.memory_manager: MemoryManager | None = None

    def set_chat_manager(self, chat_manager):
        """Set chat manager for auto-registration.

        Args:
            chat_manager: ChatManager instance
        """
        self._chat_manager = chat_manager

    def set_mcp_manager(self, mcp_manager):
        """Set MCP client manager for hot-reload support.

        Args:
            mcp_manager: MCPClientManager instance
        """
        self._mcp_manager = mcp_manager

    async def query_handler(
        self,
        msgs,
        request: AgentRequest = None,
        **kwargs,
    ):
        """
        Handle agent query with a hybrid approach:
        - 'infra-governance' session uses the Soul Beacon (CLI Brain) mode.
        - Other sessions use the standard AgentScope agent logic.
        """
        session_id = request.session_id
        user_id = request.user_id
        channel = getattr(request, "channel", DEFAULT_CHANNEL)

        # --- MODE SWITCH: SOUL BEACON FOR INFRA GOVERNANCE ---
        if session_id == "infra-governance":
            try:
                logger.info(f"--- SOUL BEACON ACTIVE: Received Input for {session_id} ---")
                
                # 1. Update Session JSON
                session_path = WORKING_DIR / "sessions" / f"{user_id}_{session_id}.json"
                data = {"agent": {"memory": {"content": []}}}
                if session_path.exists():
                    with open(session_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                
                from datetime import datetime
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
                user_text = _get_last_user_text(msgs) or ""
                
                new_msg = [
                    {
                        "id": f"msg_web_{int(datetime.now().timestamp())}",
                        "name": "user",
                        "role": "user",
                        "content": [{"type": "text", "text": user_text}],
                        "metadata": None,
                        "timestamp": timestamp
                    },
                    []
                ]
                data["agent"]["memory"]["content"].append(new_msg)
                with open(session_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)

                # 2. Create Signal Beacon for CLI Brain
                signal_dir = Path("/Users/erickong/AgentSoftFactory/copaw-data/tasks")
                signal_dir.mkdir(parents=True, exist_ok=True)
                signal_file = signal_dir / "soul_beacon.pending"
                
                signal_data = {
                    "session_id": session_id,
                    "user_id": user_id,
                    "input": user_text,
                    "timestamp": timestamp
                }
                with open(signal_file, 'w', encoding='utf-8') as f:
                    json.dump(signal_data, f, ensure_ascii=False)

                # 3. Inform the UI via yield (to stay as an async generator)
                from agentscope.message import Msg
                yield Msg(name="System", role="assistant", content="[ Beacon Sent: Awaiting CLI Brain Response... ]"), True
                return
            except Exception as e:
                logger.exception(f"Soul Beacon failed: {e}")
                from agentscope.message import Msg
                yield Msg(name="System", role="assistant", content=f"[ Beacon Error: {str(e)} ]"), True
                return

        # --- ORIGINAL LOGIC FOR ALL OTHER SESSIONS ---
        query = _get_last_user_text(msgs)
        if query and _is_command(query):
            logger.info("Command path: %s", query.strip()[:50])
            async for msg, last in run_command_path(request, msgs, self):
                yield msg, last
            return

        agent = None
        session_state_loaded = False
        try:
            logger.info(
                "Handle standard agent query:\n%s",
                json.dumps(
                    {
                        "session_id": session_id,
                        "user_id": user_id,
                        "channel": channel,
                        "msgs_len": len(msgs) if msgs else 0,
                    },
                    ensure_ascii=False,
                    indent=2,
                ),
            )

            env_context = build_env_context(
                session_id=session_id,
                user_id=user_id,
                channel=channel,
                working_dir=str(WORKING_DIR),
            )

            mcp_clients = []
            if self._mcp_manager is not None:
                mcp_clients = await self._mcp_manager.get_clients()

            config = load_config()
            agent = CoPawAgent(
                env_context=env_context,
                mcp_clients=mcp_clients,
                memory_manager=self.memory_manager,
                max_iters=config.agents.running.max_iters,
                max_input_length=config.agents.running.max_input_length,
            )
            await agent.register_mcp_clients()
            agent.set_console_output_enabled(enabled=False)

            if self._chat_manager is not None:
                await self._chat_manager.get_or_create_chat(
                    session_id, user_id, channel, name=query[:10] if query else "New Chat"
                )

            try:
                await self.session.load_session_state(session_id=session_id, user_id=user_id, agent=agent)
                session_state_loaded = True
            except Exception as e:
                logger.warning(f"load_session_state skipped: {e}")

            agent.rebuild_sys_prompt()

            async for msg, last in stream_printing_messages(
                agents=[agent],
                coroutine_task=agent(msgs),
            ):
                yield msg, last

        except Exception as e:
            logger.exception(f"Error in query handler: {e}")
            from agentscope.message import Msg
            yield Msg(name="System", role="assistant", content=f"[ Error: {str(e)} ]"), True
        finally:
            if agent is not None and session_state_loaded:
                await self.session.save_session_state(session_id=session_id, user_id=user_id, agent=agent)

    async def init_handler(self, *args, **kwargs):
        """
        Init handler.
        """
        # Load environment variables from .env file
        env_path = Path(__file__).resolve().parents[4] / ".env"
        if env_path.exists():
            load_dotenv(env_path)
            logger.debug(f"Loaded environment variables from {env_path}")
        else:
            logger.debug(
                f".env file not found at {env_path}, "
                "using existing environment variables",
            )

        session_dir = str(WORKING_DIR / "sessions")
        self.session = SafeJSONSession(save_dir=session_dir)

        if self.memory_manager is None:
            # Get config for memory manager
            config = load_config()
            max_input_length = config.agents.running.max_input_length

            # Create model and formatter
            chat_model, formatter = create_model_and_formatter()

            # Get token counter
            token_counter = _get_token_counter()

            # Create toolkit for memory manager
            toolkit = Toolkit()
            toolkit.register_tool_function(read_file)
            toolkit.register_tool_function(write_file)
            toolkit.register_tool_function(edit_file)

            # Initialize MemoryManager with new parameters
            self.memory_manager = MemoryManager(
                working_dir=str(WORKING_DIR),
                chat_model=chat_model,
                formatter=formatter,
                token_counter=token_counter,
                toolkit=toolkit,
                max_input_length=max_input_length,
                memory_compact_ratio=MEMORY_COMPACT_RATIO,
            )
        
        try:
            # Use wait_for to prevent infinite hang on memory manager start (likely Chroma/FTS issue)
            logger.info("Starting MemoryManager with 10s timeout...")
            await asyncio.wait_for(self.memory_manager.start(), timeout=10.0)
            logger.info("MemoryManager started successfully.")
        except asyncio.TimeoutError:
            logger.warning("MemoryManager start timed out, proceeding without it.")
        except Exception as e:
            logger.exception(f"MemoryManager start failed: {e}, proceeding without it.")

    async def shutdown_handler(self, *args, **kwargs):
        """
        Shutdown handler.
        """
        try:
            await self.memory_manager.close()
        except Exception as e:
            logger.warning(f"MemoryManager stop failed: {e}")
