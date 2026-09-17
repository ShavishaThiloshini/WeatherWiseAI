from typing import Any

from engine.constants.thresholds import PRIORITY_TO_SEVERITY
from engine.types.recommendation import Recommendation


def factor(name: str, value: Any, unit: str | None = None) -> dict[str, Any]:
    item = {"name": name, "value": value}
    if unit is not None:
        item["unit"] = unit
    return item


def make_recommendation(
    *,
    rec_id: str,
    category: str,
    title: str,
    message: str,
    reason: str,
    priority: str,
    risk_level: str,
    factors: list[dict[str, Any]],
    action: str | None = None,
    encourage_outdoor: bool = False,
) -> Recommendation:
    return Recommendation(
        id=rec_id,
        category=category,
        title=title,
        message=message,
        reason=reason,
        priority=priority,
        risk_level=risk_level,
        severity=PRIORITY_TO_SEVERITY[priority],
        factors=factors,
        action=action,
        encourage_outdoor=encourage_outdoor,
    )