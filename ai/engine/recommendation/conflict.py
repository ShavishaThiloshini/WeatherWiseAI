"""Safety-critical advice overrides comfort and convenience.

Precedence:
  Critical Safety → High Risk → Moderate Risk → Comfort → Convenience
"""

from engine.constants.thresholds import RISK_LEVELS

RISK_RANK = {name: index for index, name in enumerate(RISK_LEVELS)}


def highest_risk(*levels: str) -> str:
    return max(levels, key=lambda level: RISK_RANK.get(level, 0))


def resolve_conflicts(recommendations: list) -> list:
    has_critical_safety = any(
        item.priority == "CRITICAL" or item.risk_level == "CRITICAL"
        for item in recommendations
    )
    if not has_critical_safety:
        return recommendations

    kept = []
    for item in recommendations:
        if item.encourage_outdoor:
            continue
        kept.append(item)
    return kept
