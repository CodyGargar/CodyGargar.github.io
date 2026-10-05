import * as THREE from 'three';

/** Scatter decorative props around town edges. */
export function addProps(scene) {
  _addCacti(scene);
  _addBarrels(scene);
  _addLampposts(scene);
  _addTumbleweed(scene);
  _addTRexSkeleton(scene);
  _addRustedTruck(scene);
  _addRockFormation(scene);
  _addOldWagon(scene);
  _addTrainTracks(scene);
  _addTrain(scene);
  _addAnimalFarm(scene);
  _addPond(scene);
}

function _addCacti(scene) {
  const positions = [
    [-50, -40], [-47, 25], [-45, 35], [50, -35], [48, 15], [44, 40],
    [-55, 5], [55, -10],
  ];
  // [trunk, flower] color sets — cycled for natural variation. Only 3
  // distinct palettes exist for 8 cacti, so the materials are built once
  // per palette up front and shared, instead of a fresh pair per cactus.
  const palettes = [
    { trunk: 0x4a7c4e, flower: 0xe0577a },
    { trunk: 0x5a8a52, flower: 0xf0a83c },
    { trunk: 0x3f6f45, flower: 0xd94f6c },
  ].map((p) => ({
    trunkMat: new THREE.MeshLambertMaterial({ color: p.trunk }),
    flowerMat: new THREE.MeshLambertMaterial({ color: p.flower }),
  }));
  const spikeMat = new THREE.MeshLambertMaterial({ color: 0xe8dcb8 });

  positions.forEach(([x, z], i) => {
    const palette = palettes[i % palettes.length];
    const trunkMat = palette.trunkMat;

    const grp = new THREE.Group();
    grp.position.set(x, 0, z);
    grp.rotation.y = (i * 2.4) % (Math.PI * 2); // deterministic but varied facing

    const rand = _mulberry32(i * 97 + 13);
    const trunkHeight = 2.8 + rand() * 1.2;
    const trunkRadius = 0.42 + rand() * 0.1; // thick, pill-shaped body

    // Trunk: a fat capsule (cylinder + half-circle caps on both ends)
    const trunk = _addCapsule(grp, trunkMat, trunkRadius, trunkHeight);
    trunk.group.position.set(0, trunkHeight / 2, 0);
    _addSpikes(trunk.group, spikeMat, trunkRadius, trunk.cylHeight, 30, rand);

    // 0–2 curved arms, each built from two capsule segments meeting at an elbow
    const numArms = rand() < 0.15 ? 0 : rand() < 0.5 ? 1 : 2;
    for (let a = 0; a < numArms; a++) {
      const side = a === 0 ? -1 : 1;
      const armRadius = trunkRadius * 0.6;
      const attachPoint = new THREE.Vector3(side * trunkRadius * 0.5, trunkHeight * (0.4 + rand() * 0.28), 0);

      const outLen = 1.1 + rand() * 0.4;
      const outDir = new THREE.Vector3(side * 0.85, 0.35 + rand() * 0.15, 0).normalize();
      const outCenter = attachPoint.clone().addScaledVector(outDir, outLen / 2 - armRadius * 0.6);
      const outCapsule = _addCapsule(grp, trunkMat, armRadius, outLen);
      outCapsule.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), outDir);
      outCapsule.group.position.copy(outCenter);
      _addSpikes(outCapsule.group, spikeMat, armRadius, outCapsule.cylHeight, 12, rand);

      const elbow = outCenter.clone().addScaledVector(outDir, outLen / 2);
      const upLen = 0.9 + rand() * 0.5;
      const upDir = new THREE.Vector3(side * 0.12, 0.99, 0).normalize();
      const upRadius = armRadius * 0.92;
      const upCenter = elbow.clone().addScaledVector(upDir, upLen / 2 - upRadius * 0.6);
      const upCapsule = _addCapsule(grp, trunkMat, upRadius, upLen);
      upCapsule.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), upDir);
      upCapsule.group.position.copy(upCenter);
      _addSpikes(upCapsule.group, spikeMat, upRadius, upCapsule.cylHeight, 10, rand);

      // Occasional blossom at the arm tip
      if (rand() < 0.3) {
        const tip = upCenter.clone().addScaledVector(upDir, upLen / 2);
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), palette.flowerMat);
        flower.position.copy(tip).addScaledVector(upDir, 0.05);
        flower.castShadow = true;
        grp.add(flower);
      }
    }

    scene.add(grp);
  });
}

/**
 * Builds a capsule (cylinder with a half-circle/hemisphere cap on each end),
 * adds it to `parent`, and returns the local group plus its cylinder height
 * (needed by _addSpikes to know the straight section's extent).
 */
function _addCapsule(parent, mat, radius, length, radialSegments = 10) {
  const group = new THREE.Group();
  const cylHeight = Math.max(length - radius * 2, 0.05);

  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, cylHeight, radialSegments), mat);
  cyl.castShadow = true;
  cyl.receiveShadow = true;
  group.add(cyl);

  const topCap = new THREE.Mesh(
    new THREE.SphereGeometry(radius, radialSegments, Math.max(4, radialSegments / 2), 0, Math.PI * 2, 0, Math.PI / 2),
    mat
  );
  topCap.position.y = cylHeight / 2;
  topCap.castShadow = true;
  group.add(topCap);

  const botCap = new THREE.Mesh(
    new THREE.SphereGeometry(radius, radialSegments, Math.max(4, radialSegments / 2), 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    mat
  );
  botCap.position.y = -cylHeight / 2;
  botCap.castShadow = true;
  group.add(botCap);

  parent.add(group);
  return { group, cylHeight };
}

/** Scatters outward-pointing thorn spikes around a capsule's straight section. */
function _addSpikes(capsuleGroup, mat, radius, cylHeight, count, rand) {
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const y = (rand() - 0.5) * cylHeight;
    const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const spikeLen = 0.16 + rand() * 0.1;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03 + rand() * 0.02, spikeLen, 5), mat);
    spike.quaternion.setFromUnitVectors(up, dir);
    spike.position.copy(dir).multiplyScalar(radius + spikeLen / 2);
    spike.position.y += y;
    spike.castShadow = true;
    capsuleGroup.add(spike);
  }
}

/** Tiny deterministic PRNG so cactus variation is stable across reloads. */
function _mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function _addBarrels(scene) {
  const positions = [
    // The last two sit in the gap between the Devpost booth and About Me.
    [-27, 9], [-27, 6], [27, 9], [27, 6], [4.1, -7.0], [4.5, -8.4],
  ];
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x6b3a1f });
  const bandMat = new THREE.MeshLambertMaterial({ color: 0x4a4640 }); // weathered iron

  const RADIUS = 0.68;
  const HEIGHT = 1.45;
  const RADIAL_SEGMENTS = 20; // high segment count for rounded, non-faceted walls
  const rimFactor = (t) => 0.8 + 0.2 * Math.sin(t * Math.PI); // 0.8 at rims, 1.0 at the bulging middle

  positions.forEach(([x, z]) => {
    const grp = new THREE.Group();
    grp.position.set(x, 0, z);

    // Smooth barrel-curve profile, lathed into a rounded wall
    const profile = [];
    const PROFILE_SAMPLES = 12;
    for (let i = 0; i <= PROFILE_SAMPLES; i++) {
      const t = i / PROFILE_SAMPLES;
      profile.push(new THREE.Vector2(RADIUS * rimFactor(t), t * HEIGHT));
    }
    const wall = new THREE.Mesh(new THREE.LatheGeometry(profile, RADIAL_SEGMENTS), woodMat);
    wall.castShadow = true;
    wall.receiveShadow = true;
    grp.add(wall);

    // Top cap (wooden lid)
    const topCap = new THREE.Mesh(new THREE.CircleGeometry(RADIUS * rimFactor(1), RADIAL_SEGMENTS), woodMat);
    topCap.rotation.x = -Math.PI / 2;
    topCap.position.y = HEIGHT;
    topCap.receiveShadow = true;
    grp.add(topCap);

    // Metal hoop bands near the bottom and top
    [0.1, 0.9].forEach((t) => {
      const bandRadius = RADIUS * rimFactor(t) * 1.05;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(bandRadius, bandRadius, HEIGHT * 0.09, RADIAL_SEGMENTS), bandMat);
      band.position.y = t * HEIGHT;
      band.castShadow = true;
      grp.add(band);
    });

    scene.add(grp);
  });
}

function _addLampposts(scene) {
  // z=±3 lines each pole up with the main road's edge, matching the inner
  // pair at x=±12. The outer pair used to sit at z=0 — the road's actual
  // centerline — which planted them in the middle of the street.
  const positions = [[-12, -3], [12, -3], [-12, 3], [12, 3], [-30, 3], [30, 3]];

  // Old-west gas street lamp: stone footing, iron post, and a four-paned
  // lantern with a pyramid cap. Geometry/materials are shared by all lamps.
  const iron = new THREE.MeshLambertMaterial({ color: 0x2a1a0e });
  const stone = new THREE.MeshLambertMaterial({ color: 0x7a6a58 });
  const flame = new THREE.MeshBasicMaterial({ color: 0xffd28a }); // unlit, so it always reads as glowing
  const haloMat = new THREE.SpriteMaterial({
    map: _radialGlowTexture('rgba(255,200,120,1)'),
    color: 0xffb060, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const poolMat = new THREE.MeshBasicMaterial({
    map: _radialGlowTexture('rgba(255,170,80,1)'),
    transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });

  const POST_TOP = 3.9;
  const LANTERN_Y = POST_TOP + 0.36; // lantern body center
  const geo = {
    footing: new THREE.BoxGeometry(0.46, 0.3, 0.46),
    post: new THREE.CylinderGeometry(0.07, 0.1, POST_TOP - 0.3, 8),
    collar: new THREE.CylinderGeometry(0.14, 0.12, 0.12, 8),
    plate: new THREE.BoxGeometry(0.36, 0.05, 0.36),
    pane: new THREE.BoxGeometry(0.26, 0.48, 0.26),
    corner: new THREE.BoxGeometry(0.035, 0.52, 0.035),
    cap: new THREE.ConeGeometry(0.3, 0.26, 4),
    finial: new THREE.SphereGeometry(0.05, 6, 6),
    pool: new THREE.CircleGeometry(3.2, 24),
  };

  positions.forEach(([x, z], i) => {
    const grp = new THREE.Group();
    grp.position.set(x, 0, z);

    const part = (g, mat, px, py, pz) => {
      const m = new THREE.Mesh(g, mat);
      m.position.set(px, py, pz);
      m.castShadow = true;
      grp.add(m);
      return m;
    };
    part(geo.footing, stone, 0, 0.15, 0);
    part(geo.post, iron, 0, 0.3 + (POST_TOP - 0.3) / 2, 0);
    part(geo.collar, iron, 0, POST_TOP, 0);
    part(geo.plate, iron, 0, LANTERN_Y - 0.27, 0);
    const pane = part(geo.pane, flame, 0, LANTERN_Y, 0);
    pane.castShadow = false;
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      part(geo.corner, iron, cx * 0.14, LANTERN_Y, cz * 0.14);
    }
    const cap = part(geo.cap, iron, 0, LANTERN_Y + 0.37, 0);
    cap.rotation.y = Math.PI / 4; // square the 4-sided cone up with the lantern
    part(geo.finial, iron, 0, LANTERN_Y + 0.53, 0);

    // Soft halo around the lantern and a pool of light on the ground — these
    // keep the lamps reading as "lit" even against the bright sunset sky.
    const halo = new THREE.Sprite(haloMat);
    halo.position.set(0, LANTERN_Y, 0);
    halo.scale.setScalar(2.2);
    grp.add(halo);
    const pool = new THREE.Mesh(geo.pool, poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.03; // just above the road surface (y=0.01)
    grp.add(pool);

    // Physically-based falloff (decay 2), so intensity has to be high enough
    // to actually light the street and nearby storefronts a few units away.
    const light = new THREE.PointLight(0xffaa55, 22, 16, 2);
    light.position.set(0, LANTERN_Y, 0);
    grp.add(light);

    scene.add(grp);
    _lamps.push({ light, baseIntensity: light.intensity, phase: i * 1.7 });
  });
  _lampHaloMat = haloMat;
}

/** Canvas texture: soft radial falloff from `color` at the center to transparent. */
function _radialGlowTexture(color) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color.replace(/[\d.]+\)$/, '0.45)'));
  g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Lamp flicker state — filled by _addLampposts, animated in updateProps().
const _lamps = [];
let _lampHaloMat = null;
let _lampTime = 0;

// Slowly-drifting tumbleweed. Z velocity is 0 — updateProps() below only
// ever wraps the X position, so a nonzero Z drift (as this had before)
// eventually carries it off the north/south edge of the map for good.
let _tumbleweed = null;
let _tumbleVel = new THREE.Vector3(0.015, 0, 0);

function _addTumbleweed(scene) {
  const geo = new THREE.SphereGeometry(0.55, 8, 8);
  const mat = new THREE.MeshBasicMaterial({ color: 0x8b6914, wireframe: true });
  _tumbleweed = new THREE.Mesh(geo, mat);
  _tumbleweed.position.set(-40, 0.55, 2);
  scene.add(_tumbleweed);
}

function _addRockFormation(scene) {
  const grp = new THREE.Group();
  // Far southwest corner — open space away from buildings and roads
  grp.position.set(-48, 0, 38);

  const rocks = [
    // [rx_scale, ry_scale, rz_scale, x, y_base, z, rotY, rotZ]  (y_base = half-height, sits on ground)
    // Main anchor boulders
    { s: [3.2, 2.4, 2.8], x:  0,    y: 2.4,  z:  0,    ry: 0.4,  rz: 0.08 },
    { s: [2.6, 2.0, 2.2], x:  2.6,  y: 2.0,  z:  0.6,  ry: 1.1,  rz: -0.1 },
    { s: [2.8, 1.8, 2.4], x: -2.2,  y: 1.8,  z:  0.8,  ry: -0.6, rz: 0.12 },
    // Mid-size rocks leaning against the anchors
    { s: [1.6, 1.4, 1.5], x:  1.2,  y: 1.4,  z: -1.8,  ry: 0.9,  rz: 0.2  },
    { s: [1.8, 1.2, 1.6], x: -1.4,  y: 1.2,  z: -1.6,  ry: -1.2, rz: -0.15},
    { s: [1.4, 1.1, 1.3], x:  3.4,  y: 1.1,  z: -0.8,  ry: 2.0,  rz: 0.25 },
    { s: [1.2, 1.0, 1.1], x: -3.0,  y: 1.0,  z:  1.6,  ry: 0.3,  rz: -0.2 },
    // Small foreground rocks
    { s: [0.9, 0.7, 0.8], x:  0.6,  y: 0.7,  z:  2.4,  ry: 1.5,  rz: 0.1  },
    { s: [0.7, 0.55,0.65],x: -0.8,  y: 0.55, z:  2.8,  ry: -0.8, rz: 0.3  },
    { s: [0.5, 0.4, 0.45],x:  2.0,  y: 0.4,  z:  2.2,  ry: 0.7,  rz: -0.1 },
    // Pebbles scattered at base
    { s: [0.38,0.28,0.35],x: -1.8,  y: 0.28, z:  3.0,  ry: 1.2,  rz: 0    },
    { s: [0.3, 0.22,0.28],x:  3.8,  y: 0.22, z:  0.4,  ry: 0.5,  rz: 0    },
    { s: [0.25,0.18,0.22],x: -3.6,  y: 0.18, z: -0.4,  ry: -1.8, rz: 0    },
  ];

  // Three slightly varied stone materials for natural look
  const mats = [
    new THREE.MeshLambertMaterial({ color: 0x7a6e60 }),
    new THREE.MeshLambertMaterial({ color: 0x6a5e52 }),
    new THREE.MeshLambertMaterial({ color: 0x8a7c6e }),
  ];

  rocks.forEach(({ s, x, y, z, ry, rz }, i) => {
    const geo = new THREE.SphereGeometry(1, 8, 6);
    const mesh = new THREE.Mesh(geo, mats[i % mats.length]);
    mesh.scale.set(s[0], s[1], s[2]);
    mesh.position.set(x, y - s[1] * 0.18, z); // sink slightly into ground
    mesh.rotation.set(0, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    grp.add(mesh);
  });

  // Flat cap stones resting on top of the two main boulders. Every other
  // rock here uses a fixed, hand-picked rotation; these used Math.random(),
  // the only non-deterministic value in an otherwise fully fixed layout —
  // it would silently re-roll on every reload instead of staying put like
  // the rest of the formation.
  [[0, 2.6, 0, 0.4], [2.5, 2.2, 0.5, 2.1]].forEach(([x, y, z, capRotY]) => {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(1, 7, 5),
      mats[1]
    );
    cap.scale.set(1.1, 0.45, 0.95);
    cap.position.set(x, y + 1.1, z);
    cap.rotation.y = capRotY;
    cap.castShadow = true;
    grp.add(cap);
  });

  scene.add(grp);
}

function _addRustedTruck(scene) {
  const grp = new THREE.Group();
  // Parked just off the main road (which spans z in [-3,3]), near the east
  // side street. At 1.5× scale its yawed tailgate corner reaches z≈3.7, so
  // z=8 keeps it clear of the road (it was z=7 at 1×).
  grp.position.set(14, 0, 8);
  grp.rotation.y = Math.PI * 0.08; // slightly angled, like it's been sitting there a while
  grp.scale.setScalar(1.5); // built from y=0, so the tires stay on the ground

  // Old 1950s-style stepside pickup: long narrow hood, rounded fenders that
  // stand proud of the body, running boards, and a short open bed.
  const paint   = new THREE.MeshLambertMaterial({ color: 0x8c3b1e }); // faded red
  const rust    = new THREE.MeshLambertMaterial({ color: 0x4e1f0c }); // rust patches
  const primer  = new THREE.MeshLambertMaterial({ color: 0x6f7a70 }); // mismatched replacement fender
  const glass   = new THREE.MeshLambertMaterial({ color: 0x34444a });
  const chrome  = new THREE.MeshLambertMaterial({ color: 0x9a9284 }); // tarnished chrome
  const frame   = new THREE.MeshLambertMaterial({ color: 0x1f1a16 });
  const rubber  = new THREE.MeshLambertMaterial({ color: 0x161616 });
  const rimMat  = new THREE.MeshLambertMaterial({ color: 0xcbbf9a }); // cream painted rims
  const lensMat = new THREE.MeshLambertMaterial({ color: 0xfff1c4, emissive: 0x4a4230 });
  const tailMat = new THREE.MeshLambertMaterial({ color: 0xa3201a });
  const wood    = new THREE.MeshLambertMaterial({ color: 0x8a6a43 });

  function bx(w, h, d, mat, x, y, z, rx = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    m.castShadow = true;
    m.receiveShadow = true;
    grp.add(m);
    return m;
  }
  // Mirrored left/right pair of boxes at ±x.
  function pair(w, h, d, mat, x, y, z) {
    bx(w, h, d, mat, -x, y, z);
    bx(w, h, d, mat, x, y, z);
  }

  // Local +Z is the front (grille); -Z is the rear (tailgate).
  const WHEEL_R = 0.42;
  const WHEEL_X = 0.9;
  const FRONT_AXLE_Z = 1.55;
  const REAR_AXLE_Z = -1.5;

  // ── Frame + bumpers ────────────────────────────────────────────────────────
  bx(1.2, 0.18, 4.9, frame, 0, 0.55, 0);
  bx(2.1, 0.17, 0.16, chrome, 0, 0.56, 2.56); // front bumper
  bx(1.9, 0.15, 0.14, frame, 0, 0.56, -2.64); // rear bumper

  // ── Hood + grille ──────────────────────────────────────────────────────────
  const CAB_FRONT = 0.6, HOOD_END = 2.37;
  const hoodLen = HOOD_END - CAB_FRONT, hoodZ = (CAB_FRONT + HOOD_END) / 2;
  bx(1.3, 0.62, hoodLen, paint, 0, 1.01, hoodZ);
  bx(1.1, 0.08, hoodLen - 0.04, paint, 0, 1.36, hoodZ - 0.02); // rounded-off hood top
  bx(0.05, 0.03, hoodLen - 0.1, chrome, 0, 1.41, hoodZ); // center hood trim
  bx(0.45, 0.025, 0.5, rust, 0.25, 1.4, hoodZ + 0.2); // rust bloom on the hood
  bx(1.2, 0.62, 0.06, chrome, 0, 1.0, HOOD_END + 0.01); // grille surround
  bx(1.04, 0.48, 0.06, frame, 0, 0.99, HOOD_END + 0.03); // dark grille opening
  for (let i = -2; i <= 2; i++) {
    bx(0.06, 0.48, 0.05, chrome, i * 0.2, 0.99, HOOD_END + 0.06); // grille bars
  }

  // ── Cab ─────────────────────────────────────────────────────────────────────
  const CAB_BACK = -0.6;
  const cabZ = (CAB_FRONT + CAB_BACK) / 2;
  bx(1.7, 0.8, CAB_FRONT - CAB_BACK, paint, 0, 1.03, cabZ); // lower cab (doors)
  bx(1.58, 0.56, 1.0, paint, 0, 1.71, cabZ - 0.1); // greenhouse
  bx(1.66, 0.08, 1.08, paint, 0, 2.02, cabZ - 0.1); // roof lip
  // Windows sit just proud of the greenhouse faces so they read clearly.
  bx(1.36, 0.4, 0.03, glass, 0, 1.72, cabZ + 0.41); // windshield
  bx(1.0, 0.3, 0.03, glass, 0, 1.74, CAB_BACK + 0.08); // rear window
  pair(0.03, 0.38, 0.72, glass, 0.8, 1.72, cabZ - 0.1); // door windows
  pair(0.02, 0.7, 0.03, frame, 0.86, 1.03, 0.52); // door seams
  pair(0.02, 0.7, 0.03, frame, 0.86, 1.03, -0.5);
  pair(0.04, 0.05, 0.16, chrome, 0.88, 1.25, -0.35); // door handles
  pair(0.2, 0.04, 0.04, chrome, 0.92, 1.55, 0.45); // mirror arms
  pair(0.04, 0.2, 0.14, chrome, 1.02, 1.62, 0.45); // mirrors
  bx(0.03, 0.3, 0.5, rust, -0.86, 0.8, 0.05); // rusted-out door bottom

  // ── Bed (open stepside box) ────────────────────────────────────────────────
  const BED_FRONT = -0.66, BED_BACK = -2.55;
  const bedLen = BED_FRONT - BED_BACK, bedZ = (BED_FRONT + BED_BACK) / 2;
  const floorY = 0.92, wallH = 0.5, wallY = floorY + wallH / 2;
  bx(1.5, 0.08, bedLen, wood, 0, floorY, bedZ); // plank floor
  pair(0.06, wallH, bedLen, paint, 0.76, wallY, bedZ); // side walls
  bx(1.58, wallH, 0.06, paint, 0, wallY, BED_FRONT); // headboard
  bx(1.58, wallH, 0.06, paint, 0, wallY, BED_BACK); // tailgate
  bx(0.6, 0.22, 0.03, rust, -0.3, wallY - 0.05, BED_BACK - 0.03);
  pair(0.12, 0.04, bedLen + 0.06, paint, 0.76, floorY + wallH, bedZ); // top rails
  bx(0.03, 0.25, 0.6, rust, 0.79, wallY + 0.05, bedZ - 0.3);
  bx(0.5, 0.4, 0.5, wood, 0.3, floorY + 0.24, bedZ - 0.35); // old crate in the bed

  // ── Fenders — extruded half-ring arches over each wheel ────────────────────
  const fenderOuter = WHEEL_R + 0.18, fenderInner = WHEEL_R + 0.08, fenderDepth = 0.44;
  const archShape = new THREE.Shape();
  archShape.absarc(0, 0, fenderOuter, 0, Math.PI, false);
  archShape.absarc(0, 0, fenderInner, Math.PI, 0, true);
  const archGeo = new THREE.ExtrudeGeometry(archShape, {
    depth: fenderDepth, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 18,
  });
  archGeo.translate(0, 0, -fenderDepth / 2);
  function fender(side, axleZ, mat) {
    const m = new THREE.Mesh(archGeo, mat);
    m.rotation.y = -Math.PI / 2; // shape's X runs along the truck, extrusion across it
    m.position.set(side * WHEEL_X, WHEEL_R, axleZ);
    m.castShadow = true;
    m.receiveShadow = true;
    grp.add(m);
  }
  fender(-1, FRONT_AXLE_Z, paint);
  fender(1, FRONT_AXLE_Z, primer);
  fender(-1, REAR_AXLE_Z, paint);
  fender(1, REAR_AXLE_Z, paint);

  // Running boards bridge front and rear fenders under the doors.
  const boardFront = FRONT_AXLE_Z - fenderOuter, boardBack = REAR_AXLE_Z + fenderOuter;
  pair(0.42, 0.06, boardFront - boardBack, frame, WHEEL_X, WHEEL_R + 0.03, (boardFront + boardBack) / 2);

  // ── Lights ──────────────────────────────────────────────────────────────────
  for (const side of [-1, 1]) {
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.2, 12), chrome);
    bucket.rotation.x = Math.PI / 2;
    bucket.position.set(side * 0.82, 1.08, FRONT_AXLE_Z + 0.42);
    bucket.castShadow = true;
    grp.add(bucket);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12), lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(side * 0.82, 1.08, FRONT_AXLE_Z + 0.53);
    grp.add(lens);
  }
  pair(0.1, 0.14, 0.06, tailMat, 0.9, 0.98, REAR_AXLE_Z - 0.6); // tail lights on the rear fenders

  // ── Exhaust pipe (driver side, poking out behind the rear wheel) ────────────
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), chrome);
  pipe.rotation.x = Math.PI / 2;
  pipe.position.set(-0.5, 0.4, -2.25);
  grp.add(pipe);

  // ── Wheels ──────────────────────────────────────────────────────────────────
  const tireGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.3, 18);
  const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 14);
  const capGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.36, 10);
  const wheels = [
    [-WHEEL_X, FRONT_AXLE_Z], [WHEEL_X, FRONT_AXLE_Z],
    [-WHEEL_X, REAR_AXLE_Z], [WHEEL_X, REAR_AXLE_Z],
  ];
  wheels.forEach(([x, z], i) => {
    // Driver-side rear tyre has gone flat. Scale is applied before the Z
    // rotation, so the cylinder's local X (a radius axis) ends up vertical.
    const squash = i === 2 ? 0.72 : 1;
    const wheel = new THREE.Group();
    wheel.position.set(x, WHEEL_R * squash, z);
    wheel.rotation.z = Math.PI / 2; // cylinder axis along X (the axle)
    wheel.scale.x = squash;
    for (const [geo, mat] of [[tireGeo, rubber], [rimGeo, rimMat], [capGeo, chrome]]) {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      wheel.add(m);
    }
    grp.add(wheel);
  });

  scene.add(grp);
}

function _addTRexSkeleton(scene) {
  const grp = new THREE.Group();
  // Open plaza north of main road, between the two side streets
  grp.position.set(0, 0, 18);

  const bone = new THREE.MeshLambertMaterial({ color: 0xf0ead8 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x1a0a00 });

  function bx(w, h, d) { return new THREE.BoxGeometry(w, h, d); }

  function add(geo, x, y, z, rx = 0, ry = 0, rz = 0, mat = bone) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    grp.add(m);
    return m;
  }

  // Stone pedestal
  add(bx(3.2, 0.35, 3.2), 0, 0.17, 0, 0, 0, 0, new THREE.MeshLambertMaterial({ color: 0x8a7a6a }));
  add(bx(2.6, 0.2, 2.6), 0, 0.45, 0, 0, 0, 0, new THREE.MeshLambertMaterial({ color: 0x7a6a5a }));

  // ── Pelvis ──────────────────────────────────────────────────────────────────
  add(bx(1.4, 0.8, 1.0), 0, 3.2, 0);

  // ── Spine (runs forward +Z from pelvis, slight upward angle) ────────────────
  for (let i = 0; i < 5; i++) {
    add(bx(0.4, 0.3, 0.3), 0, 3.2 + i * 0.06, 0.5 + i * 0.42, 0, 0, -0.06);
  }

  // ── Shoulder girdle ──────────────────────────────────────────────────────────
  add(bx(2.1, 0.45, 0.7), 0, 3.5, 2.4);

  // ── Ribs (4 pairs fanning from spine) ──────────────────────────────────────
  [0.7, 1.05, 1.4, 1.75].forEach((rz, i) => {
    const cy = 3.2 + i * 0.06;
    const len = 1.15 - i * 0.08;
    // left
    add(bx(0.07, len, 0.07), -(0.5 + len * 0.28), cy - 0.38, rz, 0, 0, -0.55);
    // right
    add(bx(0.07, len, 0.07),  (0.5 + len * 0.28), cy - 0.38, rz, 0, 0,  0.55);
  });

  // ── Neck (3 segments curving up from shoulders) ──────────────────────────────
  add(bx(0.36, 0.95, 0.3), 0, 4.05, 2.6, -0.5, 0, 0);
  add(bx(0.3,  0.88, 0.28), 0, 4.82, 3.05, -0.7, 0, 0);
  add(bx(0.28, 0.75, 0.25), 0, 5.45, 3.45, -0.8, 0, 0);

  // ── Skull ───────────────────────────────────────────────────────────────────
  add(bx(1.1, 0.75, 1.2), 0, 5.88, 4.1);        // braincase
  add(bx(0.72, 0.45, 1.1), 0, 5.6, 5.1);         // snout upper
  add(bx(0.65, 0.13, 0.95), 0, 5.22, 5.1, 0.15); // jaw lower

  // Eye sockets
  add(new THREE.SphereGeometry(0.14, 7, 7), -0.37, 5.97, 3.9, 0, 0, 0, dark);
  add(new THREE.SphereGeometry(0.14, 7, 7),  0.37, 5.97, 3.9, 0, 0, 0, dark);

  // Upper teeth
  for (let i = 0; i < 6; i++) {
    add(bx(0.07, 0.22, 0.07), -0.28 + i * 0.11, 5.38, 5.5 + i * 0.02, 0.1);
  }

  // ── Tail (descending backward from pelvis) ───────────────────────────────────
  [
    { s: [0.9, 0.55, 0.7],  z: -0.6,  y: 3.1 },
    { s: [0.7, 0.45, 0.55], z: -1.35, y: 2.82 },
    { s: [0.5, 0.35, 0.4],  z: -2.05, y: 2.55 },
    { s: [0.35, 0.25, 0.3], z: -2.7,  y: 2.28 },
    { s: [0.2, 0.16, 0.2],  z: -3.25, y: 2.08 },
  ].forEach(({ s, z, y }) => add(bx(...s), 0, y, z, 0.12));

  // ── Legs ─────────────────────────────────────────────────────────────────────
  [-1, 1].forEach((side) => {
    const sx = side * 0.58;

    const femur = new THREE.Mesh(bx(0.22, 1.95, 0.22), bone);
    femur.position.set(sx, 2.18, 0.35);
    femur.rotation.set(-0.22, 0, side * 0.08);
    femur.castShadow = true;
    grp.add(femur);

    const tibia = new THREE.Mesh(bx(0.17, 1.8, 0.17), bone);
    tibia.position.set(sx, 0.82, 0.7);
    tibia.rotation.set(0.38, 0, side * 0.06);
    tibia.castShadow = true;
    grp.add(tibia);

    // Ankle + metatarsal
    add(bx(0.25, 0.28, 0.65), sx, 0.14, 0.82);

    // 3 toes
    [-1, 0, 1].forEach((t) => {
      add(bx(0.09, 0.09, 0.58), sx + t * 0.13, 0.05, 1.22 + t * 0.02, -0.1);
    });
  });

  // ── Tiny T-Rex arms ──────────────────────────────────────────────────────────
  [-1, 1].forEach((side) => {
    const sx = side * 1.02;
    add(bx(0.13, 0.58, 0.13), sx, 3.32, 2.2, 0, 0, side * 0.3);
    add(bx(0.10, 0.44, 0.10), sx + side * 0.06, 3.05, 2.42, 0.45, 0, side * 0.18);
    add(bx(0.06, 0.26, 0.06), sx + side * 0.1, 2.8, 2.34, 0.2,  0.15);
    add(bx(0.06, 0.26, 0.06), sx + side * 0.1, 2.8, 2.52, 0.2, -0.1);
  });

  scene.add(grp);
}

/**
 * Old covered wagon. Placement chosen to sit well clear of the west side
 * road (x in [-24,-20]), the district sign/barrel at (-30,-18)/(-9,-22),
 * and the animal farm south of it — see that function's own placement note.
 */
function _addOldWagon(scene) {
  const grp = new THREE.Group();
  // Parked in the lot between the LinkedIn booth's back wall (z=-11) and
  // the farm's front fence (z=-30.5): rear at z≈-25.9, tongue tip at z≈-17.8.
  grp.position.set(-10, 0, -23);
  grp.rotation.y = 0.3;
  grp.scale.setScalar(1.5); // everything is built from y=0, so wheels stay on the ground

  // Covered prairie wagon: weathered blue box bed on a red-painted running
  // gear, canvas bonnet stretched over hoops, and spoked wheels with iron tires.
  const bedPaint = new THREE.MeshLambertMaterial({ color: 0x55707a }); // faded wagon blue
  const gearPaint = new THREE.MeshLambertMaterial({ color: 0x8a3b26 }); // faded red running gear
  const wood = new THREE.MeshLambertMaterial({ color: 0x6b4a2f });
  const trim = new THREE.MeshLambertMaterial({ color: 0x3a2410 });
  const iron = new THREE.MeshLambertMaterial({ color: 0x2a2420 });
  const canvasMat = new THREE.MeshLambertMaterial({ color: 0xe6d8b8, side: THREE.DoubleSide });

  const bx = (w, h, d, mat, x, y, z, rx = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    m.castShadow = true;
    m.receiveShadow = true;
    grp.add(m);
    return m;
  };

  // Local +Z is the front (tongue). Rear wheels are bigger than the front
  // ones, and both sit outside the bed so the bed can ride low between them.
  // Each axle height equals its own wheel radius so the tires touch down.
  const REAR_R = 0.7, FRONT_R = 0.5;
  const REAR_Z = -1.3, FRONT_Z = 1.3;
  const WHEEL_X = 1.0;
  const BED_W = 1.6, BED_L = 4.0;
  const BED_BOTTOM = 0.95, FLOOR_TOP = 1.05, SIDE_TOP = 1.6;

  // ── Running gear: axles, bolsters, and the reach pole tying them together ──
  bx(WHEEL_X * 2 + 0.1, 0.12, 0.14, gearPaint, 0, REAR_R, REAR_Z);
  bx(WHEEL_X * 2 + 0.1, 0.12, 0.14, gearPaint, 0, FRONT_R, FRONT_Z);
  bx(BED_W, BED_BOTTOM - REAR_R, 0.2, gearPaint, 0, (BED_BOTTOM + REAR_R) / 2, REAR_Z);
  bx(BED_W, BED_BOTTOM - FRONT_R, 0.2, gearPaint, 0, (BED_BOTTOM + FRONT_R) / 2, FRONT_Z);
  const reachY = (REAR_R + FRONT_R) / 2;
  bx(0.1, 0.1, FRONT_Z - REAR_Z + 0.6, gearPaint, 0, reachY, 0,
    Math.atan2(REAR_R - FRONT_R, FRONT_Z - REAR_Z));

  // ── Bed: floor, plank sides, and end boards ───────────────────────────────
  bx(BED_W, FLOOR_TOP - BED_BOTTOM, BED_L, wood, 0, (BED_BOTTOM + FLOOR_TOP) / 2, 0);
  const sideH = SIDE_TOP - BED_BOTTOM, sideY = (SIDE_TOP + BED_BOTTOM) / 2;
  for (const side of [-1, 1]) {
    bx(0.08, sideH, BED_L, bedPaint, side * (BED_W / 2 - 0.04), sideY, 0);
    bx(0.03, 0.04, BED_L, trim, side * BED_W / 2, sideY, 0); // plank seam
    for (const z of [-1.5, -0.5, 0.5, 1.5]) {
      bx(0.04, sideH, 0.1, trim, side * BED_W / 2, sideY, z); // upright side stakes
    }
  }
  bx(BED_W, sideH, 0.08, bedPaint, 0, sideY, BED_L / 2 - 0.04); // front board
  bx(BED_W, sideH, 0.08, bedPaint, 0, sideY, -BED_L / 2 + 0.04); // tailgate
  bx(BED_W + 0.04, 0.05, 0.1, trim, 0, SIDE_TOP, -BED_L / 2 + 0.04);

  // ── Canvas bonnet over wooden hoops ────────────────────────────────────────
  // Half-cylinder opening downward, axis along Z, sitting on the side tops.
  // The front is left short so the driver's bench is exposed.
  const coverR = BED_W / 2 + 0.03, coverRise = 1.2; // taller than wide
  const coverBack = -BED_L / 2 + 0.05, coverFront = BED_L / 2 - 0.5;
  const coverLen = coverFront - coverBack, coverZ = (coverFront + coverBack) / 2;
  const cover = new THREE.Mesh(
    new THREE.CylinderGeometry(coverR, coverR, coverLen, 18, 1, true, Math.PI / 2, Math.PI),
    canvasMat
  );
  cover.rotation.x = Math.PI / 2;
  cover.scale.z = coverRise; // cylinder's local Z becomes world Y after the X rotation
  cover.position.set(0, SIDE_TOP, coverZ);
  cover.castShadow = true;
  cover.receiveShadow = true;
  grp.add(cover);

  const hoopGeo = new THREE.TorusGeometry(coverR + 0.02, 0.035, 6, 18, Math.PI);
  for (let i = 0; i < 5; i++) {
    const hoop = new THREE.Mesh(hoopGeo, wood);
    hoop.scale.y = coverRise;
    hoop.position.set(0, SIDE_TOP, coverBack + 0.02 + i * (coverLen - 0.04) / 4);
    hoop.castShadow = true;
    grp.add(hoop);
  }

  // ── Driver's bench, tongue + doubletree, and a few frontier extras ─────────
  bx(BED_W - 0.1, 0.08, 0.4, wood, 0, SIDE_TOP + 0.1, BED_L / 2 - 0.28); // seat
  bx(BED_W - 0.1, 0.3, 0.06, wood, 0, SIDE_TOP + 0.28, BED_L / 2 - 0.46); // seat back
  bx(0.06, 0.6, 0.06, trim, BED_W / 2 - 0.1, SIDE_TOP + 0.2, BED_L / 2 - 0.1, 0.35); // brake lever

  const tongueLen = 2.4, tongueDrop = FRONT_R - 0.1;
  const tongueTilt = Math.asin(tongueDrop / tongueLen);
  const tongueZ = FRONT_Z + Math.cos(tongueTilt) * tongueLen / 2;
  bx(0.12, 0.12, tongueLen, gearPaint, 0, FRONT_R - tongueDrop / 2, tongueZ, tongueTilt);
  const tipZ = FRONT_Z + Math.cos(tongueTilt) * tongueLen;
  bx(1.1, 0.08, 0.1, wood, 0, 0.12, tipZ - 0.25); // doubletree

  // Water barrel lashed to the driver-side box, between the wheels.
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 12), wood);
  barrel.position.set(-BED_W / 2 - 0.25, BED_BOTTOM + 0.25, 0.1);
  barrel.castShadow = true;
  grp.add(barrel);
  for (const y of [-0.17, 0.17]) {
    const hoop = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.04, 12), iron);
    hoop.position.set(barrel.position.x, barrel.position.y + y, barrel.position.z);
    grp.add(hoop);
  }
  bx(0.3, 0.06, 0.5, trim, -BED_W / 2 - 0.15, BED_BOTTOM - 0.03, 0.1); // barrel shelf

  // Bucket hanging off the rear axle.
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.26, 10), wood);
  bucket.position.set(0.4, REAR_R - 0.3, REAR_Z - 0.2);
  bucket.castShadow = true;
  grp.add(bucket);

  // ── Spoked wheels ───────────────────────────────────────────────────────────
  // Built in the XY plane (axle along local Z), then turned once about Y so
  // the axle runs across the wagon.
  const buildWheel = (radius) => {
    const wheel = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.TorusGeometry(radius - 0.05, 0.05, 6, 24), iron);
    tire.castShadow = true;
    wheel.add(tire);
    const felloe = new THREE.Mesh(new THREE.TorusGeometry(radius - 0.12, 0.045, 6, 24), wood);
    felloe.castShadow = true;
    wheel.add(felloe);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.26, 10), wood);
    hub.rotation.x = Math.PI / 2;
    hub.castShadow = true;
    wheel.add(hub);
    const spokeCount = 12, spokeLen = radius - 0.2;
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.045, spokeLen, 0.045), wood);
      spoke.rotation.z = angle;
      spoke.position.set(-Math.sin(angle) * (spokeLen / 2 + 0.08), Math.cos(angle) * (spokeLen / 2 + 0.08), 0);
      spoke.castShadow = true;
      wheel.add(spoke);
    }
    wheel.rotation.y = Math.PI / 2;
    return wheel;
  };

  [-1, 1].forEach((side) => {
    const rear = buildWheel(REAR_R);
    rear.position.set(side * WHEEL_X, REAR_R, REAR_Z);
    grp.add(rear);
    const front = buildWheel(FRONT_R);
    front.position.set(side * WHEEL_X, FRONT_R, FRONT_Z);
    grp.add(front);
  });

  scene.add(grp);
}

// Shared by the tracks and the train that runs on them. The game camera
// looks toward -Z, so the tracks run along the far (-Z) edge of the map
// where the train crosses the background of the view, between the corral
// (z >= -50) and the map edge (z = -60).
const TRACK_Z = -56;
const RAIL_TOP = 0.34; // ballast top 0.05 + tie offset 0.05 + tie 0.12 + rail 0.12

/** Train tracks along the far edge of the map (see TRACK_Z). */
function _addTrainTracks(scene) {
  const HALF_LEN = 55; // spans x from -55 to 55
  const TIE_SPACING = 0.7;
  const TIE_LEN = 1.8, TIE_W = 0.22, TIE_H = 0.12;
  const GAUGE = 1.1;
  const RAIL_W = 0.1, RAIL_H = 0.12;
  const BED_Y = 0.05; // ballast top

  const tieMat = new THREE.MeshLambertMaterial({ color: 0x3a2712 });
  const railMat = new THREE.MeshLambertMaterial({ color: 0x4a4640 });
  const ballastMat = new THREE.MeshLambertMaterial({ color: 0x6a625a });

  const ballast = new THREE.Mesh(
    new THREE.BoxGeometry(HALF_LEN * 2 + 2, 0.1, TIE_LEN + 0.6),
    ballastMat
  );
  ballast.position.set(0, BED_Y, TRACK_Z);
  ballast.receiveShadow = true;
  scene.add(ballast);

  // Ties — instanced, since a 110-unit run at 0.7 spacing is ~157 of them.
  const tieCount = Math.floor((HALF_LEN * 2) / TIE_SPACING);
  const tieProto = new THREE.BoxGeometry(TIE_W, TIE_H, TIE_LEN);
  const tieMesh = new THREE.InstancedMesh(tieProto, tieMat, tieCount);
  tieMesh.castShadow = true;
  tieMesh.receiveShadow = true;
  const m = new THREE.Matrix4();
  for (let i = 0; i < tieCount; i++) {
    const x = -HALF_LEN + i * TIE_SPACING;
    m.makeTranslation(x, BED_Y + 0.05 + TIE_H / 2, TRACK_Z);
    tieMesh.setMatrixAt(i, m);
  }
  tieMesh.instanceMatrix.needsUpdate = true;
  scene.add(tieMesh);

  // Rails — two long boxes resting on top of the ties, one mesh each.
  const railY = BED_Y + 0.05 + TIE_H + RAIL_H / 2;
  [-GAUGE / 2, GAUGE / 2].forEach((offset) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(HALF_LEN * 2, RAIL_H, RAIL_W), railMat);
    rail.position.set(0, railY, TRACK_Z + offset);
    rail.castShadow = true;
    scene.add(rail);
  });
}

// ── Train ─────────────────────────────────────────────────────────────────────
// A steam train shuttles back and forth along the tracks between two tunnel
// mouths. The rock around each tunnel hides the cars while they're "off the
// map", so the train never visibly pops in or out.
const TRAIN_SPEED = 9; // units/sec
const TRAIN_WAIT = 25; // seconds between runs
const TRAIN_FIRST_DEPARTURE = 4; // seconds after load, so visitors catch it early
const TUNNEL_PORTAL_X = 50; // tunnel mouths at x = ±50
const TUNNEL_DEPTH = 14; // rock extends this far past each mouth
// A car whose center is past ±58 lies entirely inside the tunnel rock (the
// longest car is 6 long, and the rock spans |x| 50–64), so it's hidden.
const TRAIN_HIDE_X = 58;

let _train = null;

function _addTrain(scene) {
  const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
  const m = {
    boiler: lambert(0x1e1e1e),
    iron: lambert(0x2b2622),
    steel: lambert(0x8a8580),
    brass: lambert(0xb08a3a),
    red: lambert(0x8a2a1c),
    green: lambert(0x2f4a3a),
    oxide: lambert(0x8a4a22),
    oxideDark: lambert(0x5e3018),
    caboose: lambert(0xa3261a),
    roof: lambert(0x2a1f18),
    wood: lambert(0x7a5a38),
    coal: lambert(0x141210),
    window: lambert(0x4a3824, { emissive: 0x2a1808 }), // faintly lit interiors
    lamp: new THREE.MeshBasicMaterial({ color: 0xfff1c4 }),
    marker: new THREE.MeshBasicMaterial({ color: 0xff4a2a }),
  };

  // Everything rides on `root`, whose local +X is the direction of travel.
  // Cars are laid out behind the locomotive's nose (local x = 0) along -X.
  const root = new THREE.Group();
  root.position.set(0, 0, TRACK_Z);
  scene.add(root);

  const cars = []; // { group, centerX }
  const wheels = []; // { mesh, radius }
  const rods = []; // { mesh, midX, axleY }

  const box = (parent, w, h, d, mat, x, y, z = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  // Cylinder along the given axis ('x', 'y', or 'z').
  const cyl = (parent, rTop, rBot, len, mat, x, y, z = 0, axis = 'y', seg = 14) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, len, seg), mat);
    if (axis === 'x') mesh.rotation.z = Math.PI / 2;
    if (axis === 'z') mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const addCar = (centerX) => {
    const group = new THREE.Group();
    group.position.x = centerX;
    root.add(group);
    cars.push({ group, centerX });
    return group;
  };
  // Pair of wheels on one axle, sitting on the rails. Each wheel is its own
  // group so it can spin about local Z; spokes make the rotation visible.
  const WHEEL_Z = 0.58;
  const axle = (parent, x, r) => {
    const out = [];
    for (const side of [-1, 1]) {
      const wheel = new THREE.Group();
      wheel.position.set(x, RAIL_TOP + r, side * WHEEL_Z);
      cyl(wheel, r, r, 0.12, m.iron, 0, 0, 0, 'z', 18);
      cyl(wheel, r + 0.05, r + 0.05, 0.04, m.iron, 0, 0, -side * 0.06, 'z', 18); // flange
      const spoke = new THREE.BoxGeometry(r * 1.7, 0.07, 0.02);
      for (const rot of [0, Math.PI / 2]) {
        const s = new THREE.Mesh(spoke, m.steel);
        s.rotation.z = rot;
        s.position.z = side * 0.07;
        wheel.add(s);
      }
      parent.add(wheel);
      wheels.push({ mesh: wheel, radius: r });
      out.push(wheel);
    }
    return out;
  };
  // Couplers ride on the car in front of them, so they hide along with it.
  const coupler = (car, localX) => box(car, 0.5, 0.1, 0.12, m.iron, localX, 1.0);

  // ── Locomotive (nose at x=0, back at x=-6) ────────────────────────────────
  const loco = addCar(-3);
  const NOSE = 3; // nose position in the loco group's local frame
  // Cowcatcher: a wedge sloping up and back from the rails.
  const pilotShape = new THREE.Shape();
  pilotShape.moveTo(0, 0);
  pilotShape.lineTo(-0.8, 0);
  pilotShape.lineTo(-0.8, 0.65);
  pilotShape.closePath();
  const pilotGeo = new THREE.ExtrudeGeometry(pilotShape, { depth: 1.5, bevelEnabled: false });
  pilotGeo.translate(0, 0, -0.75);
  const pilot = new THREE.Mesh(pilotGeo, m.red);
  pilot.position.set(NOSE, RAIL_TOP + 0.05, 0);
  pilot.castShadow = true;
  loco.add(pilot);
  box(loco, 0.15, 0.3, 1.9, m.red, NOSE - 0.8, 1.05); // buffer beam
  box(loco, 5.2, 0.16, 0.9, m.iron, -0.4, 1.12); // frame
  for (const side of [-1, 1]) box(loco, 3.8, 0.06, 0.35, m.iron, 0.2, 1.5, side * 0.85); // running boards

  // Boiler with brass bands, smokebox, and number plate.
  cyl(loco, 0.62, 0.62, 3.0, m.boiler, 0.4, 1.85, 0, 'x', 18);
  for (const bx of [1.3, 0.3, -0.7]) cyl(loco, 0.64, 0.64, 0.06, m.brass, bx, 1.85, 0, 'x', 18);
  cyl(loco, 0.66, 0.66, 0.7, m.iron, 2.05, 1.85, 0, 'x', 18); // smokebox
  cyl(loco, 0.2, 0.2, 0.04, m.brass, 2.42, 1.9, 0, 'x'); // number plate

  // Headlamp box with a glowing lens and halo.
  box(loco, 0.42, 0.42, 0.42, m.iron, 2.1, 2.75);
  cyl(loco, 0.14, 0.14, 0.04, m.lamp, 2.32, 2.75, 0, 'x');
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: _radialGlowTexture('rgba(255,220,150,1)'), color: 0xffd090,
    transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  halo.position.set(2.45, 2.75, 0);
  halo.scale.setScalar(1.6);
  loco.add(halo);

  // Flared "balloon" smokestack, steam dome, sand dome, and bell.
  cyl(loco, 0.2, 0.2, 0.35, m.boiler, 1.95, 2.55);
  cyl(loco, 0.42, 0.2, 0.7, m.boiler, 1.95, 3.07);
  cyl(loco, 0.45, 0.45, 0.08, m.iron, 1.95, 3.46);
  const smokeOrigin = new THREE.Object3D();
  smokeOrigin.position.set(1.95, 3.6, 0);
  loco.add(smokeOrigin);
  cyl(loco, 0.28, 0.3, 0.35, m.brass, 0.4, 2.6);
  const domeCap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8), m.brass);
  domeCap.scale.y = 0.5;
  domeCap.position.set(0.4, 2.78, 0);
  loco.add(domeCap);
  cyl(loco, 0.24, 0.26, 0.3, m.boiler, -0.5, 2.55);
  cyl(loco, 0.1, 0.14, 0.2, m.brass, 1.0, 2.6); // bell

  // Cab.
  box(loco, 1.8, 2.0, 1.8, m.red, -2.05, 2.2);
  box(loco, 2.1, 0.1, 2.0, m.roof, -2.05, 3.27);
  for (const side of [-1, 1]) box(loco, 0.6, 0.5, 0.02, m.window, -1.75, 2.6, side * 0.91);
  for (const side of [-1, 1]) box(loco, 0.02, 0.4, 0.4, m.window, -1.14, 2.75, side * 0.5);

  // Piston cylinders, wheels, and the side rods that couple the drivers.
  for (const side of [-1, 1]) cyl(loco, 0.22, 0.22, 0.8, m.iron, 1.55, 1.05, side * 0.95, 'x');
  axle(loco, 1.55, 0.3); // leading truck
  const DRIVER_R = 0.55, CRANK = 0.22;
  const drivers = [...axle(loco, 0.25, DRIVER_R), ...axle(loco, -0.95, DRIVER_R)];
  for (const wheel of drivers) {
    const side = Math.sign(wheel.position.z);
    cyl(wheel, 0.05, 0.05, 0.1, m.steel, CRANK, 0, side * 0.1, 'z', 8); // crank pin
  }
  for (const side of [-1, 1]) {
    const rod = box(loco, 1.36, 0.08, 0.05, m.steel, -0.35, RAIL_TOP + DRIVER_R, side * 0.72);
    rods.push({ mesh: rod, midX: -0.35, axleY: RAIL_TOP + DRIVER_R, crank: CRANK });
  }
  axle(loco, -2.3, 0.3); // trailing truck

  // ── Tender ─────────────────────────────────────────────────────────────────
  coupler(loco, -3.1);
  const tender = addCar(-7.6);
  box(tender, 2.6, 0.15, 0.9, m.iron, 0, 1.0);
  box(tender, 2.8, 1.2, 1.8, m.boiler, 0, 1.7);
  box(tender, 2.82, 0.1, 1.82, m.red, 0, 2.2);
  box(tender, 2.2, 0.3, 1.5, m.coal, 0, 2.4);
  for (const [cx, cz] of [[-0.6, -0.3], [0.3, 0.35], [0.7, -0.4]]) {
    const lump = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3), m.coal);
    lump.position.set(cx, 2.6, cz);
    lump.scale.y = 0.6;
    tender.add(lump);
  }
  axle(tender, 0.85, 0.3);
  axle(tender, -0.85, 0.3);

  // ── Passenger car ──────────────────────────────────────────────────────────
  coupler(tender, -1.6);
  const coach = addCar(-12.4);
  box(coach, 6.0, 0.12, 1.8, m.iron, 0, 1.14); // floor incl. end platforms
  box(coach, 5.0, 1.6, 1.8, m.green, 0, 2.0);
  box(coach, 5.02, 0.06, 1.82, m.brass, 0, 1.55); // trim stripe
  box(coach, 5.4, 0.12, 2.0, m.roof, 0, 2.86);
  box(coach, 4.2, 0.3, 1.0, m.roof, 0, 3.05); // clerestory
  box(coach, 4.4, 0.06, 1.2, m.roof, 0, 3.22);
  for (let i = 0; i < 7; i++) {
    for (const side of [-1, 1]) box(coach, 0.42, 0.55, 0.02, m.window, -2.1 + i * 0.7, 2.2, side * 0.91);
  }
  for (const end of [-1, 1]) box(coach, 0.04, 0.5, 1.6, m.iron, end * 2.95, 1.45); // platform railings
  for (const x of [-2.65, -1.75, 1.75, 2.65]) axle(coach, x, 0.3);

  // ── Boxcar ─────────────────────────────────────────────────────────────────
  coupler(coach, -3.1);
  const boxcar = addCar(-18.2);
  box(boxcar, 5.2, 0.12, 1.8, m.iron, 0, 1.14);
  box(boxcar, 5.2, 1.9, 1.8, m.oxide, 0, 2.15);
  box(boxcar, 5.3, 0.08, 1.9, m.oxideDark, 0, 3.14);
  box(boxcar, 5.2, 0.06, 0.35, m.wood, 0, 3.21); // roof walkway
  for (const side of [-1, 1]) {
    box(boxcar, 1.4, 1.5, 0.03, m.oxideDark, 0, 2.05, side * 0.91); // sliding door
    box(boxcar, 2.8, 0.06, 0.05, m.iron, 0, 2.85, side * 0.93); // door rail
    for (let i = 0; i < 8; i++) {
      const x = -2.4 + i * 0.68;
      if (Math.abs(x) > 0.8) box(boxcar, 0.05, 1.9, 0.02, m.oxideDark, x, 2.15, side * 0.91); // ribs
    }
  }
  for (const x of [-2.25, -1.35, 1.35, 2.25]) axle(boxcar, x, 0.3);

  // ── Caboose ────────────────────────────────────────────────────────────────
  coupler(boxcar, -2.7);
  const caboose = addCar(-22.9);
  box(caboose, 3.8, 0.12, 1.8, m.iron, 0, 1.14);
  box(caboose, 3.0, 1.7, 1.8, m.caboose, 0, 2.05);
  box(caboose, 3.2, 0.1, 2.0, m.roof, 0, 2.95);
  box(caboose, 1.2, 0.6, 1.4, m.caboose, 0, 3.3); // cupola
  box(caboose, 1.4, 0.08, 1.6, m.roof, 0, 3.64);
  for (const side of [-1, 1]) {
    box(caboose, 0.5, 0.3, 0.02, m.window, 0, 3.35, side * 0.71);
    box(caboose, 0.45, 0.5, 0.02, m.window, -0.8, 2.3, side * 0.91);
    box(caboose, 0.45, 0.5, 0.02, m.window, 0.8, 2.3, side * 0.91);
    box(caboose, 0.1, 0.14, 0.1, m.marker, -1.9, 2.6, side * 0.75); // rear marker lamps
  }
  cyl(caboose, 0.06, 0.06, 0.5, m.iron, 1.0, 3.2); // stove pipe
  for (const end of [-1, 1]) box(caboose, 0.04, 0.5, 1.6, m.iron, end * 1.85, 1.45);
  for (const x of [-1.5, -0.8, 0.8, 1.5]) axle(caboose, x, 0.3);

  // ── Smoke puffs (pooled, live in world space so they trail behind) ─────────
  const puffGeo = new THREE.IcosahedronGeometry(0.4, 2);
  const puffs = [];
  for (let i = 0; i < 32; i++) {
    const puff = new THREE.Mesh(puffGeo, new THREE.MeshLambertMaterial({
      color: 0xe8e0d6, transparent: true, opacity: 0, depthWrite: false,
    }));
    puff.visible = false;
    puff.userData.age = Infinity;
    scene.add(puff);
    puffs.push(puff);
  }

  const length = 24.8; // nose to caboose tail
  for (const car of cars) car.group.visible = false;

  _train = {
    root, cars, wheels, rods, puffs, smokeOrigin, length,
    state: 'waiting', timer: TRAIN_FIRST_DEPARTURE, dir: 1,
    distance: 0, puffTimer: 0, nextPuff: 0,
  };

  _addTunnel(scene, -1);
  _addTunnel(scene, 1);
}

/** Rocky hill with a timber-framed tunnel mouth at x = side * TUNNEL_PORTAL_X. */
function _addTunnel(scene, side) {
  const grp = new THREE.Group();
  grp.position.set(side * TUNNEL_PORTAL_X, 0, TRACK_Z);
  // Local +X points into the hill, so the same layout works for both ends.
  if (side < 0) grp.rotation.y = Math.PI;
  scene.add(grp);

  const rockMats = [0x7a6e60, 0x6a5e52, 0x8a7c6e].map((c) => new THREE.MeshLambertMaterial({ color: c }));
  const timber = new THREE.MeshLambertMaterial({ color: 0x4a3018 });
  const dark = new THREE.MeshBasicMaterial({ color: 0x0a0604 });

  // Solid core the train disappears into.
  const core = new THREE.Mesh(new THREE.BoxGeometry(TUNNEL_DEPTH, 6, 8), rockMats[1]);
  core.position.set(TUNNEL_DEPTH / 2, 3, 0);
  core.castShadow = true;
  core.receiveShadow = true;
  grp.add(core);

  // Boulders soften the box into a hill. None reach in front of the mouth
  // opening (|z| < 1.6, y < 4.6), so the train always has a clear way in.
  const boulders = [
    { s: [2.6, 1.8, 3.6], x: 2.4, y: 5.6, z: 0.2 }, // above the mouth
    { s: [4.0, 3.2, 3.2], x: 5.5, y: 6.0, z: -2.2 },
    { s: [4.6, 3.0, 3.6], x: 9.0, y: 6.4, z: 2.0 },
    { s: [3.4, 2.6, 2.8], x: 12.0, y: 5.6, z: -1.0 },
    { s: [2.2, 3.0, 2.0], x: 1.4, y: 2.4, z: -3.8 },
    { s: [2.0, 2.6, 2.2], x: 1.2, y: 2.0, z: 3.9 },
    { s: [3.0, 2.4, 2.4], x: 4.5, y: 2.6, z: 4.2 },
    { s: [3.2, 2.6, 2.4], x: 5.0, y: 2.8, z: -4.4 },
    { s: [1.0, 0.7, 0.9], x: -0.6, y: 0.5, z: 3.1 },
    { s: [0.8, 0.6, 0.7], x: -0.4, y: 0.4, z: -2.9 },
  ];
  boulders.forEach(({ s, x, y, z }, i) => {
    const rock = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), rockMats[i % rockMats.length]);
    rock.scale.set(...s);
    rock.position.set(x, y, z);
    rock.rotation.y = i * 1.3;
    rock.castShadow = true;
    rock.receiveShadow = true;
    grp.add(rock);
  });

  // Dark opening on the hill face, framed by timber posts and a header.
  const opening = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 4.2), dark);
  opening.rotation.y = -Math.PI / 2; // face back down the track (local -X)
  opening.position.set(-0.03, 2.1, 0);
  grp.add(opening);
  for (const z of [-1.57, 1.57]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.4, 0.35), timber);
    post.position.set(-0.15, 2.2, z);
    post.castShadow = true;
    grp.add(post);
  }
  const header = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 3.8), timber);
  header.position.set(-0.15, 4.4, 0);
  header.castShadow = true;
  grp.add(header);
}

function _updateTrain(delta) {
  const tr = _train;
  if (!tr) return;

  if (tr.state === 'waiting') {
    tr.timer -= delta;
    if (tr.timer > 0) return;
    // Depart from inside the tunnel on the side opposite the direction of travel.
    tr.state = 'running';
    tr.root.rotation.y = tr.dir > 0 ? 0 : Math.PI;
    tr.root.position.x = -tr.dir * (TRAIN_HIDE_X + 3);
  }

  const step = TRAIN_SPEED * delta;
  tr.root.position.x += tr.dir * step;
  tr.distance += step;
  const headX = tr.root.position.x;

  // Roll the wheels and swing the side rods with the driving wheels' cranks.
  for (const w of tr.wheels) w.mesh.rotation.z = -tr.distance / w.radius;
  const driverAngle = -tr.distance / 0.55;
  for (const rod of tr.rods) {
    rod.mesh.position.x = rod.midX + rod.crank * Math.cos(driverAngle);
    rod.mesh.position.y = rod.axleY + rod.crank * Math.sin(driverAngle);
  }

  // Show only the cars that are out of the tunnel rock.
  for (const car of tr.cars) {
    car.group.visible = Math.abs(headX + tr.dir * car.centerX) < TRAIN_HIDE_X;
  }

  // Chuff smoke from the stack while the locomotive is out in the open.
  if (tr.cars[0].group.visible) {
    tr.puffTimer += delta;
    if (tr.puffTimer >= 0.1) {
      tr.puffTimer = 0;
      const puff = tr.puffs[tr.nextPuff];
      tr.nextPuff = (tr.nextPuff + 1) % tr.puffs.length;
      tr.smokeOrigin.getWorldPosition(puff.position);
      puff.userData.age = 0;
      puff.visible = true;
    }
  }

  // Run finished once the caboose is back inside the far tunnel.
  if (tr.dir * (headX - tr.dir * tr.length) > TRAIN_HIDE_X + 3) {
    tr.state = 'waiting';
    tr.timer = TRAIN_WAIT;
    tr.dir = -tr.dir;
    for (const car of tr.cars) car.group.visible = false;
  }
}

function _updateSmoke(delta) {
  if (!_train) return;
  const LIFE = 2.4;
  for (const puff of _train.puffs) {
    if (!puff.visible) continue;
    puff.userData.age += delta;
    const t = puff.userData.age / LIFE;
    if (t >= 1) { puff.visible = false; continue; }
    puff.position.y += (1.6 - t * 0.8) * delta; // rises, slowing as it spreads
    puff.position.z += 0.4 * delta; // light breeze
    puff.scale.setScalar(0.7 + 2.6 * t);
    puff.material.opacity = 0.5 * Math.pow(1 - t, 1.5);
  }
}

// ── Animal farm ───────────────────────────────────────────────────────────────
// Per-frame animation callbacks for the farm animals and pond:
// (delta, time) => void.
const _animators = [];
let _animTime = 0;

/** Box mesh helper shared by the farm builders. */
function _farmBox(parent, w, h, d, mat, x, y, z, rx = 0, rz = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, 0, rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Fenced ranch with a red barn, hay, a water trough, a pigsty, cows,
 * horses, and chickens. Fills the open lot behind the Telegraph Office row:
 * between the side roads (x in [-20,20]), from just behind the old wagon
 * (rear at z≈-25.9) back to the train tracks (ballast from z=-54.8).
 * The gate faces town (+Z).
 */
function _addAnimalFarm(scene) {
  const CENTER_X = 0, CENTER_Z = -41.5; // fence spans x -16.5..16.5, z -52.5..-30.5
  const HALF_W = 16.5, HALF_D = 11;
  const POST_H = 1.5;
  const GATE_W = 2.6; // gap in the town-facing fence, centered on CENTER_X

  const farm = new THREE.Group();
  farm.position.set(CENTER_X, 0, CENTER_Z);
  scene.add(farm);

  const postMat = new THREE.MeshLambertMaterial({ color: 0x4a3018 });
  const railMat = new THREE.MeshLambertMaterial({ color: 0x5c3a21 });

  // Trampled dirt floor, a shade darker than the surrounding desert.
  const dirt = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF_W * 2, HALF_D * 2),
    new THREE.MeshLambertMaterial({ color: 0x8a6440 })
  );
  dirt.rotation.x = -Math.PI / 2;
  dirt.position.y = 0.02;
  dirt.receiveShadow = true;
  farm.add(dirt);

  // ── Fence: instanced posts + three rails per run, with a gate gap ─────────
  const runs = [
    [-HALF_W, -HALF_D, HALF_W, -HALF_D], // back
    [HALF_W, -HALF_D, HALF_W, HALF_D], // east
    [-HALF_W, HALF_D, -HALF_W, -HALF_D], // west
    [-HALF_W, HALF_D, -GATE_W / 2, HALF_D], // front, left of gate
    [GATE_W / 2, HALF_D, HALF_W, HALF_D], // front, right of gate
  ];
  const posts = [];
  for (const [x1, z1, x2, z2] of runs) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const count = Math.max(2, Math.round(len / 2.4) + 1);
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const px = x1 + (x2 - x1) * t, pz = z1 + (z2 - z1) * t;
      if (!posts.some(([qx, qz]) => Math.abs(px - qx) < 0.05 && Math.abs(pz - qz) < 0.05)) posts.push([px, pz]);
    }
    // Rails run along X or Z only, so a box sized to the run needs no rotation.
    const alongX = z1 === z2;
    for (const railY of [0.45, 0.9, 1.3]) {
      _farmBox(farm, alongX ? len + 0.1 : 0.07, 0.08, alongX ? 0.07 : len + 0.1, railMat,
        (x1 + x2) / 2, railY, (z1 + z2) / 2);
    }
  }
  const postMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, POST_H, 0.16), postMat, posts.length);
  postMesh.castShadow = true;
  const mtx = new THREE.Matrix4();
  posts.forEach(([px, pz], i) => {
    mtx.makeTranslation(px, POST_H / 2, pz);
    postMesh.setMatrixAt(i, mtx);
  });
  postMesh.instanceMatrix.needsUpdate = true;
  farm.add(postMesh);

  // Gate: taller posts and a braced gate swung slightly open toward town.
  for (const gx of [-GATE_W / 2, GATE_W / 2]) _farmBox(farm, 0.2, 1.9, 0.2, postMat, gx, 0.95, HALF_D);
  const gate = new THREE.Group();
  gate.position.set(-GATE_W / 2 + 0.1, 0, HALF_D);
  gate.rotation.y = -0.4; // swings outward (+Z)
  farm.add(gate);
  const gateLen = GATE_W - 0.25;
  for (const gy of [0.4, 0.85, 1.3]) _farmBox(gate, gateLen, 0.1, 0.07, railMat, gateLen / 2, gy, 0);
  _farmBox(gate, 0.1, 1.0, 0.07, railMat, gateLen - 0.05, 0.85, 0);
  const braceLen = Math.hypot(gateLen, 0.9);
  _farmBox(gate, braceLen, 0.09, 0.06, railMat, gateLen / 2, 0.85, 0.04, 0, Math.atan2(0.9, gateLen));

  // ── Barn (back-left corner, doors facing town) ─────────────────────────────
  const BARN_SCALE = 1.6; // 7.0 × 5.8 footprint
  const BARN_X = -HALF_W + 4.5, BARN_Z = -HALF_D + 4.0; // ~1 clear of the back/side fences
  _addBarn(farm, BARN_X, BARN_Z, BARN_SCALE);

  // Hay bales stacked beside the barn, plus loose hay by its doors.
  const hayMat = new THREE.MeshLambertMaterial({ color: 0xd9b44a });
  const twineMat = new THREE.MeshLambertMaterial({ color: 0x8a6a2a });
  const bale = (x, y, z, ry) => {
    const b = new THREE.Group();
    b.position.set(x, y, z);
    b.rotation.y = ry;
    farm.add(b);
    _farmBox(b, 0.9, 0.5, 0.55, hayMat, 0, 0.25, 0);
    for (const tx of [-0.22, 0.22]) _farmBox(b, 0.03, 0.51, 0.56, twineMat, tx, 0.25, 0);
  };
  // Stack beside the barn's east wall (x≈-8.5).
  bale(-7.1, 0, -9.6, 0);
  bale(-6.15, 0, -9.65, 0.05);
  bale(-5.2, 0, -9.6, -0.04);
  bale(-6.6, 0.5, -9.6, -0.08);
  bale(-5.65, 0.5, -9.62, 0.06);
  bale(-6.1, 1.0, -9.6, 0.02);
  bale(-4.2, 0, -8.7, 1.4);
  bale(-6.4, 0, -8.3, 0.2);
  _farmBox(farm, 2.4, 0.06, 1.4, hayMat, BARN_X, 0.05, BARN_Z + 3.6); // loose hay at the doors

  // ── Water trough along the east fence ─────────────────────────────────────
  const wood = new THREE.MeshLambertMaterial({ color: 0x6b4a2f });
  const water = new THREE.MeshLambertMaterial({ color: 0x4a7a8c });
  _farmBox(farm, 0.75, 0.45, 3.4, wood, HALF_W - 1.0, 0.25, 2.0);
  _farmBox(farm, 0.6, 0.04, 3.25, water, HALF_W - 1.0, 0.44, 2.0);

  // ── Windpump beside the trough, between it and the pigsty ─────────────────
  // Base spans x 13.3..15.7, z -3.7..-1.3 (trough starts at z=0.3, sty ends at z=-5.2).
  _addWindmill(farm, HALF_W - 2.0, -2.5);

  // ── Pigsty (back-right corner): low pen around a mud wallow ───────────────
  _addPigsty(farm, HALF_W - 4.3, -HALF_D + 3.4);

  // ── Animals ────────────────────────────────────────────────────────────────
  // Sized against the ~3-unit-tall cowboy rather than the old knee-high ones.
  _addCow(farm, 6.0, -4.5, 0.6, 0);
  _addCow(farm, 13.7, 2.0, Math.PI / 2, 2.1); // drinking at the trough
  _addCow(farm, 1.5, -7.0, -0.8, 4.2);
  _addCow(farm, 8.5, 6.0, 2.6, 6.3);
  _addHorse(farm, -2.0, 1.5, 2.3, 0x7a4a26, 0);
  _addHorse(farm, 3.0, 6.5, -2.6, 0x2e2622, 2.7); // dark horse, no white socks
  _addHorse(farm, -3.2, -4.5, 0.9, 0xc8a060, 5.1); // palomino

  // Chickens scratch around in front of the barn, away from the big animals.
  const chickenArea = { minX: -15.4, maxX: -7.0, minZ: -1.6, maxZ: 9.5 };
  [
    [-14.0, 0.5, 0xf2ece0], [-11.0, 2.2, 0x9a5a2a], [-8.5, 0.2, 0xf2ece0],
    [-12.4, 5.4, 0x9a5a2a], [-9.2, 7.6, 0xf2ece0], [-14.5, 4.0, 0x9a5a2a],
    [-10.4, 9.0, 0xf2ece0], [-7.8, 4.6, 0x9a5a2a],
  ].forEach(([x, z, color], i) => _addChicken(farm, x, z, color, chickenArea, i));
}

/**
 * Western windpump: a tapered steel lattice tower with a many-bladed wheel
 * and tail vane on top, and a pump at its foot piping water to the trough.
 * The wheel spins with gentle gusts, the head yaws a little, and the pump
 * rod strokes up and down with the wheel. The wheel faces town (+Z).
 */
function _addWindmill(parent, x, z) {
  const mill = new THREE.Group();
  mill.position.set(x, 0, z);
  parent.add(mill);

  const steel = new THREE.MeshLambertMaterial({ color: 0x8a8f94 });
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0xc8ccd0, side: THREE.DoubleSide });
  const vaneMat = new THREE.MeshLambertMaterial({ color: 0x9a2a1e });
  const white = new THREE.MeshLambertMaterial({ color: 0xe8e0d0 });
  const wood = new THREE.MeshLambertMaterial({ color: 0x6b4a2f });
  const concrete = new THREE.MeshLambertMaterial({ color: 0x9a948a });

  const H = 11; // tower height
  const BASE = 1.2, TOP = 0.25; // half-widths of the tower at ground and top

  // ── Tower: every leg and brace is one instance of a unit cylinder ─────────
  const struts = [];
  const strut = (a, b, r) => struts.push({ a, b, r });
  const corner = (sx, sz, t) => {
    const half = THREE.MathUtils.lerp(BASE, TOP, t);
    return new THREE.Vector3(sx * half, t * H, sz * half);
  };
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [sx, sz] of corners) strut(corner(sx, sz, 0), corner(sx, sz, 1), 0.06); // legs
  const levels = [0, 0.22, 0.42, 0.6, 0.76, 0.9];
  levels.forEach((t, li) => {
    for (let i = 0; i < 4; i++) {
      const [ax, az] = corners[i], [bx, bz] = corners[(i + 1) % 4];
      if (t > 0) strut(corner(ax, az, t), corner(bx, bz, t), 0.035); // horizontal ring
      if (li + 1 < levels.length) {
        const t2 = levels[li + 1];
        strut(corner(ax, az, t), corner(bx, bz, t2), 0.025); // X braces on each face
        strut(corner(bx, bz, t), corner(ax, az, t2), 0.025);
      }
    }
  });
  const strutMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 6), steel, struts.length);
  strutMesh.castShadow = true;
  const up = new THREE.Vector3(0, 1, 0);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), mid = new THREE.Vector3(), dir = new THREE.Vector3();
  struts.forEach(({ a, b, r }, i) => {
    dir.subVectors(b, a);
    const len = dir.length();
    q.setFromUnitVectors(up, dir.normalize());
    mid.addVectors(a, b).multiplyScalar(0.5);
    m.compose(mid, q, new THREE.Vector3(r, len, r));
    strutMesh.setMatrixAt(i, m);
  });
  strutMesh.instanceMatrix.needsUpdate = true;
  mill.add(strutMesh);

  for (const [sx, sz] of corners) _farmBox(mill, 0.4, 0.2, 0.4, concrete, sx * BASE, 0.1, sz * BASE); // footings
  _farmBox(mill, 1.1, 0.08, 1.1, wood, 0, H - 0.9, 0); // service platform

  // ── Head: gearbox, wheel, and tail vane, yawing as one unit ───────────────
  const head = new THREE.Group();
  head.position.y = H + 0.25;
  mill.add(head);
  _farmBox(head, 0.45, 0.4, 0.8, steel, 0, 0, 0);
  _farmBox(head, 0.12, 0.5, 0.12, steel, 0, -0.35, 0); // mast into the tower top

  const wheel = new THREE.Group();
  wheel.position.z = 0.55;
  head.add(wheel);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.25, 10), steel);
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);
  const R_IN = 0.35, R_OUT = 2.1, BLADES = 18;
  const bladeGeo = new THREE.BoxGeometry(0.3, R_OUT - R_IN, 0.02);
  for (let i = 0; i < BLADES; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i / BLADES) * Math.PI * 2;
    wheel.add(arm);
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = (R_IN + R_OUT) / 2;
    blade.rotation.y = 0.4; // pitched, like a real windpump sail
    blade.castShadow = true;
    arm.add(blade);
  }
  for (const r of [R_OUT - 0.05, (R_IN + R_OUT) / 2]) {
    wheel.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 4, 36), steel)); // rim rings
  }

  _farmBox(head, 0.06, 0.06, 2.4, steel, 0, 0.05, -1.5); // tail boom
  const vane = _farmBox(head, 0.04, 1.0, 1.5, vaneMat, 0, 0.25, -3.0);
  _farmBox(head, 0.05, 0.14, 1.5, white, 0, 0.25, -3.0); // white stripe across the vane
  vane.castShadow = true;

  // ── Pump: rod down the middle of the tower, pump head, pipe to the trough ─
  const rod = _farmBox(mill, 0.05, H - 1.2, 0.05, steel, 0, (H - 1.2) / 2 + 0.6, 0);
  _farmBox(mill, 0.35, 0.7, 0.35, steel, 0, 0.35, 0); // pump head
  _farmBox(mill, 0.12, 0.12, 2.6, steel, 0.6, 0.12, 1.5); // pipe toward the trough
  _farmBox(mill, 0.5, 0.12, 0.12, steel, 0.3, 0.12, 0.2);

  let spin = 0;
  _animators.push((delta, time) => {
    const gust = 1 + 0.35 * Math.sin(time * 0.31) + 0.15 * Math.sin(time * 1.13);
    spin += delta * 1.6 * gust;
    wheel.rotation.z = -spin;
    head.rotation.y = Math.sin(time * 0.17) * 0.18; // drifts with the wind
    rod.position.y = (H - 1.2) / 2 + 0.6 + Math.sin(spin) * 0.12; // pump stroke
  });
}

/** Low-railed pen with a mud wallow and three rooting pigs, centered at (x, z). */
function _addPigsty(parent, x, z) {
  const sty = new THREE.Group();
  sty.position.set(x, 0, z);
  parent.add(sty);

  const HW = 3.0, HD = 2.4;
  const railMat = new THREE.MeshLambertMaterial({ color: 0x5c3a21 });
  const mud = new THREE.Mesh(
    new THREE.CircleGeometry(1, 20),
    new THREE.MeshLambertMaterial({ color: 0x4e3420 })
  );
  mud.rotation.x = -Math.PI / 2;
  mud.scale.set(HW * 0.8, HD * 0.75, 1);
  mud.position.y = 0.03;
  mud.receiveShadow = true;
  sty.add(mud);

  for (const [cx, cz] of [[-HW, -HD], [HW, -HD], [-HW, HD], [HW, HD], [0, -HD], [0, HD], [-HW, 0], [HW, 0]]) {
    _farmBox(sty, 0.14, 0.85, 0.14, railMat, cx, 0.42, cz);
  }
  for (const ry of [0.35, 0.7]) {
    _farmBox(sty, HW * 2, 0.07, 0.06, railMat, 0, ry, -HD);
    _farmBox(sty, HW * 2, 0.07, 0.06, railMat, 0, ry, HD);
    _farmBox(sty, 0.06, 0.07, HD * 2, railMat, -HW, ry, 0);
    _farmBox(sty, 0.06, 0.07, HD * 2, railMat, HW, ry, 0);
  }

  _addPig(sty, -1.2, -0.4, 0.8, 0);
  _addPig(sty, 1.1, 0.6, -2.2, 1.7);
  _addPig(sty, 0.4, -1.3, 2.9, 3.3);
}

/** Pink pig that roots its snout at the ground and wags its curly tail. */
function _addPig(parent, x, z, rotY, phase) {
  const pig = new THREE.Group();
  pig.position.set(x, 0, z);
  pig.rotation.y = rotY;
  pig.scale.setScalar(1.25);
  parent.add(pig);

  const skin = new THREE.MeshLambertMaterial({ color: 0xe8a8a0 });
  const snoutMat = new THREE.MeshLambertMaterial({ color: 0xd4848a });
  const dark = new THREE.MeshLambertMaterial({ color: 0x2a1a14 });

  _farmBox(pig, 0.5, 0.42, 0.8, skin, 0, 0.44, 0);
  for (const [lx, lz] of [[-0.15, -0.28], [0.15, -0.28], [-0.15, 0.28], [0.15, 0.28]]) {
    _farmBox(pig, 0.12, 0.24, 0.12, skin, lx, 0.12, lz);
  }
  const head = new THREE.Group();
  head.position.set(0, 0.5, 0.4);
  pig.add(head);
  _farmBox(head, 0.36, 0.34, 0.26, skin, 0, 0, 0.1);
  _farmBox(head, 0.18, 0.14, 0.08, snoutMat, 0, -0.04, 0.26);
  for (const side of [-1, 1]) {
    _farmBox(head, 0.03, 0.04, 0.02, dark, side * 0.04, -0.04, 0.305); // nostrils
    _farmBox(head, 0.04, 0.04, 0.02, dark, side * 0.1, 0.08, 0.235); // eyes
    _farmBox(head, 0.12, 0.04, 0.1, skin, side * 0.14, 0.17, 0.04, 0.4); // floppy ears
  }
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 5, 10), skin);
  tail.position.set(0, 0.6, -0.42);
  pig.add(tail);

  _animators.push((delta, time) => {
    const t = time + phase;
    head.rotation.x = 0.25 + Math.max(0, Math.sin(t * 1.6)) * 0.35; // rooting
    tail.rotation.z = t * 6; // spinning curl reads as a wag
  });
}

/** Small red barn with white trim; local +Z is the front (doors). */
function _addBarn(parent, x, z, scale = 1) {
  const barn = new THREE.Group();
  barn.position.set(x, 0, z);
  barn.scale.setScalar(scale);
  parent.add(barn);

  const red = new THREE.MeshLambertMaterial({ color: 0x9a2a1e });
  const redDark = new THREE.MeshLambertMaterial({ color: 0x7a2016 });
  const white = new THREE.MeshLambertMaterial({ color: 0xe8e0d0 });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x4a3a30 });
  const hay = new THREE.MeshLambertMaterial({ color: 0xd9b44a });
  const dark = new THREE.MeshLambertMaterial({ color: 0x1a0e08 });

  const W = 4.4, D = 3.6, WALL_H = 2.4, RISE = 1.3;
  _farmBox(barn, W, WALL_H, D, red, 0, WALL_H / 2, 0);

  // Gable: a triangular prism running front to back on top of the walls.
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-W / 2, 0);
  gableShape.lineTo(W / 2, 0);
  gableShape.lineTo(0, RISE);
  gableShape.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: D, bevelEnabled: false });
  gableGeo.translate(0, 0, -D / 2);
  const gable = new THREE.Mesh(gableGeo, red);
  gable.position.y = WALL_H;
  gable.castShadow = true;
  barn.add(gable);

  // Roof: two slabs along the gable slopes, with a little overhang.
  const slope = Math.atan2(RISE, W / 2);
  const slabLen = Math.hypot(W / 2, RISE) + 0.3;
  for (const side of [-1, 1]) {
    const slab = _farmBox(barn, slabLen, 0.12, D + 0.4, roofMat,
      side * (W / 4 + 0.03), WALL_H + RISE / 2 + 0.08, 0, 0, -side * slope);
    slab.position.x += side * 0.05;
  }
  _farmBox(barn, 0.16, 0.16, D + 0.42, roofMat, 0, WALL_H + RISE + 0.06, 0); // ridge cap

  // White corner boards and eave trim.
  for (const cx of [-1, 1]) for (const cz of [-1, 1]) {
    _farmBox(barn, 0.12, WALL_H, 0.12, white, cx * (W / 2 - 0.04), WALL_H / 2, cz * (D / 2 - 0.04));
  }
  _farmBox(barn, W + 0.04, 0.1, 0.06, white, 0, WALL_H, D / 2 + 0.02);

  // Big double doors with white frames and X braces.
  const front = D / 2 + 0.03;
  for (const side of [-1, 1]) {
    const door = new THREE.Group();
    door.position.set(side * 0.46, 0.95, front);
    barn.add(door);
    _farmBox(door, 0.9, 1.8, 0.05, redDark, 0, 0, 0);
    _farmBox(door, 0.9, 0.08, 0.06, white, 0, 0.86, 0.01);
    _farmBox(door, 0.9, 0.08, 0.06, white, 0, -0.86, 0.01);
    _farmBox(door, 0.08, 1.8, 0.06, white, side * 0.41, 0, 0.01);
    const diag = Math.hypot(0.8, 1.7);
    const angle = Math.atan2(1.7, 0.8);
    _farmBox(door, diag, 0.07, 0.04, white, 0, 0, 0.03, 0, angle);
    _farmBox(door, diag, 0.07, 0.04, white, 0, 0, 0.03, 0, -angle);
  }

  // Hayloft door in the gable, open with hay showing.
  _farmBox(barn, 0.9, 0.75, 0.04, dark, 0, WALL_H + 0.45, front);
  _farmBox(barn, 1.0, 0.08, 0.05, white, 0, WALL_H + 0.86, front + 0.01);
  _farmBox(barn, 0.08, 0.8, 0.05, white, -0.47, WALL_H + 0.45, front + 0.01);
  _farmBox(barn, 0.08, 0.8, 0.05, white, 0.47, WALL_H + 0.45, front + 0.01);
  _farmBox(barn, 0.7, 0.25, 0.2, hay, 0, WALL_H + 0.2, front);
}

/**
 * Holstein-style cow. Grazes (lowers its head) on a slow cycle and swishes
 * its tail. `phase` offsets its animation from the other animals.
 */
function _addCow(parent, x, z, rotY, phase) {
  const SCALE = 1.5;
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  grp.scale.setScalar(SCALE);
  parent.add(grp);

  const white = new THREE.MeshLambertMaterial({ color: 0xece6da });
  const black = new THREE.MeshLambertMaterial({ color: 0x241a14 });
  const pink = new THREE.MeshLambertMaterial({ color: 0xd99a8e });
  const horn = new THREE.MeshLambertMaterial({ color: 0xe8dcb8 });
  const hoof = new THREE.MeshLambertMaterial({ color: 0x1a1208 });

  // Body, patches (slightly proud of the surface), and udder.
  _farmBox(grp, 0.62, 0.56, 1.1, white, 0, 0.8, 0);
  _farmBox(grp, 0.02, 0.3, 0.4, black, 0.32, 0.86, 0.2);
  _farmBox(grp, 0.02, 0.24, 0.3, black, -0.32, 0.78, -0.25);
  _farmBox(grp, 0.02, 0.2, 0.26, black, 0.32, 0.72, -0.3);
  _farmBox(grp, 0.34, 0.02, 0.36, black, -0.08, 1.09, -0.15);
  _farmBox(grp, 0.3, 0.2, 0.02, black, 0.1, 0.9, 0.56);
  _farmBox(grp, 0.26, 0.12, 0.26, pink, 0, 0.47, -0.28);

  // Legs and hooves.
  for (const [lx, lz] of [[-0.2, -0.42], [0.2, -0.42], [-0.2, 0.38], [0.2, 0.38]]) {
    _farmBox(grp, 0.14, 0.52, 0.14, white, lx, 0.27, lz);
    _farmBox(grp, 0.15, 0.08, 0.15, hoof, lx, 0.04, lz);
  }

  // Head on a neck pivot so it can dip to graze.
  const neck = new THREE.Group();
  neck.position.set(0, 0.92, 0.5);
  grp.add(neck);
  _farmBox(neck, 0.3, 0.3, 0.3, white, 0, 0, 0.1);
  _farmBox(neck, 0.32, 0.32, 0.36, white, 0, 0.04, 0.32);
  _farmBox(neck, 0.18, 0.16, 0.02, black, 0.06, 0.12, 0.51); // face patch
  _farmBox(neck, 0.28, 0.18, 0.14, pink, 0, -0.06, 0.54); // muzzle
  for (const side of [-1, 1]) {
    _farmBox(neck, 0.05, 0.05, 0.02, black, side * 0.08, -0.05, 0.615); // nostrils
    _farmBox(neck, 0.05, 0.05, 0.02, black, side * 0.12, 0.1, 0.505); // eyes
    _farmBox(neck, 0.16, 0.06, 0.1, white, side * 0.23, 0.12, 0.26); // ears
    _farmBox(neck, 0.05, 0.12, 0.05, horn, side * 0.12, 0.24, 0.26, 0, -side * 0.35); // horns
  }

  // Tail with a dark tuft, pivoting from the rump.
  const tail = new THREE.Group();
  tail.position.set(0, 1.0, -0.56);
  grp.add(tail);
  _farmBox(tail, 0.05, 0.5, 0.05, white, 0, -0.25, -0.02);
  _farmBox(tail, 0.09, 0.14, 0.09, black, 0, -0.52, -0.02);

  _animators.push((delta, time) => {
    const t = time + phase * 3;
    // Head spends roughly half its time down grazing, easing between poses.
    const graze = THREE.MathUtils.smoothstep(Math.sin(t * 0.35), -0.2, 0.4);
    neck.rotation.x = graze * 0.95 + Math.sin(t * 5) * 0.03 * graze; // small chewing nod
    tail.rotation.z = Math.sin(t * 1.7) * 0.35;
    tail.rotation.x = 0.15 + Math.sin(t * 0.9) * 0.08;
  });
}

/** Saddled horse that idly bobs its head, grazes now and then, and swishes its tail. */
function _addHorse(parent, x, z, rotY, coatColor = 0x7a4a26, phase = 0) {
  const SCALE = 1.45;
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;
  grp.scale.setScalar(SCALE);
  parent.add(grp);

  const coat = new THREE.MeshLambertMaterial({ color: coatColor });
  const mane = new THREE.MeshLambertMaterial({ color: 0x2a1c10 });
  const muzzle = new THREE.MeshLambertMaterial({ color: 0x4a2c16 });
  const sock = new THREE.MeshLambertMaterial({ color: 0xe8e0d0 });
  const hoof = new THREE.MeshLambertMaterial({ color: 0x1a1208 });
  const leather = new THREE.MeshLambertMaterial({ color: 0x5a3416 });
  const blanket = new THREE.MeshLambertMaterial({ color: 0xa3302a });

  _farmBox(grp, 0.52, 0.56, 1.25, coat, 0, 1.12, 0); // barrel
  _farmBox(grp, 0.5, 0.5, 0.3, coat, 0, 1.16, 0.6); // chest
  _farmBox(grp, 0.5, 0.5, 0.3, coat, 0, 1.18, -0.56); // haunch

  // Legs: white socks on the front pair (the brown horse only).
  const hasSocks = coatColor === 0x7a4a26;
  for (const [lx, lz, front] of [[-0.16, -0.5, false], [0.16, -0.5, false], [-0.16, 0.5, true], [0.16, 0.5, true]]) {
    const socked = front && hasSocks;
    _farmBox(grp, 0.13, 0.62, 0.13, coat, lx, 0.56, lz);
    _farmBox(grp, 0.12, 0.22, 0.12, socked ? sock : coat, lx, 0.17, lz);
    _farmBox(grp, 0.14, 0.07, 0.14, hoof, lx, 0.035, lz);
  }

  // Saddle blanket, saddle, horn, and stirrups.
  _farmBox(grp, 0.62, 0.04, 0.6, blanket, 0, 1.41, 0.05);
  _farmBox(grp, 0.44, 0.12, 0.46, leather, 0, 1.48, 0.05);
  _farmBox(grp, 0.4, 0.14, 0.08, leather, 0, 1.56, -0.17); // cantle
  _farmBox(grp, 0.08, 0.16, 0.08, leather, 0, 1.6, 0.26); // horn
  for (const side of [-1, 1]) {
    _farmBox(grp, 0.03, 0.42, 0.06, leather, side * 0.3, 1.2, 0.05);
    _farmBox(grp, 0.12, 0.04, 0.1, leather, side * 0.3, 0.98, 0.05);
  }

  // Neck + head on a pivot at the withers.
  const neck = new THREE.Group();
  neck.position.set(0, 1.3, 0.62);
  grp.add(neck);
  _farmBox(neck, 0.26, 0.7, 0.32, coat, 0, 0.26, 0.14, -0.55);
  _farmBox(neck, 0.07, 0.66, 0.12, mane, 0, 0.32, 0.0, -0.55); // mane
  const head = new THREE.Group();
  head.position.set(0, 0.58, 0.36);
  head.rotation.x = 0.55; // head angled down from the neck
  neck.add(head);
  _farmBox(head, 0.24, 0.26, 0.42, coat, 0, 0, 0.12);
  _farmBox(head, 0.2, 0.2, 0.18, muzzle, 0, -0.03, 0.4);
  _farmBox(head, 0.1, 0.1, 0.08, mane, 0, 0.12, -0.02); // forelock
  for (const side of [-1, 1]) {
    _farmBox(head, 0.06, 0.16, 0.05, coat, side * 0.08, 0.2, -0.04); // ears
    _farmBox(head, 0.02, 0.05, 0.05, mane, side * 0.125, 0.06, 0.12); // eyes
  }

  const tail = new THREE.Group();
  tail.position.set(0, 1.32, -0.7);
  grp.add(tail);
  _farmBox(tail, 0.13, 0.75, 0.12, mane, 0, -0.34, -0.1, 0.25);

  _animators.push((delta, time) => {
    const t = time + phase;
    const graze = THREE.MathUtils.smoothstep(Math.sin(t * 0.22 + 1.5), 0.3, 0.8);
    neck.rotation.x = Math.sin(t * 1.3) * 0.05 + graze * 0.9;
    tail.rotation.z = Math.sin(t * 2.1) * 0.25;
  });
}

/**
 * Chicken that wanders to random spots inside `area` (farm-local coords),
 * then pecks at the ground for a moment before picking a new spot.
 */
function _addChicken(parent, x, z, color, area, seed) {
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);
  parent.add(grp);

  const body = new THREE.MeshLambertMaterial({ color });
  const wing = new THREE.MeshLambertMaterial({ color: new THREE.Color(color).multiplyScalar(0.82) });
  const red = new THREE.MeshLambertMaterial({ color: 0xc42a1e });
  const yellow = new THREE.MeshLambertMaterial({ color: 0xe8a62a });

  const torso = new THREE.Group(); // bobs while walking
  grp.add(torso);
  _farmBox(torso, 0.3, 0.28, 0.4, body, 0, 0.36, 0);
  _farmBox(torso, 0.22, 0.24, 0.12, body, 0, 0.5, -0.22, -0.5); // tail feathers
  for (const side of [-1, 1]) _farmBox(torso, 0.04, 0.2, 0.28, wing, side * 0.16, 0.37, -0.02);
  for (const side of [-1, 1]) _farmBox(grp, 0.04, 0.22, 0.04, yellow, side * 0.07, 0.11, 0.02); // legs

  const head = new THREE.Group();
  head.position.set(0, 0.46, 0.16);
  torso.add(head);
  _farmBox(head, 0.16, 0.18, 0.16, body, 0, 0.1, 0.04);
  _farmBox(head, 0.04, 0.08, 0.13, red, 0, 0.22, 0.04); // comb
  _farmBox(head, 0.05, 0.07, 0.03, red, 0, 0.0, 0.13); // wattle
  _farmBox(head, 0.06, 0.05, 0.08, yellow, 0, 0.08, 0.15); // beak

  const SPEED = 0.9;
  const target = new THREE.Vector2(x, z);
  let pecking = 1 + seed * 0.7; // seconds left to peck before wandering
  let walkPhase = seed;

  const pickTarget = () => {
    target.set(
      THREE.MathUtils.lerp(area.minX, area.maxX, Math.random()),
      THREE.MathUtils.lerp(area.minZ, area.maxZ, Math.random())
    );
  };

  _animators.push((delta, time) => {
    if (pecking > 0) {
      pecking -= delta;
      head.rotation.x = Math.max(0, Math.sin(time * 9 + seed)) * 1.1; // quick pecks
      torso.position.y = 0;
      if (pecking <= 0) pickTarget();
      return;
    }
    const dx = target.x - grp.position.x, dz = target.y - grp.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.05) {
      pecking = 1.5 + Math.random() * 2.5;
      return;
    }
    const step = Math.min(dist, SPEED * delta);
    grp.position.x += (dx / dist) * step;
    grp.position.z += (dz / dist) * step;
    grp.rotation.y = Math.atan2(dx, dz);
    walkPhase += delta * 14;
    torso.position.y = Math.abs(Math.sin(walkPhase)) * 0.04;
    head.rotation.x = Math.sin(walkPhase) * 0.15; // head bob
  });
}

// ── Pond ──────────────────────────────────────────────────────────────────────
/**
 * Pond on the open ground south of Main Street (road edge at z=3), west of
 * the T-Rex plaza at (0,18) and east of the west side road (x <= -20); its
 * bank spans roughly x -18.6..-2.4, z 11.3..22.7. Flat water decals with
 * rocks, cattails, lily pads, a small dock, ripples, and ducks paddling in
 * slow loops.
 */
function _addPond(scene) {
  const grp = new THREE.Group();
  grp.position.set(-10.5, 0, 17);
  scene.add(grp);

  const RX = 6.9, RZ = 4.8; // water half-extents
  const S = RX / 4.6; // decoration scale relative to the original 4.6 × 3.2 pond

  // Irregular blob outline: an ellipse with a few fixed sine wobbles, so the
  // shoreline looks natural but is identical on every load.
  const outline = (scale) => {
    const shape = new THREE.Shape();
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const wobble = 1 + 0.07 * Math.sin(a * 3 + 0.6) + 0.05 * Math.sin(a * 5 + 2.1);
      const px = Math.cos(a) * RX * scale * wobble;
      const pz = Math.sin(a) * RZ * scale * wobble;
      if (i === 0) shape.moveTo(px, pz); else shape.lineTo(px, pz);
    }
    return shape;
  };
  // ShapeGeometry lies in XY; rotating -90° about X puts it on the ground with
  // shape-Y mapped to world -Z (mirrored, which doesn't matter for a blob).
  const layer = (scale, mat, y) => {
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(outline(scale), 1), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = y;
    mesh.receiveShadow = true;
    grp.add(mesh);
    return mesh;
  };
  layer(1.18, new THREE.MeshLambertMaterial({ color: 0x7a5a38 }), 0.025); // muddy bank
  layer(1.0, new THREE.MeshPhongMaterial({ color: 0x3f8496, shininess: 90, specular: 0x9ad0dc }), 0.045);
  layer(0.6, new THREE.MeshPhongMaterial({ color: 0x2c6474, shininess: 90, specular: 0x9ad0dc }), 0.05); // deeper middle

  // Rocks around the bank.
  const rockMats = [0x7a6e60, 0x6a5e52, 0x8a7c6e].map((c) => new THREE.MeshLambertMaterial({ color: c }));
  const rockGeo = new THREE.SphereGeometry(1, 7, 5);
  [[0.3, 0.42], [1.1, 0.3], [1.9, 0.5], [2.6, 0.26], [3.4, 0.38], [4.3, 0.3], [5.0, 0.46], [5.8, 0.28]]
    .forEach(([a, r], i) => {
      const rock = new THREE.Mesh(rockGeo, rockMats[i % 3]);
      rock.position.set(Math.cos(a) * RX * 1.12, r * S * 0.35, Math.sin(a) * RZ * 1.12);
      rock.scale.set(r * 1.3 * S, r * S, r * 1.1 * S);
      rock.rotation.y = i * 1.7;
      rock.castShadow = true;
      rock.receiveShadow = true;
      grp.add(rock);
    });

  // Cattail clumps on the bank; each clump sways gently as a unit.
  const stemMat = new THREE.MeshLambertMaterial({ color: 0x5a7a3a });
  const headMat = new THREE.MeshLambertMaterial({ color: 0x6a3e1e });
  const reeds = [];
  [[2.55, 0], [3.0, 1], [5.4, 2]].forEach(([a, seed]) => {
    const clump = new THREE.Group();
    clump.position.set(Math.cos(a) * RX * 0.95, 0, Math.sin(a) * RZ * 0.95);
    grp.add(clump);
    for (let i = 0; i < 9; i++) {
      const ox = Math.sin(i * 2.3 + seed) * 0.4 * S, oz = Math.cos(i * 1.7 + seed) * 0.3 * S;
      const h = 1.1 + ((i * 37 + seed * 11) % 10) * 0.06;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, h, 5), stemMat);
      stem.position.set(ox, h / 2, oz);
      stem.rotation.z = Math.sin(i * 3.1 + seed) * 0.12;
      stem.castShadow = true;
      clump.add(stem);
      if (i % 2 === 0) {
        const head = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.26, 6), headMat);
        head.position.set(ox + Math.sin(stem.rotation.z) * -h * 0.45, h * 0.92, oz);
        clump.add(head);
      }
    }
    reeds.push({ clump, phase: seed * 1.9 });
  });

  // Lily pads (a circle with a wedge notch) and a couple of pink flowers.
  const padMat = new THREE.MeshLambertMaterial({ color: 0x4f8a3a, side: THREE.DoubleSide });
  const flowerMat = new THREE.MeshLambertMaterial({ color: 0xf2a6c0 });
  [[-2.2, 1.0, 0.32, true], [-1.6, 1.6, 0.26, false], [-2.8, 0.2, 0.22, false], [1.8, -1.4, 0.3, true], [2.5, -0.8, 0.24, false]]
    .forEach(([px, pz, r, flower], i) => {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(r * S, 14, 0.3, Math.PI * 2 - 0.6), padMat);
      pad.rotation.set(-Math.PI / 2, 0, i * 1.3);
      pad.position.set(px * S, 0.065, pz * S);
      grp.add(pad);
      if (flower) {
        const bloom = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.14, 6), flowerMat);
        bloom.position.set(px * S, 0.12, pz * S);
        grp.add(bloom);
      }
    });

  // Small dock jutting in from the town-facing (+Z) bank.
  const plankMat = new THREE.MeshLambertMaterial({ color: 0x8a6a43 });
  const postMat = new THREE.MeshLambertMaterial({ color: 0x4a3018 });
  // Dock on the south (+Z) bank, nearest the camera, reaching into the water
  // but ending short of the ducks' widest loop.
  const DOCK_X = 2.1, DOCK_START = RZ * 1.2, DOCK_LEN = 2.8;
  for (let i = 0; i < 7; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.36), plankMat);
    plank.position.set(DOCK_X, 0.32, DOCK_START - 0.2 - i * 0.4);
    plank.castShadow = true;
    plank.receiveShadow = true;
    grp.add(plank);
  }
  for (const dx of [-0.58, 0.58]) {
    for (const dz of [0, -DOCK_LEN + 0.2]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), postMat);
      post.position.set(DOCK_X + dx, 0.22, DOCK_START - 0.2 + dz);
      post.castShadow = true;
      grp.add(post);
    }
  }

  // Ducks paddling slow loops; each leaves a ripple ring now and then.
  const duckBody = new THREE.MeshLambertMaterial({ color: 0x8a6a4a });
  const duckHeadMat = new THREE.MeshLambertMaterial({ color: 0x2f6a3a }); // mallard green
  const beakMat = new THREE.MeshLambertMaterial({ color: 0xe8a62a });
  const ducks = [[0.0, 0.5, 0], [Math.PI, 0.38, 1], [2.0, 0.55, 2], [4.2, 0.3, 3]].map(([start, loop, i]) => {
    const duck = new THREE.Group();
    grp.add(duck);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.4), duckBody);
    body.position.y = 0.12;
    duck.add(body);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.12), duckBody);
    tail.position.set(0, 0.2, -0.22);
    tail.rotation.x = -0.5;
    duck.add(tail);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.15, 0.15), i === 1 ? duckBody : duckHeadMat);
    head.position.set(0, 0.3, 0.17);
    duck.add(head);
    const beak = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.1), beakMat);
    beak.position.set(0, 0.28, 0.29);
    duck.add(beak);
    for (const m of duck.children) m.castShadow = true;
    return { duck, angle: start, loop, speed: 0.12 + i * 0.03, dir: i === 1 ? -1 : 1, i };
  });

  // Pooled ripple rings.
  const ringGeo = new THREE.RingGeometry(0.85, 1, 24);
  const ripples = Array.from({ length: 6 }, () => {
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color: 0xd8f0f4, transparent: true, opacity: 0, depthWrite: false,
    }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.07;
    ring.visible = false;
    grp.add(ring);
    return { ring, age: 0 };
  });
  let nextRipple = 0, rippleTimer = 0;

  _animators.push((delta, time) => {
    for (const { clump, phase } of reeds) clump.rotation.z = Math.sin(time * 1.1 + phase) * 0.05;

    for (const d of ducks) {
      d.angle += d.dir * d.speed * delta;
      const x = Math.cos(d.angle) * RX * d.loop, z = Math.sin(d.angle) * RZ * d.loop;
      // Face along the direction of travel (the loop's tangent).
      const tx = -Math.sin(d.angle) * RX * d.dir, tz = Math.cos(d.angle) * RZ * d.dir;
      d.duck.position.set(x, Math.sin(time * 2.4 + d.i) * 0.015, z);
      d.duck.rotation.y = Math.atan2(tx, tz);
    }

    rippleTimer += delta;
    if (rippleTimer > 1.1) {
      rippleTimer = 0;
      const src = ducks[nextRipple % ducks.length].duck.position;
      const r = ripples[nextRipple % ripples.length];
      r.ring.position.x = src.x;
      r.ring.position.z = src.z;
      r.age = 0;
      r.ring.visible = true;
      nextRipple++;
    }
    for (const r of ripples) {
      if (!r.ring.visible) continue;
      r.age += delta;
      const t = r.age / 2.2;
      if (t >= 1) { r.ring.visible = false; continue; }
      r.ring.scale.setScalar(0.2 + t * 0.9);
      r.ring.material.opacity = 0.45 * (1 - t);
    }
  });
}

/** Called each frame from the game loop to animate props. */
export function updateProps(delta) {
  // Gas-lamp flicker: two out-of-phase sines per lamp give a gentle,
  // irregular waver rather than an obvious pulse.
  _lampTime += delta;
  for (const lamp of _lamps) {
    const t = _lampTime + lamp.phase;
    const flicker = 0.9 + 0.06 * Math.sin(t * 7.3) + 0.04 * Math.sin(t * 13.1);
    lamp.light.intensity = lamp.baseIntensity * flicker;
  }
  if (_lampHaloMat) _lampHaloMat.opacity = 0.5 + 0.05 * Math.sin(_lampTime * 9.7);

  _updateTrain(delta);
  _updateSmoke(delta);

  _animTime += delta;
  for (const animate of _animators) animate(delta, _animTime);

  if (!_tumbleweed) return;
  _tumbleweed.position.addScaledVector(_tumbleVel, delta * 60);
  _tumbleweed.rotation.x += delta * 1.2;
  _tumbleweed.rotation.z += delta * 0.8;
  // wrap around
  if (_tumbleweed.position.x > 50) _tumbleweed.position.x = -50;
}
