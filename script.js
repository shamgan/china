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
      </div>
      <div class="grid" data-group="${groupId}"></div>
    `;

    const grid = section.querySelector(".grid");
    groupItems.forEach((item) => {
      const globalIndex = items.indexOf(item);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "card";
      card.setAttribute("aria-label", item.caption);
      card.innerHTML = `
        <span class="card-img-wrap">
          <img src="images/${item.filename}" alt="${escapeHtml(item.caption)}" loading="lazy">
        </span>
        <span class="card-caption">${escapeHtml(item.caption)}</span>
      `;
      card.addEventListener("click", () => openLightbox(globalIndex));
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
  currentIndex = index;
  updateLightbox();
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function updateLightbox() {
  const item = items[currentIndex];
  if (!item) return;
  lightboxImg.src = `images/${item.filename}`;
  lightboxImg.alt = item.caption;
  lightboxCaption.textContent = item.caption;
  lightboxCounter.textContent = `${currentIndex + 1} / ${items.length}`;
}

function showNext() {
  currentIndex = (currentIndex + 1) % items.length;
  updateLightbox();
}

function showPrev() {
  currentIndex = (currentIndex - 1 + items.length) % items.length;
  updateLightbox();
}

document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
document.getElementById("lightbox-next").addEventListener("click", showNext);
document.getElementById("lightbox-prev").addEventListener("click", showPrev);

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  // RTL gallery: visually-left arrow key shows next, visually-right shows prev
  if (e.key === "ArrowLeft") showNext();
  if (e.key === "ArrowRight") showPrev();
});

init();
