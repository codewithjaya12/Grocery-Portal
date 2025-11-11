const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/cart', auth, userCtrl.getCart);
router.post('/cart', auth, userCtrl.addToCart);
router.put('/cart', auth, userCtrl.updateCartItem);

module.exports = router;
