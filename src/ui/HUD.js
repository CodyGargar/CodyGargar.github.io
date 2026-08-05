/**
 * HUD — district label (top-left) and "Enter" prompt (bottom-center).
 * Mutates DOM elements injected into #hud.
 */
export class HUD {
  constructor() {
    const hud = document.getElementById('hud');

    this.districtEl = document.createElement('div');
    this.districtEl.id = 'district-label';
    hud.appendChild(this.districtEl);

    this.promptEl = document.createElement('div');
    this.promptEl.id = 'enter-prompt';
    this.promptEl.textContent = '[ E ]  Enter';
    hud.appendChild(this.promptEl);

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
}
