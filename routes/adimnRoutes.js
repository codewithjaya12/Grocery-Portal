const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminControllers');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/revenue', auth, isAdmin, adminCtrl.getRevenueStats);
router.get('/out-of-stock', auth, isAdmin, adminCtrl.getOutOfStock);
router.get('/orders', auth, isAdmin, adminCtrl.getAllOrders);
router.get('/stats', auth, isAdmin, adminCtrl.getOverview);
router.get('/users', auth, isAdmin, adminCtrl.getUsers);
router.get('/users/:id/orders', auth, isAdmin, adminCtrl.getUserOrders);

module.exports = router;
