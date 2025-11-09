// Hamburger toggle
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
menuBtn.addEventListener('click', () => { navLinks.classList.toggle('show'); });

// Simple carousel
const slides = document.querySelectorAll(".carousel img");
let currentSlide = 0;
function showNextSlide() {
  slides.forEach(s => s.classList.remove('active'));
  currentSlide = (currentSlide + 1) % slides.length;
  slides[currentSlide].classList.add('active');
}
setInterval(showNextSlide, 4000);

// Hero animations on scroll
const heroTitle = document.querySelector('.home-hero-title');
function revealHero() {
  const rect = heroTitle.getBoundingClientRect();
  if (rect.top < window.innerHeight - 100) heroTitle.classList.add('visible');
}
window.addEventListener('scroll', revealHero);
revealHero();

// Navigation single-page
document.querySelectorAll('[data-nav]').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    const target = a.getAttribute('data-nav');
    showPage(target);
  });
});

function showPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));
  const el = document.getElementById('page-' + name);
  if(el) el.classList.remove('hidden');
  window.scrollTo({top:0, behavior:'smooth'});
}

// Membership form
function submitMembershipForm(e){
  e.preventDefault();
  const f = e.target;
  const data = new FormData(f);
  const to = 'membership@zontanaples.org';
  const subject = encodeURIComponent('New Membership Application from ' + (data.get('name')||''));
  const body = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone')}\nAddress: ${data.get('address')}\nMembership Type: ${data.get('type')}\nPersonal Note: ${data.get('why')}`;
  window.location.href = `mailto:${to}?subject=${subject}&body=${encodeURIComponent(body)}`;
  return false;
}
