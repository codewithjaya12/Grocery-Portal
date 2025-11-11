const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../models/Product');

async function run() {
  const imagesDir = path.join(__dirname, '..', '..', 'images');
  if (!fs.existsSync(imagesDir)) {
    console.error('Images directory not found:', imagesDir);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const files = fs.readdirSync(imagesDir).filter(f => fs.statSync(path.join(imagesDir, f)).isFile()).map(f => f.toLowerCase());

  const products = await Product.find();
  let updated = 0;
  const report = [];

  for (const p of products) {
    const orig = p.image || '';
    let found = null;

    if (orig) {
      if (files.includes(orig.toLowerCase())) found = orig;
    }

    if (!found) {
      const base = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const candidates = [];
      ['.jpg', '.jpeg', '.png', '.webp', '.svg'].forEach(ext => candidates.push(base + ext));
      if (p.name) {
        candidates.push(p.name + '.jpg');
        candidates.push(p.name + '.png');
      }

      for (const c of candidates) {
        if (files.includes(c.toLowerCase())) { found = c; break; }
      }
    }

    if (!found) found = 'placeholder.svg';

    if (p.image !== found) {
      p.image = found;
      await p.save();
      updated++;
      report.push({ id: p._id.toString(), name: p.name, before: orig, after: found });
    }
  }

  console.log(`Processed ${products.length} products. Updated: ${updated}`);
  if (report.length) {
    console.log('Changes:');
    for (const r of report) console.log(r);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
