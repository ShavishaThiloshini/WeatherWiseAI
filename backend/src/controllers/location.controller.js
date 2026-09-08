const {
  listLocationsByUserId,
  findLocationByIdForUser,
  createLocation,
  updateLocation,
  deleteLocation,
} = require('../db');

function parseLocationInput(body, partial = false) {
  const input = body || {};
  const result = {};

  if (!partial || input.label !== undefined) {
    if (typeof input.label !== 'string' || !input.label.trim()) return { error: 'Label is required' };
    result.label = input.label.trim();
  }
  if (!partial || input.latitude !== undefined) {
    result.latitude = Number(input.latitude);
    if (!Number.isFinite(result.latitude) || result.latitude < -90 || result.latitude > 90) {
      return { error: 'Latitude must be a number between -90 and 90' };
    }
  }
  if (!partial || input.longitude !== undefined) {
    result.longitude = Number(input.longitude);
    if (!Number.isFinite(result.longitude) || result.longitude < -180 || result.longitude > 180) {
      return { error: 'Longitude must be a number between -180 and 180' };
    }
  }
  if (!partial || input.timezone !== undefined) {
    result.timezone = input.timezone === undefined ? 'UTC' : String(input.timezone).trim();
    if (!result.timezone) return { error: 'Timezone cannot be empty' };
  }
  if (!partial || input.is_default !== undefined) {
    result.isDefault = input.is_default === undefined ? false : input.is_default;
    if (typeof result.isDefault !== 'boolean') return { error: 'is_default must be a boolean' };
  }

  return { value: result };
}

function mergeLocationInput(existing, parsed) {
  return {
    label: parsed.label === undefined ? existing.label : parsed.label,
    latitude: parsed.latitude === undefined ? existing.latitude : parsed.latitude,
    longitude: parsed.longitude === undefined ? existing.longitude : parsed.longitude,
    timezone: parsed.timezone === undefined ? existing.timezone : parsed.timezone,
    isDefault: parsed.isDefault === undefined ? Boolean(existing.is_default) : parsed.isDefault,
  };
}

async function list(req, res, next) {
  try {
    return res.json({ locations: await listLocationsByUserId(req.user.sub) });
  } catch (error) { return next(error); }
}

async function get(req, res, next) {
  try {
    const location = await findLocationByIdForUser(req.params.id, req.user.sub);
    if (!location) return res.status(404).json({ error: { code: 'LOCATION_NOT_FOUND', message: 'Location not found' } });
    return res.json({ location });
  } catch (error) { return next(error); }
}

async function create(req, res, next) {
  try {
    const parsed = parseLocationInput(req.body);
    if (parsed.error) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error } });
    const location = await createLocation({ userId: req.user.sub, ...parsed.value });
    return res.status(201).json({ location });
  } catch (error) { return next(error); }
}

async function update(req, res, next) {
  try {
    const existing = await findLocationByIdForUser(req.params.id, req.user.sub);
    if (!existing) return res.status(404).json({ error: { code: 'LOCATION_NOT_FOUND', message: 'Location not found' } });
    const parsed = parseLocationInput(req.body, true);
    if (parsed.error) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error } });
    const location = await updateLocation({ locationId: req.params.id, userId: req.user.sub, ...mergeLocationInput(existing, parsed.value) });
    return res.json({ location });
  } catch (error) { return next(error); }
}

async function remove(req, res, next) {
  try {
    const deleted = await deleteLocation(req.params.id, req.user.sub);
    if (!deleted) return res.status(404).json({ error: { code: 'LOCATION_NOT_FOUND', message: 'Location not found' } });
    return res.status(204).send();
  } catch (error) { return next(error); }
}

module.exports = { list, get, create, update, remove };