from engine.constants.thresholds import RISK_LEVELS
from engine.types.recommendation import Recommendation

_RISK_RANK = {level: index for index, level in enumerate(RISK_LEVELS)}


def highest_risk(*levels: str) -> str:
    if not levels:
        return "SAFE"
    return max(levels, key=lambda level: _RISK_RANK.get(level, 0))


def resolve_conflicts(recommendations: list[Recommendation]) -> list[Recommendation]:
    if not recommendations:
        return []

    has_critical = any(
        item.priority == "CRITICAL" or item.risk_level == "CRITICAL" for item in recommendations
    )

    resolved: list[Recommendation] = []
    for item in recommendations:
        if has_critical and item.encourage_outdoor:
            continue
        if item.category == "umbrella" and item.priority == "INFO":
            continue
        if item.category == "general" and item.action == "normal_day":
            continue
        resolved.append(item)

    return resolved
