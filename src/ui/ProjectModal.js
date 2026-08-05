import { projects } from '../data/projects.js';

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

          <hr class="divider" />

          <p id="project-description"></p>

          <div id="project-tags"></div>

          <div id="project-links"></div>
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
    document.getElementById('project-description').textContent = data.description;

    const tagsEl = document.getElementById('project-tags');
    tagsEl.innerHTML = data.tech.length
      ? data.tech.map((t) => `<span class="tag">${t}</span>`).join('')
      : '';

    const linksEl = document.getElementById('project-links');
    linksEl.innerHTML = data.links
      .map(
        ({ label, url, icon }) =>
          `<a class="project-link" href="${url}" target="_blank" rel="noopener noreferrer">
            <span class="link-icon">${icon}</span>${label}
            <span class="link-ext">↗</span>
          </a>`
      )
      .join('');

    this.overlay.classList.add('open');
    this.isOpen = true;
  }

  close() {
    this.overlay.classList.remove('open');
    this.isOpen = false;
    if (this.onClose) this.onClose();
  }
}
