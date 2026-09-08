from engine.constants.thresholds import CATEGORY_TIEBREAK, PRIORITY_LEVELS

PRIORITY_RANK = {name: index for index, name in enumerate(PRIORITY_LEVELS)}


def sort_recommendations(recommendations: list) -> list:
    return sorted(
        recommendations,
        key=lambda item: (
            PRIORITY_RANK.get(item.priority, 99),
            CATEGORY_TIEBREAK.get(item.category, 99),
            item.id,
        ),
    )
