(function (G) {
  G.HUD = class HUD {
    constructor() { this.nodes = {}; for (const id of ['wind','records','phase','status','hint','power','draw','camera','home','toast','overlay']) this.nodes[id] = document.getElementById(id); this.reticle = document.querySelector('.reticle'); }
    bind({ start, home, camera }) {
      this.actions = { start, home }; this.nodes.home.onclick = home;
      this.nodes.camera.onclick = camera;
    }
    intro() {
      this.nodes.overlay.classList.remove('hidden'); this.hideNotice(); this.setAiming(false);
      this.nodes.overlay.innerHTML = `<section class="panel"><div class="eyebrow">바람을 읽는 다섯 번의 도전</div><h2>국궁 한 순 대결</h2><p>나와 솔 궁사가 번갈아 각 다섯 발을 쏩니다.</p><div class="steps"><div><b>01 조준</b>마우스·손가락 위치로 상하좌우 조절</div><div><b>02 당김</b>아래 가운데 버튼을 꾹 누르기</div><div><b>03 발사</b>손을 떼어 화살 날리기</div></div><p>과녁 어디든 맞히면 관중(O), 빗나가면 불중(X).<br>다섯 발을 모두 맞히면 몰기!</p><p class="note">2인 한 순 대결·공동 순위·탄도는 체험용 축약입니다. 공식 규칙의 완전한 재현이 아닙니다.</p><button id="start-match" class="primary">대결 시작</button></section>`;
      document.getElementById('start-match').onclick = this.actions.start;
    }
    records(manager) {
      this.nodes.records.innerHTML = G.Config.names.map((name, id) => `<div class="record ${!manager.done && manager.turn === id ? 'active' : ''}"><b>${name}${id === 0 ? ' · 플레이어' : ''}</b><div class="dots">${Array.from({ length: G.Config.arrowsPerArcher }, (_, i) => `<span class="dot ${manager.records[id][i] === true ? 'hit' : manager.records[id][i] === false ? 'miss' : ''}">${manager.records[id][i] === true ? 'O' : manager.records[id][i] === false ? 'X' : '·'}</span>`).join('')}</div></div>`).join('');
    }
    ready(manager, aim) {
      this.nodes.overlay.classList.add('hidden'); this.hideNotice(); this.records(manager);
      this.nodes.phase.textContent = `한 순 · ${manager.round}번째 발 / 5`;
      this.nodes.hint.textContent = '화면 클릭·터치로 조준 고정 → 아래 가운데 버튼을 꾹 누르고 손 떼기';
      this.aim(aim); this.setAiming(true);
    }
    aim(aim) {
      this.nodes.power.style.width = `${aim.power * 100}%`;
      const percent = Math.round(aim.power * 100);
      this.nodes.draw.style.setProperty('--charge', `${percent}%`);
      this.nodes.draw.innerHTML = `${percent > 0 ? `당기는 중 ${percent}%` : '꾹 눌러 발사'}<small>${percent >= 100 ? '최대 세기 · 놓으면 발사' : '누를수록 강하게 · 놓으면 발사'}<br>밖으로 끌면 취소</small>`;
      this.nodes.status.textContent = `높이 ${(aim.pitch * 180 / Math.PI).toFixed(1)}° · 당김 ${Math.round(aim.power * 100)}%`;
    }
    cancelled(aim) { this.aim(aim); this.nodes.status.textContent = '발사 취소 · 조준은 유지됩니다'; }
    setAiming(value) { this.nodes.draw.disabled = !value; this.nodes.draw.classList.toggle('hidden', !value); this.reticle.classList.toggle('hidden', !value); }
    wind(value) { this.nodes.wind.textContent = `${value < 0 ? '←' : '→'} ${Math.abs(value) < .5 ? '약함' : Math.abs(value) < 1 ? '보통' : '강함'} · ${Math.abs(value).toFixed(1)}`; }
    marker(point) { this.reticle.style.left = `${point.x}%`; this.reticle.style.top = `${point.y}%`; }
    cameraMode(follow) { this.nodes.camera.textContent = `카메라: ${follow ? '추적' : '고정'}`; }
    shooting(actor) { this.hideNotice(); this.setAiming(false); this.nodes.power.style.width = '0%'; this.nodes.status.textContent = `${G.Config.names[actor]}의 화살을 따라가는 중`; }
    npcWaiting() { this.nodes.status.textContent = '솔 궁사의 차례'; }
    impact(a, actor, number) {
      this.nodes.toast.innerHTML = `<strong>${a.hit ? '관중 O' : '불중 X'}</strong><span>${G.Config.names[actor]} · ${a.x < 0 ? '오른쪽' : '왼쪽'} ${Math.abs(a.x).toFixed(1)}m · ${number}번째 발</span>`;
      this.nodes.toast.classList.remove('hidden');
    }
    hideNotice() { this.nodes.toast.classList.add('hidden'); }
    result(manager) {
      this.setAiming(false); this.hideNotice(); this.nodes.overlay.classList.remove('hidden');
      const score = manager.records[0].filter(Boolean).length;
      this.nodes.overlay.innerHTML = `<section class="panel"><div class="eyebrow">한 순 완료</div><h2>${score === 5 ? '몰기! 다섯 발 모두 관중' : `${score}중, 멋진 한 순!`}</h2>${manager.standings.map(s => `<div class="rank"><b>${s.rank}위 · ${G.Config.names[s.id]}</b><span>${s.score}중 / 5발 ${s.molgi ? '· 몰기' : ''}</span></div>`).join('')}<p class="note">동점은 공동 순위이며 2인 한 순 대결은 체험용 축약 규칙입니다.</p><div class="actions"><button id="again" class="primary">다시 대결</button><button id="back">처음으로</button></div></section>`;
      document.getElementById('again').onclick = this.actions.start; document.getElementById('back').onclick = this.actions.home;
    }
  };
})(Gukgung);

