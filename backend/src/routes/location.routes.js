const express = require('express');

const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/location.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;