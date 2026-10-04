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

  // District signs
  _addSign(scene, -30, -18, 'Software Gulch');
  _addSign(scene, 30, -18, 'Hardware Frontier');
  _addSign(scene, 0, -5, 'The Telegraph Office');

  // Buildings
  // GitHub/LinkedIn/Devpost keep their real brand-logo facades, which the
  // Storefront generator doesn't model, so they stay on the plain Building
  // class. Devpost sits in its own row south of the other two — the gap
  // between github's and linkedin's roof overhangs (~4.8 units) is too
  // narrow to fit a third same-sized kiosk at x=0 in that row without
  // clipping both neighbors.
  const buildingDefs = [
    { position: { x: -6, z: -18 },  color: 0x0d1117, projectId: 'github', logo: 'github', width: 6, depth: 5, height: 6 },
    { position: { x: 6, z: -18 },   color: 0x0a66c2, projectId: 'linkedin', logo: 'linkedin', width: 6, depth: 5, height: 6 },
    { position: { x: 0, z: -26 },   color: 0x003e53, projectId: 'devpost', logo: 'devpost', width: 6, depth: 5, height: 6 },
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
    // "About Me" sits further south of the Devpost kiosk (which is itself
    // at (0,-26)) — its own footprint plus porch reaches back toward +Z by
    // roughly 7 units at this scale, so this gives clear separation from
    // Devpost's southern edge (~z=-29) without touching it.
    {
      position: { x: 0, z: -40 },
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
    { name: 'Software Gulch',       minX: -55, maxX: -10, minZ: -55, maxZ: 55 },
    { name: 'Hardware Frontier',    minX: 10,  maxX: 55,  minZ: -55, maxZ: 55 },
    { name: 'The Telegraph Office', minX: -10, maxX: 10,  minZ: -55, maxZ: 0  },
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

function _addSign(scene, x, z, text) {
  // Tall post
  const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 5, 8);
  const postMat = new THREE.MeshLambertMaterial({ color: 0x5c3317 });
  const post = new THREE.Mesh(postGeo, postMat);
  post.position.set(x, 2.5, z);
  scene.add(post);

  // Plank
  const plankGeo = new THREE.BoxGeometry(5, 1, 0.2);
  const plankMat = new THREE.MeshLambertMaterial({ color: 0x5c3317 });
  const plank = new THREE.Mesh(plankGeo, plankMat);
  plank.position.set(x, 5.2, z);
  scene.add(plank);

  // Canvas text
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#5c3317';
  ctx.fillRect(0, 0, 512, 96);
  ctx.fillStyle = '#ffcc66';
  ctx.font = 'bold 30px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 48);
  const tex = new THREE.CanvasTexture(canvas);
  const textGeo = new THREE.PlaneGeometry(4.8, 0.9);
  const textMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const textMesh = new THREE.Mesh(textGeo, textMat);
  textMesh.position.set(x, 5.2, z + 0.12);
  scene.add(textMesh);
}
