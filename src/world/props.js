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
  _addAnimalFarm(scene);
}

function _addCacti(scene) {
  const positions = [
    [-50, -40], [-48, 20], [-45, 35], [50, -35], [48, 15], [44, 40],
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
    [-27, 9], [-27, 6], [27, 9], [27, 6], [-9, -22], [9, -22],
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
  positions.forEach(([x, z]) => {
    // pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 5, 8),
      new THREE.MeshLambertMaterial({ color: 0x3a2010 })
    );
    pole.position.set(x, 2.5, z);
    scene.add(pole);

    // warm point light
    const light = new THREE.PointLight(0xffaa55, 1.2, 18);
    light.position.set(x, 5.2, z);
    scene.add(light);

    // lamp globe
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffcc88 })
    );
    globe.position.set(x, 5.1, z);
    scene.add(globe);
  });
}

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
  // Parked north of the main road (which spans z in [-3,3]), near the east
  // side street. z was 5 before, but the truck's own length plus its yaw
  // meant the tailgate corner actually landed at z~1.7 — inside the road.
  grp.position.set(14, 0, 7);
  grp.rotation.y = Math.PI * 0.08; // slightly angled, like it's been sitting there a while

  const body    = new THREE.MeshLambertMaterial({ color: 0x7a3218 }); // rusty red-brown
  const rust    = new THREE.MeshLambertMaterial({ color: 0x4e1f0c }); // darker rust patches
  const glass   = new THREE.MeshLambertMaterial({ color: 0x2a3530, transparent: true, opacity: 0.6 });
  const rubber  = new THREE.MeshLambertMaterial({ color: 0x161616 });
  const hub     = new THREE.MeshLambertMaterial({ color: 0x3a3530 });
  const chrome  = new THREE.MeshLambertMaterial({ color: 0x5a5040 }); // tarnished chrome

  function bx(w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    m.receiveShadow = true;
    grp.add(m);
    return m;
  }

  // Local +Z is the front (hood/grille); -Z is the rear (tailgate).
  const WIDTH = 2.0;
  const WHEEL_R = 0.46;
  // Wheel center sits exactly one radius above the ground, so the tire
  // actually touches down instead of floating or sinking in.
  const AXLE_Y = WHEEL_R;
  // Body/bed/cab underside clears the wheel's top with a visible gap. The
  // previous version put this only ~0.05 above the axle center, so almost
  // half of every wheel's height was buried inside the cab and bed walls —
  // that overlap, not the proportions, was the main reason this read as an
  // amorphous blob rather than a truck.
  const BODY_Y = AXLE_Y + WHEEL_R + 0.08;

  // ── Bed (rear) — floor + four low walls, genuinely open on top instead of
  // a solid box, so it actually reads as a cargo bed and not a second cabin.
  const bedW = WIDTH + 0.15, bedLen = 2.6, bedCenterZ = -1.75;
  const bedFloorH = 0.12, bedFloorY = BODY_Y + bedFloorH / 2;
  const wallH = 0.4, wallY = BODY_Y + bedFloorH + wallH / 2;
  const wallT = 0.09;
  bx(bedW, bedFloorH, bedLen, rust, 0, bedFloorY, bedCenterZ); // floor
  bx(wallT, wallH, bedLen, body, -bedW / 2 + wallT / 2, wallY, bedCenterZ); // left wall
  bx(wallT, wallH, bedLen, body,  bedW / 2 - wallT / 2, wallY, bedCenterZ); // right wall
  bx(bedW, wallH, wallT, body, 0, wallY, bedCenterZ + bedLen / 2); // front (cab-side) wall
  bx(bedW, wallH, wallT, rust, 0, wallY, bedCenterZ - bedLen / 2); // tailgate
  // Rust streaks down the bed sides
  bx(0.05, 0.3, 0.05, rust, -bedW / 2, wallY - 0.35, bedCenterZ + 0.6);
  bx(0.05, 0.25, 0.05, rust, bedW / 2, wallY - 0.3, bedCenterZ - 0.4);

  // ── Cab (center) — sits on the same chassis line as the bed, clearly
  // taller than the bed walls without towering over the truck.
  const cabZ = 0.35;
  const cabBodyH = 0.95, cabBodyY = BODY_Y + cabBodyH / 2;
  bx(WIDTH, cabBodyH, 1.3, body, 0, cabBodyY, cabZ); // lower cab body
  const roofH = 0.42, roofY = cabBodyY + cabBodyH / 2 + roofH / 2;
  bx(WIDTH - 0.15, roofH, 1.05, body, 0, roofY, cabZ - 0.05); // cabin roof, set in slightly
  bx(0.05, 0.3, 0.4, rust, -WIDTH / 2, cabBodyY, cabZ - 0.3);
  bx(0.05, 0.2, 0.3, rust,  WIDTH / 2, cabBodyY + 0.2, cabZ + 0.2);

  const cabTop = cabBodyY + cabBodyH / 2;
  // Windshield (front-facing, slightly raked)
  bx(WIDTH - 0.2, roofH - 0.08, 0.06, glass, 0, cabTop + roofH / 2, cabZ + 0.68, -0.15);
  // Rear window (facing the bed)
  bx(WIDTH - 0.35, roofH - 0.14, 0.06, glass, 0, cabTop + roofH / 2, cabZ - 0.6, 0.1);
  // Side windows
  bx(0.05, roofH - 0.1, 0.6, glass, -WIDTH / 2 + 0.02, cabTop + roofH / 2, cabZ);
  bx(0.05, roofH - 0.1, 0.6, glass,  WIDTH / 2 - 0.02, cabTop + roofH / 2, cabZ);
  // Door seam + handle hint
  bx(0.03, cabBodyH * 0.7, 0.02, rust, -WIDTH / 2 - 0.01, cabBodyY, cabZ);
  bx(0.03, cabBodyH * 0.7, 0.02, rust,  WIDTH / 2 + 0.01, cabBodyY, cabZ);

  // ── Hood + front end ────────────────────────────────────────────────────────
  // Shortened from the old hoodLen=1.3, which pushed the grille/bumper more
  // than a full unit past the cab's own front face — a front overhang
  // longer than the wheelbase itself. Combined with a bumper mounted down
  // near axle height while the grille sat up near BODY_Y, that left a big
  // empty gap between them with nothing connecting them, which is what
  // rendered as an isolated flat "plank" floating out ahead of the truck.
  const hoodZ = cabZ + 0.75, hoodLen = 0.7;
  bx(WIDTH - 0.1, 0.16, hoodLen, body, 0, cabTop - 0.06, hoodZ); // flat hood panel
  bx(WIDTH - 0.15, cabBodyH - 0.1, 0.08, rust, 0, cabBodyY - 0.02, hoodZ + hoodLen / 2 - 0.05); // firewall shadow gap

  const frontZ = hoodZ + hoodLen / 2 + 0.1;
  const grilleH = cabBodyH * 0.85;
  bx(WIDTH, grilleH, 0.16, body, 0, BODY_Y + grilleH / 2, frontZ); // grille panel
  bx(WIDTH, 0.22, 0.18, chrome, 0, BODY_Y - 0.03, frontZ - 0.02); // front bumper, mounted flush under the grille
  for (let i = 0; i < 3; i++) {
    bx(WIDTH - 0.3, 0.06, 0.06, rust, 0, BODY_Y + 0.3 + i * 0.18, frontZ + 0.1);
  }
  bx(0.4, 0.3, 0.1, chrome,  0.72, BODY_Y + 0.5, frontZ + 0.09);
  bx(0.4, 0.3, 0.1, chrome, -0.72, BODY_Y + 0.5, frontZ + 0.09);

  // ── Exhaust pipe (driver side, below the cab) ────────────────────────────────
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 8), chrome);
  pipe.rotation.z = Math.PI / 2;
  pipe.position.set(-WIDTH / 2 - 0.05, AXLE_Y - 0.15, cabZ - 0.3);
  pipe.castShadow = true;
  grp.add(pipe);

  // ── Wheels ──────────────────────────────────────────────────────────────────
  const wheelX = WIDTH / 2 - 0.05;
  const wheelPositions = [
    [-wheelX, AXLE_Y, hoodZ - hoodLen / 2 + 0.1],  // front-left
    [ wheelX, AXLE_Y, hoodZ - hoodLen / 2 + 0.1],  // front-right
    [-wheelX, AXLE_Y, bedCenterZ + 0.5],           // rear-left (flat, see below)
    [ wheelX, AXLE_Y, bedCenterZ + 0.5],           // rear-right
  ];
  wheelPositions.forEach(([x, y, z], i) => {
    const isFlatRear = i === 2; // driver-side rear tyre sags, like it's been sitting a while
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.34, 14), rubber);
    // Lay the cylinder on its side so its axis runs along X (the axle) —
    // this alone is enough for a normal wheel. The old "flat tire" branch
    // additionally rotated about X then Z, which doesn't just tilt the
    // tire: composing those two rotations reorients the whole shape so its
    // footprint balloons to roughly double the wheel radius in both width
    // and height and dips well below the ground — that oversized, sunken
    // blob is what was rendering as a long plank under the truck.
    tire.rotation.z = Math.PI / 2;
    if (isFlatRear) {
      const squash = 0.6; // vertical squash for a deflated look
      // Object3D applies scale in local space BEFORE rotation, so it's the
      // cylinder's local X (its radius axis) that becomes vertical once the
      // Z rotation above is applied — scaling Y here (the cylinder's local
      // height/thickness axis, which maps to vehicle-width) was the exact
      // bug that left the "flat" tire's actual height untouched.
      tire.scale.x = squash;
      tire.position.set(x, WHEEL_R * squash, z); // keep the flattened tire's bottom on the ground
    } else {
      tire.position.set(x, y, z);
    }
    tire.castShadow = true;
    grp.add(tire);

    if (!isFlatRear) {
      const hubcap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.36, 10), hub);
      hubcap.rotation.z = Math.PI / 2;
      hubcap.position.set(x, y, z);
      grp.add(hubcap);
    }
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
  grp.position.set(-10, 0, -28);
  grp.rotation.y = 0.3;

  const wood = new THREE.MeshLambertMaterial({ color: 0x6b4a2f });
  const trim = new THREE.MeshLambertMaterial({ color: 0x3a2410 });
  const canvasMat = new THREE.MeshLambertMaterial({ color: 0xd9c199 });

  const bx = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    grp.add(m);
    return m;
  };

  // Rear wheels are bigger than the front ones, like a real old wagon. Each
  // axle height is set to its OWN wheel radius (touches the ground exactly),
  // and the bed sits above the taller of the two wheel-tops plus a clear
  // gap — the truck earlier this session got this backwards (axle height
  // and body-bottom were nearly the same number) and ended up with wheels
  // half-buried in the body; this bakes the correct relationship in from
  // the start instead of tuning it after the fact.
  const REAR_R = 0.7, FRONT_R = 0.5;
  const REAR_AXLE_Y = REAR_R, FRONT_AXLE_Y = FRONT_R;
  const BED_BOTTOM_Y = Math.max(REAR_AXLE_Y + REAR_R, FRONT_AXLE_Y + FRONT_R) + 0.1;

  const BED_W = 2.2, BED_L = 4.4;

  // Bed floor + side rails
  bx(BED_W, 0.15, BED_L, wood, 0, BED_BOTTOM_Y + 0.075, 0);
  const railH = 0.35, railY = BED_BOTTOM_Y + 0.15 + railH / 2;
  bx(0.08, railH, BED_L, wood, -BED_W / 2 + 0.04, railY, 0);
  bx(0.08, railH, BED_L, wood, BED_W / 2 - 0.04, railY, 0);
  bx(BED_W, railH, 0.08, wood, 0, railY, BED_L / 2 - 0.04);
  bx(BED_W, railH, 0.08, wood, 0, railY, -BED_L / 2 + 0.04);

  // Plank seams for a little texture — cheap detail, matches the boardwalk
  // treatment used on the storefronts.
  for (let i = 0; i < 4; i++) {
    const zpos = -BED_L / 2 + 0.6 + i * (BED_L - 1.2) / 3;
    bx(BED_W - 0.05, 0.03, 0.06, trim, 0, BED_BOTTOM_Y + 0.15 + 0.015, zpos);
  }

  // Canvas canopy — a stretched sphere whose equator sits at the bed's top
  // surface, so only the dome half is ever visible; the lower hemisphere is
  // fully enclosed inside the (opaque) bed and side rails.
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), canvasMat);
  canopy.scale.set(BED_W / 2 * 0.9, 1.2, BED_L / 2 * 0.92);
  canopy.position.set(0, BED_BOTTOM_Y + 0.15, 0);
  canopy.castShadow = true;
  grp.add(canopy);

  // Tongue (hitch pole) sticking out the front
  bx(0.12, 0.12, 1.8, wood, 0, BED_BOTTOM_Y - 0.05, BED_L / 2 + 0.9);

  // Wheels — built in a shared local frame (spin axis = Y, matching a
  // default unrotated cylinder) and rotated once as a whole group, the same
  // proven-safe pattern used for the truck's wheels — no combined multi-axis
  // rotation, which is what caused the truck's earlier "flat tire" bug.
  const buildWheel = (radius) => {
    const wheel = new THREE.Group();
    const thickness = 0.1;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, 16), wood);
    rim.castShadow = true;
    wheel.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.16, radius * 0.16, thickness * 1.4, 10), trim);
    hub.castShadow = true;
    wheel.add(hub);
    const spokeCount = 6;
    for (let i = 0; i < spokeCount; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.05, thickness * 0.85, radius * 1.75), trim);
      spoke.rotation.y = (i / spokeCount) * Math.PI * 2;
      spoke.castShadow = true;
      wheel.add(spoke);
    }
    wheel.rotation.z = Math.PI / 2;
    return wheel;
  };

  const rearZ = -BED_L / 2 + 0.5;
  const frontZ = BED_L / 2 - 0.6;
  [-1, 1].forEach((side) => {
    const wheelX = side * (BED_W / 2 + 0.1);
    const rear = buildWheel(REAR_R);
    rear.position.set(wheelX, REAR_AXLE_Y, rearZ);
    grp.add(rear);
    const front = buildWheel(FRONT_R);
    front.position.set(wheelX, FRONT_AXLE_Y, frontZ);
    grp.add(front);
  });

  scene.add(grp);
}

/**
 * Train tracks running along the far northern edge of town — well clear of
 * the rock formation (centered (-48,38), reaching roughly z<=42) and the
 * northern cacti (z<=40).
 */
function _addTrainTracks(scene) {
  const TRACK_Z = 50;
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

/**
 * Fenced animal corral with a couple of cows and a horse. Placed in the
 * open field south of the district signs/kiosks (which end at z=-21), well
 * clear of the west side road (x in [-24,-20]) and the old wagon just north
 * of it.
 */
function _addAnimalFarm(scene) {
  const CENTER_X = -10, CENTER_Z = -45;
  const HALF_W = 6, HALF_D = 5;
  const POST_H = 1.1;

  const postMat = new THREE.MeshLambertMaterial({ color: 0x4a3018 });
  const railMat = new THREE.MeshLambertMaterial({ color: 0x5c3a21 });

  // Perimeter posts (instanced) — evenly spaced along each straight,
  // axis-aligned edge; corners are shared between adjacent edges and
  // de-duplicated below.
  const postPositions = [];
  const addEdgePosts = (x1, z1, x2, z2, spacing) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const count = Math.max(2, Math.round(len / spacing) + 1);
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      postPositions.push([x1 + (x2 - x1) * t, z1 + (z2 - z1) * t]);
    }
  };
  addEdgePosts(-HALF_W, -HALF_D, HALF_W, -HALF_D, 2.4); // south
  addEdgePosts(HALF_W, -HALF_D, HALF_W, HALF_D, 2.4);   // east
  addEdgePosts(HALF_W, HALF_D, -HALF_W, HALF_D, 2.4);   // north
  addEdgePosts(-HALF_W, HALF_D, -HALF_W, -HALF_D, 2.4); // west

  const uniquePosts = [];
  postPositions.forEach(([px, pz]) => {
    const dup = uniquePosts.some(([qx, qz]) => Math.abs(px - qx) < 0.05 && Math.abs(pz - qz) < 0.05);
    if (!dup) uniquePosts.push([px, pz]);
  });

  const postGeo = new THREE.BoxGeometry(0.14, POST_H, 0.14);
  const postMesh = new THREE.InstancedMesh(postGeo, postMat, uniquePosts.length);
  postMesh.castShadow = true;
  const m = new THREE.Matrix4();
  uniquePosts.forEach(([lx, lz], i) => {
    m.makeTranslation(CENTER_X + lx, POST_H / 2, CENTER_Z + lz);
    postMesh.setMatrixAt(i, m);
  });
  postMesh.instanceMatrix.needsUpdate = true;
  scene.add(postMesh);

  // Rails: 2 per side, all 4 sides axis-aligned so no rotation math is
  // needed at all.
  const addRailPair = (w, d, x, z) => {
    [0.75, 0.45].forEach((railY) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, d), railMat);
      rail.position.set(CENTER_X + x, railY, CENTER_Z + z);
      rail.castShadow = true;
      scene.add(rail);
    });
  };
  addRailPair(HALF_W * 2 + 0.1, 0.07, 0, -HALF_D);
  addRailPair(HALF_W * 2 + 0.1, 0.07, 0, HALF_D);
  addRailPair(0.07, HALF_D * 2 + 0.1, -HALF_W, 0);
  addRailPair(0.07, HALF_D * 2 + 0.1, HALF_W, 0);

  _addCow(scene, CENTER_X - 2, CENTER_Z - 1, 0.3);
  _addCow(scene, CENTER_X + 2.5, CENTER_Z + 1.5, -0.6);
  _addHorse(scene, CENTER_X + 0.5, CENTER_Z - 2, 1.2);
}

function _addCow(scene, x, z, rotY) {
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;

  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xe8e0d0 });
  const patchMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
  const hoofMat = new THREE.MeshLambertMaterial({ color: 0x1a1208 });

  const bx = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    grp.add(m);
    return m;
  };

  bx(0.55, 0.5, 1.0, bodyMat, 0, 0.75, 0);
  bx(0.2, 0.22, 0.3, patchMat, 0.2, 0.85, 0.25);
  bx(0.18, 0.18, 0.25, patchMat, -0.15, 0.7, -0.2);
  bx(0.32, 0.3, 0.34, bodyMat, 0, 0.95, 0.62);
  bx(0.22, 0.16, 0.16, bodyMat, 0, 0.85, 0.82);
  bx(0.14, 0.05, 0.1, bodyMat, 0.2, 1.08, 0.58);
  bx(0.14, 0.05, 0.1, bodyMat, -0.2, 1.08, 0.58);
  [[-0.2, -0.4], [0.2, -0.4], [-0.2, 0.35], [0.2, 0.35]].forEach(([lx, lz]) => {
    bx(0.12, 0.5, 0.12, bodyMat, lx, 0.25, lz);
    bx(0.13, 0.08, 0.13, hoofMat, lx, 0.04, lz);
  });

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), bodyMat);
  tail.rotation.x = 0.5;
  tail.position.set(0, 0.7, -0.55);
  tail.castShadow = true;
  grp.add(tail);

  scene.add(grp);
}

function _addHorse(scene, x, z, rotY) {
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);
  grp.rotation.y = rotY;

  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
  const maneMat = new THREE.MeshLambertMaterial({ color: 0x2a1c10 });
  const hoofMat = new THREE.MeshLambertMaterial({ color: 0x1a1208 });

  const bx = (w, h, d, mat, x, y, z, rx = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    m.castShadow = true;
    m.receiveShadow = true;
    grp.add(m);
    return m;
  };

  bx(0.5, 0.55, 1.2, bodyMat, 0, 1.05, 0);
  bx(0.28, 0.55, 0.28, bodyMat, 0.05, 1.35, 0.65, -0.5);
  bx(0.24, 0.24, 0.42, bodyMat, 0.05, 1.68, 0.95);
  bx(0.08, 0.5, 0.28, maneMat, 0.05, 1.4, 0.55, -0.5);
  bx(0.08, 0.14, 0.06, bodyMat, 0.16, 1.85, 0.85);
  bx(0.08, 0.14, 0.06, bodyMat, -0.06, 1.85, 0.85);
  [[-0.16, -0.5], [0.16, -0.5], [-0.16, 0.45], [0.16, 0.45]].forEach(([lx, lz]) => {
    bx(0.11, 0.75, 0.11, bodyMat, lx, 0.38, lz);
    bx(0.12, 0.08, 0.12, hoofMat, lx, 0.04, lz);
  });
  bx(0.1, 0.55, 0.08, maneMat, 0, 1.0, -0.65, 0.3);

  scene.add(grp);
}

/** Called each frame from the game loop to animate props. */
export function updateProps(delta) {
  if (!_tumbleweed) return;
  _tumbleweed.position.addScaledVector(_tumbleVel, delta * 60);
  _tumbleweed.rotation.x += delta * 1.2;
  _tumbleweed.rotation.z += delta * 0.8;
  // wrap around
  if (_tumbleweed.position.x > 50) _tumbleweed.position.x = -50;
}
