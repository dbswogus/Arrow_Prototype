(function(){'use strict';
const canvas=document.getElementById('game'),game=new Workshop.Game();let view;
try{view=new WorkshopRenderer(canvas)}catch(e){console.error(e);return}
let best=0;try{best=Number(localStorage.getItem('gakgung-coop-team-learning-best'))||0}catch{}
const sound={ctx:null,enabled:true,unlock(){if(!this.enabled)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;try{this.ctx=this.ctx||new C();if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{})}catch{}},notes(freqs,volume=.035){if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;try{const now=this.ctx.currentTime;freqs.forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=now+i*.1;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+.24)})}catch{}}};
window.addEventListener('pointerdown',()=>sound.unlock());window.addEventListener('keydown',()=>sound.unlock());
view.buttons=[];view.resize();const input=attachControls(canvas,game,view,command);let heard=0,tutorialPage=0;
function command(id){if(id==='touch'){view.touchUI=!view.touchUI;view.resize();input.clear()}if(id==='tutorial'){game.state='TUTORIAL';tutorialPage=0}if(id==='back')tutorialPage=Math.max(0,tutorialPage-1);if(id==='play'){if(game.state==='TUTORIAL'&&tutorialPage<2){tutorialPage++;return}game.start();input.resume();heard=0}if(id==='title'){game.state='TITLE';input.resume()}if(id==='resume')input.resume()}
window.addEventListener('resize',()=>{view.resize();input.clear()});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();input.clear();cancelAnimationFrame(frameId)});canvas.addEventListener('webglcontextrestored',()=>location.reload());
const colors=['#78c9ea','#ffa384'];
function paint(c,r){const W=r.W,H=r.H;c.clearRect(0,0,W,H);r.buttons=[];
 const panel=(x,y,w,h,bg='#17383e')=>{c.fillStyle=bg;c.beginPath();c.roundRect(x-w/2,y-h/2,w,h,10);c.fill()};
 const text=(s,x,y,size=24,color='#fff2d5')=>{c.font=`700 ${size*(game.state==='PLAYING'?.68:.75)}px "Malgun Gothic",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(s,x,y)};
 const tag=(s,x,y,size=18,bg='#17383e')=>{c.font=`700 ${size*(game.state==='PLAYING'?.68:.75)}px "Malgun Gothic",sans-serif`;const w=Math.ceil(c.measureText(s).width)+16,h=Math.ceil(size*(game.state==='PLAYING'?.68:.75))+12;panel(x,y,w,h,bg);text(s,x,y,size)};
 const lines=(s,x,y,size=24,color)=>s.split('\n').forEach((v,i,a)=>text(v,x,y+(i-(a.length-1)/2)*(size+10),size,color));
 const button=(id,label,x,y,w=260,h=64,kind,player)=>{panel(x,y,w,h,player===0?'#285f76':player===1?'#8d493a':'#a9653e');lines(label,x,y,24);r.buttons.push({id,x,y,w,h,kind,player})};
 const gauge=(x,y,w,value,color='#85d3b4')=>{panel(x,y,w,10,'#25403f');c.fillStyle=color;c.fillRect(x-w/2+4,y-3,(w-8)*Math.max(0,Math.min(1,value)),6)};
 if(game.state==='PLAYING'){
 panel(W/2,29,W-30,44);text('각궁 공방 대소동',W*.27,29,24);text(`${Math.ceil(game.time)}초   ${game.score}점`,W*.83,29,28);
 if(game.orders.length){const t=game.orders[0];panel(W/2,76,360,38);text(`완성 활 한 건 · 마감까지 ${Math.ceil(t)}초`,W/2,76,22,t<8?'#ffb486':undefined)}else{panel(W/2,76,360,38);text('새 주문 마감 · 남은 작업을 정리해요',W/2,76,22)}
 button('touch',r.touchUI?'조이스틱 숨기기':'조이스틱 보기',W-91,76,158,34);
 Workshop.benches.forEach(b=>{const [x,y]=r.project(b.x,1.9,b.z);const state=typeof b.id==='number'?game.stations[b.id]:null;tag(state?.state==='processing'?Workshop.processName(b.id,state.t):b.label,x,y);if(typeof b.id==='number'){const s=game.stations[b.id],[bx,by]=r.project(b.x,1.08,b.z+.55);if(s.state==='processing'){if(b.id===3&&!s.balanceTried){panel(bx,by,110,14);c.fillStyle='#426f50';c.fillRect(bx-13,by-5,26,10);c.fillStyle='#f6d68a';c.fillRect(bx-50+game.balanceMarker()*100-2,by-7,4,14)}else gauge(bx,by,110,s.t/s.duration)}if(s.state==='ready')text('✓',bx,by,27,'#bce39a')}});
 const shelf=Workshop.props.find(p=>p.id==='shelf');const [sx,sy]=r.project(shelf.x,1.6,shelf.z);tag('전달 선반',sx,sy,15);
 const dry=game.dry;const [rx,ry]=r.project(0,2.15,0);tag(dry.state==='ready'?'⑤ 건조 완료 ✓':dry.state==='processing'?'⑤ 건조하기':'⑤ 건조 · 3초',rx,ry,20);if(dry.state==='processing')gauge(rx,ry+24,140,dry.t/dry.duration);
 if(game.lesson){c.globalAlpha=Math.min(1,game.lesson.life/.6);tag(`${game.lesson.title} · ${game.lesson.text}`,W/2,112,20,'#274740');c.globalAlpha=1}
 game.players.forEach((p,i)=>{const [x,y]=r.project(p.x,1.95,p.z);text(`P${i+1}`,x,y,22,colors[i]);const f=game.focus(i);if(f){const [fx,fy]=r.project(f.x,1.35,f.z);c.strokeStyle=colors[i];c.lineWidth=2;c.strokeRect(fx-42,fy-8,84,16)}const cx=W*(i?.75:.25),infoY=H-(r.touchUI?148:39);panel(cx,infoY,W/2-24,48);text(`P${i+1} · ${Workshop.names[p.held]||'빈손'}${p.held==='bow'?' · '+(100+p.quality)+'점':''} · ${i?'방향키 / Enter / R Shift':'WASD / F / G'}`,cx,infoY-9,20,colors[i]);text(p.notice>0?p.message:(f?(f.id==='shelf'?'행동: 맡기기 / 꺼내기':'행동: '+f.label):'마주 보고 행동하면 물건 건네기'),cx,infoY+13,17);
 if(p.polish){const gy=infoY-42;panel(cx,gy,260,32);c.fillStyle='#436550';c.fillRect(cx-26,gy-9,52,18);c.fillStyle='#f5df9c';c.fillRect(cx-100+game.polishMarker(p)*200-3,gy-11,6,22);text('초록 구간에서 행동!',cx,gy-27,18,colors[i])}
 if(r.touchUI){const jx=W*(i?.57:.07)+22,jy=H-65;c.fillStyle=i?'#7d493b':'#285b70';c.beginPath();c.arc(jx,jy,49,0,Math.PI*2);c.fill();c.strokeStyle=colors[i];c.lineWidth=2;c.stroke();const stick=input.sticks[i];c.fillStyle=colors[i];c.beginPath();c.arc(jx+stick.x*27,jy+stick.y*27,18,0,Math.PI*2);c.fill();r.buttons.push({kind:'stick',player:i,x:jx,y:jy,w:108,h:108});text(i?'방향키':'WASD',jx,jy+47,16);button('act',p.polish?'맞추기':(f?.id===2&&p.held==='bow'&&!p.polished?'화피단장':f?.id===3&&game.stations[3].state==='processing'&&!p.held&&!game.stations[3].balanceTried?'균형 맞추기':'행동')+'\n'+(i?'Enter':'F'),W*(i?.75:.25),jy,108,82,'act',i);button('drop','놓기\n'+(i?'R Shift':'G'),W*(i?.91:.41),jy,106,82,'drop',i)}});
 for(const e of game.effects){const age=2.5-e.life,[x,y]=r.project(e.x,1.8,e.z);for(let k=0;k<22;k++){const a=k*2.399,dist=age*(35+k%5*12);c.fillStyle=['#f1cd6b','#9fd9b0','#efa180','#9acfe3'][k%4];c.fillRect(x+Math.cos(a)*dist,y+Math.sin(a)*dist-age*35+age*age*20,5,5)}text('납품 +'+e.value+'점!',x,y-24-age*28,32,'#ffe49a');if(age<1.1){panel(x,y+22,80,38,'#bd9460');text('✓',x,y+22,30,'#fff1d0')}}
 if(input.paused){panel(W/2,H/2,Math.min(W-30,660),200);lines('잠시 쉬는 중\n화면을 떠나면 시간이 멈춥니다',W/2,H/2-34,25);button('resume','계속하기',W/2,H/2+55)}
 }else{
 c.fillStyle='rgba(9,24,29,.94)';c.fillRect(0,0,W,H);
 if(game.state==='TUTORIAL'){
 const titles=['활은 이렇게 만들어요','둘이 나누면 더 빨라요','정성을 더하면 점수도 올라요'];
 text(`게임 안내  ${tutorialPage+1} / 3`,W/2,H*.09,21,'#abc8bf');text(titles[tutorialPage],W/2,H*.19,37);
 const card=(x,y,w,h,title,body,accent='#a9cdbd')=>{panel(x,y,w,h,'#19373e');text(title,x,y-h*.27,25,accent);lines(body,x,y+h*.15,20)};
 if(tutorialPage===0){
 const gap=18,cw=Math.min(260,(W-80-gap*2)/3),ch=Math.min(120,H*.17),xs=[W/2-cw-gap,W/2,W/2+cw+gap];
 const stages=[['①·② 몸체 · 3초','재료 손질 → 몸체 만들기'],['③·④ 접합 · 4초','뿔 붙이기 → 심줄 올리기'],['⑤ 건조 · 3초','중앙 건조대에 걸어요'],['⑥ 해궁 · 2초','새 해궁대에서 균형 잡기'],['⑦ 화피단장 · 2초','화피단장대에서 겉면 정돈'],['⑧ 각궁 완성','출고하면 기본 100점']];
 stages.forEach((s,i)=>card(xs[i%3],H*(i<3?.38:.59),cw,ch,s[0],s[1],i===5?'#f2ce89':'#a9cdbd'));
 text('건조 → 오른쪽 아래 해궁대 → 오른쪽 위 화피단장대 → 출고',W/2,H*.74,20,'#cad7ce');
 }else if(tutorialPage===1){
 const cw=Math.min(390,(W-90)/2),ch=H*.29;
 card(W/2-cw/2-12,H*.42,cw,ch,'왼쪽: 재료 · 접합','재료를 준비하고 몸체를 접합\n중앙 선반으로 파트너에게 전달\n그동안 다음 활을 준비해요','#83cee9');
 card(W/2+cw/2+12,H*.42,cw,ch,'오른쪽: 건조 · 마무리','선반에서 이어받아 건조\n해궁 → 화피단장 → 출고\n역할은 자유롭게 바꿔도 좋아요','#f0ba92');
 panel(W/2,H*.68,Math.min(W-70,810),H*.15,'#102a31');text('P1   WASD 이동  ·  F 행동  ·  G 놓기',W/2,H*.65,23,colors[0]);text('P2   방향키 이동  ·  Enter 행동  ·  오른쪽 Shift 놓기',W/2,H*.70,23,colors[1]);text('가까이 마주 보고 행동하면 손에서 손으로 건넬 수도 있어요.',W/2,H*.78,18,'#b5c9c0');
 }else{
 const cw=Math.min(390,(W-90)/2),ch=H*.30;
 card(W/2-cw/2-12,H*.42,cw,ch,'해궁 균형 맞추기  +25점','해궁 작업 중 빈손으로\n초록 구간에 맞춰 행동\n놓쳐도 자동으로 완성돼요!','#efcd84');
 card(W/2+cw/2+12,H*.42,cw,ch,'추가 화피단장  +25점','완성 활을 들고 화피단장대에서 행동\n표시가 초록 구간에 오면 다시 행동\n실패·시간 초과: 이 활 납품 점수 -10','#a5d7ae');
 text('빠르게 납품하면 100점, 두 보너스를 모두 받으면 150점',W/2,H*.66,25,'#f2d79e');text('보너스는 선택이에요. 남은 주문 시간을 보고 결정하세요.',W/2,H*.73,20,'#cad7ce');
 }
 const bw=Math.min(250,W*.30);button(tutorialPage===0?'title':'back',tutorialPage===0?'처음으로':'이전',W*.30,H*.86,bw,56);button('play',tutorialPage<2?'다음':'공방 시작',W*.70,H*.86,bw,56);text('한 판 180초  ·  공동 주문 한 건씩  ·  주문 기한 30초',W/2,H-25,18,'#a8bfb8');
 }else{
 text('GAKGUNG WORKSHOP',W/2,H*.12,21,'#b7d6cb');text(game.state==='TITLE'?'각궁 공방 대소동':'오늘의 공방 마감',W/2,H*.24,W<1000?39:48);
 if(game.state==='TITLE'){lines('둘이 함께 활을 만들고\n시간 안에 주문을 완성하세요.',W/2,H*.44,30);button('tutorial','게임 방법 보기',W/2,H*.64);text(`2인 협동 · 최고 기록 ${best}점`,W/2,H*.77,23)}
 else{lines(`함께 납품 ${game.delivered}개 · 공동 ${game.score}점 · 최고 ${best}점\n최고 품질 활 ${game.bestBow}점 · 정성 활 ${game.qualityBows}개\n최다 연속 납품 ${game.bestStreak}개 · 직접 건네기 ${game.handoffs}회\n함께 만든 활 ${game.teamBows}개 · 선반 인계 ${game.shelfPasses}회\n만료 ${game.expired}건 · 충돌 ${game.collisions}회`,W/2,H*.46,25);button('play','다시 함께하기',W/2,H*.70);button('title','처음으로',W/2,H*.82)}
 text('실제 약 1년의 제작 사례를 소재로, 전시의 8단계를 게임용 시간으로 압축했습니다.',W/2,H-23,17,'#c1c4ad');
 }
 }
}
let last=performance.now(),frameId;function frame(now){const dt=Math.min((now-last)/1000,.1);last=now;if(!input.paused){const was=game.state;game.tick(dt,input.axes());if(game.state==='PLAYING'){for(const e of game.effects)if(e.id>heard){heard=e.id;sound.notes(e.value>=150?[523,659,784,1046]:[523,659,784])}}if(was==='PLAYING'&&game.state==='RESULT'){best=Math.max(best,game.score);try{localStorage.setItem('gakgung-coop-team-learning-best',best)}catch{}}}view.draw(game,paint);frameId=requestAnimationFrame(frame)}frameId=requestAnimationFrame(frame);
window.workshopStatus=()=>({state:game.state,time:game.time,score:game.score,players:game.players.map(p=>({x:p.x,z:p.z,held:p.held,quality:p.quality,fallen:p.fallen})),orders:game.orders.length,dry:game.dry.state,shelf:game.shelf?.type||null,teamBows:game.teamBows,lesson:game.lesson?.key||null,webglError:view.gl.getError(),canvasCount:document.querySelectorAll('canvas').length});
})();


