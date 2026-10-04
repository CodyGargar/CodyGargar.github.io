/** True when the primary input is a finger rather than a mouse (phones, tablets). */
export const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

const BASE_RADIUS = 56; // px — half the joystick base's size in styles.css
const DEADZONE = 0.15;

/**
 * TouchControls — on-screen virtual joystick for touch devices. Writes an
 * analog direction into `player.touchInput` ({x, z}, each in [-1, 1], with
 * +z toward the camera, matching the S key) while a finger drags the knob.
 */
export class TouchControls {
  constructor(player) {
    this.player = player;

    this.base = document.createElement('div');
    this.base.id = 'joystick';
    this.base.setAttribute('aria-hidden', 'true'); // keyboard users have WASD
    this.knob = document.createElement('div');
    this.knob.id = 'joystick-knob';
    this.base.appendChild(this.knob);
    document.getElementById('hud').appendChild(this.base);

    this._pointerId = null;
    this.base.addEventListener('pointerdown', (e) => this._onDown(e));
    this.base.addEventListener('pointermove', (e) => this._onMove(e));
    this.base.addEventListener('pointerup', (e) => this._onUp(e));
    this.base.addEventListener('pointercancel', (e) => this._onUp(e));
    window.addEventListener('blur', () => this._release());
  }

  _onDown(e) {
    if (this._pointerId !== null) return;
    this._pointerId = e.pointerId;
    this.base.setPointerCapture(e.pointerId);
    this._onMove(e);
  }

  _onMove(e) {
    if (e.pointerId !== this._pointerId) return;
    const rect = this.base.getBoundingClientRect();
    let dx = (e.clientX - (rect.left + rect.width / 2)) / BASE_RADIUS;
    let dy = (e.clientY - (rect.top + rect.height / 2)) / BASE_RADIUS;
    const mag = Math.hypot(dx, dy);
    if (mag > 1) { dx /= mag; dy /= mag; } // clamp the knob to the base's rim

    this.knob.style.transform = `translate(${dx * BASE_RADIUS}px, ${dy * BASE_RADIUS}px)`;
    const active = Math.min(mag, 1) > DEADZONE;
    this.player.touchInput.x = active ? dx : 0;
    this.player.touchInput.z = active ? dy : 0;
  }

  _onUp(e) {
    if (e.pointerId === this._pointerId) this._release();
  }

  _release() {
    this._pointerId = null;
    this.knob.style.transform = '';
    this.player.touchInput.x = 0;
    this.player.touchInput.z = 0;
  }
}
