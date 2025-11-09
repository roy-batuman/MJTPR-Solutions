// Hamburger toggle
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
menuBtn.addEventListener('click', () => {
  navLinks.classList.toggle('show');
});

// Carousel
const slides = document.querySelectorAll(".carousel img");
let current = 0;
function showNextSlide() {
  slides[current].classList.remove("active");
  current = (current + 1) % slides.length;
  slides[current].classList.add("active");
}
setInterval(showNextSlide, 4000);

// Navigation single-page
document.querySelectorAll('[data-nav]').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    const target = a.getAttribute('data-nav');
    showPage(target);
  });
});

function showPage(name){
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const el = document.getElementById('page-' + name);
  if(el) el.classList.remove('hidden');
  window.location.hash = name;
  window.scrollTo({top: 0, behavior: 'smooth'});
}

// Default page
const initialPage = window.location.hash.replace('#', '') || 'home';
showPage(initialPage);
window.addEventListener('hashchange', () => {
  const page = window.location.hash.replace('#', '');
  showPage(page);
});
