const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Product = require('../models/Product');

const products = [
  { name: 'Apple', category: 'Fruits', price: 80, unit: 'kg', stock: 50, image: 'apple.jpg' },
  { name: 'Banana', category: 'Fruits', price: 40, unit: 'kg', stock: 60, image: 'banana.jpg' },
  { name: 'Tomato', category: 'Vegetables', price: 30, unit: 'kg', stock: 70, image: 'tomato.jpg' },
  { name: 'Milk', category: 'Dairy', price: 50, unit: 'L', stock: 30, image: 'milk.jpg' },
  { name: 'Chocolate Cake', category: 'Cakes', price: 600, unit: 'kg', stock: 20, image: 'chocolate-cake.jpg' }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(products);
    console.log('Inserted sample products');
  } else {
    console.log('Products already exist:', count);
  }
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
