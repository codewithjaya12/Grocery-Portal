const mongoose = require('mongoose');

const LoginSchema = new mongoose.Schema({
  email: { type: String, required: true },
  loginTime: { type: Date, default: Date.now },
  ip: { type: String }
});

module.exports = mongoose.model('Login', LoginSchema);
