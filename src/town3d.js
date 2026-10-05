import * as THREE from 'three';
import { buildTown } from './world/Town.js';
import { updateProps } from './world/props.js';
import { Player } from './character/Player.js';
import { nearestDoorBuilding } from './character/collision.js';
import { HUD } from './ui/HUD.js';
import { TouchControls, isTouchDevice } from './ui/TouchControls.js';

/**
 * The walkable 3D town: renderer, scene, player, HUD, and game loop. Lives in
 * its own module so main.js can load it with a dynamic import() — Three.js
 * and the whole world builder only download when someone actually opens the
 * town, and the classic site never pays for them.
 *
 * Returns a controller; setActive(false) pauses simulation and rendering
 * while the classic site is showing.
 */
export function startTown({ modal }) {
  // ── Renderer ───────────────────────────────────────────────────────────────
  const canvas = document.getElementById('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  // Phones often report a 3x pixel ratio; rendering at 1.5x keeps the frame
  // rate up there with little visible difference on a small screen.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouchDevice ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);

  // ── Scene & Camera ─────────────────────────────────────────────────────────
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

  // ── Lighting ───────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffe0b0, 0.7));

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

  // ── World, player, HUD ─────────────────────────────────────────────────────
  const { buildings, districtZones } = buildTown(scene);

  const player = new Player(camera);
  player.addTo(scene);

  const hud = new HUD({ touch: isTouchDevice, onEnter: () => tryEnter() });
  if (isTouchDevice) new TouchControls(player);

  // player.enabled must reflect BOTH of these, not visibility alone —
  // otherwise, while the project modal is open, WASD/arrow keydowns still
  // call preventDefault() (blocking the modal's own arrow-key scrolling) and
  // this.keys keeps accumulating state, so a key held when 'E' was pressed is
  // still "on" the instant the modal closes and the character lurches off
  // with no new input.
  let active = false;
  let paused = false;
  const updatePlayerEnabled = () => { player.enabled = active && !paused; };
  modal.onClose = () => { paused = false; updatePlayerEnabled(); };

  let nearBuilding = null;
  function tryEnter() {
    if (!active || !nearBuilding || paused) return;
    paused = true;
    updatePlayerEnabled();
    modal.open(nearBuilding.projectId);
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'e' || e.key === 'E') tryEnter();
  });

  // ── Resize ─────────────────────────────────────────────────────────────────
  function syncRendererSize() {
    fitCameraFov();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', () => {
    if (!active) return; // avoid pointless framebuffer reallocation while hidden
    syncRendererSize();
  });

  // ── Game loop ──────────────────────────────────────────────────────────────
  const clock = new THREE.Clock();

  function loop() {
    requestAnimationFrame(loop);
    if (!active) return; // classic site showing — skip sim/render work entirely

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

  return {
    setActive(value) {
      active = value;
      updatePlayerEnabled();
      // The resize listener skips work while hidden, so catch up on anything
      // missed as soon as the town is shown again.
      if (active) syncRendererSize();
    },
  };
}
