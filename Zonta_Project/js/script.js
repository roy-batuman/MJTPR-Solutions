/******************************************************
 * Zonta Club of Naples — Full Site Logic
 * Handles navigation, carousel, animations, and forms
 ******************************************************/

document.addEventListener("DOMContentLoaded", () => {

  // ===== FADE-IN ELEMENTS =====
  (function () {
    const items = document.querySelectorAll(".fade-in, .fade-in-section");
    if (!items || items.length === 0) return;
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    items.forEach(el => observer.observe(el));
  })();

  // ===== HAMBURGER MENU =====
  const menuBtn = document.querySelector(".menu-btn");
  const navLinks = document.querySelector(".nav-links");
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => navLinks.classList.toggle("show"));
  }

  // ===== CAROUSEL =====
  const slides = document.querySelectorAll(".carousel img");
  if (slides.length) {
    let current = 0;
    slides[current].classList.add("active");
    setInterval(() => {
      slides[current].classList.remove("active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("active");
    }, 4000);
  }

  // ===== SINGLE-PAGE NAVIGATION =====
  const pages = document.querySelectorAll(".page");
  const navButtons = document.querySelectorAll("[data-nav]");

  function hideAllPages() {
    pages.forEach(p => p.style.display = "none");
  }

  function showPage(name) {
    hideAllPages();
    const el = document.getElementById("page-" + name);
    if (el) el.style.display = "block";
    window.location.hash = name;
    window.scrollTo({ top: 0 });
  }

  navButtons.forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      showPage(btn.getAttribute("data-nav"));
      if (navLinks && navLinks.classList.contains("show")) navLinks.classList.remove("show");
    });
  });

  const initialPage = window.location.hash.replace("#", "") || "home";
  showPage(initialPage);

  window.addEventListener("hashchange", () => {
    const page = window.location.hash.replace("#", "");
    showPage(page);
  });

  // ===== HERO BUTTONS =====
  const joinBtn = document.getElementById("joinBtn");
  const heroJoin = document.getElementById("heroJoin");
  const donateBtn = document.getElementById("donateBtn");
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
// Fade-in on scroll for info section
const infoSection = document.querySelector('.info-section');

function revealInfo() {
  const rect = infoSection.getBoundingClientRect();
  if (rect.top < window.innerHeight - 100) {
    infoSection.classList.add('visible');
  }
}

window.addEventListener('scroll', revealInfo);
revealInfo();

document.addEventListener("scroll", () => {
  const elements = document.querySelectorAll(".fade-in-section");

  elements.forEach(el => {
    const position = el.getBoundingClientRect().top;
    const screenHeight = window.innerHeight;

    if (position < screenHeight - 100) {
      el.classList.add("visible");
    }
  });
});
/* -----------------------------
 OUR MISSION SLIDESHOW LOGIC
------------------------------ */

let missionSlideIndex = 0;
const missionSlides = document.querySelectorAll(".mission-slides img");
const dots = document.querySelectorAll(".mission-dots .dot");

function showMissionSlide(n) {
  missionSlides.forEach((slide, i) => {
    slide.classList.remove("active");
    dots[i].classList.remove("active");
  });

  missionSlides[n].classList.add("active");
  dots[n].classList.add("active");
}

function nextMissionSlide() {
  missionSlideIndex = (missionSlideIndex + 1) % missionSlides.length;
  showMissionSlide(missionSlideIndex);
}

function prevMissionSlide() {
  missionSlideIndex =
    (missionSlideIndex - 1 + missionSlides.length) % missionSlides.length;
  showMissionSlide(missionSlideIndex);
}

// Auto-play
setInterval(nextMissionSlide, 5000);

// Buttons
document.querySelector(".mission-next").addEventListener("click", nextMissionSlide);
document.querySelector(".mission-prev").addEventListener("click", prevMissionSlide);

// Dots
dots.forEach((dot, i) => {
  dot.addEventListener("click", () => {
    missionSlideIndex = i;
    showMissionSlide(i);
  });
});

// Initialize
showMissionSlide(0);
//Reveal event cards on scroll
const eventCards = document.querySelectorAll('.event-card');

function revealEvents() {
  const trigger = window.innerHeight * 0.85;

  eventCards.forEach(card => {
    const top = card.getBoundingClientRect().top;
    if (top < trigger) {
      card.classList.add('show');
    }
  });
}

window.addEventListener('scroll', revealEvents);
revealEvents();

//Scroll Animation 
const observeElements = document.querySelectorAll(".fade-in-section");

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
});

observeElements.forEach(el => observer.observe(el));

// PDF DOWNLOAD BUTTON
document.getElementById("downloadPDFBtn").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;

  const form = document.getElementById("zontaApplicationForm");

  const pdf = new jsPDF("p", "pt", "letter");

  pdf.html(form, {
    callback: function (pdf) {
      pdf.save("Zonta_Application.pdf");
    },
    x: 20,
    y: 20,
    width: 560
  });
});

//supabase linkage for pdf
document.getElementById("zontaApplicationForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());
  payload.areas = formData.getAll("areas");

  const response = await fetch("https://YOUR_PROJECT_ID.supabase.co/functions/v1/membership-application", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    alert("Your application has been submitted!");
  } else {
    alert("There was an error submitting your form.");
  }
});
// ================= MEMBERSHIP APPLICATION LOGIC =================
(function () {
  const form = document.getElementById("zontaApplicationForm");
  if (!form) return; // safety

  const errorBox = document.getElementById("appError");
  const successBox = document.getElementById("appSuccess");
  const pdfBtn = document.getElementById("downloadPDFBtn");
  const honeypot = document.getElementById("websiteField");

  function showError(msg) {
    if (!errorBox) return alert(msg);
    errorBox.style.display = "block";
    errorBox.textContent = msg;
  }

  function showSuccess(msg) {
    if (!successBox) return alert(msg);
    successBox.style.display = "block";
    successBox.textContent = msg;
  }

  function clearMessages() {
    if (errorBox) {
      errorBox.style.display = "none";
      errorBox.textContent = "";
    }
    if (successBox) {
      successBox.style.display = "none";
      successBox.textContent = "";
    }
    // clear red borders
    form.querySelectorAll(".error").forEach(el => el.classList.remove("error"));
  }

  function validateForm() {
    clearMessages();

    let valid = true;
    const fullName = form.fullName;
    const email = form.email;
    const phone = form.phone;
    const address = form.address;
    const occupation = form.occupation;
    const reason = form.reason;

    const requiredFields = [fullName, email, phone, address, occupation, reason];

    requiredFields.forEach(f => {
      if (!f.value.trim()) {
        valid = false;
        f.classList.add("error");
      }
    });

    const emailVal = email.value.trim();
    if (emailVal && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailVal)) {
      valid = false;
      email.classList.add("error");
      showError("Please enter a valid email address.");
      return false;
    }

    if (!valid) {
      showError("Please fill in all required fields.");
    }

    return valid;
  }

  // Submit handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages();

    // Honeypot check (bots)
    if (honeypot && honeypot.value.trim() !== "") {
      // Pretend success, but do nothing.
      showSuccess("Thank you! Your application has been received.");
      form.reset();
      return;
    }

    if (!validateForm()) return;

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.areas = formData.getAll("areas");

    try {
      const res = await fetch(
        "https://YOUR_PROJECT_ID.supabase.co/functions/v1/membership-application",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        showError("There was an error submitting your application. Please try again.");
        return;
      }

      showSuccess("Your application has been submitted successfully!");
      form.reset();
    } catch (err) {
      console.error(err);
      showError("Network error. Please try again.");
    }
  });

  // PDF Download button
  if (pdfBtn) {
    pdfBtn.addEventListener("click", async () => {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "pt", "letter");

      // Clone form so we don't show buttons in a weird way
      const clone = form.cloneNode(true);
      clone.querySelectorAll("button").forEach(btn => btn.remove());
      // put in temp container
      const wrapper = document.createElement("div");
      wrapper.style.padding = "20px";
      wrapper.appendChild(clone);

      await pdf.html(wrapper, {
        callback: (doc) => {
          doc.save("Zonta_Membership_Application.pdf");
        },
        x: 20,
        y: 20,
        width: 560,
        windowWidth: 800
      });
    });
  }
})();

/******************************************************
 * Zonta Club of Naples — Full Site Logic
 * Handles navigation, carousel, animations, and forms
 ******************************************************/

document.addEventListener("DOMContentLoaded", () => {

  // ===== FADE-IN ELEMENTS =====
  (function () {
    const items = document.querySelectorAll(".fade-in, .fade-in-section");
    if (!items || items.length === 0) return;
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    items.forEach(el => observer.observe(el));
  })();

  // ===== HAMBURGER MENU =====
  const menuBtn = document.querySelector(".menu-btn");
  const navLinks = document.querySelector(".nav-links");
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () =>
      navLinks.classList.toggle("show")
    );
  }

  // ===== CAROUSEL =====
  const slides = document.querySelectorAll(".carousel img");
  if (slides.length) {
    let current = 0;
    slides[current].classList.add("active");
    setInterval(() => {
      slides[current].classList.remove("active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("active");
    }, 4000);
  }

  // ===== SINGLE-PAGE NAVIGATION =====
  const pages = document.querySelectorAll(".page");
  const navButtons = document.querySelectorAll("[data-nav]");

  function hideAllPages() {
    pages.forEach(p => p.style.display = "none");
  }

  function showPage(name) {
    hideAllPages();
    const el = document.getElementById("page-" + name);
    if (el) el.style.display = "block";
    window.location.hash = name;
    window.scrollTo({ top: 0 });
  }

  navButtons.forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      showPage(btn.getAttribute("data-nav"));
      if (navLinks && navLinks.classList.contains("show"))
        navLinks.classList.remove("show");
    });
  });

  const initialPage = window.location.hash.replace("#", "") || "home";
  showPage(initialPage);

  window.addEventListener("hashchange", () => {
    const page = window.location.hash.replace("#", "");
    showPage(page);
  });

  // ===== HERO BUTTONS =====
  const joinBtn = document.getElementById("joinBtn");
  const heroJoin = document.getElementById("heroJoin");
  const donateBtn = document.getElementById("donateBtn");
  const heroDonate = document.getElementById("heroDonate");

  if (joinBtn) joinBtn.addEventListener("click", () => showPage("membership"));
  if (heroJoin) heroJoin.addEventListener("click", () => showPage("membership"));
  if (donateBtn) donateBtn.addEventListener("click", openDonate);
  if (heroDonate) heroDonate.addEventListener("click", openDonate);

});

/* =========================================
   ZONTA STORE — FRONT-END LOGIC
========================================= */

const storeProducts = [
  {
    id: "mask-1",
    name: "Zonta Face Mask",
    price: 12.00,
    description: "Reusable mask with Zonta emblem.",
    tag: "Support Item",
    image: "images/zonta_mask.jpg"
  },
  {
    id: "mug-1",
    name: "Zonta Coffee Mug",
    price: 18.00,
    description: "Ceramic mug supporting women’s empowerment.",
    tag: "Popular Item",
    image: "images/zonta_mug.jpg"
  },
  {
    id: "ticket-1",
    name: "Fundraising Gala Ticket",
    price: 75.00,
    description: "Entry to our annual fundraising gala.",
    tag: "Event Ticket",
    image: "images/Event-pic1.jpg"
  }
];

let cartItems = [];

/* ---------- DOM ELEMENTS ---------- */
const productsContainer = document.getElementById("productsContainer");
const cartPanel = document.getElementById("cartPanel");
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const overlay = document.getElementById("overlayBackdrop");
const cartCount = document.getElementById("cartCount");
const cartItemsContainer = document.getElementById("cartItemsContainer");
const cartEmptyMessage = document.getElementById("cartEmptyMessage");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

// Modal
const productModal = document.getElementById("productModal");
const modalImg = document.getElementById("modalProductImage");
const modalName = document.getElementById("modalProductName");
const modalPrice = document.getElementById("modalProductPrice");
const modalDesc = document.getElementById("modalProductDescription");
const modalTag = document.getElementById("modalProductTag");
const modalQty = document.getElementById("modalProductQty");
const modalAddBtn = document.getElementById("modalAddToCartBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

let modalProduct = null;

/* ---------- RENDER PRODUCTS ---------- */
function renderProducts() {
  productsContainer.innerHTML = storeProducts
    .map(
      p => `
      <div class="product-card" data-id="${p.id}">
        <div class="product-img-wrap">
          <img src="${p.image}" class="product-img">
        </div>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-description">${p.description}</p>

        <div class="product-footer-row">
          <div class="product-price">$${p.price.toFixed(2)}</div>
          <div>
            <button class="more-info-btn" data-action="details">Details</button>
            <button class="add-cart-btn" data-action="add">Add</button>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

/* ---------- ADD TO CART ---------- */
function addToCart(id, qty = 1) {
  const product = storeProducts.find(p => p.id === id);
  if (!product) return;
  
  const existing = cartItems.find(i => i.id === id);
  if (existing) existing.qty += qty;
  else cartItems.push({ ...product, qty });

  updateCart();
}

/* ---------- UPDATE CART UI ---------- */
function updateCart() {
  const count = cartItems.reduce((sum, i) => sum + i.qty, 0);
  cartCount.textContent = count;

  if (cartItems.length === 0) {
    cartItemsContainer.innerHTML = "";
    cartEmptyMessage.style.display = "block";
    cartTotal.textContent = "$0.00";
    return;
  }

  cartEmptyMessage.style.display = "none";

  cartItemsContainer.innerHTML = cartItems
    .map(
      i => `
      <div class="cart-item">
        <div>
          <div class="cart-item-name">${i.name}</div>
          <div class="cart-item-meta">$${i.price.toFixed(2)} each</div>
        </div>
        <div class="cart-item-actions">
          <input type="number" data-id="${i.id}" class="cart-qty-input" min="1" value="${i.qty}">
          <button data-remove="${i.id}" class="cart-remove-btn">Remove</button>
          <div class="cart-item-price">$${(i.price * i.qty).toFixed(2)}</div>
        </div>
      </div>
    `
    )
    .join("");

  cartTotal.textContent =
    "$" +
    cartItems.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2);
}

/* ---------- OPEN / CLOSE CART ---------- */
function openCart() {
  cartPanel.classList.add("open");
  overlay.classList.add("show");
}

function closeCart() {
  cartPanel.classList.remove("open");
  overlay.classList.remove("show");
}

/* ---------- PRODUCT MODAL ---------- */
function openModal(id) {
  const p = storeProducts.find(x => x.id === id);
  modalProduct = p;

  modalImg.src = p.image;
  modalName.textContent = p.name;
  modalPrice.textContent = "$" + p.price.toFixed(2);
  modalDesc.textContent = p.description;
  modalTag.textContent = p.tag;
  modalQty.value = 1;

  productModal.classList.add("open");
  overlay.classList.add("show");
}

function closeModal() {
  productModal.classList.remove("open");
  overlay.classList.remove("show");
}

/* ---------- EVENT LISTENERS ---------- */
productsContainer.addEventListener("click", e => {
  const card = e.target.closest(".product-card");
  if (!card) return;

  const id = card.dataset.id;
  const action = e.target.dataset.action;

  if (action === "add") addToCart(id);
  if (action === "details") openModal(id);
});

cartItemsContainer.addEventListener("input", e => {
  if (!e.target.classList.contains("cart-qty-input")) return;
  const id = e.target.dataset.id;
  const item = cartItems.find(i => i.id === id);
  item.qty = parseInt(e.target.value);
  updateCart();
});

cartItemsContainer.addEventListener("click", e => {
  if (!e.target.dataset.remove) return;
  const id = e.target.dataset.remove;
  cartItems = cartItems.filter(i => i.id !== id);
  updateCart();
});

openCartBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
overlay.addEventListener("click", () => {
  closeCart();
  closeModal();
});

closeModalBtn.addEventListener("click", closeModal);

modalAddToCartBtn.addEventListener("click", () => {
  addToCart(modalProduct.id, parseInt(modalQty.value));
  closeModal();
  openCart();
});

checkoutBtn.addEventListener("click", () => {
  alert("Checkout system will be activated once Stripe is connected.");
});

/* ---------- INIT ---------- */
renderProducts();
updateCart();
function openCart() {
  cartPanel.classList.add("open");
  overlay.classList.add("visible");
}

function closeCart() {
  cartPanel.classList.remove("open");
  overlay.classList.remove("visible");
}

if (openCartBtn) openCartBtn.addEventListener("click", openCart);
if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
if (overlay) overlay.addEventListener("click", closeCart);



document.querySelectorAll(".mini-carousel").forEach((carousel) => {
    const inner = carousel.querySelector(".mini-carousel-inner");
    const images = inner.querySelectorAll("img");
    const captionBox = carousel.querySelector(".mini-caption");

    let index = 0;
    const total = images.length;

    // Update carousel position + caption
    function updateCarousel() {
        inner.style.transform = `translateX(-${index * 100}%)`;
        captionBox.textContent = images[index].dataset.caption;
    }

    // Prev button
    const prevBtn = carousel.querySelector(".scholarship-mini-prev");
    prevBtn.addEventListener("click", () => {
        index = (index - 1 + total) % total;
        updateCarousel();
    });

    // Next button
    const nextBtn = carousel.querySelector(".scholarship-mini-next");
    nextBtn.addEventListener("click", () => {
        index = (index + 1) % total;
        updateCarousel();
    });

    // Initialize
    updateCarousel();
});


