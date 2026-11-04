(function (G) {
  G.Game = class Game {
    constructor(THREE) {
      this.hud = new G.HUD(); this.range = new G.ArcheryRange(THREE, document.querySelector('canvas'));
      this.camera = new G.CameraDirector(THREE, this.range.camera);
      this.wind = new G.WindSystem(); this.physics = new G.ArrowPhysics(this.wind);
      this.npc = new G.NPCArcher(this.wind); this.manager = new G.TurnManager();
      this.time = 0; this.last = null; this.flight = null; this.impact = null;
      this.aim = this.defaultAim(); this.state = 'INTRO';
      this.input = new G.AimController(document.querySelector('canvas'), this.hud.nodes.draw, {
        enabled: () => this.state === 'PLAYER_AIM',
        mapPosition: (x, y, width, height) => this.camera.pointerToAim(x, y, width, height),
        onAim: a => { this.aim = a; this.hud.aim(a); },
        onPower: power => { this.aim.power = power; this.hud.aim(this.aim); },
        onFire: power => this.fire({ ...this.aim, power }),
        onCancel: () => { this.aim.power = 0; if (this.state === 'PLAYER_AIM') this.hud.cancelled(this.aim); }
      });
      this.hud.bind({ start: () => this.start(), home: () => this.intro(), camera: () => { this.camera.follow = !this.camera.follow; this.hud.cameraMode(this.camera.follow); } });
      this.intro(); requestAnimationFrame(ms => this.frame(ms));
    }
    defaultAim() { return { yaw: 0, pitch: G.Config.aim.defaultPitch, power: 0 }; }
    clear() { this.input.cancel(); this.flight = null; this.impact = null; this.range.clear(); this.manager.reset(); this.aim = this.defaultAim(); }
    intro() { this.state = 'INTRO'; this.clear(); this.hud.records(this.manager); this.hud.intro(); }
    start() { this.clear(); this.ready(); }
    ready() {
      this.state = 'PLAYER_AIM'; this.impact = null; this.range.resetTrail();
      this.camera.resetAim();
      this.aim.power = 0; this.hud.ready(this.manager, this.aim);
    }
    fire(aim) {
      if (!['PLAYER_AIM', 'NPC_WAIT'].includes(this.state)) return;
      const actor = this.manager.turn;
      this.state = actor === 0 ? 'PLAYER_SHOT' : 'NPC_SHOT';
      this.flight = { arrow: this.physics.launch(aim, actor === 0 ? 0 : this.npc.x), start: this.time, actor };
      this.impact = null; this.range.resetTrail(); this.hud.shooting(actor);
    }
    finish(a) {
      const actor = this.flight.actor, number = this.manager.records[actor].length + 1;
      this.flight = null; this.impact = { x: a.x, y: Math.max(.08, a.y), z: a.z };
      this.range.showImpact(a); this.hud.impact(a, actor, number);
      this.manager.record(a.hit); this.hud.records(this.manager);
      this.state = 'IMPACT'; this.deadline = this.time + (actor === 0 ? 1.5 : .75);
    }
    update(dt) {
      this.input.update();
      const elapsed = dt * (this.flight && this.flight.actor !== 0 ? 2.5 : 1);
      this.time += elapsed;
      if (this.flight) {
        let left = elapsed;
        while (left > 0 && this.flight) {
          const step = Math.min(left, 1 / 120);
          const a = this.physics.step(this.flight.arrow, step, this.flight.start);
          this.flight.arrow = a;
          if (a.done) this.finish(a);
          left -= step;
        }
        if (this.flight) this.range.showArrow(this.flight.arrow);
      }
      if (this.state === 'IMPACT') {
        this.range.trail.material.opacity = .8 * Math.max(0, Math.min(1, (this.deadline - this.time) / .75));
        if (this.time >= this.deadline) {
          this.range.resetTrail(); this.impact = null;
          if (this.manager.done) { this.state = 'ROUND_RESULT'; this.hud.result(this.manager); }
          else if (this.manager.turn === 0) this.ready();
          else { this.state = 'NPC_WAIT'; this.deadline = this.time + .35; this.hud.npcWaiting(); }
        }
      }
      if (this.state === 'NPC_WAIT' && this.time >= this.deadline) this.fire(this.npc.chooseAim(this.time));
      const windTime = this.flight ? this.flight.start + this.flight.arrow.t : this.time;
      const wind = this.wind.valueAt(windTime), aiming = this.state === 'PLAYER_AIM';
      this.hud.wind(wind); this.range.update(this.time, wind, this.aim, aiming);
      this.camera.update(dt, this.flight, this.impact);
      if (aiming) this.hud.marker(this.camera.projectAim(this.aim));
    }
    frame(ms) {
      const dt = this.last === null ? 0 : Math.min((ms - this.last) / 1000, .05); this.last = ms;
      this.update(dt); this.range.render(); requestAnimationFrame(next => this.frame(next));
    }
  };
})(Gukgung);
