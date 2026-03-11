# -*- coding: utf-8 -*-
import logging
from typing import Tuple
from agentscope.model import ChatModelBase, OpenAIChatModel, OllamaChatModel
from agentscope.formatter import FormatterBase, OpenAIChatFormatter, OllamaChatFormatter
from ..providers.store import load_providers_json

logger = logging.getLogger(__name__)

def create_model_and_formatter(model_id: str = "llama3.2") -> Tuple[ChatModelBase, FormatterBase]:
    """
    Unified Factory: Resolves model_id against authorized providers in providers.json.
    """
    print(f"DEBUG: Factory resolving model_id: {model_id}")
    # 1. Handle Local/Default cases
    if not model_id or "llama" in model_id.lower():
        print(f"DEBUG: Using local llama fallback for {model_id}")
        model = OllamaChatModel(model_name="llama3.2", host="http://localhost:11434")
        return model, OllamaChatFormatter()

    # 2. Resolve via Authorized Providers
    try:
        print("DEBUG: Loading providers.json...")
        data = load_providers_json()
        target_config = None
        
        # Check Custom Providers (e.g. Fangzhou/doubao)
        print(f"DEBUG: Checking {len(data.custom_providers)} custom providers...")
        for p_id, cpd in data.custom_providers.items():
            if any(m.id == model_id for m in cpd.models):
                print(f"DEBUG: Found {model_id} in custom provider: {p_id}")
                target_config = {
                    "api_key": cpd.api_key,
                    "base_url": cpd.base_url or cpd.default_base_url,
                    "model_name": model_id
                }
                break
        
        # Check Built-in Providers
        if not target_config:
            print(f"DEBUG: Checking built-in providers...")
            from ..providers.registry import PROVIDERS
            for p_id, settings in data.providers.items():
                defn = PROVIDERS.get(p_id)
                if defn and any(m.id == model_id for m in defn.models):
                    print(f"DEBUG: Found {model_id} in built-in provider: {p_id}")
                    target_config = {
                        "api_key": settings.api_key,
                        "base_url": settings.base_url or defn.default_base_url,
                        "model_name": model_id
                    }
                    break

        if target_config and target_config["api_key"]:
            print(f"DEBUG: Initializing OpenAIChatModel for {model_id} via {target_config['base_url']}")
            model = OpenAIChatModel(
                model_name=target_config["model_name"],
                api_key=target_config["api_key"],
                stream=False,
                client_kwargs={"base_url": target_config["base_url"]}
            )
            return model, OpenAIChatFormatter()
        else:
            print(f"DEBUG: No valid config or API KEY for {model_id}. Falling back.")
            logger.warning(f"Model {model_id} found but NO API KEY authorized. Falling back.")
            
    except Exception as e:
        print(f"DEBUG: RESOLUTION ERROR: {str(e)}")
        logger.error(f"Resolution failed for {model_id}: {e}")

    # Final Fallback
    print("DEBUG: Final Fallback to llama3.2")
    return OllamaChatModel(model_name="llama3.2"), OllamaChatFormatter()

__all__ = ["create_model_and_formatter"]
