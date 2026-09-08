-- WeatherWise AI MySQL schema
-- Requires MySQL 8.0+ for UUID_TO_BIN, JSON, and CHECK constraints.

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_preferences (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  cold_tolerance VARCHAR(20) NOT NULL DEFAULT 'medium',
  preferred_activity VARCHAR(40) NULL,
  preferred_activity_time TIME NULL,
  units VARCHAR(10) NOT NULL DEFAULT 'metric',
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_user_preferences_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_user_preferences_cold_tolerance
    CHECK (cold_tolerance IN ('low', 'medium', 'high')),
  CONSTRAINT chk_user_preferences_units
    CHECK (units IN ('metric', 'imperial'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS locations (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  label VARCHAR(60) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_locations_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_locations_latitude CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_locations_longitude CHECK (longitude BETWEEN -180 AND 180),
  INDEX idx_locations_user (user_id),
  INDEX idx_locations_user_default (user_id, is_default)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS plants (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  location_id CHAR(36) NOT NULL,
  name VARCHAR(60) NOT NULL,
  species_type VARCHAR(60) NULL,
  last_watered_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_plants_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_plants_location
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  INDEX idx_plants_user (user_id),
  INDEX idx_plants_location (location_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS weather_snapshots (
  id CHAR(36) PRIMARY KEY,
  location_id CHAR(36) NOT NULL,
  temperature_c DECIMAL(5,2) NOT NULL,
  feels_like_c DECIMAL(5,2) NULL,
  humidity_percent TINYINT UNSIGNED NULL,
  wind_speed_kmh DECIMAL(5,2) NULL,
  wind_direction_degrees SMALLINT UNSIGNED NULL,
  pressure_hpa DECIMAL(7,2) NULL,
  visibility_km DECIMAL(6,2) NULL,
  uv_index DECIMAL(4,1) NULL,
  rain_probability_percent TINYINT UNSIGNED NULL,
  condition_code VARCHAR(30) NOT NULL,
  sunrise TIME NULL,
  sunset TIME NULL,
  observed_at TIMESTAMP NOT NULL,
  fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_weather_snapshots_location
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  CONSTRAINT chk_weather_snapshots_humidity CHECK (humidity_percent IS NULL OR humidity_percent <= 100),
  CONSTRAINT chk_weather_snapshots_wind_direction CHECK (wind_direction_degrees IS NULL OR wind_direction_degrees <= 360),
  CONSTRAINT chk_weather_snapshots_rain_probability CHECK (rain_probability_percent IS NULL OR rain_probability_percent <= 100),
  INDEX idx_weather_snapshots_location_fetched (location_id, fetched_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS forecast_cache (
  id CHAR(36) PRIMARY KEY,
  location_id CHAR(36) NOT NULL,
  forecast_for TIMESTAMP NOT NULL,
  granularity VARCHAR(10) NOT NULL,
  temperature_c DECIMAL(5,2) NOT NULL,
  feels_like_c DECIMAL(5,2) NULL,
  humidity_percent TINYINT UNSIGNED NULL,
  wind_speed_kmh DECIMAL(5,2) NULL,
  uv_index DECIMAL(4,1) NULL,
  rain_probability_percent TINYINT UNSIGNED NULL,
  rain_intensity VARCHAR(20) NULL,
  condition_code VARCHAR(30) NULL,
  fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_forecast_cache_location
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  CONSTRAINT chk_forecast_cache_granularity CHECK (granularity IN ('hourly', 'daily')),
  CONSTRAINT chk_forecast_cache_humidity CHECK (humidity_percent IS NULL OR humidity_percent <= 100),
  CONSTRAINT chk_forecast_cache_rain_probability CHECK (rain_probability_percent IS NULL OR rain_probability_percent <= 100),
  UNIQUE KEY uq_forecast_cache_period (location_id, forecast_for, granularity),
  INDEX idx_forecast_cache_location_fetched (location_id, fetched_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS weather_history (
  id CHAR(36) PRIMARY KEY,
  location_id CHAR(36) NOT NULL,
  summary_date DATE NOT NULL,
  avg_temperature_c DECIMAL(5,2) NULL,
  max_temperature_c DECIMAL(5,2) NULL,
  min_temperature_c DECIMAL(5,2) NULL,
  total_rain_mm DECIMAL(7,2) NULL,
  dominant_condition VARCHAR(30) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_weather_history_location
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  UNIQUE KEY uq_weather_history_location_date (location_id, summary_date),
  INDEX idx_weather_history_location_date (location_id, summary_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerts (
  id CHAR(36) PRIMARY KEY,
  location_id CHAR(36) NOT NULL,
  alert_type VARCHAR(30) NOT NULL,
  severity VARCHAR(10) NOT NULL,
  title VARCHAR(120) NOT NULL,
  reason TEXT NOT NULL,
  valid_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alerts_location
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  CONSTRAINT chk_alerts_severity CHECK (severity IN ('low', 'medium', 'high')),
  INDEX idx_alerts_location_active (location_id, is_active),
  INDEX idx_alerts_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  alert_id CHAR(36) NULL,
  title VARCHAR(120) NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_alert
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE SET NULL,
  INDEX idx_notifications_user_read (user_id, is_read),
  INDEX idx_notifications_user_sent (user_id, sent_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS travel_analyses (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  origin_location_id CHAR(36) NOT NULL,
  destination_label VARCHAR(120) NULL,
  destination_latitude DECIMAL(9,6) NOT NULL,
  destination_longitude DECIMAL(9,6) NOT NULL,
  risk_level VARCHAR(10) NOT NULL,
  risk_score TINYINT UNSIGNED NULL,
  risk_factors JSON NOT NULL,
  suggested_departure TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_travel_analyses_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_travel_analyses_origin
    FOREIGN KEY (origin_location_id) REFERENCES locations(id) ON DELETE CASCADE,
  CONSTRAINT chk_travel_analyses_latitude CHECK (destination_latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_travel_analyses_longitude CHECK (destination_longitude BETWEEN -180 AND 180),
  CONSTRAINT chk_travel_analyses_risk_level CHECK (risk_level IN ('low', 'medium', 'high')),
  CONSTRAINT chk_travel_analyses_risk_score CHECK (risk_score IS NULL OR risk_score <= 100),
  INDEX idx_travel_analyses_user_created (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_conversations (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_conversations_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ai_conversations_user_started (user_id, started_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_messages (
  id CHAR(36) PRIMARY KEY,
  conversation_id CHAR(36) NOT NULL,
  sender VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
  CONSTRAINT chk_ai_messages_sender CHECK (sender IN ('user', 'assistant')),
  INDEX idx_ai_messages_conversation_created (conversation_id, created_at)
) ENGINE=InnoDB;
