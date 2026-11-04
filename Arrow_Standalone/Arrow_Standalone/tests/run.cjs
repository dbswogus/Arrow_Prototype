// Development verification only. Running the game itself needs no Node.js.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
let clock=0;
const context={window:{addEventListener(){}},performance:{now:()=>clock},console};vm.createContext(context);
vm.runInContext('globalThis.Gukgung=window.Gukgung={}',context);
for(const name of ['config','game/WindSystem','game/ArrowPhysics','game/TurnManager','game/NPCArcher','input/AimProjection','input/AimController','game/Game'])vm.runInContext(fs.readFileSync(path.join(root,'js',name+'.js'),'utf8'),context);
const G=context.Gukgung,wind=new G.WindSystem(),physics=new G.ArrowPhysics(wind);
let passed=0;function test(name,fn){try{fn();console.log('PASS '+name);passed++;}catch(e){console.error('FAIL '+name);throw e;}}
function fly(aim,time=0,x=0,dt=1/120){let a=physics.launch(aim,x);for(let i=0;i<3000&&!a.done;i++)a=physics.step(a,dt,time);return a;}
const aim={yaw:0,pitch:.235,power:1};
test('상하좌우 조준 범위와 화면 방향',()=>{const l=G.AimController.fromPosition(0,0,1000,600),r=G.AimController.fromPosition(1000,600,1000,600);assert.ok(l.yaw>0&&r.yaw<0);assert.ok(l.pitch>0&&r.pitch<0);assert.equal(l.power,0);});
test('상하 각도가 수직 속도와 탄착 높이에 반영',()=>{assert.ok(physics.launch({...aim,pitch:.35}).vy>physics.launch({...aim,pitch:.15}).vy);assert.ok(fly({...aim,pitch:.35}).y>fly({...aim,pitch:.15}).y);});
test('당김은 세기만 바꾸고 선택한 고각은 보존',()=>{const high=physics.launch({...aim,power:1}),low=physics.launch({...aim,power:.3});assert.ok(high.vz>low.vz);assert.ok(Math.abs(Math.atan2(high.vy,Math.hypot(high.vx,high.vz))-.235)<1e-8);assert.ok(Math.abs(Math.atan2(low.vy,Math.hypot(low.vx,low.vz))-.235)<1e-8);});
test('바람 약 21% 감소, 오른쪽 바람은 화면 오른쪽',()=>{assert.equal(G.Config.windAcceleration,3.8);assert.ok(wind.valueAt(5)>0&&wind.accelerationAt(5)<0);const a=fly(aim,5);assert.ok(a.x<-3&&a.x>-3.6);assert.equal(a.hit,false);assert.equal(fly({...aim,yaw:.07},5).hit,true);});
test('과녁 교차 판정과 적분 안정성',()=>{const a=fly(aim),b=fly(aim,0,0,1/240);assert.equal(a.z,48);assert.equal(a.hit,true);assert.ok(Math.abs(a.x-b.x)<.01&&Math.abs(a.y-b.y)<.01);assert.equal(fly({...aim,yaw:.16}).hit,false);});
test('한 명 NPC와 10발 교대, 기록 및 종료',()=>{const t=new G.TurnManager();for(let i=0;i<10;i++){assert.equal(t.turn,i%2);assert.equal(t.round,Math.floor(i/2)+1);t.record(i%2===0);}assert.equal(t.records.length,2);assert.ok(t.done);assert.throws(()=>t.record(true));assert.equal(t.standings[0].score,5);assert.equal(t.standings[0].molgi,true);});
test('공동 순위와 NPC 물리 보정',()=>{const t=new G.TurnManager();for(let i=0;i<10;i++)t.record(true);assert.equal(t.standings[0].rank,1);assert.equal(t.standings[1].rank,1);const npc=new G.NPCArcher(wind,()=>.5);assert.equal(fly(npc.chooseAim(5),5,npc.x).hit,true);});
function surface(){const events={};return {events,addEventListener:(n,f)=>events[n]=f,setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:1000,height:600})};}
function event(id,x,y,type='touch'){return {pointerId:id,clientX:x,clientY:y,pointerType:type,button:0,preventDefault(){}};}
test('터치 조준만으로 발사하지 않고 별도 길게 누르기로 발사',()=>{const canvas=surface(),button=surface();let current,shots=0,power;
const input=new G.AimController(canvas,button,{enabled:()=>true,onAim:a=>current=a,onPower:p=>power=p,onFire:p=>{power=p;shots++;},onCancel(){}});
canvas.events.pointerdown(event(1,100,100));canvas.events.pointerup(event(1,800,200));assert.equal(shots,0);const pitch=current.pitch;
button.events.pointerdown(event(2,900,100));clock+=1000;input.update();assert.equal(power,1);assert.equal(current.pitch,pitch);assert.equal(shots,0);button.events.pointerup(event(2,900,100));assert.equal(shots,1);});
test('당김 취소와 짧은 당김은 기록을 소비하지 않음',()=>{const canvas=surface(),button=surface();let shots=0,cancelled=0;
const input=new G.AimController(canvas,button,{enabled:()=>true,onAim(){},onPower(){},onFire:()=>shots++,onCancel:()=>cancelled++});
button.events.pointerdown(event(1,0,0));input.cancel();button.events.pointerup(event(1,0,120));button.events.pointerdown(event(2,0,0));button.events.pointerup(event(2,0,10));assert.equal(shots,0);assert.equal(cancelled,2);});
test('비활성 입력 차단 및 다른 손가락 무시',()=>{const canvas=surface(),button=surface();let enabled=false,moves=0,shots=0;
new G.AimController(canvas,button,{enabled:()=>enabled,onAim:()=>moves++,onPower(){},onFire:()=>shots++,onCancel(){}});
canvas.events.pointerdown(event(1,0,0));assert.equal(moves,0);enabled=true;canvas.events.pointerdown(event(1,0,0));canvas.events.pointermove(event(2,1000,600));assert.equal(moves,1);button.events.pointerdown(event(2,0,0));button.events.pointerup(event(2,0,120));assert.equal(shots,0);});
test('연습 없이 실제 Game 루프로 10발 진행, 결과 후 재시작',()=>{
const game=Object.create(G.Game.prototype);game.time=0;game.state='PLAYER_AIM';game.wind=wind;game.physics=physics;game.npc=new G.NPCArcher(wind,()=>.5);game.manager=new G.TurnManager();game.aim={...aim};game.input={cancel(){},update(){}};
game.range={clear(){},resetTrail(){},showArrow(){},showImpact(){},update(){},trail:{material:{}}};game.camera={resetAim(){},update(){},projectAim(){return{x:50,y:50}}};let results=0;
game.hud={aim(){},ready(){},shooting(){},impact(){},records(){},npcWaiting(){},wind(){},marker(){},result(){results++;}};
let playerShots=0;for(let i=0;i<10000&&game.state!=='ROUND_RESULT';i++){if(game.state==='PLAYER_AIM'){game.fire({...aim});playerShots++;}game.update(1/60);}
assert.equal(game.state,'ROUND_RESULT');assert.equal(playerShots,5);assert.equal(results,1);assert.equal(game.manager.records[1].length,5);game.start();assert.equal(game.state,'PLAYER_AIM');assert.equal(game.manager.records[0].length,0);
});
test('HTML은 외부 코드와 CSS만 참조하고 모든 로컬 경로가 존재',()=>{const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.ok(!/<script[^>]*>\s*[^<\s]/.test(html));for(const match of html.matchAll(/(?:src|href)="([^"https:]+\.(?:js|css))"/g))assert.ok(fs.existsSync(path.join(root,match[1])));assert.ok(!html.includes('practice'));});
test('카메라 기준 커서와 조준점 일치: 가로·세로·태블릿 화면',()=>{
const projection=new G.AimProjection();
for(const [width,height] of [[1920,1080],[1024,768],[768,1024],[2560,1080]]){
const view=G.AimProjection.defaultView();view.aspect=width/height;
for(let x=0;x<=width;x+=width/10)for(let y=0;y<=height;y+=height/10){
const a=projection.fromScreen(x,y,width,height,view),p=projection.toScreen(a,view);
assert.ok(Math.abs(p.x*width/100-x)<.01);assert.ok(Math.abs(p.y*height/100-y)<.01);
}}
});
test('원점 카메라의 각도는 독립적인 원근 투영 공식과 일치',()=>{
const p=new G.AimProjection(),view={position:p.origin,look:{x:0,y:1.7,z:10},fov:55,aspect:2};
const a=p.fromScreen(1500,250,2000,1000,view),t=Math.tan(55*Math.PI/360);
assert.ok(Math.abs(a.yaw+Math.atan(t))<1e-10);
assert.ok(Math.abs(a.pitch-Math.atan(.5*t/Math.sqrt(1+t*t)))<1e-10);
});
test('이전 각도 한계와 화면 바깥 입력 없이 바람 보정각까지 도달',()=>{
const p=new G.AimProjection(),view=G.AimProjection.defaultView();view.aspect=16/9;
for(const a of [{yaw:.07,pitch:.235},{yaw:-.07,pitch:.235},{yaw:0,pitch:.15},{yaw:0,pitch:.35}]){
const point=p.toScreen(a,view);assert.ok(point.x>0&&point.x<100&&point.y>0&&point.y<100);
const actual=p.fromScreen(point.x*19.2,point.y*10.8,1920,1080,view);
assert.ok(Math.abs(actual.yaw-a.yaw)<1e-10&&Math.abs(actual.pitch-a.pitch)<1e-10);
}});
test('클릭으로 조준 고정 후 당김 버튼까지 마우스를 옮겨도 각도 유지',()=>{
const canvas=surface(),button=surface();let current;
new G.AimController(canvas,button,{enabled:()=>true,onAim:a=>current=a,onPower(){},onFire(){},onCancel(){}});
canvas.events.pointerdown(event(1,500,200,'mouse'));canvas.events.pointerup(event(1,500,200,'mouse'));const saved=current;
canvas.events.pointermove(event(1,950,400,'mouse'));assert.equal(current,saved);
canvas.events.pointerdown(event(1,650,250,'mouse'));assert.notEqual(current,saved);
});
test('정지한 포인터로 시간에 비례한 충전, 최대치 유지, 손 뗄 때 한 번 발사',()=>{
const canvas=surface(),button=surface();let power,shots=0,fired;
const input=new G.AimController(canvas,button,{enabled:()=>true,onAim(){},onPower:p=>power=p,onFire:p=>{shots++;fired=p;},onCancel(){}});
button.events.pointerdown(event(1,500,500));clock+=500;input.update();assert.equal(power,.5);assert.equal(shots,0);
clock+=2000;input.update();assert.equal(power,1);assert.equal(shots,0);
button.events.pointerup(event(1,500,500));assert.equal(shots,1);assert.equal(fired,1);
button.events.pointerup(event(1,500,500));assert.equal(shots,1);
});
test('버튼 밖으로 끌면 즉시 취소되고 다시 안으로 들어와도 발사하지 않음',()=>{
const canvas=surface(),button=surface();let shots=0,cancelled=0;
const input=new G.AimController(canvas,button,{enabled:()=>true,onAim(){},onPower(){},onFire:()=>shots++,onCancel:()=>cancelled++});
button.events.pointerdown(event(1,500,500));clock+=400;button.events.pointermove(event(1,-200,1000));assert.equal(cancelled,1);assert.equal(input.power(),0);
button.events.pointermove(event(1,500,500));button.events.pointerup(event(1,500,500));assert.equal(shots,0);assert.equal(cancelled,1);
});
test('충전 취소, 포커스 이탈, 짧은 탭과 비활성 상태는 발사하지 않음',()=>{
const canvas=surface(),button=surface();let shots=0,enabled=true;
const input=new G.AimController(canvas,button,{enabled:()=>enabled,onAim(){},onPower(){},onFire:()=>shots++,onCancel(){}});
button.events.pointerdown(event(1,0,0));clock+=500;input.cancel();button.events.pointerup(event(1,0,0));
button.events.pointerdown(event(2,0,0));clock+=50;button.events.pointerup(event(2,0,0));
button.events.pointerdown(event(3,0,0));clock+=500;enabled=false;input.update();button.events.pointerup(event(3,0,0));assert.equal(shots,0);
});
test('키보드도 누르고 있는 동안 충전하고 키를 놓으면 발사',()=>{
const canvas=surface(),button=surface();let shots=0,power;
const input=new G.AimController(canvas,button,{enabled:()=>true,onAim(){},onPower(){},onFire:p=>{shots++;power=p;},onCancel(){}});
button.events.keydown({key:' ',repeat:false,preventDefault(){}});clock+=650;input.update();assert.equal(shots,0);
button.events.keyup({key:' ',preventDefault(){}});assert.equal(shots,1);assert.equal(power,.65);
});
test('이동 이벤트 없이 버튼 밖에서 놓아도 취소, 새로 누르면 정상 발사',()=>{
const canvas=surface(),button=surface();let shots=0,cancelled=0;
new G.AimController(canvas,button,{enabled:()=>true,onAim(){},onPower(){},onFire:()=>shots++,onCancel:()=>cancelled++});
button.events.pointerdown(event(1,500,500));clock+=500;button.events.pointerup(event(1,1001,500));assert.equal(shots,0);assert.equal(cancelled,1);
button.events.pointerdown(event(2,500,500));clock+=500;button.events.pointerup(event(2,500,500));assert.equal(shots,1);
});
test('키보드 충전 중 Escape 취소',()=>{
const canvas=surface(),button=surface();let shots=0,cancelled=0;
new G.AimController(canvas,button,{enabled:()=>true,onAim(){},onPower(){},onFire:()=>shots++,onCancel:()=>cancelled++});
button.events.keydown({key:' ',repeat:false,preventDefault(){}});clock+=500;
button.events.keydown({key:'Escape',preventDefault(){}});button.events.keyup({key:' ',preventDefault(){}});assert.equal(shots,0);assert.equal(cancelled,1);
});
console.log(passed+' tests passed');
