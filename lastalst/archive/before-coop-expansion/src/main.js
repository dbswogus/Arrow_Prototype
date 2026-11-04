(function(){'use strict';
const canvas=document.getElementById('game'),game=new Workshop.Game();let view;
try{view=new WorkshopRenderer(canvas)}catch(error){console.error(error);return}
let best=0;try{best=Number(localStorage.getItem('gakgung-coop-year-best'))||0}catch{}
view.buttons=[];view.resize();const input=attachControls(canvas,game,view,command);
function command(id){if(id==='touch'){view.touchUI=!view.touchUI;view.resize();input.clear()}if(id==='tutorial')game.state='TUTORIAL';if(id==='play'){game.start();input.resume()}if(id==='title'){game.state='TITLE';input.resume()}if(id==='resume')input.resume()}
window.addEventListener('resize',()=>{view.resize();input.clear()});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();input.clear();cancelAnimationFrame(frameId)});canvas.addEventListener('webglcontextrestored',()=>location.reload());
const colors=['#78c9ea','#ffa384'];
function paint(c,r){const W=r.W,H=r.H;c.clearRect(0,0,W,H);r.buttons=[];
 const panel=(x,y,w,h,bg='#17383e')=>{c.fillStyle=bg;c.beginPath();c.roundRect(x-w/2,y-h/2,w,h,12);c.fill()};
 const text=(s,x,y,size=24,color='#fff2d5')=>{c.font=`700 ${size*(game.state==='PLAYING'?.68:.75)}px "Malgun Gothic",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(s,x,y)};
 const lines=(s,x,y,size=24,color)=>s.split('\n').forEach((line,i,a)=>text(line,x,y+(i-(a.length-1)/2)*(size+12),size,color));
 const button=(id,label,x,y,w=260,h=64,kind,player)=>{panel(x,y,w,h,player===0?'#285f76':player===1?'#8d493a':'#b86b3e');lines(label,x,y,24);r.buttons.push({id,x,y,w,h,kind,player})};
 if(game.state==='PLAYING'){
 panel(W/2,29,W-30,44);text('각궁 공방 · 게임 속 1년 = 45초',W*.29,29,25);text(`${Math.ceil(game.time)}초   ${game.score}점`,W*.79,29,28);
 if(game.orders.length){const t=game.orders[0],days=Math.max(0,Math.ceil(t/Workshop.orderDuration*Workshop.orderYearDays));panel(W/2,76,530,38);text(`완성 활 의뢰 · 납기까지 ${days}일 · ${Math.ceil(t)}초`,W/2,76,22,t<12?'#ffb486':undefined)}else{panel(W/2,76,530,38);text('새 주문 마감 · 남은 작업을 정리해요',W/2,76,22)}
 button('touch',r.touchUI?'조이스틱 숨기기':'조이스틱 보기',W-91,76,158,34);
 Workshop.benches.forEach(b=>{const [x,y]=r.project(b.x,1.9,b.z);panel(x,y,typeof b.id==='number'?174:134,28,'#18393e');text(b.label,x,y,18);if(typeof b.id==='number'){const state=game.stations[b.id], [bx,by]=r.project(b.x,1.08,b.z+.55);if(state.state==='processing'){panel(bx,by,112,10,'#25403f');c.fillStyle='#85d3b4';c.fillRect(bx-52,by-3,104*state.t/state.duration,6)}if(state.state==='ready'){c.fillStyle='#bce39a';c.beginPath();c.arc(bx,by,9,0,Math.PI*2);c.fill();c.strokeStyle='#234331';c.lineWidth=2;c.beginPath();c.moveTo(bx-4,by);c.lineTo(bx-1,by+3);c.lineTo(bx+5,by-4);c.stroke()}}});
 game.players.forEach((p,i)=>{const [x,y]=r.project(p.x,1.95,p.z);text(`P${i+1}`,x,y,22,colors[i]);const f=game.focus(i);if(f){const [fx,fy]=r.project(f.x,1.4,f.z);c.strokeStyle=colors[i];c.lineWidth=3;c.strokeRect(fx-50,fy-10,100,20)}const cx=W*(i?.75:.25),infoY=H-(r.touchUI?148:39);panel(cx,infoY,W/2-24,48);text(`P${i+1} · ${Workshop.names[p.held]||'빈손'} · ${i?'방향키 / Enter / R Shift':'WASD / F / G'}`,cx,infoY-9,21,colors[i]);text(p.notice>0?p.message:(f?'행동: '+f.label:'서로 도와 주문을 완성해요'),cx,infoY+13,17);if(r.touchUI){const sx=W*(i?.57:.07)+22,sy=H-65;
 c.fillStyle=i?'#7d493b':'#285b70';c.beginPath();c.arc(sx,sy,49,0,Math.PI*2);c.fill();c.strokeStyle=colors[i];c.lineWidth=2;c.stroke();const stick=input.sticks[i];c.fillStyle=colors[i];c.beginPath();c.arc(sx+stick.x*27,sy+stick.y*27,18,0,Math.PI*2);c.fill();r.buttons.push({kind:'stick',player:i,x:sx,y:sy,w:108,h:108});text(i?'방향키':'WASD',sx,sy+47,16);
 button('act','행동\n'+(i?'Enter':'F'),W*(i?.75:.25),sy,108,82,'act',i);button('drop','놓기\n'+(i?'R Shift':'G'),W*(i?.91:.41),sy,106,82,'drop',i);
 } });
 if(input.paused){panel(W/2,H/2,Math.min(W-30,700),220,'#18353e');lines('잠시 쉬는 중\n화면을 떠나면 시간이 멈춥니다',W/2,H/2-38,25);button('resume','계속하기',W/2,H/2+60)}
 }else{
 c.fillStyle='rgba(9,24,29,.88)';c.fillRect(0,0,W,H);text('GAKGUNG · TWO MAKERS, ONE WORKSHOP',W/2,H*.13,22,'#b7d6cb');text(game.state==='TITLE'?'각궁 공방 대소동':game.state==='TUTORIAL'?'둘이 함께 만드는 작은 공방':'오늘의 공방 마감',W/2,H*.24,W<1000?42:52);
 if(game.state==='TITLE'){lines('한 화면 · 두 장인 · 180초 / 주문 한 건씩\n재료를 건네고, 길을 양보하고, 주문을 완성하세요',W/2,H*.43,28);button('tutorial','공방 문 열기',W/2,H*.64);text(`2인 로컬 협동 · 최고 기록 ${best}점`,W/2,H*.77,24)}
 else if(game.state==='TUTORIAL'){lines('몸체 창고 → ① 몸체 가공 5초 → 활 몸체\n활 몸체 + 뿔 창고의 뿔 → ② 뿔 결합 6초\n결합 몸체 → ③ 마감 4초 → 완성 활 → 출고',W/2,H*.40,25);lines('P1  WASD 이동 / F 행동 / G 내려놓기\nP2  방향키 이동 / Enter 행동 / 오른쪽 Shift 내려놓기\n태블릿: 각자 색깔의 조이스틱 · 행동 · 놓기',W/2,H*.60,23);text('한 주문의 납기 1년을 45초로 압축! 빠른 충돌은 조심해요.',W/2,H*.74,22);button('play','함께 180초 시작',W/2,H*.85)}
 else{lines(`함께 납품 ${game.delivered}개 · 공동 점수 ${game.score}점\n만료 주문 ${game.expired}건 · 충돌 ${game.collisions}회\n최고 기록 ${best}점`,W/2,H*.45,29);button('play','다시 함께하기',W/2,H*.67);button('title','처음으로',W/2,H*.80)}
 text('약 1년 걸리는 제작 사례를 소재로, 주문 납기 1년을 45초로 압축했습니다.',W/2,H-28,20,'#c1c4ad');
 }
}
let last=performance.now(),frameId;function frame(now){const dt=Math.min((now-last)/1000,.1);last=now;if(!input.paused){const was=game.state;game.tick(dt,input.axes());if(was==='PLAYING'&&game.state==='RESULT'){best=Math.max(best,game.score);try{localStorage.setItem('gakgung-coop-year-best',best)}catch{}}}view.draw(game,paint);frameId=requestAnimationFrame(frame)}frameId=requestAnimationFrame(frame);
// Read-only diagnostics for browser verification; game actions remain user input.
window.workshopStatus=()=>({state:game.state,time:game.time,score:game.score,players:game.players.map(p=>({x:p.x,z:p.z,held:p.held,fallen:p.fallen})),orders:game.orders.length,webglError:view.gl.getError(),canvasCount:document.querySelectorAll('canvas').length});
})();
