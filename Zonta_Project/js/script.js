// Hamburger Menu
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
menuBtn.addEventListener('click', ()=> navLinks.classList.toggle('show'));

// Navigation
document.querySelectorAll('[data-nav]').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    showPage(a.getAttribute('data-nav'));
  });
});
function showPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
  const el=document.getElementById('page-'+name);
  if(el) el.classList.remove('hidden');
  window.location.hash=name;
  window.scrollTo({top:0, behavior:'smooth'});
}
showPage(window.location.hash.replace('#','')||'home');
window.addEventListener('hashchange', ()=> showPage(window.location.hash.replace('#','')));

// Carousel
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel img');
function showSlide(n){
  slides.forEach((s,i)=> s.classList.toggle('active', i===n));
}
function nextSlide(){
  currentSlide=(currentSlide+1)%slides.length;
  showSlide(currentSlide);
}
setInterval(nextSlide, 5000);
