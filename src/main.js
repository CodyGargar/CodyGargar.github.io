import * as THREE from 'three';
import { buildTown } from './world/Town.js';
import { updateProps } from './world/props.js';
import { Player } from './character/Player.js';
import { nearestDoorBuilding } from './character/collision.js';
import { HUD } from './ui/HUD.js';
import { ProjectModal } from './ui/ProjectModal.js';
import { ClassicSite } from './ui/ClassicSite.js';
import { TouchControls, isTouchDevice } from './ui/TouchControls.js';

// ── Renderer ─────────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
// Phones often report a 3x pixel ratio; rendering at 1.5x keeps the frame
// rate up there with little visible difference on a small screen.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouchDevice ? 1.5 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);

// ── Scene & Camera ────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd4956a); // dusty amber sky
scene.fog = new THREE.Fog(0xd4956a, 50, 110);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);

// Three.js FOV is vertical, so on a portrait phone a fixed 60° leaves only
// a sliver of the town visible side to side. Widen it until the horizontal
// view is at least 60°, capped so it doesn't turn into a fisheye.
function fitCameraFov() {
  const aspect = window.innerWidth / window.innerHeight;
  const minHorizontal = THREE.MathUtils.degToRad(60);
  const vertical = 2 * Math.atan(Math.tan(minHorizontal / 2) / aspect);
  camera.aspect = aspect;
  camera.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(vertical), 60, 85);
  camera.updateProjectionMatrix();
}
fitCameraFov();
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
const hud = new HUD({ touch: isTouchDevice, onEnter: () => tryEnter() });
const modal = new ProjectModal();
const classicSite = new ClassicSite();
if (isTouchDevice) new TouchControls(player);

// player.enabled must reflect BOTH of these, not mode alone — otherwise,
// while the project modal is open in 3D mode, WASD/arrow keydowns still
// call preventDefault() (blocking the modal's own arrow-key scrolling) and
// this.keys keeps accumulating state, so a key held when 'E' was pressed is
// still "on" the instant the modal closes and the character lurches off
// with no new input.
let paused = false;
function setPaused(value) {
  paused = value;
  updatePlayerEnabled();
}
modal.onClose = () => { setPaused(false); };

let nearBuilding = null;

function tryEnter() {
  if (mode !== '3d' || !nearBuilding || paused) return;
  setPaused(true);
  modal.open(nearBuilding.projectId);
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'e' || e.key === 'E') tryEnter();
});

// ── 3D / classic-site toggle ────────────────────────────────────────────────
const scene3dEl = document.getElementById('scene-3d');
const classicEl = document.getElementById('classic-site');
const toggleBtn = document.getElementById('view-toggle');

let mode = localStorage.getItem('siteMode') === 'classic' ? 'classic' : '3d';

function updatePlayerEnabled() {
  player.enabled = mode === '3d' && !paused;
}

function applyMode() {
  const is3d = mode === '3d';
  scene3dEl.style.display = is3d ? '' : 'none';
  classicEl.hidden = is3d;
  updatePlayerEnabled();
  toggleBtn.textContent = is3d ? '🌐 Classic Site' : '🤠 3D Town';
  // The resize listener below skips work while the 3D view is hidden, so
  // catch up on anything missed as soon as it's shown again.
  if (is3d) syncRendererSize();
}

toggleBtn.addEventListener('click', () => {
  if (modal.isOpen) modal.close(); // don't leave the project overlay open under the wrong view
  mode = mode === '3d' ? 'classic' : '3d';
  localStorage.setItem('siteMode', mode);
  applyMode();
});

applyMode();

// ── Resize ────────────────────────────────────────────────────────────────────
function syncRendererSize() {
  fitCameraFov();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', () => {
  if (mode !== '3d') return; // avoid pointless framebuffer reallocation while hidden
  syncRendererSize();
});

// ── Game loop ─────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function loop() {
  requestAnimationFrame(loop);
  if (mode !== '3d') return; // classic site showing — skip sim/render work entirely

  const delta = Math.min(clock.getDelta(), 0.05);

  player.update(delta, buildings, paused);
  if (player.velocity.lengthSq() > 1) hud.dismissHint();
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
