# -*- coding: utf-8 -*-
from typing import List, Dict

# Single source of truth for events to avoid circular imports
asf_event_queue: Dict[str, List[str]] = {}
