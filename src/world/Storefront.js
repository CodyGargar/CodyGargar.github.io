import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Storefront — parameterized Old West storefront generator.
 *
 * createStorefront(config) returns an object shaped like the game's existing
 * Building instances so it drops into Town.js/collision.js/main.js unchanged:
 *   { group, boundingBox, doorPosition, projectId, addTo(scene) }
 *
 * `group` is built from one ExtrudeGeometry false front + a handful of merged
 * BufferGeometry meshes bucketed by material, plus two InstancedMesh batches
 * for repeated timber and planks — always at full detail. (A distance-based
 * LOD swap to a cheap silhouette was tried, but with only a handful of
 * buildings in this scene there's no real draw-call pressure to justify it,
 * and the pop when it swapped was more noticeable than the saving was worth.)
 */

const STORY_HEIGHT = 3.1;

const _materialCache = new Map();

export function createStorefront(config) {
  const cfg = {
    stories: 1,
    parapetStyle: 'stepped',
    porchDepth: 2.0,
    postCount: 4,
    sidingType: 'lap',
    woodTint: 0x8b6f47,
    hasBalcony: false,
    hasHitchingRail: true,
    scale: 1,
    depth: config.width * 0.72,
    ...config,
  };

  const rand = _mulberry32(_hashString(cfg.projectId || cfg.name || 'storefront'));
  const dims = _computeDims(cfg);
  const mats = _buildMaterials(cfg);

  const near = new THREE.Group();
  const staticByMat = new Map(); // material -> [{ geometry, matrix }]
  const addStatic = (mat, geometry, matrix) => {
    if (!staticByMat.has(mat)) staticByMat.set(mat, []);
    staticByMat.get(mat).push({ geometry, matrix });
  };

  _buildFalseFront(cfg, dims, mats, rand, addStatic);
  _buildMainVolume(cfg, dims, mats, addStatic);
  _buildPorchRoof(cfg, dims, mats, addStatic);
  _buildOpenings(cfg, dims, mats, addStatic);
  _buildBoardwalkBase(cfg, dims, mats, addStatic);
  const sign = _buildSign(cfg, dims, mats);
  near.add(sign);

  // Merge every material bucket into a single draw call each.
  for (const [mat, entries] of staticByMat) {
    const geometries = entries.map(({ geometry, matrix }) => {
      const cloned = geometry.clone();
      const g = cloned.index ? cloned.toNonIndexed() : cloned;
      g.applyMatrix4(matrix);
      return g;
    });
    const merged = mergeGeometries(geometries, false);
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    near.add(mesh);
  }

  near.add(_buildTimberInstances(cfg, dims, mats, rand));
  near.add(_buildPlankInstances(cfg, dims, mats, rand));

  near.position.set(cfg.position.x, 0, cfg.position.z);
  near.scale.setScalar(cfg.scale);

  // Scale is applied as a transform on the group, so collision/door data
  // (computed from the pre-scale cfg dimensions) must account for it too.
  const half = { x: (cfg.width / 2) * cfg.scale, z: (cfg.depth / 2) * cfg.scale };
  const boundingBox = {
    minX: cfg.position.x - half.x,
    maxX: cfg.position.x + half.x,
    minZ: cfg.position.z - half.z,
    maxZ: cfg.position.z + half.z,
  };
  const doorPosition = new THREE.Vector3(cfg.position.x, 0, cfg.position.z + half.z);

  return {
    group: near,
    boundingBox,
    doorPosition,
    projectId: cfg.projectId,
    addTo(scene) { scene.add(near); },
  };
}

const BOARDWALK_HEIGHT = 0.14;

function _computeDims(cfg) {
  const mainHeight = cfg.stories * STORY_HEIGHT;
  const parapetRise = cfg.parapetStyle === 'flat' ? 1.0 : 1.8;
  const windowY = mainHeight * 0.565;
  const windowH = mainHeight * 0.484;
  return {
    mainHeight,
    falseFrontHeight: mainHeight + parapetRise,
    facadeWidth: cfg.width + 0.6,
    facadeThickness: 0.28,
    porchZ: cfg.depth / 2 + cfg.porchDepth, // outer edge of porch/boardwalk, where posts stand
    // "Small" refers to the porch roof's low height, not its width — it
    // still runs the full building width, edge to edge.
    porchWidth: cfg.width,
    windowY, windowH, // ground-floor flanking window center height + height
    // Porch roof/posts must clear the tops of those windows, with a margin.
    headerY: windowY + windowH / 2 + 0.35,
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * Materials — procedural wood grain (diffuse + normal + roughness), cached
 * by tint+siding so buildings sharing a config reuse the same textures.
 * ──────────────────────────────────────────────────────────────────────── */

function _buildMaterials(cfg) {
  const wood = _woodTextureSet(cfg.woodTint, cfg.sidingType);
  const trimTint = new THREE.Color(cfg.woodTint).multiplyScalar(0.32).getHex();
  const boardwalkTint = new THREE.Color(cfg.woodTint).multiplyScalar(1.15).getHex();

  return {
    siding: new THREE.MeshStandardMaterial({
      color: cfg.woodTint, map: wood.map, normalMap: wood.normalMap,
      roughnessMap: wood.roughnessMap, roughness: 0.9, metalness: 0,
    }),
    trim: new THREE.MeshStandardMaterial({ color: trimTint, roughness: 0.78, metalness: 0 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x2e2620, roughness: 0.92, metalness: 0 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1c1108, roughness: 0.85, metalness: 0 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x2a3530, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.75,
    }),
    boardwalk: new THREE.MeshStandardMaterial({ color: boardwalkTint, roughness: 0.88, metalness: 0 }),
    timber: new THREE.MeshStandardMaterial({ color: trimTint, roughness: 0.82, metalness: 0 }),
    signPanel: new THREE.MeshStandardMaterial({ color: 0xf0e2b8, roughness: 0.6, metalness: 0 }),
    knob: new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.6 }),
  };
}

function _woodTextureSet(tint, siding) {
  const key = `${tint.toString(16)}|${siding}`;
  if (_materialCache.has(key)) return _materialCache.get(key);

  const SIZE = 256;
  const base = new THREE.Color(tint);
  const vertical = siding === 'board-batten';

  const diffuseCanvas = document.createElement('canvas');
  diffuseCanvas.width = diffuseCanvas.height = SIZE;
  const dctx = diffuseCanvas.getContext('2d');
  dctx.fillStyle = `#${base.getHexString()}`;
  dctx.fillRect(0, 0, SIZE, SIZE);

  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = heightCanvas.height = SIZE;
  const hctx = heightCanvas.getContext('2d');
  hctx.fillStyle = '#808080';
  hctx.fillRect(0, 0, SIZE, SIZE);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = roughCanvas.height = SIZE;
  const rctx = roughCanvas.getContext('2d');
  rctx.fillStyle = '#c8c8c8';
  rctx.fillRect(0, 0, SIZE, SIZE);

  const rand = _mulberry32(_hashString(key));
  const plankCount = vertical ? 9 : 15;
  let cursor = 0;
  for (let i = 0; i < plankCount; i++) {
    const nominal = SIZE / plankCount;
    const w = Math.max(nominal + (rand() - 0.5) * nominal * 0.4, 4); // varied plank width
    const shade = base.clone().multiplyScalar(0.86 + rand() * 0.16);
    dctx.fillStyle = `#${shade.getHexString()}`;
    if (vertical) dctx.fillRect(cursor, 0, Math.max(w - 2, 1), SIZE);
    else dctx.fillRect(0, cursor, SIZE, Math.max(w - 2, 1));

    hctx.fillStyle = '#3c3c3c';
    if (vertical) hctx.fillRect(cursor + w - 2, 0, 2, SIZE);
    else hctx.fillRect(0, cursor + w - 2, SIZE, 2);

    rctx.fillStyle = `rgba(255,255,255,${rand() * 0.25})`; // sun-bleached patches
    if (vertical) rctx.fillRect(cursor, 0, w, SIZE);
    else rctx.fillRect(0, cursor, SIZE, w);

    cursor += w;
    if (cursor >= SIZE) break;
  }

  for (let k = 0; k < 10; k++) {
    const kx = rand() * SIZE, ky = rand() * SIZE, kr = 2 + rand() * 4;
    const knotShade = base.clone().multiplyScalar(0.5);
    dctx.fillStyle = `#${knotShade.getHexString()}`;
    dctx.beginPath();
    dctx.ellipse(kx, ky, kr, kr * 0.6, rand() * Math.PI, 0, Math.PI * 2);
    dctx.fill();
    hctx.fillStyle = '#585858';
    hctx.beginPath();
    hctx.ellipse(kx, ky, kr, kr * 0.6, 0, 0, Math.PI * 2);
    hctx.fill();
  }

  for (let s = 0; s < 6; s++) {
    const sx = rand() * SIZE, sy = rand() * SIZE, len = 10 + rand() * 30;
    const ang = vertical ? Math.PI / 2 + (rand() - 0.5) * 0.3 : (rand() - 0.5) * 0.3;
    dctx.strokeStyle = 'rgba(0,0,0,0.22)';
    dctx.lineWidth = 1;
    dctx.beginPath();
    dctx.moveTo(sx, sy);
    dctx.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
    dctx.stroke();
  }

  const map = new THREE.CanvasTexture(diffuseCanvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  const normalMap = new THREE.CanvasTexture(_heightToNormalMap(heightCanvas));
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;

  const result = { map, normalMap, roughnessMap };
  _materialCache.set(key, result);
  return result;
}

/** Converts a grayscale height canvas into a tangent-space normal map via central differences. */
function _heightToNormalMap(heightCanvas) {
  const w = heightCanvas.width, h = heightCanvas.height;
  const src = heightCanvas.getContext('2d').getImageData(0, 0, w, h).data;
  const at = (x, y) => src[((y + h) % h) * w * 4 + ((x + w) % w) * 4] / 255;

  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const octx = out.getContext('2d');
  const img = octx.createImageData(w, h);
  const strength = 2.2;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (at(x - 1, y) - at(x + 1, y)) * strength;
      const ny = (at(x, y - 1) - at(x, y + 1)) * strength;
      const nz = 1.0;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * w + x) * 4;
      img.data[i]     = Math.round((nx / len * 0.5 + 0.5) * 255);
      img.data[i + 1] = Math.round((ny / len * 0.5 + 0.5) * 255);
      img.data[i + 2] = Math.round((nz / len * 0.5 + 0.5) * 255);
      img.data[i + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

/* ────────────────────────────────────────────────────────────────────────
 * Geometry builders — each pushes { geometry, matrix } into a material
 * bucket via addStatic() instead of creating its own Mesh/draw call.
 * ──────────────────────────────────────────────────────────────────────── */

/** False front: ExtrudeGeometry from a 2D silhouette (flat / stepped / curved parapet). */
function _buildFalseFront(cfg, dims, mats, rand, addStatic) {
  const hw = dims.facadeWidth / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);

  const capZ = cfg.depth / 2 - dims.facadeThickness / 2 + 0.02;
  const capTrim = (width, y, x = 0) => {
    addStatic(mats.trim, new THREE.BoxGeometry(width, 0.12, dims.facadeThickness + 0.1),
      new THREE.Matrix4().makeTranslation(x, y, capZ));
  };

  if (cfg.parapetStyle === 'stepped') {
    const h1 = dims.mainHeight + 0.3;
    const h2 = dims.mainHeight + (dims.falseFrontHeight - dims.mainHeight) * 0.6;
    const h3 = dims.falseFrontHeight;
    const w2 = hw * 0.72, w3 = hw * 0.42;
    shape.lineTo(-hw, h1);
    shape.lineTo(-w2, h1);
    shape.lineTo(-w2, h2);
    shape.lineTo(-w3, h2);
    shape.lineTo(-w3, h3);
    shape.lineTo(w3, h3);
    shape.lineTo(w3, h2);
    shape.lineTo(w2, h2);
    shape.lineTo(w2, h1);
    shape.lineTo(hw, h1);
    shape.lineTo(hw, 0);
    shape.closePath();

    // Wood trim capping every step ledge — not just the very top — so the
    // whole "roof" silhouette (this parapet, standing in for a real roof)
    // reads as finished all the way down, not just at the peak.
    capTrim(hw - w2, h1, -(hw + w2) / 2);
    capTrim(hw - w2, h1, (hw + w2) / 2);
    capTrim(w2 - w3, h2, -(w2 + w3) / 2);
    capTrim(w2 - w3, h2, (w2 + w3) / 2);
    capTrim(w3 * 2 + 0.15, h3 - 0.1);
  } else if (cfg.parapetStyle === 'curved') {
    const curveBase = dims.mainHeight + 0.3;
    shape.lineTo(-hw, curveBase);
    shape.quadraticCurveTo(-hw, dims.falseFrontHeight, 0, dims.falseFrontHeight);
    shape.quadraticCurveTo(hw, dims.falseFrontHeight, hw, curveBase);
    shape.lineTo(hw, 0);
    shape.closePath();

    // Split into two flanking segments, same idea as the stepped style's h1
    // caps — a single full-width board here sits right under the sign board
    // (which is centered a bit above this same height) and clips through it.
    const signGap = Math.min(cfg.width * 0.55, 3.2) / 2 + 0.35;
    if (hw > signGap) {
      capTrim(hw - signGap, curveBase, -(hw + signGap) / 2);
      capTrim(hw - signGap, curveBase, (hw + signGap) / 2);
    }
  } else {
    shape.lineTo(-hw, dims.falseFrontHeight);
    shape.lineTo(hw, dims.falseFrontHeight);
    shape.lineTo(hw, 0);
    shape.closePath();

    capTrim(dims.facadeWidth + 0.15, dims.falseFrontHeight - 0.1);
  }

  const geo = new THREE.ExtrudeGeometry(shape, { depth: dims.facadeThickness, bevelEnabled: false });
  const matrix = new THREE.Matrix4().makeTranslation(0, 0, cfg.depth / 2 - dims.facadeThickness);
  addStatic(mats.siding, geo, matrix);
}

/**
 * A roof slab hinged at a fixed high edge and sloping down over `runLen`
 * toward a far edge dropped by `rise`, extending in the +Z direction from
 * `pivot` if sign=1, or -Z if sign=-1. Rotating a box about its own center
 * (the original bug) lifts one end well past the intended anchor instead of
 * keeping it fixed, which is what sent the old roof floating above the
 * parapet — baking a translate into the geometry so the pivot edge sits at
 * the local origin guarantees that edge never moves.
 */
function _slopedRoof(width, thickness, runLen, rise, sign, pivot) {
  const geo = new THREE.BoxGeometry(width, thickness, runLen);
  geo.translate(0, 0, sign * runLen / 2);
  const angle = Math.asin(sign * rise / runLen);
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(angle, 0, 0));
  const matrix = new THREE.Matrix4().compose(pivot, q, new THREE.Vector3(1, 1, 1));
  return { geo, matrix };
}

/** Main volume: just the box walls — no real roof behind the false front. */
function _buildMainVolume(cfg, dims, mats, addStatic) {
  const walls = new THREE.BoxGeometry(cfg.width, dims.mainHeight, cfg.depth);
  addStatic(mats.siding, walls, new THREE.Matrix4().makeTranslation(0, dims.mainHeight / 2, 0));
}

/** Small covered porch roof over just the entrance, sloping down toward the street. */
function _buildPorchRoof(cfg, dims, mats, addStatic) {
  const roofWidth = dims.porchWidth;
  const headerY = dims.headerY; // clears the flanking windows below it
  const runLen = cfg.porchDepth + 0.3;

  // Hinged at the building wall (high edge) and sloping down toward the
  // street (+Z), per spec — pivoting about the box's own center instead
  // would send one end up above the wall and the other below the ground.
  const { geo, matrix } = _slopedRoof(
    roofWidth, 0.14, runLen, 0.35, 1,
    new THREE.Vector3(0, headerY + 0.12, cfg.depth / 2 - 0.05)
  );
  addStatic(mats.roof, geo, matrix);

  // Header beam tying the post tops together, under the roof
  const header = new THREE.BoxGeometry(roofWidth - 0.4, 0.2, 0.2);
  addStatic(mats.trim, header, new THREE.Matrix4().makeTranslation(0, headerY - 0.15, dims.porchZ));

  // Diagonal corner braces where the outer posts meet the header. Anchored
  // at the post (bottom end) and leaning inward-and-up toward the header —
  // rotating a box centered on the post (the previous approach) makes it
  // straddle the post symmetrically, so the bottom half hangs off in open
  // air past the post instead of starting at it.
  const braceLen = 0.6;
  const braceGeo = new THREE.BoxGeometry(0.09, braceLen, 0.09);
  braceGeo.translate(0, braceLen / 2, 0); // local origin = bottom (post-attachment) end
  const outerPostX = (dims.porchWidth - 0.6) / 2;
  [-1, 1].forEach((side) => {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, side * 0.6));
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(side * outerPostX, headerY - 0.6, dims.porchZ - 0.02),
      q,
      new THREE.Vector3(1, 1, 1)
    );
    addStatic(mats.trim, braceGeo.clone(), m);
  });
}

/** Recessed door + flanking double-hung windows + one upper false-front window. */
function _buildOpenings(cfg, dims, mats, addStatic) {
  const frontZ = cfg.depth / 2;

  // Door: recessed dark slab framed by a 4-piece jamb+lintel casing (not a solid
  // panel — a solid box here would fully occlude the recessed door behind it).
  // Base sits on the boardwalk surface, not raw ground — otherwise the door's
  // bottom is buried inside the boardwalk platform and z-fights with it.
  const doorW = 1.3, doorH = 2.5, jamb = 0.15, frameZ = frontZ + 0.02, base = BOARDWALK_HEIGHT;
  const jambGeo = new THREE.BoxGeometry(jamb, doorH + jamb, 0.1);
  addStatic(mats.trim, jambGeo, new THREE.Matrix4().makeTranslation(-doorW / 2 - jamb / 2, base + doorH / 2, frameZ));
  addStatic(mats.trim, jambGeo.clone(), new THREE.Matrix4().makeTranslation(doorW / 2 + jamb / 2, base + doorH / 2, frameZ));
  const lintelGeo = new THREE.BoxGeometry(doorW + jamb * 2, jamb, 0.1);
  addStatic(mats.trim, lintelGeo, new THREE.Matrix4().makeTranslation(0, base + doorH + jamb / 2, frameZ));

  // Slab sits proud of the wall too (nothing can recess into a solid box without a
  // true boolean cut), but less proud than the frame — reads as recessed by contrast.
  const doorSlab = new THREE.BoxGeometry(doorW, doorH, 0.05);
  addStatic(mats.dark, doorSlab, new THREE.Matrix4().makeTranslation(0, base + doorH / 2, frontZ + 0.015));

  const knob = new THREE.SphereGeometry(0.045, 8, 8);
  addStatic(mats.knob, knob, new THREE.Matrix4().makeTranslation(doorW * 0.32, base + doorH * 0.42, frontZ + 0.045));

  _addDoubleHungWindow(mats, addStatic, { x: -cfg.width * 0.3, y: dims.windowY, z: frontZ, w: 0.85, h: dims.windowH });
  _addDoubleHungWindow(mats, addStatic, { x: cfg.width * 0.3, y: dims.windowY, z: frontZ, w: 0.85, h: dims.windowH });
}

function _addDoubleHungWindow(mats, addStatic, { x, y, z, w, h }) {
  const casing = new THREE.BoxGeometry(w + 0.22, h + 0.22, 0.08);
  addStatic(mats.trim, casing, new THREE.Matrix4().makeTranslation(x, y, z + 0.05));

  const sashGap = 0.03;
  const paneH = (h - sashGap) / 2;
  const upperPane = new THREE.BoxGeometry(w, paneH, 0.04);
  addStatic(mats.glass, upperPane, new THREE.Matrix4().makeTranslation(x, y + paneH / 2 + sashGap / 2, z + 0.08));
  const lowerPane = new THREE.BoxGeometry(w, paneH, 0.04);
  addStatic(mats.glass, lowerPane, new THREE.Matrix4().makeTranslation(x, y - paneH / 2 - sashGap / 2, z + 0.08));

  const meetingRail = new THREE.BoxGeometry(w + 0.05, 0.05, 0.06);
  addStatic(mats.trim, meetingRail, new THREE.Matrix4().makeTranslation(x, y, z + 0.09));

  const sill = new THREE.BoxGeometry(w + 0.35, 0.08, 0.2);
  addStatic(mats.trim, sill, new THREE.Matrix4().makeTranslation(x, y - h / 2 - 0.09, z + 0.12));
}

/** Raised boardwalk platform + step down to the street (planks are instanced separately). */
function _buildBoardwalkBase(cfg, dims, mats, addStatic) {
  const platform = new THREE.BoxGeometry(dims.facadeWidth, 0.14, cfg.porchDepth);
  addStatic(mats.boardwalk, platform, new THREE.Matrix4().makeTranslation(
    0, 0.07, cfg.depth / 2 + cfg.porchDepth / 2
  ));
  const step = new THREE.BoxGeometry(dims.facadeWidth * 0.4, 0.07, 0.3);
  addStatic(mats.boardwalk, step, new THREE.Matrix4().makeTranslation(
    0, 0.035, dims.porchZ + 0.15
  ));
}

/** Framed sign board centered on the false front, with a CanvasTexture generated from signText. */
function _buildSign(cfg, dims, mats) {
  const group = new THREE.Group();
  const w = Math.min(cfg.width * 0.55, 3.2);
  const h = w * 0.22;
  const y = dims.mainHeight + 0.35; // just above the roofline, clear of the parapet window above it
  const z = cfg.depth / 2 + 0.02; // proud of the false front's own outer face, not embedded in it

  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.18, h + 0.18, 0.08), mats.trim);
  frame.position.set(0, y, z);
  group.add(frame);

  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = Math.round(512 * (h / w));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f0e2b8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#3a2410';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = '#241608';
  ctx.font = `bold ${Math.round(canvas.height * 0.4)}px "Rye", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cfg.signText || cfg.name || '', canvas.width / 2, canvas.height / 2 + 4);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), roughness: 0.6 })
  );
  panel.position.set(0, y, z + 0.045);
  group.add(panel);

  return group;
}

/** One InstancedMesh sharing a unit-cube prototype for posts, rafter tails, and hitching posts. */
function _buildTimberInstances(cfg, dims, mats, rand) {
  const instances = [];
  const push = (pos, rot, scale) => instances.push({ pos, rot, scale });

  // Porch posts, evenly spaced under the small porch roof, jittered ±2°
  const postHeaderY = dims.headerY;
  const spanW = dims.porchWidth - 0.6;
  const postXs = [];
  for (let i = 0; i < cfg.postCount; i++) {
    const t = cfg.postCount === 1 ? 0.5 : i / (cfg.postCount - 1);
    const x = -spanW / 2 + t * spanW;
    postXs.push(x);
    push(
      new THREE.Vector3(x, postHeaderY / 2, dims.porchZ),
      new THREE.Euler((rand() - 0.5) * 0.02, 0, (rand() - 0.5) * 0.07),
      new THREE.Vector3(0.2, postHeaderY, 0.2)
    );
  }

  // Rafter tails under the small porch roof's edge
  const porchTailCount = Math.max(3, Math.round(dims.porchWidth / 1.4));
  for (let i = 0; i < porchTailCount; i++) {
    const t = porchTailCount === 1 ? 0.5 : i / (porchTailCount - 1);
    const x = -dims.porchWidth / 2 + 0.3 + t * (dims.porchWidth - 0.6);
    push(
      new THREE.Vector3(x, dims.headerY + 0.1, dims.porchZ + 0.25),
      new THREE.Euler(0, 0, (rand() - 0.5) * 0.05),
      new THREE.Vector3(0.1, 0.1, 0.4)
    );
  }

  // Rafter tails under the big main roof's back edge, running the full width
  const mainTailCount = Math.max(3, Math.round(cfg.width / 1.4));
  for (let i = 0; i < mainTailCount; i++) {
    const t = mainTailCount === 1 ? 0.5 : i / (mainTailCount - 1);
    const x = -cfg.width / 2 + 0.4 + t * (cfg.width - 0.8);
    push(
      new THREE.Vector3(x, dims.mainHeight + 0.06, -cfg.depth / 2 + 0.1),
      new THREE.Euler(0, 0, (rand() - 0.5) * 0.05),
      new THREE.Vector3(0.1, 0.1, 0.35)
    );
  }

  const proto = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.InstancedMesh(proto, mats.timber, instances.length);
  mesh.castShadow = true;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  instances.forEach(({ pos, rot, scale }, i) => {
    q.setFromEuler(rot);
    m.compose(pos, q, scale);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;

  // Little fence rails filling the porch's outer gaps between posts — using
  // the existing posts as the fence's end supports (not separate freestanding
  // posts out front). Whichever gap straddles the door (x=0) is left open.
  if (cfg.hasHitchingRail) {
    for (let i = 0; i < postXs.length - 1; i++) {
      const xa = postXs[i], xb = postXs[i + 1];
      if (xa < 0 && xb > 0) continue;
      const railW = Math.abs(xb - xa) - 0.24;
      const railX = (xa + xb) / 2;
      [0.55, 0.3].forEach((ry) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(railW, 0.07, 0.07), mats.timber);
        rail.position.set(railX, ry, dims.porchZ);
        rail.castShadow = true;
        mesh.add(rail);
      });
    }
  }

  return mesh;
}

/** Boardwalk planks as individual jittered slats, instanced. */
function _buildPlankInstances(cfg, dims, mats, rand) {
  const plankThickness = 0.05;
  const nominalWidth = 0.22;
  const count = Math.max(4, Math.round(dims.facadeWidth / nominalWidth));
  const proto = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.InstancedMesh(proto, mats.boardwalk, count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  let cursor = -dims.facadeWidth / 2;
  for (let i = 0; i < count; i++) {
    const w = nominalWidth * (0.85 + rand() * 0.3);
    const gap = 0.015;
    const x = cursor + w / 2;
    q.setFromEuler(new THREE.Euler(0, (rand() - 0.5) * 0.02, 0));
    m.compose(
      new THREE.Vector3(x, 0.145, cfg.depth / 2 + cfg.porchDepth / 2),
      q,
      new THREE.Vector3(Math.max(w - gap, 0.02), plankThickness, cfg.porchDepth - 0.1)
    );
    mesh.setMatrixAt(i, m);
    cursor += w;
    if (cursor > dims.facadeWidth / 2) break;
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.count = count;
  return mesh;
}

/* ────────────────────────────────────────────────────────────────────────
 * Small deterministic helpers
 * ──────────────────────────────────────────────────────────────────────── */

function _hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  return h >>> 0;
}

function _mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
