import * as THREE from 'three';
import { buildTown } from './world/Town.js';
import { updateProps } from './world/props.js';
import { Player } from './character/Player.js';
import { nearestDoorBuilding } from './character/collision.js';
import { HUD } from './ui/HUD.js';
import { ProjectModal } from './ui/ProjectModal.js';

// ── Renderer ─────────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);

// ── Scene & Camera ────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd4956a); // dusty amber sky
scene.fog = new THREE.Fog(0xd4956a, 50, 110);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 7, 20);

// ── Lighting ──────────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0xffe0b0, 0.7);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffbb66, 1.6);
sun.position.set(30, 40, 20);
sun.castShadow = true;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 180;
sun.shadow.camera.left = -70;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0015; // avoids shadow acne at perpendicular surface junctions (e.g. door/boardwalk)
sun.shadow.normalBias = 0.03;
scene.add(sun);

// ── World ─────────────────────────────────────────────────────────────────────
const { buildings, districtZones } = buildTown(scene);

// ── Player ────────────────────────────────────────────────────────────────────
const player = new Player(camera);
player.addTo(scene);

// ── UI ────────────────────────────────────────────────────────────────────────
const hud = new HUD();
const modal = new ProjectModal();
let paused = false;
modal.onClose = () => { paused = false; };

let nearBuilding = null;

window.addEventListener('keydown', (e) => {
  if (e.key === 'e' || e.key === 'E') {
    if (nearBuilding && !paused) {
      paused = true;
      modal.open(nearBuilding.projectId);
    }
  }
});

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Game loop ─────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function loop() {
  requestAnimationFrame(loop);
  const delta = Math.min(clock.getDelta(), 0.05);

  player.update(delta, buildings, paused);
  updateProps(delta);

  // District label
  const px = player.position.x;
  const pz = player.position.z;
  let currentDistrict = null;
  for (const zone of districtZones) {
    if (px >= zone.minX && px <= zone.maxX && pz >= zone.minZ && pz <= zone.maxZ) {
      currentDistrict = zone.name;
      break;
    }
  }
  hud.setDistrict(currentDistrict);

  // Enter prompt
  nearBuilding = nearestDoorBuilding(px, pz, buildings);
  hud.showEnterPrompt(!!nearBuilding && !paused);

  renderer.render(scene, camera);
}

loop();
