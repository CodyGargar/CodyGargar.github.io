const HINT_TIMEOUT_MS = 12000;

/**
 * HUD — district label (top-left), "Enter" prompt (bottom-center), and a
 * first-visit controls hint. Mutates DOM elements injected into #hud.
 * On touch devices the Enter prompt becomes a tappable button that calls
 * `onEnter`, since there's no E key to press.
 */
export class HUD {
  constructor({ touch = false, onEnter = () => {} } = {}) {
    const hud = document.getElementById('hud');

    this.districtEl = document.createElement('div');
    this.districtEl.id = 'district-label';
    hud.appendChild(this.districtEl);

    this.promptEl = document.createElement(touch ? 'button' : 'div');
    this.promptEl.id = 'enter-prompt';
    if (touch) {
      this.promptEl.type = 'button';
      this.promptEl.textContent = 'Tap to enter';
      this.promptEl.addEventListener('click', () => onEnter());
    } else {
      this.promptEl.textContent = '[ E ]  Enter';
    }
    hud.appendChild(this.promptEl);

    this.hintEl = document.createElement('div');
    this.hintEl.id = 'controls-hint';
    this.hintEl.innerHTML = touch
      ? 'Drag the <b>joystick</b> to walk · walk up to a door and <b>tap</b> to enter'
      : '<b>WASD</b> / <b>arrow keys</b> to walk · <b>E</b> at a door to enter';
    hud.appendChild(this.hintEl);
    this._hintDismissed = false;
    requestAnimationFrame(() => { if (!this._hintDismissed) this.hintEl.classList.add('visible'); });
    this._hintTimeout = setTimeout(() => this.dismissHint(), HINT_TIMEOUT_MS);

    this._currentDistrict = null;
    this._districtTimeout = null;
  }

  setDistrict(name) {
    if (name === this._currentDistrict) return;
    this._currentDistrict = name;

    clearTimeout(this._districtTimeout);
    this.districtEl.classList.remove('visible');

    if (name) {
      // small delay so the fade-out finishes before new name appears
      this._districtTimeout = setTimeout(() => {
        this.districtEl.textContent = name;
        this.districtEl.classList.add('visible');
      }, 200);
    }
  }

  showEnterPrompt(visible) {
    this.promptEl.classList.toggle('visible', visible);
  }

  /** Fades out the controls hint — called once the player first moves. */
  dismissHint() {
    if (this._hintDismissed) return;
    this._hintDismissed = true;
    clearTimeout(this._hintTimeout);
    this.hintEl.classList.remove('visible');
  }
}
