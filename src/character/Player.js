import * as THREE from 'three';
import { resolveCollision } from './collision.js';

const SPEED = 10;
const ACCEL = 18;
const DECEL = 14;
const CAM_OFFSET = new THREE.Vector3(0, 8, 13);
const CAM_LERP = 0.08;
const STRIDE_LENGTH = 2.0; // ground distance covered per full leg-swing cycle

/**
 * Player — low-poly cowboy figure (hat, moustache, vest, belt, boots) with
 * WASD movement, smooth velocity, collision resolution, and third-person
 * camera follow. Local +Z is the figure's front.
 */
export class Player {
  constructor(camera) {
    this.camera = camera;
    this.velocity = new THREE.Vector2(0, 0); // XZ velocity
    this.position = new THREE.Vector3(0, 0, 8);
    this._camTarget = this.position.clone().add(CAM_OFFSET);
    camera.position.copy(this._camTarget);
    camera.lookAt(this.position.x, 1.5, this.position.z);

    this.keys = { up: false, down: false, left: false, right: false };
    this._bindKeys();

    this._walkPhase = 0;
    this._walkAmp = 0;

    this.group = new THREE.Group();
    this._buildCowboy();
    this.group.castShadow = true;
  }

  _buildCowboy() {
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xc68958 }); // light brown skin
    const vestMat = new THREE.MeshLambertMaterial({ color: 0x5c3a21 }); // leather vest
    const vestPocketMat = new THREE.MeshLambertMaterial({ color: 0x432c18 }); // vest pocket
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0xd9c199 }); // shirt/sleeves
    const cuffMat = new THREE.MeshLambertMaterial({ color: 0xbfa274 }); // sleeve cuff
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x8b6f47 }); // pants
    const chapAccentMat = new THREE.MeshLambertMaterial({ color: 0xa9835a }); // leg trim
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x2e1c10 }); // dark brown boots
    const soleMat = new THREE.MeshLambertMaterial({ color: 0x1a0f08 }); // boot sole
    const beltMat = new THREE.MeshLambertMaterial({ color: 0x4a2f1a }); // belt leather
    const buckleMat = new THREE.MeshLambertMaterial({ color: 0xd4af37 }); // gold buckle/buttons
    const hatMat = new THREE.MeshLambertMaterial({ color: 0x3b2412 }); // cowboy hat
    const hatBandMat = new THREE.MeshLambertMaterial({ color: 0x241509 }); // hat band
    const moustacheMat = new THREE.MeshLambertMaterial({ color: 0x241509 });
    const bandanaMat = new THREE.MeshLambertMaterial({ color: 0xb03a2e }); // neck bandana
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x1a1006 });

    const add = (parent, mesh, x, y, z, rotY = 0) => {
      mesh.position.set(x, y, z);
      if (rotY) mesh.rotation.y = rotY;
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // Legs: pivot at the hip so each leg can swing for the walk cycle.
    // All-box "voxel" construction for a bigger, blockier silhouette.
    const HIP_Y = 1.0;
    this.legL = new THREE.Group();
    this.legR = new THREE.Group();
    this.legL.position.set(-0.22, HIP_Y, 0);
    this.legR.position.set(0.22, HIP_Y, 0);
    for (const leg of [this.legL, this.legR]) {
      add(leg, new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.62, 0.34), pantsMat), 0, 0.69 - HIP_Y, 0);
      add(leg, new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.5, 0.05), chapAccentMat), 0, 0.69 - HIP_Y, 0.18);
      add(leg, new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.46), bootMat), 0, 0.22 - HIP_Y, 0.04);
      add(leg, new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.48), soleMat), 0, 0.03 - HIP_Y, 0.04);
      this.group.add(leg);
    }

    // Belt (with buckle)
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.16, 0.62), beltMat), 0, 1.08, 0);
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.12), buckleMat), 0, 1.08, 0.34);

    // Torso: open vest (two side panels) over a buttoned shirt
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.78, 0.52), shirtMat), 0, 1.55, 0);
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.76, 0.58), vestMat), -0.28, 1.55, 0);
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.76, 0.58), vestMat), 0.28, 1.55, 0);
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.03), vestPocketMat), -0.28, 1.4, 0.3);
    for (const by of [1.36, 1.55, 1.74]) {
      add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.06), buckleMat), 0, by, 0.28);
    }

    // Bandana around the neck
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.5), bandanaMat), 0, 1.94, 0);
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.05), bandanaMat), 0, 1.78, 0.24);

    // Arms: pivot at the shoulder so each arm can swing opposite its same-side leg
    const SHOULDER_Y = 1.94;
    this.armL = new THREE.Group();
    this.armR = new THREE.Group();
    this.armL.position.set(-0.6, SHOULDER_Y, 0);
    this.armR.position.set(0.6, SHOULDER_Y, 0);
    for (const arm of [this.armL, this.armR]) {
      add(arm, new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.62, 0.28), shirtMat), 0, -0.31, 0);
      add(arm, new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.3), cuffMat), 0, -0.66, 0);
      add(arm, new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), skinMat), 0, -0.83, 0);
      this.group.add(arm);
    }

    // Neck + blocky head
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.22), skinMat), 0, 2.02, 0);
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.46), skinMat), 0, 2.35, 0);

    // Eyes + moustache
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.03), eyeMat), -0.13, 2.4, 0.24);
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.03), eyeMat), 0.13, 2.4, 0.24);
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.08), moustacheMat), -0.1, 2.28, 0.24);
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.08), moustacheMat), 0.1, 2.28, 0.24);

    // Cowboy hat: octagonal brim (two overlapping boxes) + band + crown
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 1.0), hatMat), 0, 2.62, 0);
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 1.0), hatMat), 0, 2.62, 0, Math.PI / 4);
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.5), hatBandMat), 0, 2.7, 0);
    add(this.group, new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.44), hatMat), 0, 2.91, 0);
  }

  /** Swings the leg/arm pivot groups through a walk cycle keyed to distance traveled. */
  _updateWalkAnim(delta, paused) {
    const speed = paused ? 0 : this.velocity.length();
    const moving = speed > 0.3;

    if (moving) {
      // One full swing cycle (2*PI) should cover one stride length of ground,
      // so leg cadence tracks how far the body actually moved this frame.
      const distance = speed * delta;
      this._walkPhase += (distance / STRIDE_LENGTH) * Math.PI * 2;
    }
    const targetAmp = moving ? Math.min(speed / SPEED, 1) : 0;
    this._walkAmp = THREE.MathUtils.lerp(this._walkAmp, targetAmp, Math.min(1, delta * 8));

    const swing = Math.sin(this._walkPhase) * this._walkAmp;
    this.legL.rotation.x = swing * 0.7;
    this.legR.rotation.x = -swing * 0.7;
    this.armL.rotation.x = -swing * 0.5;
    this.armR.rotation.x = swing * 0.5;
  }

  _bindKeys() {
    const map = {
      KeyW: 'up', ArrowUp: 'up',
      KeyS: 'down', ArrowDown: 'down',
      KeyA: 'left', ArrowLeft: 'left',
      KeyD: 'right', ArrowRight: 'right',
    };
    window.addEventListener('keydown', (e) => {
      if (map[e.code]) { this.keys[map[e.code]] = true; e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => {
      if (map[e.code]) this.keys[map[e.code]] = false;
    });
  }

  addTo(scene) {
    scene.add(this.group);
  }

  /**
   * @param {number} delta - seconds since last frame
   * @param {Building[]} buildings - for collision
   * @param {boolean} paused - when modal is open
   */
  update(delta, buildings, paused) {
    if (!paused) {
      const dx = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
      const dz = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0);
      const moving = dx !== 0 || dz !== 0;

      if (moving) {
        const len = Math.hypot(dx, dz);
        this.velocity.x += (dx / len) * ACCEL * delta;
        this.velocity.y += (dz / len) * ACCEL * delta;
        // clamp to max speed
        const speed = this.velocity.length();
        if (speed > SPEED) this.velocity.multiplyScalar(SPEED / speed);
      } else {
        // decelerate
        const speed = this.velocity.length();
        const newSpeed = Math.max(0, speed - DECEL * delta);
        if (speed > 0) this.velocity.multiplyScalar(newSpeed / speed);
      }

      const desiredX = this.position.x + this.velocity.x * delta;
      const desiredZ = this.position.z + this.velocity.y * delta;
      const resolved = resolveCollision(desiredX, desiredZ, buildings);
      this.position.x = resolved.x;
      this.position.z = resolved.z;

      // Face movement direction
      if (this.velocity.length() > 0.5) {
        this.group.rotation.y = Math.atan2(this.velocity.x, this.velocity.y);
      }
    }

    this.group.position.copy(this.position);
    this._updateWalkAnim(delta, paused);

    // Camera follow with lerp
    const idealCam = this.position.clone().add(CAM_OFFSET);
    this._camTarget.lerp(idealCam, CAM_LERP);
    this.camera.position.copy(this._camTarget);
    this.camera.lookAt(this.position.x, 1.5, this.position.z);
  }
}
