const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

exports.placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(req.user.id).populate('cart.productId').session(session);
    if (!user || user.cart.length === 0) throw new Error('Cart is empty');

    let total = 0;
    const orderItems = [];

    for (const ci of user.cart) {
      const product = await Product.findById(ci.productId._id).session(session);
      if (!product) throw new Error(`Product not found: ${ci.productId._id}`);
      if (product.stock < ci.quantity) throw new Error(`Not enough stock for ${product.name}`);

      product.stock -= ci.quantity;
      if (product.stock <= 0) {
        product.stock = 0;
        product.status = 'Out of Stock';
      }
      await product.save({ session });

      total += ci.quantity * product.price;
      orderItems.push({ productId: product._id, quantity: ci.quantity, pricePerUnit: product.price });
    }

    const order = await Order.create([{ user: user._id, items: orderItems, totalPrice: total }], { session });
    user.cart = [];
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Order placed successfully', order: order[0] });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: err.message });
  }
};
