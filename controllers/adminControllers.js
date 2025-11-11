const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Login = require('../models/Login');

// Return all orders with user and product details (admin only)
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user').populate('items.productId').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRevenueStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 }
        }
      }
    ]);
    const result = stats[0] || { totalRevenue: 0, totalOrders: 0 };
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOutOfStock = async (req, res) => {
  try {
    const outOfStock = await Product.find({ stock: { $lte: 0 } });
    res.json(outOfStock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: list all orders with user and product info
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('user').populate('items.productId');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: list users with aggregated order stats
exports.getUsers = async (req, res) => {
  try {
    // Allow optional ?email= filter (case-insensitive)
    const filter = {};
    if (req.query && req.query.email) {
      const email = req.query.email.trim();
      if (email) filter.email = { $regex: `^${email}$`, $options: 'i' };
    }
    const users = await User.find(filter).select('-password').lean();

    // aggregate orders by user
    const orderAgg = await Order.aggregate([
      { $group: { _id: '$user', totalSpent: { $sum: '$totalPrice' }, totalOrders: { $sum: 1 }, lastOrder: { $max: '$createdAt' } } }
    ]);

    const aggMap = {};
    orderAgg.forEach(a => { aggMap[a._id.toString()] = a; });

    // aggregate last login time by email
    const loginAgg = await Login.aggregate([
      { $group: { _id: '$email', lastLogin: { $max: '$loginTime' } } }
    ]);
    const loginMap = {};
    loginAgg.forEach(l => { loginMap[l._id] = l.lastLogin; });

    const result = users.map(u => {
      const info = aggMap[u._id?.toString()];
      return Object.assign({}, u, {
        totalOrders: info ? info.totalOrders : 0,
        totalSpent: info ? info.totalSpent : 0,
        lastOrder: info ? info.lastOrder : null,
        lastLogin: loginMap[u.email] || null
      });
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: get all orders for a single user
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.params.id;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).populate('items.productId');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: overview stats (products, users, orders, revenue)
exports.getOverview = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const orderStats = await Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, totalOrders: { $sum: 1 } } }
    ]);
    const stats = orderStats[0] || { totalRevenue: 0, totalOrders: 0 };
    // Allow configurable profit margin via env (e.g., 0.2 for 20%). Default to 20%.
    const margin = parseFloat(process.env.ADMIN_PROFIT_MARGIN || '0.2');
    const estimatedProfit = (stats.totalRevenue || 0) * margin;
    res.json({ totalProducts, totalUsers, totalOrders: stats.totalOrders, totalRevenue: stats.totalRevenue, estimatedProfit, margin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
