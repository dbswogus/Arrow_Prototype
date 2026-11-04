(function (G) {
  // Input and marker rendering use the same camera projection and launch origin.
  // The sphere is a direction reference, not a predicted ballistic impact.
  G.AimProjection = class AimProjection {
    constructor() { this.origin = { x: 0, y: 1.7, z: 0 }; this.distance = 25; }
    static defaultView() { return { position: { x: 0, y: 2.8, z: -7 }, look: { x: 0, y: 3, z: 36 }, fov: 55, aspect: 1 }; }
    add(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
    sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
    scale(a, n) { return { x: a.x * n, y: a.y * n, z: a.z * n }; }
    dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
    cross(a, b) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
    unit(a) { return this.scale(a, 1 / Math.hypot(a.x, a.y, a.z)); }
    basis(view) {
      const forward = this.unit(this.sub(view.look, view.position));
      const right = this.unit(this.cross(forward, { x: 0, y: 1, z: 0 }));
      return { forward, right, up: this.cross(right, forward), tangent: Math.tan(view.fov * Math.PI / 360) };
    }
    fromScreen(x, y, width, height, view = G.AimProjection.defaultView()) {
      const b = this.basis(view), aspect = width / Math.max(1, height);
      const nx = 2 * Math.max(0, Math.min(width, x)) / Math.max(1, width) - 1;
      const ny = 1 - 2 * Math.max(0, Math.min(height, y)) / Math.max(1, height);
      const ray = this.unit(this.add(b.forward, this.add(this.scale(b.right, nx * b.tangent * aspect), this.scale(b.up, ny * b.tangent))));
      const offset = this.sub(view.position, this.origin), along = this.dot(offset, ray);
      const discriminant = along * along - this.dot(offset, offset) + this.distance ** 2;
      const t = -along + Math.sqrt(Math.max(0, discriminant));
      const point = this.add(view.position, this.scale(ray, t));
      const direction = this.sub(point, this.origin);
      return { yaw: Math.atan2(direction.x, direction.z), pitch: Math.atan2(direction.y, Math.hypot(direction.x, direction.z)), power: 0 };
    }
    toScreen(aim, view) {
      const b = this.basis(view);
      const direction = { x: Math.sin(aim.yaw) * Math.cos(aim.pitch), y: Math.sin(aim.pitch), z: Math.cos(aim.yaw) * Math.cos(aim.pitch) };
      const point = this.add(this.origin, this.scale(direction, this.distance));
      const relative = this.sub(point, view.position), depth = this.dot(relative, b.forward);
      return { x: (1 + this.dot(relative, b.right) / (depth * b.tangent * view.aspect)) * 50,
        y: (1 - this.dot(relative, b.up) / (depth * b.tangent)) * 50 };
    }
  };
})(Gukgung);
