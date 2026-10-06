import { projects, profile, contact } from '../data/projects.js';
import { renderProjectLink } from './linkRenderer.js';
import { renderBadges } from './badges.js';

// Short tab labels for the town's districts. Any district not listed here
// still gets a tab, labeled with its full district name.
const TAB_LABELS = {
  'Software Gulch': 'Software',
  'Hardware Frontier': 'Hardware',
};
const TAB_STORAGE_KEY = 'classicTab';

// Skills strip groups, built from every project's `tech` tags. Within a group,
// skills used by more projects come first (ties keep this listed order). Any
// tag not listed here still shows up, under "Other", rather than vanishing.
const SKILL_GROUPS = [
  ['Languages', ['Python', 'JavaScript', 'TypeScript', 'C++', 'Java', 'HTML', 'CSS']],
  ['Web & frameworks', ['React', 'Next.js', 'Node.js', 'Express', 'Vite', 'FastAPI', 'Three.js', 'WebSockets', 'Google Maps API', 'SQLite', 'Swing', 'SEO']],
  ['AI & computer vision', ['Claude API', 'Gemini API', 'OpenCV', 'MediaPipe', 'TensorFlow', 'Web Speech API']],
  ['Hardware & embedded', ['ESP32', 'Raspberry Pi', 'IMU', 'ToF sensor', 'GPS', 'PlatformIO', '3D Printing']],
];
// Tags that describe a category or a sub-library rather than a skill of their own.
const SKILL_SKIP = new Set(['Hardware', 'AWT']);

const hasUrl = (link) => link.url && link.url !== '#';
// "https://www.github.com/foo/" -> "github.com/foo"
const displayUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

/**
 * ClassicSite — plain scrollable HTML/CSS rendering of the same project
 * data used by the 3D town: a hero with social links, one tab per district
 * (Software / Hardware), and a contact section. Built once into
 * #classic-site; toggled visible by main.js alongside the 3D scene.
 */
export class ClassicSite {
  constructor() {
    this.container = document.getElementById('classic-site');
    this._build();
  }

  _build() {
    const { github, linkedin, devpost, aboutMe } = projects;
    const socials = [github, linkedin, devpost];

    // District order is derived from the data itself (first-seen order),
    // not a separately maintained allowlist, so a new district can't
    // silently vanish from this view while still showing in the 3D town.
    const grouped = {};
    const districtOrder = [];
    for (const p of Object.values(projects)) {
      if (p.district === 'The Telegraph Office') continue; // social links, shown in the hero instead
      if (!grouped[p.district]) { grouped[p.district] = []; districtOrder.push(p.district); }
      grouped[p.district].push(p);
    }
    // Strongest projects first within each tab (see `rank` in projects.js).
    const byRank = (a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity);
    for (const list of Object.values(grouped)) list.sort(byRank);

    const featured = Object.values(projects)
      .filter((p) => p.featured)
      .sort((a, b) => a.featured - b.featured);

    const tabs = districtOrder.map((district, i) => ({
      district,
      label: TAB_LABELS[district] ?? district,
      id: `classic-tab-${i}`,
      panelId: `classic-panel-${i}`,
    }));

    this.container.innerHTML = `
      <div id="classic-page">
        <header class="classic-hero">
          <p class="classic-kicker">${profile.headline}</p>
          <h1 class="classic-name">${profile.name}</h1>
          <div class="classic-ornament" aria-hidden="true"><span>✦</span></div>
          <p class="classic-tagline">${aboutMe.description}</p>
          <div class="classic-hero-links">
            ${socials.map((s) => renderProjectLink({ ...s.links[0], label: s.title })).join('')}
            <a class="project-link is-primary" href="#classic-contact"><span class="link-icon">✉</span>Get in touch</a>
          </div>
        </header>

        <main class="classic-main">
          ${this._skills()}

          ${featured.length ? `
            <section class="classic-featured" aria-labelledby="classic-featured-title">
              <h2 class="classic-section-title" id="classic-featured-title">Featured</h2>
              <div class="classic-featured-grid">
                ${featured.map((p) => this._card(p, { featured: true })).join('')}
              </div>
            </section>
          ` : ''}

          <h2 class="classic-section-title">All projects</h2>
          <div class="classic-tabs" role="tablist" aria-label="Project categories">
            ${tabs.map((t) => `
              <button class="classic-tab" role="tab" id="${t.id}" aria-controls="${t.panelId}"
                aria-selected="false" tabindex="-1">
                ${t.label}
                <span class="classic-tab-count">${grouped[t.district].length}</span>
              </button>
            `).join('')}
          </div>

          ${tabs.map((t) => `
            <section class="classic-panel" role="tabpanel" id="${t.panelId}" aria-labelledby="${t.id}" hidden>
              <p class="classic-panel-district">${t.district}</p>
              <div class="classic-grid">
                ${grouped[t.district].map((p) => this._card(p)).join('')}
              </div>
            </section>
          `).join('')}

          <section class="classic-contact" id="classic-contact">
            <h2 class="classic-section-title">Contact</h2>
            <p class="classic-section-sub">Open to internships, collaborations, and hackathon teams. Say howdy.</p>
            <div class="classic-contact-grid">
              ${this._contactItem({
                label: 'Email', icon: '✉', value: contact.email,
                href: contact.email && `mailto:${contact.email}`, copy: true,
              })}
              ${this._contactItem({
                label: 'Phone', icon: '☎', value: contact.phone,
                href: contact.phone && `tel:${contact.phone.replace(/[^\d+]/g, '')}`, copy: true,
              })}
            </div>
            <div class="classic-contact-grid is-socials">
              ${socials.map((s) => {
                const link = s.links[0];
                return this._contactItem({
                  label: s.title, icon: link.icon,
                  value: hasUrl(link) ? displayUrl(link.url) : '',
                  href: link.url, external: true,
                });
              }).join('')}
            </div>
          </section>
        </main>

        <footer class="classic-footer">
          <p>© ${new Date().getFullYear()} ${profile.name}</p>
          <p>Also viewable as a walkable 3D western town — flip the switch up top.</p>
        </footer>
      </div>
    `;

    this._initTabs(tabs);
    this._initCopyButtons();
    this._initGalleries();
  }

  _initTabs(tabs) {
    const buttons = tabs.map((t) => this.container.querySelector(`#${t.id}`));
    const panels = tabs.map((t) => this.container.querySelector(`#${t.panelId}`));

    const select = (index, focus = false) => {
      buttons.forEach((btn, i) => {
        const active = i === index;
        btn.setAttribute('aria-selected', String(active));
        btn.tabIndex = active ? 0 : -1;
        panels[i].hidden = !active;
      });
      if (focus) buttons[index].focus();
      try { localStorage.setItem(TAB_STORAGE_KEY, tabs[index].district); } catch { /* storage unavailable */ }
    };

    buttons.forEach((btn, i) => {
      btn.addEventListener('click', () => select(i));
      // Arrow keys move between tabs, per the WAI-ARIA tabs pattern.
      btn.addEventListener('keydown', (e) => {
        let next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % buttons.length;
        else if (e.key === 'ArrowLeft') next = (i - 1 + buttons.length) % buttons.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = buttons.length - 1;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });

    let saved = null;
    try { saved = localStorage.getItem(TAB_STORAGE_KEY); } catch { /* storage unavailable */ }
    const start = tabs.findIndex((t) => t.district === saved);
    if (buttons.length) select(start === -1 ? 0 : start);
  }

  _initCopyButtons() {
    for (const btn of this.container.querySelectorAll('.classic-copy')) {
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(btn.dataset.copy);
          btn.textContent = 'Copied';
        } catch {
          btn.textContent = 'Copy failed';
        }
        clearTimeout(btn._resetTimer);
        btn._resetTimer = setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
      });
    }
  }

  _skills() {
    const counts = new Map();
    for (const p of Object.values(projects)) {
      for (const t of p.tech ?? []) if (!SKILL_SKIP.has(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const grouped = new Set(SKILL_GROUPS.flatMap(([, tags]) => tags));
    const groups = [
      ...SKILL_GROUPS,
      ['Other', [...counts.keys()].filter((t) => !grouped.has(t))],
    ];
    const rows = groups
      .map(([label, tags]) => {
        const present = tags
          .filter((t) => counts.has(t))
          .sort((a, b) => counts.get(b) - counts.get(a) || tags.indexOf(a) - tags.indexOf(b));
        if (!present.length) return '';
        const chips = present.map((t) => {
          const n = counts.get(t);
          const title = `Used in ${n} project${n === 1 ? '' : 's'}`;
          return `<span class="skill" title="${title}">${t}${n > 1 ? `<span class="skill-count" aria-label="${title}">${n}</span>` : ''}</span>`;
        }).join('');
        return `<div class="classic-skills-row"><p class="classic-skills-label">${label}</p><div class="classic-skills-chips">${chips}</div></div>`;
      })
      .join('');
    return `
      <section class="classic-skills" aria-labelledby="classic-skills-title">
        <h2 class="classic-section-title" id="classic-skills-title">Skills</h2>
        ${rows}
      </section>
    `;
  }

  /** Thumbnail clicks swap that card's cover photo (one delegated listener for every card). */
  _initGalleries() {
    this.container.addEventListener('click', (e) => {
      const thumb = e.target.closest('.classic-thumb');
      if (!thumb) return;
      const media = thumb.closest('.classic-card-media');
      const cover = media.querySelector('.classic-card-cover');
      cover.src = thumb.dataset.src;
      cover.alt = thumb.dataset.alt;
      cover.style.objectPosition = thumb.dataset.focus;
      for (const t of media.querySelectorAll('.classic-thumb')) t.classList.toggle('is-active', t === thumb);
    });
  }

  _media(p) {
    const images = p.images ?? [];
    if (!images.length) return '';
    const [first] = images;
    const focus = (img) => img.focus ?? 'center';
    const thumbs = images.length > 1
      ? `<div class="classic-card-thumbs">${images.map((img, i) => `
          <button type="button" class="classic-thumb${i === 0 ? ' is-active' : ''}"
            data-src="${img.src}" data-alt="${img.alt}" data-focus="${focus(img)}" aria-label="Show photo ${i + 1} of ${images.length}">
            <img src="${img.src}" alt="" loading="lazy" decoding="async" style="object-position: ${focus(img)}" />
          </button>`).join('')}
        </div>`
      : '';
    return `
      <figure class="classic-card-media">
        <img class="classic-card-cover" src="${first.src}" alt="${first.alt}" loading="lazy" decoding="async"
          style="object-position: ${focus(first)}" />
        ${thumbs}
      </figure>
    `;
  }

  _contactItem({ label, icon, value, href, copy = false, external = false }) {
    const target = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const body = value
      ? `<a class="classic-contact-value" href="${href}"${target}>${value}</a>`
      : `<span class="classic-contact-value is-empty">Coming soon</span>`;
    const copyBtn = value && copy
      ? `<button class="classic-copy" type="button" data-copy="${value}" aria-label="Copy ${label.toLowerCase()}">Copy</button>`
      : '';
    return `
      <div class="classic-contact-item">
        <span class="classic-contact-icon" aria-hidden="true">${icon}</span>
        <div class="classic-contact-text">
          <p class="classic-contact-label">${label}</p>
          ${body}
        </div>
        ${copyBtn}
      </div>
    `;
  }

  _card(p, { featured = false } = {}) {
    const tags = p.tech.length
      ? `<div class="classic-tags">${p.tech.map((t) => `<span class="tag">${t}</span>`).join('')}</div>`
      : '';
    // Only real links get buttons; placeholders collapse into one quiet line
    // instead of a stack of greyed-out "soon" buttons.
    const live = p.links.filter(hasUrl);
    const pending = p.links.filter((l) => !hasUrl(l));
    const liveHtml = live.length
      ? `<div class="classic-card-links">${live.map(renderProjectLink).join('')}</div>`
      : '';
    const pendingHtml = pending.length
      ? `<p class="classic-card-pending">${pending.map((l) => l.label).join(' · ')} coming soon</p>`
      : '';
    return `
      <article class="classic-card${featured ? ' is-featured' : ''}${p.images?.length ? ' has-media' : ''}">
        ${this._media(p)}
        <div class="classic-card-body">
          ${featured ? `<p class="classic-card-district">${TAB_LABELS[p.district] ?? p.district}</p>` : ''}
          <h3 class="classic-card-title">${p.title}</h3>
          ${renderBadges(p)}
          <p class="classic-card-desc">${p.description}</p>
          ${tags}
          ${liveHtml}
          ${pendingHtml}
        </div>
      </article>
    `;
  }
}
