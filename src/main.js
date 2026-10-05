import { ProjectModal } from './ui/ProjectModal.js';
import { ClassicSite } from './ui/ClassicSite.js';

// Entry point. Only the lightweight pieces load up front: the classic site,
// the project page, and the view toggle. The 3D town (Three.js and the whole
// world builder, most of the download) is a separate chunk fetched on demand
// the first time the 3D view is shown — see loadTown() below.

const modal = new ProjectModal();
new ClassicSite();

// ── 3D / classic-site toggle ────────────────────────────────────────────────
const scene3dEl = document.getElementById('scene-3d');
const classicEl = document.getElementById('classic-site');
const toggleBtn = document.getElementById('view-toggle');
const loadingEl = document.getElementById('town-loading');

let mode = localStorage.getItem('siteMode') === 'classic' ? 'classic' : '3d';

let town = null; // controller returned by startTown(), once loaded
let townPromise = null;

function loadTown() {
  townPromise ??= import('./town3d.js').then(({ startTown }) => {
    town = startTown({ modal });
    return town;
  });
  return townPromise;
}

function applyMode() {
  const is3d = mode === '3d';
  scene3dEl.style.display = is3d ? '' : 'none';
  classicEl.hidden = is3d;
  toggleBtn.textContent = is3d ? '🌐 Classic Site' : '🤠 3D Town';

  if (!is3d) {
    town?.setActive(false);
    return;
  }
  if (town) {
    town.setActive(true);
    return;
  }
  loadingEl.hidden = false;
  loadTown()
    .then((t) => {
      loadingEl.hidden = true;
      t.setActive(mode === '3d'); // the visitor may have toggled away while it loaded
    })
    .catch(() => {
      townPromise = null; // allow a retry on the next toggle
      loadingEl.textContent = "Couldn't load the 3D town. Try the classic site, or refresh.";
    });
}

toggleBtn.addEventListener('click', () => {
  if (modal.isOpen) modal.close(); // don't leave the project overlay open under the wrong view
  mode = mode === '3d' ? 'classic' : '3d';
  localStorage.setItem('siteMode', mode);
  applyMode();
});

// A classic-site visitor hovering or focusing the toggle is likely to click
// it, so start fetching the town chunk early (without starting it).
const prefetchTown = () => { if (mode === 'classic') import('./town3d.js').catch(() => {}); };
toggleBtn.addEventListener('pointerenter', prefetchTown, { once: true });
toggleBtn.addEventListener('focus', prefetchTown, { once: true });

applyMode();
