/* -------------------------------------------------
   Zonta Admin Panel — Full Logic
   Requires:
   - profiles (id, full_name, is_admin)
   - events, scholarships, members, announcements,
     products, membership_applications tables
   - Storage bucket: "public-assets"
--------------------------------------------------- */

// 🔑 Supabase config (you can keep your existing URL & anon key)
const SUPABASE_URL = "https://ecixycrogsswdfkrokvw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjaXh5Y3JvZ3Nzd2Rma3Jva3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjA0NTQsImV4cCI6MjA3OTcyMDQ1NH0.AyOJKSRMWtRwKPg4gFXvSYMq9AnxR9EyQfgVF_YyXAg";

// Global Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM refs
const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const emailSignInBtn = document.getElementById("emailSignIn");
const emailInput = document.getElementById("emailInput");
const googleSignInBtn = document.getElementById("googleSignIn");
const appleSignInBtn = document.getElementById("appleSignIn");
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
  if (session?.user) {
    await handleSignedIn(session.user);
  } else {
    showLogin();
  }
}

function showLogin() {
  loginCard.style.display = "block";
  adminArea.classList.add("hidden");
  signOutBtn.classList.add("hidden");
  signedInAs.textContent = "Not signed in";
  topActions.innerHTML = "";
}

async function handleSignedIn(user) {
  currentUser = user;

  // ensure profile row exists
  await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  isAdmin = profile?.is_admin === true;
  const displayName = profile?.full_name || user.email || user.id;
  signedInAs.textContent = `Signed in: ${displayName}${isAdmin ? " (admin)" : ""}`;

  loginCard.style.display = "none";
  adminArea.classList.remove("hidden");
  signOutBtn.classList.remove("hidden");

  if (!isAdmin) {
    adminArea.innerHTML = `
      <div class="card">
        <h3>No admin access</h3>
        <p class="notice">Your account is not marked as <code>is_admin = true</code> in the <code>profiles</code> table.</p>
      </div>`;
    topActions.innerHTML = "";
    return;
  }

  renderTab("dashboard");
}

// Magic link
emailSignInBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email) return alert("Enter an email.");
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) return alert(error.message);
  alert("Magic link sent. Check your email.");
});

// OAuth - Google
googleSignInBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.href },
  });
  if (error) alert(error.message);
});

// OAuth - Apple
appleSignInBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: { redirectTo: window.location.href },
  });
  if (error) alert(error.message);
});

// Sidebar "Sign In" scroll
signInBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  emailInput?.focus();
});

// Sign out
signOutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  isAdmin = false;
  currentUser = null;
  showLogin();
});

// Auth state listener
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) handleSignedIn(session.user);
  else showLogin();
});

/* ---------------- NAV & TABS ---------------- */

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderTab(btn.dataset.tab);
  });
});

function setPageTitle(tab) {
  pageTitle.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
}

async function renderTab(tab) {
  if (!isAdmin && tab !== "dashboard") {
    adminArea.innerHTML = `
      <div class="card">
        <h3>No admin access</h3>
        <p class="notice">You must be an administrator to manage content.</p>
      </div>`;
    topActions.innerHTML = "";
    return;
  }

  currentTab = tab;
  setPageTitle(tab);
  topActions.innerHTML = "";

  if (tab === "dashboard") return renderDashboard();
  if (tab === "events") return renderEvents();
  if (tab === "scholarships") return renderScholarships();
  if (tab === "members") return renderMembers();
  if (tab === "announcements") return renderAnnouncements();
  if (tab === "applications") return renderApplications();
  if (tab === "products") return renderProducts();
}

/* ---------------- DASHBOARD ---------------- */

async function renderDashboard() {
  adminArea.innerHTML = `
    <div class="card">
      <h3>Welcome, admin</h3>
      <p class="notice">Use the left menu to manage events, scholarships, members, announcements, applications, and products.</p>
    </div>
  `;
}

/* ---------------- EVENTS (with image upload) ---------------- */

async function renderEvents() {
  topActions.innerHTML = `<button class="btn" id="addEventBtn">+ Add Event</button>`;
  adminArea.innerHTML = `
    <div class="card">
      <h3>Events</h3>
      <div id="eventsList" class="list"></div>
    </div>`;

  document.getElementById("addEventBtn").addEventListener("click", () => openEventForm());

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  const list = document.getElementById("eventsList");
  if (error) {
    list.innerHTML = `<div class="notice">Error: ${error.message}</div>`;
    return;
  }

  list.innerHTML =
    data?.map(
      (ev) => `
      <div class="item" data-id="${ev.id}">
        <div class="meta">
          <strong>${escapeHtml(ev.title)}</strong>
          <div class="notice">${ev.date} • ${escapeHtml(ev.location || "")}</div>
          <div style="margin-top:6px; color:#444;">${truncate(ev.description || "", 120)}</div>
          ${ev.image_url ? `<div class="notice">Image: <a href="${ev.image_url}" target="_blank">View</a></div>` : ""}
        </div>
        <div class="controls">
          <button class="small" data-action="edit">Edit</button>
          <button class="small danger" data-action="delete">Delete</button>
        </div>
      </div>`
    ).join("") || `<div class="notice">No events yet.</div>`;

  list.querySelectorAll(".item").forEach((item) => {
    const id = item.dataset.id;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => openEventForm(id));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteEvent(id));
  });
}

function openEventForm(id = null) {
  editingId = id;
  modalTitle.textContent = id ? "Edit Event" : "Add Event";
  modalBody.innerHTML = `<div class="notice">Loading...</div>`;
  modal.classList.add("open");

  if (id) {
    supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          alert(error.message);
          modal.classList.remove("open");
          return;
        }
        const ev = data;
        modalBody.innerHTML = eventFormHTML(ev);
      });
  } else {
    modalBody.innerHTML = eventFormHTML();
  }
}

function eventFormHTML(ev = {}) {
  const dateVal = ev.date ? String(ev.date).split("T")[0] : "";
  return `
    <label>Title<input class="input" id="f_title" value="${escapeAttr(ev.title || "")}" /></label>
    <label>Date<input type="date" class="input" id="f_date" value="${dateVal}" /></label>
    <label>Location<input class="input" id="f_location" value="${escapeAttr(ev.location || "")}" /></label>
    <label>Description<textarea class="input" id="f_description" rows="4">${escapeHtml(ev.description || "")}</textarea></label>
    <label>Image URL (optional)
      <input class="input" id="f_image_url" value="${escapeAttr(ev.image_url || "")}" />
    </label>
    <label>Upload Image (optional)
      <input type="file" id="f_image_file" accept="image/*" />
      <small class="notice">Uploads to Supabase bucket <code>public-assets</code>.</small>
    </label>
  `;
}

async function saveEvent() {
  const title = document.getElementById("f_title").value.trim();
  const date = document.getElementById("f_date").value;
  const location = document.getElementById("f_location").value.trim();
  const description = document.getElementById("f_description").value.trim();
  let imageUrl = document.getElementById("f_image_url").value.trim();
  const fileInput = document.getElementById("f_image_file");
  const file = fileInput?.files?.[0];

  if (!title || !date) return alert("Title and date are required.");

  // If a file was selected, upload it
  if (file) {
    const path = `events/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("public-assets")
      .upload(path, file);
    if (uploadErr) {
      alert("Image upload failed: " + uploadErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("public-assets").getPublicUrl(uploadData.path);
    imageUrl = pub.publicUrl;
  }

  if (editingId) {
    const { error } = await supabase
      .from("events")
      .update({ title, date, location, description, image_url: imageUrl })
      .eq("id", editingId);
    if (error) return alert(error.message);
  } else {
    const { data: userRes } = await supabase.auth.getUser();
    const created_by = userRes?.user?.id || null;
    const { error } = await supabase
      .from("events")
      .insert([{ title, date, location, description, image_url: imageUrl, created_by }]);
    if (error) return alert(error.message);
  }

  modal.classList.remove("open");
  editingId = null;
  renderEvents();
}

async function deleteEvent(id) {
  if (!confirm("Delete this event?")) return;
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return alert(error.message);
  renderEvents();
}

/* ---------------- SCHOLARSHIPS ---------------- */

async function renderScholarships() {
  topActions.innerHTML = `<button class="btn" id="addScholarshipBtn">+ Add Scholarship</button>`;
  adminArea.innerHTML = `
    <div class="card">
      <h3>Scholarships</h3>
      <div id="schList" class="list"></div>
    </div>`;

  document.getElementById("addScholarshipBtn").addEventListener("click", () => openScholarshipForm());

  const { data, error } = await supabase
    .from("scholarships")
    .select("*")
    .order("created_at", { ascending: false });

  const list = document.getElementById("schList");
  if (error) {
    list.innerHTML = `<div class="notice">Error: ${error.message}</div>`;
    return;
  }

  list.innerHTML =
    data?.map(
      (s) => `
      <div class="item" data-id="${s.id}">
        <div class="meta">
          <strong>${escapeHtml(s.name)}</strong>
          <div class="notice">Deadline: ${s.deadline || "—"}</div>
          <div style="margin-top:6px; color:#444;">${truncate(s.description || "", 120)}</div>
          ${s.pdf_url ? `<div class="notice">PDF: <a href="${s.pdf_url}" target="_blank">View</a></div>` : ""}
        </div>
        <div class="controls">
          <button class="small" data-action="edit">Edit</button>
          <button class="small danger" data-action="delete">Delete</button>
        </div>
      </div>`
    ).join("") || `<div class="notice">No scholarships yet.</div>`;

  list.querySelectorAll(".item").forEach((item) => {
    const id = item.dataset.id;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => openScholarshipForm(id));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteScholarship(id));
  });
}

function openScholarshipForm(id = null) {
  editingId = id;
  modalTitle.textContent = id ? "Edit Scholarship" : "Add Scholarship";
  modalBody.innerHTML = `<div class="notice">Loading...</div>`;
  modal.classList.add("open");

  if (id) {
    supabase
      .from("scholarships")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          alert(error.message);
          modal.classList.remove("open");
          return;
        }
        const s = data;
        const deadline = s.deadline ? String(s.deadline).split("T")[0] : "";
        modalBody.innerHTML = `
          <label>Name<input class="input" id="f_name" value="${escapeAttr(s.name || "")}" /></label>
          <label>Deadline<input type="date" class="input" id="f_deadline" value="${deadline}" /></label>
          <label>Description<textarea class="input" id="f_desc" rows="4">${escapeHtml(s.description || "")}</textarea></label>
          <label>PDF URL<input class="input" id="f_pdf" value="${escapeAttr(s.pdf_url || "")}" /></label>
        `;
      });
  } else {
    modalBody.innerHTML = `
      <label>Name<input class="input" id="f_name" /></label>
      <label>Deadline<input type="date" class="input" id="f_deadline" /></label>
      <label>Description<textarea class="input" id="f_desc" rows="4"></textarea></label>
      <label>PDF URL<input class="input" id="f_pdf" /></label>
    `;
  }
}

async function saveScholarship() {
  const name = document.getElementById("f_name").value.trim();
  const deadline = document.getElementById("f_deadline").value || null;
  const description = document.getElementById("f_desc").value.trim();
  const pdf_url = document.getElementById("f_pdf").value.trim();

  if (!name) return alert("Name is required.");

  if (editingId) {
    const { error } = await supabase
      .from("scholarships")
      .update({ name, deadline, description, pdf_url })
      .eq("id", editingId);
    if (error) return alert(error.message);
  } else {
    const { data: userRes } = await supabase.auth.getUser();
    const created_by = userRes?.user?.id || null;
    const { error } = await supabase
      .from("scholarships")
      .insert([{ name, deadline, description, pdf_url, created_by }]);
    if (error) return alert(error.message);
  }

  modal.classList.remove("open");
  editingId = null;
  renderScholarships();
}

async function deleteScholarship(id) {
  if (!confirm("Delete this scholarship?")) return;
  const { error } = await supabase.from("scholarships").delete().eq("id", id);
  if (error) return alert(error.message);
  renderScholarships();
}

/* ---------------- MEMBERS ---------------- */

async function renderMembers() {
  topActions.innerHTML = `<button class="btn" id="addMemberBtn">+ Add Member</button>`;
  adminArea.innerHTML = `
    <div class="card">
      <h3>Members</h3>
      <div id="membersList" class="list"></div>
    </div>`;

  document.getElementById("addMemberBtn").addEventListener("click", () => openMemberForm());

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });

  const list = document.getElementById("membersList");
  if (error) {
    list.innerHTML = `<div class="notice">Error: ${error.message}</div>`;
    return;
  }

  list.innerHTML =
    data?.map(
      (m) => `
      <div class="item" data-id="${m.id}">
        <div class="meta">
          <strong>${escapeHtml(m.name)}</strong>
          <div class="notice">${escapeHtml(m.role || "")} • ${escapeHtml(m.category || "")}</div>
          <div style="margin-top:6px; color:#444;">${truncate(m.bio || "", 120)}</div>
          ${m.image_url ? `<div class="notice">Image: <a href="${m.image_url}" target="_blank">View</a></div>` : ""}
        </div>
        <div class="controls">
          <button class="small" data-action="edit">Edit</button>
          <button class="small danger" data-action="delete">Delete</button>
        </div>
      </div>`
    ).join("") || `<div class="notice">No members yet.</div>`;

  list.querySelectorAll(".item").forEach((item) => {
    const id = item.dataset.id;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => openMemberForm(id));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteMember(id));
  });
}

function openMemberForm(id = null) {
  editingId = id;
  modalTitle.textContent = id ? "Edit Member" : "Add Member";
  modalBody.innerHTML = `<div class="notice">Loading...</div>`;
  modal.classList.add("open");

  if (id) {
    supabase
      .from("members")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          alert(error.message);
          modal.classList.remove("open");
          return;
        }
        const m = data;
        modalBody.innerHTML = `
          <label>Name<input class="input" id="f_name" value="${escapeAttr(m.name || "")}" /></label>
          <label>Role<input class="input" id="f_role" value="${escapeAttr(m.role || "")}" /></label>
          <label>Category<input class="input" id="f_cat" value="${escapeAttr(m.category || "")}" /></label>
          <label>Bio<textarea class="input" id="f_bio" rows="4">${escapeHtml(m.bio || "")}</textarea></label>
          <label>Image URL<input class="input" id="f_img" value="${escapeAttr(m.image_url || "")}" /></label>
        `;
      });
  } else {
    modalBody.innerHTML = `
      <label>Name<input class="input" id="f_name" /></label>
      <label>Role<input class="input" id="f_role" /></label>
      <label>Category<input class="input" id="f_cat" /></label>
      <label>Bio<textarea class="input" id="f_bio" rows="4"></textarea></label>
      <label>Image URL<input class="input" id="f_img" /></label>
    `;
  }
}

async function saveMember() {
  const name = document.getElementById("f_name").value.trim();
  const role = document.getElementById("f_role").value.trim();
  const category = document.getElementById("f_cat").value.trim();
  const bio = document.getElementById("f_bio").value.trim();
  const image_url = document.getElementById("f_img").value.trim();

  if (!name || !role) return alert("Name and role are required.");

  if (editingId) {
    const { error } = await supabase
      .from("members")
      .update({ name, role, category, bio, image_url })
      .eq("id", editingId);
    if (error) return alert(error.message);
  } else {
    const { error } = await supabase
      .from("members")
      .insert([{ name, role, category, bio, image_url }]);
    if (error) return alert(error.message);
  }

  modal.classList.remove("open");
  editingId = null;
  renderMembers();
}

async function deleteMember(id) {
  if (!confirm("Delete this member?")) return;
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) return alert(error.message);
  renderMembers();
}

/* ---------------- ANNOUNCEMENTS (full CRUD) ---------------- */

async function renderAnnouncements() {
  topActions.innerHTML = `<button class="btn" id="addAnnouncementBtn">+ Add Announcement</button>`;
  adminArea.innerHTML = `
    <div class="card">
      <h3>Announcements</h3>
      <div id="annList" class="list"></div>
    </div>`;

  document.getElementById("addAnnouncementBtn").addEventListener("click", () => openAnnouncementForm());

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  const list = document.getElementById("annList");
  if (error) {
    list.innerHTML = `<div class="notice">Error: ${error.message}</div>`;
    return;
  }

  list.innerHTML =
    data?.map(
      (a) => `
      <div class="item" data-id="${a.id}">
        <div class="meta">
          <strong>${escapeHtml(a.title)}</strong>
          <div class="notice">${new Date(a.created_at).toLocaleString()}</div>
          <div style="margin-top:6px; color:#444;">${truncate(a.body || "", 140)}</div>
        </div>
        <div class="controls">
          <button class="small" data-action="edit">Edit</button>
          <button class="small danger" data-action="delete">Delete</button>
        </div>
      </div>`
    ).join("") || `<div class="notice">No announcements yet.</div>`;

  list.querySelectorAll(".item").forEach((item) => {
    const id = item.dataset.id;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => openAnnouncementForm(id));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteAnnouncement(id));
  });
}

function openAnnouncementForm(id = null) {
  editingId = id;
  modalTitle.textContent = id ? "Edit Announcement" : "Add Announcement";
  modalBody.innerHTML = `<div class="notice">Loading...</div>`;
  modal.classList.add("open");

  if (id) {
    supabase
      .from("announcements")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          alert(error.message);
          modal.classList.remove("open");
          return;
        }
        const a = data;
        modalBody.innerHTML = `
          <label>Title<input class="input" id="f_title" value="${escapeAttr(a.title || "")}" /></label>
          <label>Body<textarea class="input" id="f_body" rows="6">${escapeHtml(a.body || "")}</textarea></label>
        `;
      });
  } else {
    modalBody.innerHTML = `
      <label>Title<input class="input" id="f_title" /></label>
      <label>Body<textarea class="input" id="f_body" rows="6"></textarea></label>
    `;
  }
}

async function saveAnnouncement() {
  const title = document.getElementById("f_title").value.trim();
  const body = document.getElementById("f_body").value.trim();
  if (!title) return alert("Title is required.");

  if (editingId) {
    const { error } = await supabase
      .from("announcements")
      .update({ title, body })
      .eq("id", editingId);
    if (error) return alert(error.message);
  } else {
    const { data: userRes } = await supabase.auth.getUser();
    const created_by = userRes?.user?.id || null;
    const { error } = await supabase
      .from("announcements")
      .insert([{ title, body, created_by }]);
    if (error) return alert(error.message);
  }

  modal.classList.remove("open");
  editingId = null;
  renderAnnouncements();
}

async function deleteAnnouncement(id) {
  if (!confirm("Delete this announcement?")) return;
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) return alert(error.message);
  renderAnnouncements();
}

/* ---------------- MEMBERSHIP APPLICATIONS ---------------- */

async function renderApplications() {
  topActions.innerHTML = "";
  adminArea.innerHTML = `
    <div class="card">
      <h3>Membership Applications</h3>
      <div id="appsList" class="list"></div>
    </div>`;

  const { data, error } = await supabase
    .from("membership_applications")
    .select("*")
    .order("created_at", { ascending: false });

  const list = document.getElementById("appsList");
  if (error) {
    list.innerHTML = `<div class="notice">Error: ${error.message}</div>`;
    return;
  }

  list.innerHTML =
    data?.map(
      (app) => `
      <div class="item" data-id="${app.id}">
        <div class="meta">
          <strong>${escapeHtml(app.full_name)}</strong>
          <div class="notice">${escapeHtml(app.email)}</div>
          <div style="margin-top:4px;">${escapeHtml(app.reason || "")}</div>
          <div class="notice">Submitted: ${new Date(app.created_at).toLocaleString()}</div>
          <div class="notice">Reviewed: ${app.reviewed ? "✔ Yes" : "No"}</div>
        </div>
        <div class="controls">
          <button class="small" data-action="review">${app.reviewed ? "Mark Unreviewed" : "Mark Reviewed"}</button>
          <button class="small danger" data-action="delete">Delete</button>
        </div>
      </div>`
    ).join("") || `<div class="notice">No applications yet.</div>`;

  list.querySelectorAll(".item").forEach((item) => {
    const id = item.dataset.id;
    item.querySelector('[data-action="review"]').addEventListener("click", async () => {
      const app = data.find((a) => a.id === id);
      const { error } = await supabase
        .from("membership_applications")
        .update({ reviewed: !app.reviewed })
        .eq("id", id);
      if (error) alert(error.message);
      else renderApplications();
    });
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteApplication(id));
  });
}

async function deleteApplication(id) {
  if (!confirm("Delete this application?")) return;
  const { error } = await supabase.from("membership_applications").delete().eq("id", id);
  if (error) return alert(error.message);
  renderApplications();
}

/* ---------------- PRODUCTS / STORE MANAGER ---------------- */

async function renderProducts() {
  topActions.innerHTML = `<button class="btn" id="addProductBtn">+ Add Product</button>`;
  adminArea.innerHTML = `
    <div class="card">
      <h3>Products / Store</h3>
      <div id="productsList" class="list"></div>
    </div>`;

  document.getElementById("addProductBtn").addEventListener("click", () => openProductForm());

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const list = document.getElementById("productsList");
  if (error) {
    list.innerHTML = `<div class="notice">Error: ${error.message}</div>`;
    return;
  }

  list.innerHTML =
    data?.map(
      (p) => `
      <div class="item" data-id="${p.id}">
        <div class="meta">
          <strong>${escapeHtml(p.name)}</strong>
          <div class="notice">$${p.price?.toFixed ? p.price.toFixed(2) : p.price || "0.00"} • Stock: ${p.stock ?? 0}</div>
          <div style="margin-top:6px; color:#444;">${truncate(p.description || "", 120)}</div>
          ${p.image_url ? `<div class="notice">Image: <a href="${p.image_url}" target="_blank">View</a></div>` : ""}
        </div>
        <div class="controls">
          <button class="small" data-action="edit">Edit</button>
          <button class="small danger" data-action="delete">Delete</button>
        </div>
      </div>`
    ).join("") || `<div class="notice">No products yet.</div>`;

  list.querySelectorAll(".item").forEach((item) => {
    const id = item.dataset.id;
    item.querySelector('[data-action="edit"]').addEventListener("click", () => openProductForm(id));
    item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteProduct(id));
  });
}

function openProductForm(id = null) {
  editingId = id;
  modalTitle.textContent = id ? "Edit Product" : "Add Product";
  modalBody.innerHTML = `<div class="notice">Loading...</div>`;
  modal.classList.add("open");

  if (id) {
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          alert(error.message);
          modal.classList.remove("open");
          return;
        }
        const p = data;
        modalBody.innerHTML = `
          <label>Name<input class="input" id="f_name" value="${escapeAttr(p.name || "")}" /></label>
          <label>Price<input type="number" step="0.01" class="input" id="f_price" value="${p.price ?? ""}" /></label>
          <label>Stock<input type="number" class="input" id="f_stock" value="${p.stock ?? 0}" /></label>
          <label>Description<textarea class="input" id="f_desc" rows="4">${escapeHtml(p.description || "")}</textarea></label>
          <label>Image URL<input class="input" id="f_img_url" value="${escapeAttr(p.image_url || "")}" /></label>
          <label>Upload Image (optional)
            <input type="file" id="f_img_file" accept="image/*" />
            <small class="notice">Uploads to Supabase bucket <code>public-assets</code>.</small>
          </label>
        `;
      });
  } else {
    modalBody.innerHTML = `
      <label>Name<input class="input" id="f_name" /></label>
      <label>Price<input type="number" step="0.01" class="input" id="f_price" /></label>
      <label>Stock<input type="number" class="input" id="f_stock" value="0" /></label>
      <label>Description<textarea class="input" id="f_desc" rows="4"></textarea></label>
      <label>Image URL<input class="input" id="f_img_url" /></label>
      <label>Upload Image (optional)
        <input type="file" id="f_img_file" accept="image/*" />
        <small class="notice">Uploads to Supabase bucket <code>public-assets</code>.</small>
      </label>
    `;
  }
}

async function saveProduct() {
  const name = document.getElementById("f_name").value.trim();
  const priceVal = document.getElementById("f_price").value;
  const stockVal = document.getElementById("f_stock").value;
  const description = document.getElementById("f_desc").value.trim();
  let image_url = document.getElementById("f_img_url").value.trim();
  const file = document.getElementById("f_img_file")?.files?.[0];

  if (!name) return alert("Name is required.");

  const price = priceVal ? parseFloat(priceVal) : null;
  const stock = stockVal ? parseInt(stockVal, 10) : 0;

  if (file) {
    const path = `products/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("public-assets")
      .upload(path, file);
    if (uploadErr) {
      alert("Image upload failed: " + uploadErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("public-assets").getPublicUrl(uploadData.path);
    image_url = pub.publicUrl;
  }

  if (editingId) {
    const { error } = await supabase
      .from("products")
      .update({ name, price, stock, description, image_url })
      .eq("id", editingId);
    if (error) return alert(error.message);
  } else {
    const { error } = await supabase
      .from("products")
      .insert([{ name, price, stock, description, image_url }]);
    if (error) return alert(error.message);
  }

  modal.classList.remove("open");
  editingId = null;
  renderProducts();
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return alert(error.message);
  renderProducts();
}

/* ---------------- MODAL GLOBAL HANDLERS ---------------- */

modalSave.addEventListener("click", () => {
  if (currentTab === "events") return saveEvent();
  if (currentTab === "scholarships") return saveScholarship();
  if (currentTab === "members") return saveMember();
  if (currentTab === "announcements") return saveAnnouncement();
  if (currentTab === "products") return saveProduct();
});

modalCancel.addEventListener("click", () => {
  modal.classList.remove("open");
  editingId = null;
});

/* ---------------- HELPERS ---------------- */

function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function escapeHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s) {
  if (!s) return "";
  return String(s).replace(/"/g, "&quot;");
}

/* ---------------- INITIAL LOAD ---------------- */

checkSession();
