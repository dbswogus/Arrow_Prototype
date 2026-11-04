(function (G) {
  G.ArrowPhysics = class ArrowPhysics {
    constructor(wind) { this.wind = wind; }
    launch(aim, x = 0) {
      const speed = 29 + aim.power * 9;
      const pitch = aim.pitch ?? G.Config.aim.defaultPitch;
      return { x, y: 1.7, z: 0, vx: Math.sin(aim.yaw) * Math.cos(pitch) * speed,
        vy: Math.sin(pitch) * speed, vz: Math.cos(pitch) * Math.cos(aim.yaw) * speed, t: 0 };
    }
    step(a, dt, startTime) {
      const ax = this.wind.accelerationAt(startTime + a.t + dt / 2);
      const b = { ...a, x: a.x + a.vx * dt + .5 * ax * dt * dt,
        y: a.y + a.vy * dt - 4.9 * dt * dt, z: a.z + a.vz * dt,
        vx: a.vx + ax * dt, vy: a.vy - 9.8 * dt, t: a.t + dt };
      const target = G.Config.target;
      if (b.z >= target.z) {
        const f = (target.z - a.z) / (b.z - a.z);
        b.x = a.x + (b.x - a.x) * f; b.y = a.y + (b.y - a.y) * f; b.z = target.z;
        b.done = true;
        b.hit = Math.abs(b.x - target.x) <= target.width / 2 && Math.abs(b.y - target.y) <= target.height / 2;
      } else if (b.y <= 0) { b.done = true; b.hit = false; }
      return b;
    }
  };
})(Gukgung);
