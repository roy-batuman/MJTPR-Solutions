/* ------------------------------------------
   ADMIN PANEL — Zonta Club of Naples
   Fully improved + fixed version
   ------------------------------------------ */

const SUPABASE_URL = "https://ecixycrogsswdfkrokvw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------------- DOM ELEMENTS ---------------- */
const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const emailSignInBtn = document.getElementById("emailSignIn");
const emailInput = document.getElementById("emailInput");
const googleBtn = document.getElementById("googleSignIn");
const appleBtn = document.getElementById("appleSignIn");
const signedInAs = document.getElementById("signedInAs");

const loginCard = document.getElementById("loginCard");
const adminArea = document.getElementById("adminArea");
const pageTitle = document.getElementById("pageTitle");
const topActions = document.getElementById("topActions");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalSave = document.getElementById("modalSave");
const modalCancel = document.getElementById("modalCancel");

let currentTab = "dashboard";
let editingId = null;
let currentUser = null;
let isAdmin = false;

/* ---------------- AUTH ---------------- */

async function checkSession() {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  session?.user ? handleSignedIn(session.user) : showLogin();
}

function showLogin() {
  loginCard.style.display = "block";
  adminArea.classList.add("hidden");
  signOutBtn.classList.add("hidden");
  signedInAs.textContent = "Not signed in";
}

async function handleSignedIn(user) {
  currentUser = user;

  // Look up admin flag
  const { data } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .maybeSingle();

  isAdmin = data?.is_admin === true;

  const displayName = data?.full_name || user.email || user.id;
  signedInAs.textContent = `Signed in: ${displayName}${isAdmin ? " (admin)" : ""}`;

  if (!isAdmin) {
    loginCard.style.display = "none";
    adminArea.classList.remove("hidden");
    adminArea.innerHTML = `
      <div class="card">
        <h3>Access denied</h3>
        <p class="notice">This account is not an admin.</p>
      </div>`;
    signOutBtn.classList.remove("hidden");
    return;
  }

  loginCard.style.display = "none";
  adminArea.classList.remove("hidden");
  signOutBtn.classList.remove("hidden");

  renderTab("dashboard");
}

/* ----- Sign In Buttons ----- */

emailSignInBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email) return alert("Enter email.");
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) alert(error.message);
  else alert("Magic link sent.");
});

googleBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: location.href },
  });
  if (error) alert(error.message);
});

appleBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: { redirectTo: location.href },
  });
  if (error) alert(error.message);
});

signOutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  showLogin();
});

/* Listen to auth state changes */
supabase.auth.onAuthStateChange((_event, session) => {
  session?.user ? handleSignedIn(session.user) : showLogin();
});

/* ---------------- NAV TABS ---------------- */

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
    btn.classList.add("active");
    renderTab(btn.dataset.tab);
  });
});

function setPageTitle(tab) {
  pageTitle.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
}

async function renderTab(tab) {
  currentTab = tab;
  setPageTitle(tab);
  topActions.innerHTML = "";

  if (tab === "dashboard") return renderDashboard();
  if (tab === "events") return renderEvents();
  if (tab === "scholarships") return renderScholarships();
  if (tab === "members") return renderMembers();
  if (tab === "announcements") return renderAnnouncements();
  if (tab === "applications") return renderApplications();
}

/* ---------------- DASHBOARD ---------------- */

async function renderDashboard() {
  adminArea.innerHTML = `
    <div class="card">
      <h3>Welcome, Admin</h3>
      <p>Use the tabs to manage content.</p>
    </div>
  `;
}

/* ---------------- EVENTS ---------------- (unchanged but fixed) */

async function renderEvents() {
  topActions.innerHTML = `<button class="btn" id="addEventBtn">+ Add Event</button>`;
  adminArea.innerHTML = `<div class="card"><h3>Events</h3><div id="eventsList" class="list"></div></div>`;

  document.getElementById("addEventBtn").addEventListener("click", () => openEventForm());

  const { data } = await supabase.from("events").select("*").order("date", { ascending: true });
  const list = document.getElementById("eventsList");

  list.innerHTML = (data || [])
    .map(
      (ev) => `
    <div class="item">
      <div class="meta">
        <strong>${escapeHtml(ev.title)}</strong>
        <div class="notice">${ev.date}</div>
      </div>
      <div class="controls">
        <button class="small" onclick="openEventForm('${ev.id}')">Edit</button>
        <button class="small danger" onclick="deleteEvent('${ev.id}')">Delete</button>
      </div>
    </div>`
    )
    .join("");
}

/* ---------------- SCHOLARSHIPS ---------------- */

async function renderScholarships() {
  topActions.innerHTML = `<button class="btn" id="addScholarshipBtn">+ Add Scholarship</button>`;
  adminArea.innerHTML = `<div class="card"><h3>Scholarships</h3><div id="schList" class="list"></div></div>`;

  document.getElementById("addScholarshipBtn").addEventListener("click", () => openScholarshipForm());

  const { data } = await supabase.from("scholarships").select("*");
  const list = document.getElementById("schList");

  list.innerHTML = (data || [])
    .map(
      (s) => `
    <div class="item">
      <div class="meta">
        <strong>${escapeHtml(s.name)}</strong>
        <div class="notice">${s.deadline || ""}</div>
      </div>
      <div class="controls">
        <button class="small" onclick="openScholarshipForm('${s.id}')">Edit</button>
        <button class="small danger" onclick="deleteScholarship('${s.id}')">Delete</button>
      </div>
    </div>`
    )
    .join("");
}

/* ---------------- MEMBERS ---------------- */

async function renderMembers() {
  topActions.innerHTML = `<button class="btn" id="addMemberBtn">+ Add Member</button>`;
  adminArea.innerHTML = `<div class="card"><h3>Members</h3><div id="membersList" class="list"></div></div>`;

  document.getElementById("addMemberBtn").addEventListener("click", () => openMemberForm());

  const { data } = await supabase.from("members").select("*");
  const list = document.getElementById("membersList");

  list.innerHTML = data
    .map(
      (m) => `
    <div class="item">
      <div class="meta">
        <strong>${escapeHtml(m.name)}</strong>
        <div class="notice">${escapeHtml(m.role)}</div>
      </div>
      <div class="controls">
        <button class="small" onclick="openMemberForm('${m.id}')">Edit</button>
        <button class="small danger" onclick="deleteMember('${m.id}')">Delete</button>
      </div>
    </div>`
    )
    .join("");
}

/* ---------------- ANNOUNCEMENTS ---------------- */

function renderAnnouncements() {
  adminArea.innerHTML = `
    <div class="card">
      <h3>Announcements</h3>
      <p class="notice">Coming soon.</p>
    </div>
  `;
}

/* ---------------- MEMBERSHIP APPLICATIONS ---------------- */

async function renderApplications() {
  adminArea.innerHTML = `
    <div class="card">
      <h3>Membership Applications</h3>
      <div id="appsList" class="list"></div>
    </div>
  `;

  const { data } = await supabase
    .from("membership_applications")
    .select("*")
    .order("created_at", { ascending: false });

  const list = document.getElementById("appsList");

  list.innerHTML = data
    .map(
      (app) => `
      <div class="item">
        <div class="meta">
          <strong>${escapeHtml(app.full_name)}</strong>
          <div class="notice">${app.email}</div>
          <div style="margin-top:4px">${escapeHtml(app.reason || "")}</div>
          <div class="notice">Submitted: ${new Date(app.created_at).toLocaleString()}</div>
        </div>
        <div class="controls">
          <button class="small" onclick="markReviewed('${app.id}')">
            ${app.reviewed ? "Reviewed ✔" : "Mark Reviewed"}
          </button>
          <button class="small danger" onclick="deleteApplication('${app.id}')">Delete</button>
        </div>
      </div>
    `
    )
    .join("");
}

async function markReviewed(id) {
  await supabase.from("membership_applications").update({ reviewed: true }).eq("id", id);
  renderApplications();
}

async function deleteApplication(id) {
  if (!confirm("Delete this application?")) return;
  await supabase.from("membership_applications").delete().eq("id", id);
  renderApplications();
}

/* ---------------- UTILITIES ---------------- */

function escapeHtml(s) {
  return String(s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

checkSession();
