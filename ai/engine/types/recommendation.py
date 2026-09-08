from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class WeatherSnapshot:
    """Normalized weather the rule engine understands.

    Optional fields stay None when the caller did not supply them.
    The engine must not invent values for missing fields.
    """

    temperature_c: float | None = None
    feels_like_c: float | None = None
    humidity_percent: float | None = None
    wind_speed_kmh: float | None = None
    wind_gust_kmh: float | None = None
    wind_direction: str | None = None
    pressure_hpa: float | None = None
    visibility_km: float | None = None
    uv_index: float | None = None
    rain_probability_percent: float | None = None
    rain_intensity: str | None = None
    condition: str | None = None
    cloud_coverage_percent: float | None = None
    sunrise: str | None = None
    sunset: str | None = None
    observed_at: str | None = None
    location_label: str | None = None
    timezone: str | None = None
    request_id: str | None = None
    rain_timing: str | None = None  # now | soon | later | unknown
    limitations: list[str] = field(default_factory=list)


@dataclass
class Recommendation:
    id: str
    category: str
    title: str
    message: str
    reason: str
    priority: str
    risk_level: str
    severity: str
    factors: list[dict[str, Any]]
    action: str | None = None
    score: int | None = None
    valid_from: str | None = None
    valid_until: str | None = None
    encourage_outdoor: bool = False

    def to_api(self) -> dict[str, Any]:
        payload = asdict(self)
        payload.pop("encourage_outdoor")
        return payload


@dataclass
class ConditionAnalysis:
    temperature: str | None
    rain: str | None
    wind: str | None
    uv: str | None
    humidity: str | None
    thunderstorm: bool


@dataclass
class RiskAssessment:
    heat: str
    cold: str
    rain: str
    wind: str
    uv: str
    travel: str
    outdoor: str
    overall: str


@dataclass
class EngineResult:
    recommendations: list[Recommendation]
    alerts: list[dict[str, Any]]
    analysis: ConditionAnalysis
    risks: RiskAssessment
    activity: str
    limitations: list[str]
    summary: str
    request_id: str | None
    data_freshness: str | None
