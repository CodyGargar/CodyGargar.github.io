/**
 * collision.js — AABB helpers for buildings.
 * resolveCollision pushes the candidate position out of any overlapping box.
 */

const PLAYER_RADIUS = 0.7;

/**
 * Given a desired world-XZ position, return a corrected position
 * that doesn't overlap any building bounding box.
 */
export function resolveCollision(desiredX, desiredZ, buildings) {
  let x = desiredX;
  let z = desiredZ;

  // A single pass over the building list resolves each box independently,
  // so pushing out of a later box can shove the point straight back into an
  // earlier one without ever re-checking it — order-dependent, and it can
  // leave the point still overlapping a box whenever two buildings' player-
  // inflated regions are close enough to touch. Re-running the full pass a
  // few times lets it settle; the town's buildings are spaced well apart by
  // design, so in practice this almost always converges in a single extra
  // pass, but it's a cheap, bounded loop rather than relying on that.
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;

    for (const b of buildings) {
      const box = b.boundingBox;
      const inX = x > box.minX - PLAYER_RADIUS && x < box.maxX + PLAYER_RADIUS;
      const inZ = z > box.minZ - PLAYER_RADIUS && z < box.maxZ + PLAYER_RADIUS;
      if (!inX || !inZ) continue;

      // Push out along the axis of least penetration
      const overlapLeft  = (box.maxX + PLAYER_RADIUS) - x;
      const overlapRight = x - (box.minX - PLAYER_RADIUS);
      const overlapFront = (box.maxZ + PLAYER_RADIUS) - z;
      const overlapBack  = z - (box.minZ - PLAYER_RADIUS);

      const minOverlap = Math.min(overlapLeft, overlapRight, overlapFront, overlapBack);
      if (minOverlap === overlapLeft)  x = box.maxX + PLAYER_RADIUS;
      else if (minOverlap === overlapRight) x = box.minX - PLAYER_RADIUS;
      else if (minOverlap === overlapFront) z = box.maxZ + PLAYER_RADIUS;
      else z = box.minZ - PLAYER_RADIUS;
      moved = true;
    }

    if (!moved) break;
  }

  return { x, z };
}

/**
 * Return the nearest building whose door is within `threshold` units of (px, pz),
 * or null if none are close.
 */
export function nearestDoorBuilding(px, pz, buildings, threshold = 2.8) {
  let best = null;
  let bestDist = Infinity;
  for (const b of buildings) {
    const d = b.doorPosition;
    const dist = Math.hypot(px - d.x, pz - d.z);
    if (dist < threshold && dist < bestDist) {
      best = b;
      bestDist = dist;
    }
  }
  return best;
}
