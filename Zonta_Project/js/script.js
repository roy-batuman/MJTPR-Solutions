// Scroll animations
const fadeElems = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
});
fadeElems.forEach(el => observer.observe(el));

// Events list
const events = [
  {date: "2025-10-15", title: "Monthly Meeting", details: "6:00 PM — Community Center"},
  {date: "2025-11-05", title: "Fall Fundraiser", details: "7:00 PM — Lakeside Hotel"},
  {date: "2025-12-10", title: "Scholarship Awards", details: "3:00 PM — City Library"}
];
const eventsList = document.getElementById('eventsList');
events.forEach(ev=>{
  const li = document.createElement('li');
  li.innerHTML = `<strong>${new Date(ev.date).toLocaleDateString()}</strong> — ${ev.title}<div class="small muted">${ev.details}</div>`;
  eventsList.appendChild(li);
});

