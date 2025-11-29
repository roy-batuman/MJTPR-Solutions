// admin.js (module)
// Replace these with your Supabase project values
const SUPABASE_URL = "https://ecixycrogsswdfkrokvw.supabase.co"; // <- your URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjaXh5Y3JvZ3Nzd2Rma3Jva3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA0NTQsImV4cCI6MjA3OTcyMDQ1NH0.AyOJKSRMWtRwKPg4gFXvSYMq9AnxR9EyQfgVF_YyXAg";
// Initialize supabase
const supabase = supabaseJs.createClient(ecixycrogsswdfkrokvw.supabase.co, eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjaXh5Y3JvZ3Nzd2Rma3Jva3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA0NTQsImV4cCI6MjA3OTcyMDQ1NH0.AyOJKSRMWtRwKPg4gFXvSYMq9AnxR9EyQfgVF_YyXAg);

// DOM refs
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const googleSignInBtn = document.getElementById('googleSignIn');
const appleSignInBtn = document.getElementById('appleSignIn');
const emailSignInBtn = document.getElementById('emailSignIn');
const emailInput = document.getElementById('emailInput');
const signedInAs = document.getElementById('signedInAs');

const loginCard = document.getElementById('loginCard');
const adminArea = document.getElementById('adminArea');
const content = document.getElementById('content');
const tabs = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('pageTitle');
const topActions = document.getElementById('topActions');

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalSave = document.getElementById('modalSave');
const modalCancel = document.getElementById('modalCancel');

let currentTab = 'dashboard';
let editingId = null;
let currentUser = null;
let isAdmin = false;

/*
  Quick DB schema recommendations (run in Supabase SQL editor):
  ----------------------------------------------------------
  CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users (id),
    full_name text,
    is_admin boolean DEFAULT false
  );

  CREATE TABLE events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text,
    date date,
    location text,
    description text,
    image_url text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now()
  );

  CREATE TABLE scholarships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text,
    deadline date,
    description text,
    pdf_url text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now()
  );

  CREATE TABLE members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text,
    role text,
    category text,
    bio text,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
  );
*/

// -------------------- AUTH --------------------
async function checkSession(){
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (session?.user) {
    await handleSignedIn(session.user);
  } else {
    showLogin();
  }
}

function showLogin(){
  loginCard.style.display = 'block';
  adminArea.classList.add('hidden');
  signOutBtn.classList.add('hidden');
  signInBtn.classList.remove('hidden');
  signedInAs.textContent = 'Not signed in';
  topActions.innerHTML = '';
}

// Called once we have a user
async function handleSignedIn(user){
  currentUser = user;
  // check profiles table for admin flag
  try {
    const { data, error } = await supabase.from('profiles').select('is_admin, full_name').eq('id', user.id).single();
    if (error && error.code !== 'PGRST116') {
      // if table missing or other DB error, still show limited admin area
      console.warn('profile lookup error', error.message);
    }
    isAdmin = data?.is_admin === true;
    const displayName = data?.full_name || user.email || user.id;
    signedInAs.textContent = `Signed in: ${displayName}${isAdmin ? ' (admin)' : ''}`;

    if (!isAdmin) {
      // If not admin, show message and do not reveal admin area
      loginCard.style.display = 'none';
      adminArea.classList.remove('hidden');
      adminArea.innerHTML = `<div class="card"><h3>Access denied</h3><p class="notice">Your account is not marked as an administrator in the <code>profiles</code> table. Ask a site owner to set <code>is_admin=true</code> for your profile.</p></div>`;
      signOutBtn.classList.remove('hidden');
      signInBtn.classList.add('hidden');
      return;
    }

    // Show full admin UI
    loginCard.style.display = 'none';
    adminArea.classList.remove('hidden');
    signOutBtn.classList.remove('hidden');
    signInBtn.classList.add('hidden');

    // render dashboard by default
    renderTab('dashboard');

  } catch (err) {
    console.error(err);
    showLogin();
  }
}

// Sign in handlers
emailSignInBtn?.addEventListener('click', async ()=>{
  const email = (emailInput.value || '').trim();
  if (!email) return alert('Enter an email');
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) return alert(error.message);
  alert('Magic link sent. Check your email.');
});

googleSignInBtn?.addEventListener('click', async () => {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: {redirectTo: location.href} });
  if (error) return alert(error.message);
});

appleSignInBtn?.addEventListener('click', async () => {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple', options: {redirectTo: location.href} });
  if (error) return alert(error.message);
});

signOutBtn?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  isAdmin = false; currentUser = null;
  showLogin();
});

// small quick Sign In button (sidebar)
signInBtn?.addEventListener('click', ()=> {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // focus the email input
  emailInput?.focus();
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) handleSignedIn(session.user);
  else showLogin();
});

// -------------------- NAV & TABS --------------------
document.querySelectorAll('.nav-item').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    renderTab(tab);
  });
});

function setPageTitle(t){
  pageTitle.textContent = t.charAt(0).toUpperCase() + t.slice(1);
}

// -------------------- RENDERING --------------------
async function renderTab(tab){
  currentTab = tab;
  setPageTitle(tab);
  topActions.innerHTML = ''; // actions area
  if (tab === 'dashboard') return renderDashboard();
  if (tab === 'events') return renderEvents();
  if (tab === 'scholarships') return renderScholarships();
  if (tab === 'members') return renderMembers();
  if (tab === 'announcements') return renderAnnouncements();
}

// DASHBOARD
async function renderDashboard(){
  adminArea.innerHTML = `
    <div class="card">
      <h3>Welcome, admin</h3>
      <p class="notice">Use the left menu to manage content. All changes require an admin account.</p>
      <div style="display:flex; gap:10px; margin-top:12px;">
        <button class="btn" id="goEvents">Manage Events</button>
        <button class="btn" id="goScholarships">Manage Scholarships</button>
      </div>
    </div>
    <div class="card">
      <h3>Recent events</h3>
      <div id="recentEvents" class="list"></div>
    </div>
  `;
  document.getElementById('goEvents').addEventListener('click', ()=> { document.querySelector('[data-tab="events"]').click();});
  document.getElementById('goScholarships').addEventListener('click', ()=> { document.querySelector('[data-tab="scholarships"]').click();});
  // load recent events
  const { data } = await supabase.from('events').select('*').order('date',{ascending:false}).limit(5);
  const container = document.getElementById('recentEvents');
  container.innerHTML = data?.map(ev => `<div class="item"><div class="meta"><strong>${ev.title}</strong><div class="notice">${ev.date}</div></div></div>`).join('') || '<div class="notice">No events</div>';
}

// ---------- EVENTS ----------
async function renderEvents(){
  topActions.innerHTML = `<button class="btn" id="addEventBtn">+ Add Event</button>`;
  adminArea.innerHTML = `<div class="card"><h3>Events</h3><div id="eventsList" class="list"></div></div>`;
  document.getElementById('addEventBtn').addEventListener('click', ()=> openEventForm());

  const { data, error } = await supabase.from('events').select('*').order('date',{ascending:true});
  if (error) return adminArea.querySelector('#eventsList').innerHTML = `<div class="notice">Error: ${error.message}</div>`;
  const list = adminArea.querySelector('#eventsList');
  list.innerHTML = data.map(ev => `
    <div class="item" data-id="${ev.id}">
      <div class="meta">
        <div style="font-weight:700">${escapeHtml(ev.title)}</div>
        <div class="notice">${ev.date} • ${escapeHtml(ev.location||'')}</div>
        <div style="margin-top:6px; color:#444;">${truncate(ev.description||'',120)}</div>
      </div>
      <div class="controls">
        <button class="small" data-action="edit" data-id="${ev.id}">Edit</button>
        <button class="small danger" data-action="delete" data-id="${ev.id}">Delete</button>
      </div>
    </div>
  `).join('');

  // handlers
  list.querySelectorAll('[data-action="edit"]').forEach(b => b.addEventListener('click', (e)=> openEventForm(e.target.dataset.id)));
  list.querySelectorAll('[data-action="delete"]').forEach(b => b.addEventListener('click', (e)=> deleteEvent(e.target.dataset.id)));
}

function openEventForm(id){
  editingId = id || null;
  modalTitle.textContent = id ? 'Edit Event' : 'Add Event';
  modalBody.innerHTML = `<div class="notice">Loading...</div>`;
  if (id) {
    supabase.from('events').select('*').eq('id', id).single().then(res=>{
      if (res.error) return alert(res.error.message);
      const ev = res.data;
      modalBody.innerHTML = `
        <label>Title<input class="input" id="f_title" value="${escapeAttr(ev.title)}"/></label>
        <label>Date<input type="date" id="f_date" class="input" value="${ev.date ? ev.date.split('T')[0] : ''}"/></label>
        <label>Location<input class="input" id="f_location" value="${escapeAttr(ev.location||'')}"/></label>
        <label>Description<textarea id="f_description" class="input" rows="5">${escapeHtml(ev.description||'')}</textarea></label>
        <label>Image URL<input class="input" id="f_image" value="${escapeAttr(ev.image_url||'')}"/></label>
      `;
      modal.classList.add('open');
    });
  } else {
    modalBody.innerHTML = `
      <label>Title<input class="input" id="f_title" /></label>
      <label>Date<input type="date" id="f_date" class="input" /></label>
      <label>Location<input class="input" id="f_location" /></label>
      <label>Description<textarea id="f_description" class="input" rows="5"></textarea></label>
      <label>Image URL<input class="input" id="f_image" /></label>
    `;
    modal.classList.add('open');
  }
}

modalSave.addEventListener('click', async ()=>{
  if (currentTab === 'events') return saveEvent();
  if (currentTab === 'scholarships') return saveScholarship();
  if (currentTab === 'members') return saveMember();
});

modalCancel.addEventListener('click', ()=> { modal.classList.remove('open'); editingId = null; });

async function saveEvent(){
  const title = document.getElementById('f_title').value.trim();
  const date = document.getElementById('f_date').value;
  const location = document.getElementById('f_location').value.trim();
  const description = document.getElementById('f_description').value.trim();
  const image = document.getElementById('f_image').value.trim();
  if (!title || !date) return alert('Title & Date required');

  if (editingId) {
    const { error } = await supabase.from('events').update({ title, date, location, description, image_url: image }).eq('id', editingId);
    if (error) return alert(error.message);
  } else {
    const userRes = await supabase.auth.getUser();
    const created_by = userRes.data.user?.id || null;
    const { error } = await supabase.from('events').insert([{ title, date, location, description, image_url: image, created_by }]);
    if (error) return alert(error.message);
  }
  modal.classList.remove('open'); editingId = null;
  renderTab('events');
}

async function deleteEvent(id){
  if (!confirm('Delete this event?')) return;
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) return alert(error.message);
  renderTab('events');
}

// ---------- SCHOLARSHIPS ----------
async function renderScholarships(){
  currentTab = 'scholarships';
  topActions.innerHTML = `<button class="btn" id="addScholarshipBtn">+ Add Scholarship</button>`;
  adminArea.innerHTML = `<div class="card"><h3>Scholarships</h3><div id="schList" class="list"></div></div>`;
  document.getElementById('addScholarshipBtn').addEventListener('click', ()=> openScholarshipForm());

  const { data, error } = await supabase.from('scholarships').select('*').order('created_at',{ascending:false});
  if (error) return adminArea.querySelector('#schList').innerHTML = `<div class="notice">Error: ${error.message}</div>`;
  const list = adminArea.querySelector('#schList');
  list.innerHTML = data.map(s => `
    <div class="item"><div class="meta"><div style="font-weight:700">${escapeHtml(s.name)}</div><div class="notice">Deadline: ${s.deadline || '—'}</div><div style="margin-top:6px; color:#444;">${truncate(s.description||'',120)}</div></div><div class="controls"><button class="small" data-action="edit" data-id="${s.id}">Edit</button><button class="small danger" data-action="delete" data-id="${s.id}">Delete</button></div></div>
  `).join('');
  list.querySelectorAll('[data-action="edit"]').forEach(b => b.addEventListener('click', (e)=> openScholarshipForm(e.target.dataset.id)));
  list.querySelectorAll('[data-action="delete"]').forEach(b => b.addEventListener('click', (e)=> deleteScholarship(e.target.dataset.id)));
}

function openScholarshipForm(id){
  editingId = id || null;
  modalTitle.textContent = id ? 'Edit Scholarship' : 'Add Scholarship';
  if (id) {
    supabase.from('scholarships').select('*').eq('id', id).single().then(res=>{
      if (res.error) return alert(res.error.message);
      const s = res.data;
      modalBody.innerHTML = `
        <label>Name<input class="input" id="f_name" value="${escapeAttr(s.name)}"/></label>
        <label>Deadline<input type="date" id="f_deadline" class="input" value="${s.deadline ? s.deadline.split('T')[0] : ''}"/></label>
        <label>Description<textarea id="f_desc" class="input" rows="5">${escapeHtml(s.description||'')}</textarea></label>
        <label>PDF URL<input class="input" id="f_pdf" value="${escapeAttr(s.pdf_url||'')}"/></label>
      `;
      modal.classList.add('open');
    });
  } else {
    modalBody.innerHTML = `
      <label>Name<input class="input" id="f_name" /></label>
      <label>Deadline<input type="date" id="f_deadline" class="input" /></label>
      <label>Description<textarea id="f_desc" class="input" rows="5"></textarea></label>
      <label>PDF URL<input class="input" id="f_pdf" /></label>
    `;
    modal.classList.add('open');
  }
}

async function saveScholarship(){
  const name = document.getElementById('f_name').value.trim();
  const deadline = document.getElementById('f_deadline').value || null;
  const description = document.getElementById('f_desc').value.trim();
  const pdf = document.getElementById('f_pdf').value.trim();
  if (!name) return alert('Name required');
  if (editingId) {
    const { error } = await supabase.from('scholarships').update({ name, deadline, description, pdf_url: pdf }).eq('id', editingId);
    if (error) return alert(error.message);
  } else {
    const userRes = await supabase.auth.getUser();
    const created_by = userRes.data.user?.id || null;
    const { error } = await supabase.from('scholarships').insert([{ name, deadline, description, pdf_url: pdf, created_by }]);
    if (error) return alert(error.message);
  }
  modal.classList.remove('open'); editingId = null;
  renderTab('scholarships');
}

async function deleteScholarship(id){
  if (!confirm('Delete this scholarship?')) return;
  const { error } = await supabase.from('scholarships').delete().eq('id', id);
  if (error) return alert(error.message);
  renderTab('scholarships');
}

// ---------- MEMBERS ----------
async function renderMembers(){
  topActions.innerHTML = `<button class="btn" id="addMemberBtn">+ Add Member</button>`;
  adminArea.innerHTML = `<div class="card"><h3>Members</h3><div id="membersList" class="list"></div></div>`;
  document.getElementById('addMemberBtn').addEventListener('click', ()=> openMemberForm());

  const { data, error } = await supabase.from('members').select('*').order('created_at',{ascending:false});
  if (error) return adminArea.querySelector('#membersList').innerHTML = `<div class="notice">Error: ${error.message}</div>`;
  const list = adminArea.querySelector('#membersList');
  list.innerHTML = data.map(m => `
    <div class="item" data-id="${m.id}">
      <div class="meta">
        <div style="font-weight:700">${escapeHtml(m.name)}</div>
        <div class="notice">${escapeHtml(m.role || '')} • ${escapeHtml(m.category || '')}</div>
        <div style="margin-top:6px; color:#444;">${truncate(m.bio||'',120)}</div>
      </div>
      <div class="controls">
        <button class="small" data-action="edit" data-id="${m.id}">Edit</button>
        <button class="small danger" data-action="delete" data-id="${m.id}">Delete</button>
      </div>
    </div>
  `).join('');
  list.querySelectorAll('[data-action="edit"]').forEach(b => b.addEventListener('click', (e)=> openMemberForm(e.target.dataset.id)));
  list.querySelectorAll('[data-action="delete"]').forEach(b => b.addEventListener('click', (e)=> deleteMember(e.target.dataset.id)));
}

function openMemberForm(id){
  editingId = id || null;
  modalTitle.textContent = id ? 'Edit Member' : 'Add Member';
  if (id) {
    supabase.from('members').select('*').eq('id', id).single().then(res=>{
      if (res.error) return alert(res.error.message);
      const m = res.data;
      modalBody.innerHTML = `
        <label>Name<input class="input" id="f_name" value="${escapeAttr(m.name)}"/></label>
        <label>Role<input class="input" id="f_role" value="${escapeAttr(m.role||'')}"/></label>
        <label>Category<input class="input" id="f_cat" value="${escapeAttr(m.category||'')}"/></label>
        <label>Bio<textarea id="f_bio" class="input" rows="5">${escapeHtml(m.bio||'')}</textarea></label>
        <label>Image URL<input class="input" id="f_img" value="${escapeAttr(m.image_url||'')}"/></label>
      `;
      modal.classList.add('open');
    });
  } else {
    modalBody.innerHTML = `
      <label>Name<input class="input" id="f_name" /></label>
      <label>Role<input class="input" id="f_role" /></label>
      <label>Category<input class="input" id="f_cat" /></label>
      <label>Bio<textarea id="f_bio" class="input" rows="5"></textarea></label>
      <label>Image URL<input class="input" id="f_img" /></label>
    `;
    modal.classList.add('open');
  }
}

async function saveMember(){
  const name = document.getElementById('f_name').value.trim();
  const role = document.getElementById('f_role').value.trim();
  const category = document.getElementById('f_cat').value.trim();
  const bio = document.getElementById('f_bio').value.trim();
  const img = document.getElementById('f_img').value.trim();
  if (!name || !role) return alert('Name & Role required');
  if (editingId) {
    const { error } = await supabase.from('members').update({ name, role, category, bio, image_url: img }).eq('id', editingId);
    if (error) return alert(error.message);
  } else {
    const { error } = await supabase.from('members').insert([{ name, role, category, bio, image_url: img }]);
    if (error) return alert(error.message);
  }
  modal.classList.remove('open'); editingId = null;
  renderTab('members');
}

async function deleteMember(id){
  if (!confirm('Delete this member?')) return;
  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) return alert(error.message);
  renderTab('members');
}

// placeholder
async function renderAnnouncements(){
  adminArea.innerHTML = `<div class="card"><h3>Announcements</h3><p class="notice">Add announcement management here.</p></div>`;
}

// -------------------- HELPERS --------------------
function truncate(s,n){ return s?.length > n ? s.slice(0,n-1)+'…' : (s||''); }
function escapeHtml(s){ return s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }
function escapeAttr(s){ return (s||'').replace(/"/g,'&quot;'); }

// initial load
checkSession();
