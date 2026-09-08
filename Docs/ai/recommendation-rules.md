# WeatherWise AI
### Recommendation rules (Day 03)

Rules are skip-if-data-missing. They never invent temperature, UV, rain, or wind.

## Heat

- Very hot, or high heat temperature (≥ 35°C), or high feels-like → heat caution + hydration.
- Hot **and** high/very high humidity → elevated heat risk (not a warning on every warm day).
- Comfortable temperature does not create a heat warning even if UV is high (UV is a separate rule).

## Cold

- Cold / very cold from temperature or feels-like.
- Strong wind increases cold risk (wind chill style, without fabricating a feels-like value if both inputs exist they are both cited).

## Rain

- Low probability → no strong rain warning (avoids alarm fatigue).
- Moderate+ → umbrella; timing included when forecast hours exist (`later today` vs `soon` vs `now`).
- Heavy/extreme → rain protection + travel caution + poorer outdoor suitability.

## Thunderstorm (safety-critical)

- Condition contains `thunder`, `storm`, or `stormy`.
- CRITICAL outdoor safety: avoid open areas; postpone outdoor activity.
- Emits an `alerts` item. Casual “great day outside” advice is removed.

## Wind

- Strong → outdoor/travel caution.
- Very strong → high/critical wind risk; avoid unnecessary exposure.
- Moderate and below → no wind warning.

## UV

- High → consider sunscreen.
- Very high / extreme → sunscreen, shade, limit prolonged direct sun, with reason citing the UV index.

## Clothing

One combined item: temperature band + waterproof layer if rain is meaningful + sun-protective extras if UV is high and it is not a cold day.

## Umbrella

- Below light threshold → no umbrella recommendation.
- Light → optional / consider.
- Moderate or ≥ 70% → carry umbrella.
- Heavy/extreme → strongly recommend umbrella or raincoat.

## Hydration

Follows heat risk. General safety wording only — no medical claims or prescribed volumes.

## Outdoor activity

Levels: `Excellent`, `Good`, `Moderate`, `Poor`, `Avoid`.

Thunderstorm, very strong wind, extreme rain, or critical heat → **Avoid** (or Poor for heavy rain / very hot / strong wind). Safety always wins over a comfortable temperature.
