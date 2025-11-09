// NAVIGATION
const navLinks = document.querySelectorAll('.nav-links a');
const pages = document.querySelectorAll('.page');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = link.dataset.nav;
    pages.forEach(page => {
      page.classList.add('hidden');
    });
    document.getElementById(`page-${target}`).classList.remove('hidden');
  });
});

// STORE CART
let cart = [];
function addToCart(name, price) {
  cart.push({name, price});
  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  cartItems.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    total += item.price;
    const div = document.createElement('div');
    div.textContent = `${item.name} - $${item.price}`;
    cartItems.appendChild(div);
  });
  cartTotal.textContent = total.toFixed(2);
  document.getElementById('cart').classList.remove('hidden');
}

// CONTACT FORM
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Thank you for your message!');
  contactForm.reset();
});
