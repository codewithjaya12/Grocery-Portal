// cart.js - small client-side cart using localStorage
const CART_KEY = 'grocery_cart_v1';

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(item) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.id === item.id);
  if (idx >= 0) {
    cart[idx].qty += item.qty;
  } else {
    cart.push(item);
  }
  saveCart(cart);
  alert(item.name + ' added to cart');
  updateCartCount();
}

function updateCartCount() {
  const count = getCart().reduce((s,i) => s + i.qty, 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = count;
}

// Call on page load
document.addEventListener('DOMContentLoaded', updateCartCount);
