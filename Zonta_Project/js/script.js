/******************************************************
 * Zonta Club of Naples — Full Site Logic
 * Handles navigation, carousel, animations, and forms
 ******************************************************/

document.addEventListener("DOMContentLoaded", () => {
  /* =========================================================
     HAMBURGER MENU
  ========================================================= */
  const menuBtn = document.querySelector(".menu-btn");
  const navLinks = document.querySelector(".nav-links");

  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });
  }

  /* =========================================================
     CAROUSEL (HOME)
  ========================================================= */
  const slides = document.querySelectorAll(".carousel img");
  if (slides.length > 0) {
    let current = 0;
    slides[current].classList.add("active");

    setInterval(() => {
      slides[current].classList.remove("active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("active");
    }, 4000);
  }

  /* =========================================================
     SINGLE-PAGE NAVIGATION (TABS)
  ========================================================= */
  const navButtons = document.querySelectorAll("[data-nav]");
  const pages = document.querySelectorAll(".page");

  function showPage(name) {
    pages.forEach((p) => p.classList.add("hidden"));
    const el = document.getElementById("page-" + name);
    if (el) el.classList.remove("hidden");

    // Update hash for history/back button support
    window.location.hash = name;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Attach navigation listeners
  navButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = btn.getAttribute("data-nav");
      showPage(target);
      if (navLinks.classList.contains("show")) navLinks.classList.remove("show"); // close mobile menu
    });
  });

  // Handle initial page load
  const initialPage = window.location.hash.replace("#", "") || "home";
  showPage(initialPage);

  // Listen for hash changes
  window.addEventListener("hashchange", () => {
    const page = window.location.hash.replace("#", "");
    showPage(page);
  });

  /* =========================================================
     HERO BUTTONS
  ========================================================= */
  const joinBtn = document.getElementById("joinBtn");
  const donateBtn = document.getElementById("donateBtn");
  const heroJoin = document.getElementById("heroJoin");
  const heroDonate = document.getElementById("heroDonate");

  if (joinBtn) joinBtn.addEventListener("click", () => showPage("membership"));
  if (heroJoin) heroJoin.addEventListener("click", () => showPage("membership"));
  if (donateBtn) donateBtn.addEventListener("click", openDonate);
  if (heroDonate) heroDonate.addEventListener("click", openDonate);

  /* =========================================================
     MEMBERSHIP FORM
  ========================================================= */
  window.submitMembershipForm = function (e) {
    e.preventDefault();
    const f = e.target;
    const data = new FormData(f);
    const name = encodeURIComponent(data.get("name") || "");
    const email = encodeURIComponent(data.get("email") || "");
    const phone = encodeURIComponent(data.get("phone") || "");
    const address = encodeURIComponent(data.get("address") || "");
    const type = encodeURIComponent(data.get("type") || "");
    const why = encodeURIComponent(data.get("why") || "");
    const to = "membership@zontanaples.org";
    const subject = encodeURIComponent("New Membership Application from " + (data.get("name") || ""));
    const body = `Name: ${decodeURIComponent(name)}%0D%0AEmail: ${decodeURIComponent(email)}%0D%0APhone: ${decodeURIComponent(phone)}%0D%0AAddress: ${decodeURIComponent(address)}%0D%0AMembership Type: ${decodeURIComponent(type)}%0D%0AReason:%0D%0A${decodeURIComponent(why)}`;
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    return false;
  };

  window.downloadMembershipPDF = function () {
    const content = `
Zonta Club of Naples - Membership Form

Full Name:
Email:
Phone:
Address:
Membership Type: (Individual/Student/Corporate)
Why do you want to join?

Please email completed form to: membership@zontanaples.org
    `.trim();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Zonta_Membership_Form.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /* =========================================================
     SCHOLARSHIP BUTTONS
  ========================================================= */
  const downloadAppBtn = document.getElementById("downloadAppBtn");
  const applyOnlineBtn = document.getElementById("applyOnlineBtn");

  if (downloadAppBtn) {
    downloadAppBtn.addEventListener("click", () => {
      const template = `
Zonta Club of Naples - Scholarship Application

Full Name:
Date of Birth:
Address:
Phone:
Email:
High School / College:
Major / Intended Major:
GPA:
Statement (250 words):
Attachments: transcript, letter of recommendation

Submit via email to: scholarships@zontanaples.org
      `.trim();
      const blob = new Blob([template], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Zonta_Scholarship_Application.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  if (applyOnlineBtn) {
    applyOnlineBtn.addEventListener("click", () => {
      const to = "scholarships@zontanaples.org";
      const subject = encodeURIComponent("Scholarship Application Submission");
      window.location.href = `mailto:${to}?subject=${subject}`;
    });
  }

  /* =========================================================
     CONTACT FORM
  ========================================================= */
  window.contactSubmit = function (e) {
    e.preventDefault();
    const f = e.target;
    const data = new FormData(f);
    const to = "info@zontanaples.org";
    const subject = encodeURIComponent("Website Contact from " + (data.get("name") || ""));
    const body = `Message from ${data.get("name")}\n\n${data.get("message")}\n\nEmail: ${data.get("email")}`;
    window.location.href = `mailto:${to}?subject=${subject}&body=${encodeURIComponent(body)}`;
    return false;
  };

  /* =========================================================
     CART FUNCTIONALITY (CLIENT SIDE)
  ========================================================= */
  let cart = [];
  const cartElement = document.getElementById("cart");
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  window.addToCart = function (name, price) {
    cart.push({ name, price });
    renderCart();
    if (cartElement) cartElement.classList.remove("hidden");
  };

  window.removeFromCart = function (idx) {
    cart.splice(idx, 1);
    renderCart();
  };

  function renderCart() {
    if (!cartItems || !cartTotal) return;
    cartItems.innerHTML = "";
    let total = 0;

    cart.forEach((item, i) => {
      total += item.price;
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.marginBottom = "8px";
      row.innerHTML = `
        <div>${item.name}</div>
        <div style="display:flex;gap:8px;align-items:center">
          <div>$${item.price.toFixed(2)}</div>
          <button class="small" onclick="removeFromCart(${i})" style="background:none;border:0;color:#888;cursor:pointer">✕</button>
        </div>`;
      cartItems.appendChild(row);
    });

    cartTotal.textContent = total.toFixed(2);
    if (cart.length === 0) {
      cartItems.innerHTML = '<div class="small muted">Cart is empty</div>';
      cartElement.classList.add("hidden");
    }
  }

  window.checkoutPayPal = function () {
    if (cart.length === 0) {
      alert("Cart is empty.");
      return;
    }
    const total = cart.reduce((s, i) => s + i.price, 0).toFixed(2);
    const payPalMeLink = "https://www.paypal.com/paypalme/YOUR_PAYPAL_USERNAME/" + total;
    if (confirm(`You will be redirected to PayPal to pay $${total}. Continue?`)) {
      window.open(payPalMeLink, "_blank");
    }
  };

  window.checkoutByCheck = function () {
    if (cart.length === 0) {
      alert("Cart is empty.");
      return;
    }
    const total = cart.reduce((s, i) => s + i.price, 0).toFixed(2);
    alert(`To pay by check: Please mail a check for $${total} payable to "Zonta Club of Naples" to:\n\nZonta Club of Naples\nPO Box 1234\nNaples, FL\n\nInclude a note with items purchased.`);
  };

  /* =========================================================
     DONATE LINK
  ========================================================= */
  window.openDonate = function () {
    const donateUrl = "https://www.paypal.com/donate?hosted_button_id=YOUR_BUTTON_ID";
    if (confirm("Open donation page?")) window.open(donateUrl, "_blank");
  };

  /* =========================================================
     SCROLL ANIMATIONS
  ========================================================= */
  const heroTitle = document.querySelector(".home-hero-title");
  const infoText = document.querySelector(".info-text");

  function revealOnScroll() {
    [heroTitle, infoText].forEach((el) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) el.classList.add("visible");
    });
  }

  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll();
});
