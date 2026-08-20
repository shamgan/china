const SECTION_META = {
  maps: {
    title: "מפות",
    intro: "מפות שממחישות את מסלול הטיול, האזור הגיאוגרפי ומיקומו בעולם.",
  },
  human: {
    title: "גיאוגרפיה אנושית",
    intro: "דברים מעניינים לאורך מסלול הטיול: אנשים, תרבות, דת ואורח חיים ברמת טיבט ובמרכז סין.",
  },
  physical: {
    title: "גיאוגרפיה פיסית",
    intro: "נופים, תצורות טבע ותופעות גיאולוגיות שנצפו במהלך הטיול.",
  },
};

const SECTION_ORDER = ["maps", "human", "physical"];

let items = [];
let currentIndex = 0;

async function init() {
  const root = document.getElementById("gallery-root");
  try {
    const res = await fetch("data.json");
    items = await res.json();
  } catch (e) {
    root.innerHTML = '<p class="loading">שגיאה בטעינת התמונות.</p>';
    return;
  }

  root.innerHTML = "";

  SECTION_ORDER.forEach((groupId) => {
    const groupItems = items.filter((it) => it.group === groupId);
    if (!groupItems.length) return;

    const meta = SECTION_META[groupId] || { title: groupId, intro: "" };
    const section = document.createElement("section");
    section.className = "section";
    section.id = groupId;

    section.innerHTML = `
      <div class="section-header">
        <h2>${meta.title}</h2>
        <p>${meta.intro}</p>
        <button type="button" class="slideshow-btn" data-group="${groupId}">
          <span aria-hidden="true">&#9654;</span> מצגת רצה
        </button>
      </div>
      <div class="grid" data-group="${groupId}"></div>
    `;

    section.querySelector(".slideshow-btn").addEventListener("click", () => startSlideshow(groupId));

    const grid = section.querySelector(".grid");
    groupItems.forEach((item) => {
      const globalIndex = items.indexOf(item);
      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", item.caption);
      card.innerHTML = `
        <span class="card-img-wrap">
          ${item.location ? `<button type="button" class="card-location-btn" aria-label="הצג מיקום על מפה"><span aria-hidden="true">📍</span></button>` : ""}
          <img src="images/${item.filename}" alt="${escapeHtml(item.caption)}" loading="lazy">
        </span>
        <span class="card-caption">${escapeHtml(item.caption)}</span>
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
  lightboxImg.src = `images/${item.filename}`;
  lightboxImg.alt = item.caption;
  lightboxCaption.textContent = item.caption;
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
  playToggleBtn.setAttribute("aria-label", "המשך מצגת");
}

function resumeSlideshow() {
  if (!slideshowGroup) return;
  clearInterval(slideshowTimer);
  slideshowTimer = setInterval(showNext, SLIDESHOW_INTERVAL_MS);
  playIcon.innerHTML = "&#10074;&#10074;";
  playToggleBtn.setAttribute("aria-label", "השהה מצגת");
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
    fullscreenBtn.setAttribute("aria-label", "יציאה ממסך מלא");
  } else {
    fullscreenIcon.innerHTML = "&#9974;";
    fullscreenBtn.setAttribute("aria-label", "הגדלה למסך מלא");
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

function openLocationModal(item) {
  const loc = item.location;
  if (!loc) return;

  locationSiteName.textContent = loc.siteName;
  locationDescription.textContent = loc.description;
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
