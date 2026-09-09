const express = require("express");

const weatherController = require("../controllers/weather.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/current", requireAuth, weatherController.current);
router.get("/forecast", requireAuth, weatherController.forecast);
router.post("/recommendations", requireAuth, weatherController.recommendations);

module.exports = router;
