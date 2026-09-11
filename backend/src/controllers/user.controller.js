const {
  findUserById,
  updateUserName,
  getUserPreferences,
  updateUserPreferences,
} = require('../db');

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

async function me(req, res, next) {
  try {
    const user = await findUserById(req.user.sub);
    if (!user) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    return res.json({ user: publicUser(user) });
  } catch (error) { return next(error); }
}

async function updateMe(req, res, next) {
  try {
    if (typeof req.body?.name !== 'string' || !req.body.name.trim()) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Name is required' } });
    }
    const user = await updateUserName(req.user.sub, req.body.name.trim());
    return res.json({ user: publicUser(user) });
  } catch (error) { return next(error); }
}

function parsePreferences(body) {
  const allowed = ['cold_tolerance', 'preferred_activity', 'preferred_activity_time', 'units', 'notifications_enabled'];
  const unknown = Object.keys(body || {}).find((key) => !allowed.includes(key));
  if (unknown) return { error: `Unknown preference: ${unknown}` };

  const value = {};
  if (body.cold_tolerance !== undefined) {
    if (!['low', 'medium', 'high'].includes(body.cold_tolerance)) return { error: 'cold_tolerance must be low, medium, or high' };
    value.cold_tolerance = body.cold_tolerance;
  }
  if (body.preferred_activity !== undefined) {
    if (body.preferred_activity !== null && (typeof body.preferred_activity !== 'string' || !body.preferred_activity.trim())) {
      return { error: 'preferred_activity must be a non-empty string or null' };
    }
    value.preferred_activity = body.preferred_activity === null ? null : body.preferred_activity.trim();
  }
  if (body.preferred_activity_time !== undefined) {
    if (body.preferred_activity_time !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.preferred_activity_time)) {
      return { error: 'preferred_activity_time must use HH:MM format' };
    }
    value.preferred_activity_time = body.preferred_activity_time;
  }
  if (body.units !== undefined) {
    if (!['metric', 'imperial'].includes(body.units)) return { error: 'units must be metric or imperial' };
    value.units = body.units;
  }
  if (body.notifications_enabled !== undefined) {
    if (typeof body.notifications_enabled !== 'boolean') return { error: 'notifications_enabled must be boolean' };
    value.notifications_enabled = body.notifications_enabled;
  }
  return { value };
}

async function preferences(req, res, next) {
  try { return res.json({ preferences: await getUserPreferences(req.user.sub) }); }
  catch (error) { return next(error); }
}

async function updatePreferences(req, res, next) {
  try {
    const parsed = parsePreferences(req.body || {});
    if (parsed.error) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error } });
    return res.json({ preferences: await updateUserPreferences(req.user.sub, parsed.value) });
  } catch (error) { return next(error); }
}

module.exports = { me, updateMe, preferences, updatePreferences };
