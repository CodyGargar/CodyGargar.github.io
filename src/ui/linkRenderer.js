/**
 * Renders one project link as either a real anchor or a visually-matching
 * disabled placeholder — used by both ProjectModal and ClassicSite so a
 * project whose URL hasn't been filled in yet (still '#' or empty) never
 * renders as `<a href="#" target="_blank">`, which opens a new tab that
 * just reloads the current page instead of doing nothing.
 */
export function renderProjectLink({ label, url, icon }) {
  if (!url || url === '#') {
    return `
      <span class="project-link disabled" aria-disabled="true" title="Coming soon">
        <span class="link-icon">${icon}</span>${label}
        <span class="link-ext">soon</span>
      </span>
    `;
  }
  return `
    <a class="project-link" href="${url}" target="_blank" rel="noopener noreferrer">
      <span class="link-icon">${icon}</span>${label}
      <span class="link-ext">↗</span>
    </a>
  `;
}
