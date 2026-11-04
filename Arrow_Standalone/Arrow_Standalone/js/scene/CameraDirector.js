(function (G) {
  G.CameraDirector = class CameraDirector {
    constructor(THREE, camera) {
      this.T = THREE; this.camera = camera; this.follow = true;
      this.base = new THREE.Vector3(0, 2.8, -7); this.look = new THREE.Vector3(0, 3, 36);
      this.projection = new G.AimProjection();
      camera.position.copy(this.base); camera.lookAt(this.look);
    }
    resetAim() {
      this.camera.position.copy(this.base); this.look.set(0, 3, 36);
      this.camera.lookAt(this.look); this.camera.updateMatrixWorld(true);
    }
    view() { return { position: this.camera.position, look: this.look, fov: this.camera.fov, aspect: this.camera.aspect }; }
    pointerToAim(x, y, width, height) { return this.projection.fromScreen(x, y, width, height, this.view()); }
    update(dt, flight, impact) {
      const desired = this.base.clone(), target = new this.T.Vector3(0, 3, 36);
      if (flight && this.follow) {
        const a = flight.arrow; desired.set(a.x + 1.5, a.y + 1.1, a.z - 4); target.set(a.x, a.y, a.z + 8);
      } else if (flight || impact) {
        desired.set(8, 6, 36); target.set(impact?.x ?? flight.arrow.x, impact?.y ?? 4, 48);
      }
      this.camera.position.lerp(desired, 1 - Math.exp(-dt * 7));
      this.look.lerp(target, 1 - Math.exp(-dt * 8)); this.camera.lookAt(this.look);
    }
    projectAim(aim) {
      return this.projection.toScreen(aim, this.view());
    }
  };
})(Gukgung);
