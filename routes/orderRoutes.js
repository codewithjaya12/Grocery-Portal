const express = require('express');
const router = express.Router();
const orderCtrl = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.post('/place', auth, orderCtrl.placeOrder);

module.exports = router;
