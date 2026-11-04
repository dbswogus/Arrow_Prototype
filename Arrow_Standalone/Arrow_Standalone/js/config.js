window.Gukgung = window.Gukgung || {};
Gukgung.Config = Object.freeze({
  names: ['나', '솔 궁사'], arrowsPerArcher: 5,
  target: Object.freeze({ x: 0, y: 4, z: 48, width: 5, height: 6 }),
  windAcceleration: 3.8, // Previous version: 4.8. About 21% gentler.
  aim: Object.freeze({ defaultPitch: .235 }), // Pointer angles come from the camera projection.
  chargeDurationMs: 1000, minimumPower: .18, trailDuration: .4
});
