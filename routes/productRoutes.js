const express = require('express');

const router = express.Router();
const productCtrl = require('../controllers/productController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// Public: list products
router.get('/', productCtrl.getProducts);

// Protected: admin-only product management
router.post('/add', auth, isAdmin, productCtrl.addProduct);
router.put('/update/:id', auth, isAdmin, productCtrl.updateProduct);
router.delete('/delete/:id', auth, isAdmin, productCtrl.deleteProduct);

module.exports = router;
