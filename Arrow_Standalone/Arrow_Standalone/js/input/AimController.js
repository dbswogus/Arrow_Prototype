(function (G) {
  G.AimController = class AimController {
    static fromPosition(x, y, width, height) {
      return new G.AimProjection().fromScreen(x, y, width, height);
    }
    constructor(canvas, drawButton, { enabled, onAim, onPower, onFire, onCancel, mapPosition = G.AimController.fromPosition, now = () => performance.now() }) {
      this.pointer = null; this.aimPointer = null; this.locked = false;
      this.chargeStarted = null; this.key = null;
      this.power = () => this.chargeStarted === null ? 0 : Math.max(0, Math.min(1, (now() - this.chargeStarted) / G.Config.chargeDurationMs));
      this.update = () => {
        if (this.chargeStarted === null) return;
        if (!enabled()) { this.cancel(); return; }
        onPower(this.power());
      };
      const beginCharge = () => { this.chargeStarted = now(); onPower(0); };
      const release = () => {
        const power = this.power(); this.pointer = null; this.key = null; this.chargeStarted = null;
        if (enabled() && power >= G.Config.minimumPower) onFire(power); else onCancel();
      };
      const updateAim = e => {
        if (!enabled() || this.chargeStarted !== null) return;
        if (this.aimPointer !== null && e.pointerId !== this.aimPointer) return;
        const r = canvas.getBoundingClientRect();
        onAim(mapPosition(e.clientX - r.left, e.clientY - r.top, r.width, r.height));
      };
      canvas.addEventListener('pointerdown', e => {
        if (!enabled() || this.chargeStarted !== null || this.aimPointer !== null || e.button !== 0) return;
        e.preventDefault(); this.locked = false; this.aimPointer = e.pointerId; canvas.setPointerCapture(e.pointerId); updateAim(e);
      });
      canvas.addEventListener('pointermove', e => {
        if (this.aimPointer === e.pointerId || (this.aimPointer === null && !this.locked && e.pointerType === 'mouse')) updateAim(e);
      });
      canvas.addEventListener('pointerup', e => {
        if (this.aimPointer !== e.pointerId) return;
        updateAim(e); this.aimPointer = null; this.locked = true; // Lock while moving to the draw button.
      });
      const endAim = e => { if (this.aimPointer === e.pointerId) this.aimPointer = null; };
      canvas.addEventListener('pointercancel', endAim); canvas.addEventListener('lostpointercapture', endAim);
      const insideButton = e => {
        const r = drawButton.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.left + r.width && e.clientY >= r.top && e.clientY <= r.top + r.height;
      };
      drawButton.addEventListener('pointerdown', e => {
        if (!enabled() || this.chargeStarted !== null || this.aimPointer !== null || e.button !== 0) return;
        e.preventDefault(); this.pointer = e.pointerId;
        drawButton.setPointerCapture(e.pointerId); beginCharge();
      });
      drawButton.addEventListener('pointermove', e => {
        if (this.pointer !== e.pointerId) return;
        e.preventDefault();
        if (!insideButton(e)) this.cancel();
      });
      drawButton.addEventListener('pointerup', e => {
        if (this.pointer !== e.pointerId) return;
        if (!insideButton(e)) { this.cancel(); return; }
        release();
      });
      this.cancel = () => {
        const drawing = this.chargeStarted !== null;
        this.pointer = null; this.aimPointer = null; this.key = null; this.chargeStarted = null;
        if (drawing) onCancel();
      };
      drawButton.addEventListener('pointercancel', this.cancel);
      drawButton.addEventListener('lostpointercapture', this.cancel);
      drawButton.addEventListener('contextmenu', e => e.preventDefault());
      window.addEventListener('blur', this.cancel);
      globalThis.document?.addEventListener('visibilitychange', () => {
        if (document.hidden) this.cancel();
      });
      // Keyboard uses the same hold-to-charge and release-to-fire behavior.
      drawButton.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); this.cancel(); return; }
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        if (e.repeat || !enabled() || this.chargeStarted !== null || this.aimPointer !== null) return;
        this.key = e.key; beginCharge();
      });
      drawButton.addEventListener('keyup', e => { if (this.key === e.key) { e.preventDefault(); release(); } });
      drawButton.addEventListener('blur', () => { if (this.key !== null) this.cancel(); });
    }
  };
})(Gukgung);
