from engine.constants.thresholds import CATEGORY_TIEBREAK, PRIORITY_LEVELS
from engine.types.recommendation import Recommendation

_PRIORITY_RANK = {level: index for index, level in enumerate(PRIORITY_LEVELS)}


def sort_recommendations(recommendations: list[Recommendation]) -> list[Recommendation]:
    return sorted(
        recommendations,
        key=lambda item: (
            _PRIORITY_RANK.get(item.priority, len(PRIORITY_LEVELS)),
            CATEGORY_TIEBREAK.get(item.category, 99),
            item.id,
        ),
    )
