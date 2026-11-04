(function (G) {
  G.WindSystem = class WindSystem {
    valueAt(time) { return 1.1 * Math.sin(time * .19) + .45 * Math.sin(time * .43 + .6); }
    // The camera faces +Z, so screen-right is world -X.
    accelerationAt(time) { return -this.valueAt(time) * G.Config.windAcceleration; }
  };
})(Gukgung);
