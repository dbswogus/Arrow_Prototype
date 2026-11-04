(function (G) {
  G.NPCArcher = class NPCArcher {
    constructor(wind, random = Math.random) { this.wind = wind; this.random = random; this.x = -3; }
    chooseAim(time) {
      const power = .88 + (this.random() - .5) * .2, pitch = G.Config.aim.defaultPitch;
      const flightTime = G.Config.target.z / ((29 + power * 9) * Math.cos(pitch));
      const correction = -this.x / G.Config.target.z - this.wind.accelerationAt(time) * .5 * flightTime ** 2 / G.Config.target.z;
      return { power, pitch, yaw: correction + .047 * (this.random() - .5) * 2 };
    }
  };
})(Gukgung);
