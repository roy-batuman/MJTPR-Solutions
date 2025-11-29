// -------------------------
// INITIALIZE SUPABASE
// -------------------------
const SUPABASE_URL = "YOUR_URL_HERE";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -------------------------
// EMAIL LOGIN
// -------------------------
document.getElementById("emailLoginBtn").onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Login failed: check password or email" + error.message);
    return;
  }

  // Redirect to admin dashboard
  window.location.href = "admin.html";
};

// -------------------------
// GOOGLE LOGIN
// -------------------------
document.getElementById("googleBtn").onclick = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/admin.html" }
  });
};

// -------------------------
// APPLE LOGIN
// -------------------------
document.getElementById("appleBtn").onclick = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: { redirectTo: window.location.origin + "/admin.html" }
  });
};