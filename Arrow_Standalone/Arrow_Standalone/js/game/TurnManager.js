(function (G) {
  G.TurnManager = class TurnManager {
    constructor() { this.reset(); }
    reset() { this.records = G.Config.names.map(() => []); this.turn = 0; }
    record(hit) {
      if (this.done) throw new Error('Round complete');
      this.records[this.turn].push(Boolean(hit)); this.turn = (this.turn + 1) % this.records.length;
    }
    get done() { return this.records.every(r => r.length === G.Config.arrowsPerArcher); }
    get round() { return Math.min(G.Config.arrowsPerArcher, this.records[0].length + (this.turn === 0 ? 1 : 0)); }
    get standings() {
      const totals = this.records.map(r => r.filter(Boolean).length);
      return totals.map((score, id) => ({ id, score, rank: 1 + totals.filter(s => s > score).length,
        molgi: score === G.Config.arrowsPerArcher })).sort((a, b) => b.score - a.score);
    }
  };
})(Gukgung);
