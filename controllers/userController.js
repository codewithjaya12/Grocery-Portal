const User = require('../models/User');
const Product = require('../models/Product');

exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('cart.productId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const index = user.cart.findIndex(item => item.productId.equals(productId));
    if (index > -1) {
      user.cart[index].quantity += quantity;
    } else {
      user.cart.push({ productId, quantity });
    }
    await user.save();
    const updated = await User.findById(req.user.id).populate('cart.productId');
    res.json(updated.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { productId, quantity } = req.body;
    const index = user.cart.findIndex(item => item.productId.equals(productId));
    if (index === -1) return res.status(404).json({ message: 'Item not found in cart' });

    if (quantity <= 0) user.cart.splice(index, 1);
    else user.cart[index].quantity = quantity;

    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
