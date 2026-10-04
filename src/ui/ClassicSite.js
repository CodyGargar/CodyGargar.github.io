import { projects } from '../data/projects.js';
import { renderProjectLink } from './linkRenderer.js';

/**
 * ClassicSite — plain scrollable HTML/CSS rendering of the same project
 * data used by the 3D town, grouped by district. Built once into
 * #classic-site; toggled visible by main.js alongside the 3D scene.
 */
export class ClassicSite {
  constructor() {
    this.container = document.getElementById('classic-site');
    this._build();
  }

  _build() {
    const { github, linkedin, devpost, aboutMe } = projects;

    // District order is derived from the data itself (first-seen order),
    // not a separately maintained allowlist — a hardcoded list silently
    // drops any project whose district isn't in it, with no warning, so a
    // future district added here could vanish from this view while still
    // showing up fine in the 3D town.
    const grouped = {};
    const districtOrder = [];
    for (const p of Object.values(projects)) {
      if (p.district === 'The Telegraph Office') continue; // contact links, shown in the hero instead
      if (!grouped[p.district]) { grouped[p.district] = []; districtOrder.push(p.district); }
      grouped[p.district].push(p);
    }

    const sections = districtOrder
      .map((district) => `
        <section class="classic-district">
          <h2 class="classic-district-title">${district}</h2>
          <div class="classic-grid">
            ${grouped[district].map((p) => this._card(p)).join('')}
          </div>
        </section>
      `).join('');

    this.container.innerHTML = `
      <div id="classic-page">
        <header class="classic-hero">
          <p class="classic-kicker">Portfolio</p>
          <h1 class="classic-name">Edgar Arevalo</h1>
          <p class="classic-tagline">${aboutMe.description}</p>
          <div class="classic-hero-links">
            ${renderProjectLink(github.links[0])}
            ${renderProjectLink(linkedin.links[0])}
            ${renderProjectLink(devpost.links[0])}
          </div>
        </header>

        <main class="classic-main">${sections}</main>

        <footer class="classic-footer">
          <p>Also viewable as a walkable 3D western town — flip the switch above.</p>
        </footer>
      </div>
    `;
  }

  _card(p) {
    const tags = p.tech.length
      ? `<div class="classic-tags">${p.tech.map((t) => `<span class="tag">${t}</span>`).join('')}</div>`
      : '';
    return `
      <article class="classic-card">
        <h3 class="classic-card-title">${p.title}</h3>
        <p class="classic-card-desc">${p.description}</p>
        ${tags}
        <div class="classic-card-links">${p.links.map(renderProjectLink).join('')}</div>
      </article>
    `;
  }
}
