import * as THREE from 'three';
import { Building } from './Building.js';
import { createStorefront } from './Storefront.js';
import { addProps } from './props.js';

const GROUND_SIZE = 120;

/**
 * Town — assembles the ground, road grid, district signs, and all buildings.
 * Returns { buildings, districtZones } for use by collision and HUD systems.
 */
export function buildTown(scene) {
  // Ground
  const groundGeo = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0xc8a96e });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Roads
  _addRoad(scene, 0, 0, GROUND_SIZE, 6, true);   // main east-west street
  _addRoad(scene, -22, 0, GROUND_SIZE, 4, false); // left north-south
  _addRoad(scene, 22, 0, GROUND_SIZE, 4, false);  // right north-south

  // District signs: ranch-gate archways over each side road where it meets
  // Main Street, facing the camera (+Z) so they read from the spawn point.
  _addArchSign(scene, -22, -4.6, 'Software Gulch');
  _addArchSign(scene, 22, -4.6, 'Hardware Frontier');

  // Buildings
  // GitHub/LinkedIn/Devpost keep their real brand-logo facades, which the
  // Storefront generator doesn't model, so they stay on the plain Building
  // class. Together with About Me they form one Main Street row between the
  // side roads (x in [-20,20]): the three social booths side by side on the
  // west half, About Me on the east half. Every front (booth roof overhangs,
  // About Me's porch) lines up at z=-5.5, the same line as the storefronts
  // in the other two districts.
  //   booth: 5.5 wide + 1.2 roof overhang = 6.7, at a 7.6 pitch → x from -18.95 to 2.95
  //   About Me: 11.8-wide facade at x=11.5 → x from 5.6 to 17.4
  const BOOTH_Z = -8.5; // depth 5 → body front at -6, roof overhang front at -5.5
  // District sign mounted on the middle booth's roof (height 6 + 0.4 roof),
  // as a header over the row instead of a post blocking the logos.
  _addRoofSign(scene, -8.0, BOOTH_Z + 2.2, 6.4, 'The Telegraph Office');
  const buildingDefs = [
    { position: { x: -15.6, z: BOOTH_Z }, color: 0x0d1117, projectId: 'github', logo: 'github', width: 5.5, depth: 5, height: 6 },
    { position: { x: -8.0, z: BOOTH_Z }, color: 0x0a66c2, projectId: 'linkedin', logo: 'linkedin', width: 5.5, depth: 5, height: 6 },
    { position: { x: -0.4, z: BOOTH_Z }, color: 0x003e53, projectId: 'devpost', logo: 'devpost', width: 5.5, depth: 5, height: 6 },
  ];

  // Project storefronts. Positions are chosen so that at scale 1.55
  // (footprint ~6 half-width, front porch reaching ~7.5 past center) none of
  // them clip the main road (|z|<3), the side roads (x in [-24,-20] or
  // [20,24]), each other, the district sign posts (x=∓30, z=-18), or nearby
  // props. The two Software Gulch buildings west of the side road already
  // use the full available space in that row, so ParticleAI sits on a
  // second row north of the main road instead (front faces away from the
  // road here, but the district zone and interaction still work the same).
  const storefrontDefs = [
    {
      position: { x: -40, z: 10 },
      projectId: 'particleAi',
      name: 'Particle AI',
      width: 7,
      stories: 1,
      parapetStyle: 'curved',
      porchDepth: 2.0,
      postCount: 4,
      sidingType: 'lap',
      woodTint: 0x9c7a52,
      signText: 'Particle AI',
      hasHitchingRail: true,
      scale: 1.55,
    },
    {
      position: { x: 46, z: -12.5 },
      projectId: 'arthAi',
      name: 'ArthAi',
      width: 7,
      stories: 1,
      parapetStyle: 'stepped',
      porchDepth: 2.0,
      postCount: 4,
      sidingType: 'lap',
      woodTint: 0xb8895a,
      signText: 'ArthAi',
      hasHitchingRail: true,
      scale: 1.55,
    },
    {
      position: { x: -46, z: -12.5 },
      projectId: 'pitPerfect',
      name: 'PitPerfect',
      width: 7,
      stories: 1,
      parapetStyle: 'curved',
      porchDepth: 2.0,
      postCount: 4,
      sidingType: 'board-batten',
      woodTint: 0xa07840,
      signText: 'PitPerfect',
      hasHitchingRail: true,
      scale: 1.55,
    },
    {
      position: { x: 31, z: -12.5 },
      projectId: 'assist',
      name: 'Assist',
      width: 7,
      stories: 1,
      parapetStyle: 'flat',
      porchDepth: 2.0,
      postCount: 3,
      sidingType: 'lap',
      woodTint: 0x8b6914,
      signText: 'Assist',
      hasHitchingRail: true,
      scale: 1.55,
    },
    {
      position: { x: -31, z: -12.5 },
      projectId: 'firstStep',
      name: 'FirstStep AI',
      width: 7,
      stories: 1,
      parapetStyle: 'stepped',
      porchDepth: 2.0,
      postCount: 5,
      sidingType: 'lap',
      woodTint: 0x9e7a3a,
      signText: 'FirstStep AI',
      hasHitchingRail: true,
      scale: 1.55,
    },
    // Software Gulch back row, behind FirstStep AI and PitPerfect (whose
    // back walls are at z=-16.4): fronts at z≈-24.5 leave an 8-unit lane
    // between the rows, reached from the west side road.
    {
      position: { x: -31, z: -31.5 },
      projectId: 'arevalosAuto',
      name: "Arevalo's Auto Repair",
      width: 7,
      stories: 1,
      parapetStyle: 'flat',
      porchDepth: 2.0,
      postCount: 4,
      sidingType: 'board-batten',
      woodTint: 0x8a5a3a,
      signText: "Arevalo's Auto",
      hasHitchingRail: false,
      scale: 1.55,
    },
    {
      position: { x: -46, z: -31.5 },
      projectId: 'billSplit',
      name: 'Bill Split',
      width: 7,
      stories: 1,
      parapetStyle: 'stepped',
      porchDepth: 2.0,
      postCount: 4,
      sidingType: 'lap',
      woodTint: 0xa88a5a,
      signText: 'Bill Split',
      hasHitchingRail: true,
      scale: 1.55,
    },
    // South of Main Street beside Particle AI (x -45.9..-34.1), like it
    // facing away from the road: x -56.3..-47.7 at this scale and width.
    {
      position: { x: -52, z: 10 },
      projectId: 'shootySpace',
      name: 'Shooty Space Game',
      width: 6,
      stories: 1,
      parapetStyle: 'curved',
      porchDepth: 2.0,
      postCount: 4,
      sidingType: 'lap',
      woodTint: 0x7a6a8a,
      signText: 'Shooty Space',
      hasHitchingRail: false,
      scale: 1.3,
    },
    // Hardware Frontier back row, mirroring Software Gulch's: behind Assist
    // (back wall at z=-16.4), reached from the east side road.
    {
      position: { x: 31, z: -31.5 },
      projectId: 'brainBuddy',
      name: 'Brain Buddy',
      width: 7,
      stories: 1,
      parapetStyle: 'curved',
      porchDepth: 2.0,
      postCount: 4,
      sidingType: 'board-batten',
      woodTint: 0xa8786a,
      signText: 'Brain Buddy',
      hasHitchingRail: true,
      scale: 1.55,
    },
    // "About Me" shares the Telegraph Office row with the social booths
    // (see buildingDefs above); at z=-12.5 its porch front lands at z=-5.5
    // like every other storefront on Main Street.
    {
      position: { x: 11.5, z: -12.5 },
      projectId: 'aboutMe',
      name: 'About Me',
      width: 7,
      stories: 1,
      parapetStyle: 'curved',
      porchDepth: 2.0,
      postCount: 4,
      sidingType: 'board-batten',
      woodTint: 0x8b6f47,
      signText: 'About Me',
      hasHitchingRail: true,
      scale: 1.55,
    },
  ];

  const buildings = [
    ...buildingDefs.map((def) => {
      const b = new Building(def);
      b.addTo(scene);
      return b;
    }),
    ...storefrontDefs.map((def) => {
      const b = createStorefront(def);
      b.addTo(scene);
      return b;
    }),
  ];

  addProps(scene);

  // District zones: AABB regions keyed by name
  const districtZones = [
    // The Telegraph Office block runs between the two side roads.
    { name: 'Software Gulch',       minX: -55, maxX: -20, minZ: -55, maxZ: 55 },
    { name: 'Hardware Frontier',    minX: 20,  maxX: 55,  minZ: -55, maxZ: 55 },
    { name: 'The Telegraph Office', minX: -20, maxX: 20,  minZ: -55, maxZ: 0  },
  ];

  return { buildings, districtZones };
}

function _addRoad(scene, cx, cz, length, width, isEW) {
  const geo = isEW
    ? new THREE.PlaneGeometry(length, width)
    : new THREE.PlaneGeometry(width, length);
  const mat = new THREE.MeshLambertMaterial({ color: 0x7a5c3a });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(cx, 0.01, cz);
  scene.add(mesh);
}

const _signWood = new THREE.MeshLambertMaterial({ color: 0x4a2c14 });

/**
 * Sign board: a dark wood frame holding a cream panel with the text painted
 * on both faces, so it reads from either side. Same look as the storefront
 * signs (dark Rye lettering on cream), just much bigger.
 */
function _makeSignBoard(text, width, height) {
  const board = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.36, height + 0.36, 0.22), _signWood);
  frame.castShadow = true;
  board.add(frame);

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = Math.round(1024 * (height / width));
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8; // stays crisp when seen at an angle from the street

  const draw = () => {
    const ctx = canvas.getContext('2d');
    const { width: cw, height: ch } = canvas;
    ctx.fillStyle = '#f0e2b8';
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = '#3a2410';
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, cw - 28, ch - 28);
    // Largest Rye size that fits the panel with some side margin.
    let size = ch * 0.62;
    ctx.font = `${size}px "Rye", serif`;
    const maxW = cw * 0.88;
    const measured = ctx.measureText(text).width;
    if (measured > maxW) {
      size *= maxW / measured;
      ctx.font = `${size}px "Rye", serif`;
    }
    ctx.fillStyle = '#241608';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cw / 2, ch / 2 + size * 0.06);
    tex.needsUpdate = true;
  };
  draw();
  // The Rye webfont usually isn't loaded yet when the town is built, so the
  // first draw falls back to a generic serif — redraw once it arrives.
  document.fonts?.load(`64px "Rye"`).then(draw).catch(() => {});

  // Unlit, so the lettering stays legible whichever way the sun hits it.
  const panelMat = new THREE.MeshBasicMaterial({ map: tex });
  for (const side of [1, -1]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), panelMat);
    panel.position.z = side * 0.115;
    if (side < 0) panel.rotation.y = Math.PI;
    board.add(panel);
  }
  return board;
}

/** Ranch-gate archway over a side road: two posts, a crossbeam, and a hanging sign. */
function _addArchSign(scene, x, z, text) {
  const grp = new THREE.Group();
  grp.position.set(x, 0, z);
  scene.add(grp);

  const SPAN = 5.2; // post to post, just wider than the 4-unit side road
  const POST_H = 7.2;
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, POST_H, 0.4), _signWood);
    post.position.set(side * SPAN / 2, POST_H / 2, 0);
    post.castShadow = true;
    grp.add(post);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(SPAN + 1.0, 0.4, 0.5), _signWood);
  beam.position.y = POST_H - 0.2;
  beam.castShadow = true;
  grp.add(beam);

  // Board hangs from the beam on two short chains/rods, high enough that
  // the cowboy walks under it with room to spare.
  const board = _makeSignBoard(text, 4.8, 1.3);
  board.position.y = POST_H - 1.45;
  grp.add(board);
  for (const side of [-1, 1]) {
    const rod = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), _signWood);
    rod.position.set(side * 1.8, POST_H - 0.55, 0);
    grp.add(rod);
  }
}

/** Sign standing on a roof at height `roofY`, on two short posts. */
function _addRoofSign(scene, x, z, roofY, text) {
  const grp = new THREE.Group();
  grp.position.set(x, roofY, z);
  scene.add(grp);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), _signWood);
    post.position.set(side * 2.2, 0.35, 0);
    grp.add(post);
  }
  const board = _makeSignBoard(text, 5.4, 1.2);
  board.position.y = 0.6 + 0.78;
  grp.add(board);
}
