/**
 * Renders a project's badge row (award, event or kind, live, team size) as
 * an HTML string, or '' when it has none. Shared by the classic site's cards
 * and the 3D town's project page so both show the same facts.
 */
export function renderBadges(p) {
  const badges = [];
  if (p.award) badges.push(`<span class="badge badge-award"><span aria-hidden="true">🏆</span> ${p.award}</span>`);
  if (p.event) badges.push(`<span class="badge badge-event">${p.event}</span>`);
  else if (p.kind) badges.push(`<span class="badge">${p.kind}</span>`);
  if (p.links?.some((l) => l.label.startsWith('Live') && l.url && l.url !== '#')) {
    badges.push('<span class="badge badge-live"><span class="badge-dot" aria-hidden="true"></span>Live</span>');
  }
  if (p.team) badges.push(`<span class="badge">Team of ${p.team}</span>`);
  return badges.length ? `<div class="badges">${badges.join('')}</div>` : '';
}
