const SECTION_META = {
  maps: {
    title: { he: "מפות", en: "Maps" },
    intro: {
      he: "מפות שממחישות את מסלול הטיול, האזור הגיאוגרפי ומיקומו בעולם.",
      en: "Maps illustrating the trip route, the geographic region, and its location in the world.",
    },
  },
  human: {
    title: { he: "גיאוגרפיה אנושית", en: "Human Geography" },
    intro: {
      he: "דברים מעניינים לאורך מסלול הטיול: אנשים, תרבות, דת ואורח חיים ברמת טיבט ובמרכז סין.",
      en: "Interesting things along the trip route: people, culture, religion and way of life on the Tibetan Plateau and in central China.",
    },
  },
  physical: {
    title: { he: "גיאוגרפיה פיסית", en: "Physical Geography" },
    intro: {
      he: "נופים, תצורות טבע ותופעות גיאולוגיות שנצפו במהלך הטיול.",
      en: "Landscapes, natural formations and geological phenomena observed during the trip.",
    },
  },
  people: {
    title: { he: "אנשים בסין", en: "People in China" },
    intro: { he: "", en: "" },
  },
};

const SECTION_ORDER = ["maps", "human", "physical", "people"];

const UI_STRINGS = {
  he: {
    heroEyebrow: "✦ תמונות נבחרות ✦",
    heroTitle: "טיול למרכז סין",
    heroCredit: "טיול מאורגן במסגרת \"עולם נסתר\" בהדרכת רנן הורקני (קיץ 2026)",
    heroSubtitle: "רמת טיבט · דרך המשי · מדבר גובי",
    loading: "טוען תמונות...",
    error: "שגיאה בטעינת התמונות.",
    slideshowBtn: "מצגת רצה",
    locationBtnText: "מיקום הצילום",
    locationBtnAria: "הצג מיקום על מפה",
    approxNote: "* מיקום משוער, מבוסס על תמונה סמוכה שצולמה עם GPS",
    footer: "אלבום דיגיטלי מהטיול לסין ולרמת טיבט",
    langToggle: "EN",
    closeAria: "סגירה",
    prevAria: "התמונה הקודמת",
    nextAria: "התמונה הבאה",
    pauseAria: "השהה מצגת",
    resumeAria: "המשך מצגת",
    fullscreenEnterAria: "הגדלה למסך מלא",
    fullscreenExitAria: "יציאה ממסך מלא",
  },
  en: {
    heroEyebrow: "✦ Selected Photos ✦",
    heroTitle: "Trip to Central China",
    heroCredit: "An organized trip as part of \"Olam Nistar\" (Hidden World), guided by Renan Hurkani (Summer 2026)",
    heroSubtitle: "Tibetan Plateau · Silk Road · Gobi Desert",
    loading: "Loading photos...",
    error: "Error loading photos.",
    slideshowBtn: "Slideshow",
    locationBtnText: "Photo Location",
    locationBtnAria: "Show location on map",
    approxNote: "* Approximate location, based on a nearby photo taken with GPS",
    footer: "A digital album from the trip to China and the Tibetan Plateau",
    langToggle: "עב",
    closeAria: "Close",
    prevAria: "Previous photo",
    nextAria: "Next photo",
    pauseAria: "Pause slideshow",
    resumeAria: "Resume slideshow",
    fullscreenEnterAria: "Enter fullscreen",
    fullscreenExitAria: "Exit fullscreen",
  },
};

let currentLang = localStorage.getItem("lang") === "en" ? "en" : "he";
let translations = { captions: {}, sites: {} };

function t(key) {
  return UI_STRINGS[currentLang][key];
}

function tCaption(heCaption) {
  if (!heCaption) return heCaption;
  if (currentLang === "en" && translations.captions[heCaption]) {
    return translations.captions[heCaption];
  }
  return heCaption;
}

function tSite(loc) {
  if (currentLang === "en" && translations.sites[loc.siteName]) {
    return translations.sites[loc.siteName];
  }
  return { name: loc.siteName, description: loc.description };
}

let items = [];
let currentIndex = 0;

async function init() {
  const root = document.getElementById("gallery-root");
  try {
    const [dataRes, transRes] = await Promise.all([fetch("data.json"), fetch("translations.json")]);
    items = await dataRes.json();
    translations = await transRes.json();
  } catch (e) {
    root.innerHTML = `<p class="loading">${t("error")}</p>`;
    return;
  }

  applyLanguage();
}

function renderGallery() {
  const root = document.getElementById("gallery-root");
  root.innerHTML = "";

  SECTION_ORDER.forEach((groupId) => {
    const groupItems = items.filter((it) => it.group === groupId);
    if (!groupItems.length) return;

    const meta = SECTION_META[groupId] || { title: { he: groupId, en: groupId }, intro: { he: "", en: "" } };
    const title = meta.title[currentLang];
    const intro = meta.intro[currentLang];
    const section = document.createElement("section");
    section.className = "section";
    section.id = groupId;

    section.innerHTML = `
      <div class="section-header">
        <h2>${title}</h2>
        ${intro ? `<p>${intro}</p>` : ""}
        <button type="button" class="slideshow-btn" data-group="${groupId}">
          <span aria-hidden="true">&#9654;</span> ${t("slideshowBtn")}
        </button>
      </div>
      <div class="grid" data-group="${groupId}"></div>
    `;

    section.querySelector(".slideshow-btn").addEventListener("click", () => startSlideshow(groupId));

    const grid = section.querySelector(".grid");
    groupItems.forEach((item) => {
      const globalIndex = items.indexOf(item);
      const caption = tCaption(item.caption);
      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", caption || title);
      card.innerHTML = `
        <span class="card-img-wrap">
          ${item.location ? `<button type="button" class="card-location-btn" aria-label="${t("locationBtnAria")}"><span aria-hidden="true">📍</span></button>` : ""}
          <img src="images/${item.filename}" alt="${escapeHtml(caption || title)}" loading="lazy">
        </span>
        ${caption ? `<span class="card-caption">${escapeHtml(caption)}</span>` : ""}
      `;
      card.addEventListener("click", () => openLightbox(globalIndex));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(globalIndex);
        }
      });
      const locBtn = card.querySelector(".card-location-btn");
      if (locBtn) {
        locBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          openLocationModal(item);
        });
      }
      grid.appendChild(card);
    });

    root.appendChild(section);
  });
}

function applyLanguage() {
  document.documentElement.lang = currentLang;
  document.body.classList.toggle("lang-en", currentLang === "en");

  document.getElementById("hero-eyebrow").textContent = t("heroEyebrow");
  document.getElementById("hero-title").textContent = t("heroTitle");
  document.getElementById("hero-credit").textContent = t("heroCredit");
  document.getElementById("hero-subtitle").textContent = t("heroSubtitle");
  document.getElementById("footer-text").textContent = t("footer");
  document.querySelectorAll(".route-label").forEach((el) => {
    const g = el.getAttribute("data-group");
    const meta = SECTION_META[g];
    if (meta) el.textContent = meta.title[currentLang];
  });
  document.getElementById("lang-toggle").textContent = t("langToggle");
  document.getElementById("lightbox-close").setAttribute("aria-label", t("closeAria"));
  document.getElementById("lightbox-prev").setAttribute("aria-label", t("prevAria"));
  document.getElementById("lightbox-next").setAttribute("aria-label", t("nextAria"));
  document.getElementById("location-modal-close").setAttribute("aria-label", t("closeAria"));
  document.getElementById("lightbox-location-btn-text").textContent = t("locationBtnText");

  renderGallery();

  if (lightbox.classList.contains("open")) {
    updateLightbox();
  }
  if (playToggleBtn && !playToggleBtn.hidden) {
    playToggleBtn.setAttribute("aria-label", slideshowTimer ? t("pauseAria") : t("resumeAria"));
  }
  updateFullscreenIcon();
  if (locationModal.classList.contains("open") && currentLocationItem) {
    openLocationModal(currentLocationItem);
  }
}

document.getElementById("lang-toggle").addEventListener("click", () => {
  currentLang = currentLang === "he" ? "en" : "he";
  localStorage.setItem("lang", currentLang);
  applyLanguage();
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Lightbox ----------
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCaption = document.getElementById("lightbox-caption-text");
const lightboxCounter = document.getElementById("lightbox-counter");

function openLightbox(index) {
  stopSlideshow();
  currentIndex = index;
  updateLightbox();
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  stopSlideshow();
  if (isFullscreen()) exitFullscreen();
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

const lightboxLocationBtn = document.getElementById("lightbox-location-btn");

function updateLightbox() {
  const item = items[currentIndex];
  if (!item) return;
  const caption = tCaption(item.caption);
  lightboxImg.src = `images/${item.filename}`;
  lightboxImg.alt = caption;
  lightboxCaption.textContent = caption;
  if (slideshowGroup) {
    const pos = slideshowIndices.indexOf(currentIndex);
    lightboxCounter.textContent = `${pos + 1} / ${slideshowIndices.length}`;
  } else {
    lightboxCounter.textContent = `${currentIndex + 1} / ${items.length}`;
  }
  if (item.location) {
    lightboxLocationBtn.hidden = false;
    lightboxLocationBtn.onclick = () => openLocationModal(item);
  } else {
    lightboxLocationBtn.hidden = true;
    lightboxLocationBtn.onclick = null;
  }
}

function showNext() {
  if (slideshowGroup) {
    const pos = slideshowIndices.indexOf(currentIndex);
    currentIndex = slideshowIndices[(pos + 1) % slideshowIndices.length];
  } else {
    currentIndex = (currentIndex + 1) % items.length;
  }
  updateLightbox();
}

function showPrev() {
  if (slideshowGroup) {
    const pos = slideshowIndices.indexOf(currentIndex);
    currentIndex = slideshowIndices[(pos - 1 + slideshowIndices.length) % slideshowIndices.length];
  } else {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
  }
  updateLightbox();
}

document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
document.getElementById("lightbox-next").addEventListener("click", () => { pauseSlideshow(); showNext(); });
document.getElementById("lightbox-prev").addEventListener("click", () => { pauseSlideshow(); showPrev(); });

// ---------- Slideshow ----------
const SLIDESHOW_INTERVAL_MS = 4000;
let slideshowGroup = null;
let slideshowIndices = [];
let slideshowTimer = null;
const playToggleBtn = document.getElementById("lightbox-play-toggle");
const playIcon = document.getElementById("lightbox-play-icon");

function startSlideshow(groupId) {
  const indices = items.reduce((acc, it, i) => {
    if (it.group === groupId) acc.push(i);
    return acc;
  }, []);
  if (!indices.length) return;
  slideshowGroup = groupId;
  slideshowIndices = indices;
  playToggleBtn.hidden = false;
  openLightboxForSlideshow(indices[0]);
  resumeSlideshow();
}

function openLightboxForSlideshow(index) {
  currentIndex = index;
  updateLightbox();
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function stopSlideshow() {
  slideshowGroup = null;
  slideshowIndices = [];
  clearInterval(slideshowTimer);
  slideshowTimer = null;
  playToggleBtn.hidden = true;
}

function pauseSlideshow() {
  if (!slideshowGroup) return;
  clearInterval(slideshowTimer);
  slideshowTimer = null;
  playIcon.innerHTML = "&#9654;";
  playToggleBtn.setAttribute("aria-label", t("resumeAria"));
}

function resumeSlideshow() {
  if (!slideshowGroup) return;
  clearInterval(slideshowTimer);
  slideshowTimer = setInterval(showNext, SLIDESHOW_INTERVAL_MS);
  playIcon.innerHTML = "&#10074;&#10074;";
  playToggleBtn.setAttribute("aria-label", t("pauseAria"));
}

playToggleBtn.addEventListener("click", () => {
  if (slideshowTimer) {
    pauseSlideshow();
  } else {
    resumeSlideshow();
  }
});

// ---------- Fullscreen ----------
const fullscreenBtn = document.getElementById("lightbox-fullscreen-toggle");
const fullscreenIcon = document.getElementById("lightbox-fullscreen-icon");

function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function enterFullscreen() {
  const el = lightbox;
  const req = el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen && el.webkitRequestFullscreen();
  if (req && req.catch) req.catch(() => {});
}

function exitFullscreen() {
  const req = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen && document.webkitExitFullscreen();
  if (req && req.catch) req.catch(() => {});
}

fullscreenBtn.addEventListener("click", () => {
  if (isFullscreen()) {
    exitFullscreen();
  } else {
    enterFullscreen();
  }
});

function updateFullscreenIcon() {
  if (isFullscreen()) {
    fullscreenIcon.textContent = "✕";
    fullscreenBtn.setAttribute("aria-label", t("fullscreenExitAria"));
  } else {
    fullscreenIcon.innerHTML = "&#9974;";
    fullscreenBtn.setAttribute("aria-label", t("fullscreenEnterAria"));
  }
}

document.addEventListener("fullscreenchange", updateFullscreenIcon);
document.addEventListener("webkitfullscreenchange", updateFullscreenIcon);

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") {
    if (isFullscreen()) return; // let the browser exit fullscreen first
    closeLightbox();
  }
  // RTL gallery: visually-left arrow key shows next, visually-right shows prev
  if (e.key === "ArrowLeft") { pauseSlideshow(); showNext(); }
  if (e.key === "ArrowRight") { pauseSlideshow(); showPrev(); }
  if (e.key === " " && slideshowGroup) {
    e.preventDefault();
    if (slideshowTimer) pauseSlideshow();
    else resumeSlideshow();
  }
});

// ---------- Location modal ----------
const locationModal = document.getElementById("location-modal");
const locationSiteName = document.getElementById("location-site-name");
const locationDescription = document.getElementById("location-description");
const locationApproxNote = document.getElementById("location-approx-note");
let locationMap = null;
let locationMarker = null;
let currentLocationItem = null;

function openLocationModal(item) {
  const loc = item.location;
  if (!loc) return;
  currentLocationItem = item;

  const site = tSite(loc);
  locationSiteName.textContent = site.name;
  locationDescription.textContent = site.description;
  locationApproxNote.textContent = t("approxNote");
  locationApproxNote.hidden = !loc.approx;

  locationModal.classList.add("open");
  locationModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (!locationMap) {
    locationMap = L.map("location-map");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(locationMap);
  }
  locationMap.setView([loc.lat, loc.lon], 12);
  if (locationMarker) {
    locationMarker.setLatLng([loc.lat, loc.lon]);
  } else {
    locationMarker = L.marker([loc.lat, loc.lon]).addTo(locationMap);
  }
  locationMap.invalidateSize();
}

function closeLocationModal() {
  locationModal.classList.remove("open");
  locationModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = lightbox.classList.contains("open") ? "hidden" : "";
}

document.getElementById("location-modal-close").addEventListener("click", closeLocationModal);
locationModal.addEventListener("click", (e) => {
  if (e.target === locationModal) closeLocationModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && locationModal.classList.contains("open")) closeLocationModal();
});

// ---------- Journey progress bar ----------
const journeyFill = document.getElementById("journey-progress-fill");
function updateJourneyProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  journeyFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
}
window.addEventListener("scroll", updateJourneyProgress, { passive: true });
window.addEventListener("resize", updateJourneyProgress);

init();
updateJourneyProgress();
