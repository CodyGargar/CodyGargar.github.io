import { projects } from '../data/projects.js';
import { renderProjectLink } from './linkRenderer.js';
import { renderBadges } from './badges.js';

/**
 * ProjectPage — full-screen overlay that replaces the viewport when entering a building.
 * Call open(projectId) to show, close() or back button to dismiss.
 */
export class ProjectModal {
  constructor() {
    this.overlay = document.getElementById('modal-overlay');
    this.isOpen = false;
    this.onClose = null;

    this.overlay.innerHTML = `
      <div id="project-page">
        <header id="project-header">
          <button id="back-btn" aria-label="Back to town">
            <span id="back-arrow">←</span> Back to Town
          </button>
        </header>

        <main id="project-main">
          <div id="project-meta">
            <span id="project-district"></span>
          </div>

          <h1 id="project-title"></h1>

          <div id="project-badges"></div>

          <hr class="divider" />

          <p id="project-description"></p>

          <div id="project-tags"></div>

          <div id="project-links"></div>

          <div id="project-media"></div>
        </main>
      </div>
    `;

    document.getElementById('back-btn').addEventListener('click', () => this.close());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  open(projectId) {
    const data = projects[projectId];
    if (!data) return;

    document.getElementById('project-district').textContent = data.district;
    document.getElementById('project-title').textContent = data.title;
    document.getElementById('project-badges').innerHTML = renderBadges(data);
    document.getElementById('project-description').textContent = data.description;

    const tagsEl = document.getElementById('project-tags');
    // Hidden (not just emptied) when there's nothing to show — an empty div
    // still reserves its own margin-bottom, which left a large unexplained
    // gap between the description and the links on projects with no tags
    // (e.g. the github/linkedin contact entries).
    tagsEl.style.display = data.tech.length ? '' : 'none';
    tagsEl.innerHTML = data.tech.length
      ? data.tech.map((t) => `<span class="tag">${t}</span>`).join('')
      : '';

    const linksEl = document.getElementById('project-links');
    linksEl.innerHTML = data.links.map(renderProjectLink).join('');

    // Video (privacy-enhanced embed) and photo grid; each photo opens full size.
    const video = data.youtube
      ? `<div class="project-video"><iframe src="https://www.youtube-nocookie.com/embed/${data.youtube}"
          title="${data.title} video" loading="lazy" allowfullscreen
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`
      : '';
    const photos = data.images?.length
      ? `<div class="project-photos">${data.images.map((img) => `
          <a href="${img.src}" target="_blank" rel="noopener"><img src="${img.src}" alt="${img.alt}" loading="lazy"
            style="object-position: ${img.focus ?? 'center'}" /></a>`).join('')}
        </div>`
      : '';
    document.getElementById('project-media').innerHTML = video + photos;

    this.overlay.classList.add('open');
    this.isOpen = true;
  }

  close() {
    // Clearing the media also stops a playing video instead of leaving it
    // running unseen behind the town.
    document.getElementById('project-media').innerHTML = '';
    this.overlay.classList.remove('open');
    this.isOpen = false;
    if (this.onClose) this.onClose();
  }
}
