/* Pure game model; classic scripts also work through file:// without a server. */
(function(root){
'use strict';
const names={wood:'몸체 재료',horn:'뿔 재료',body:'활 몸체',joined:'결합 몸체',bow:'완성 활'};
const benches=[
 {id:'wood',x:-7.2,z:-3.7,label:'몸체 창고',color:'#bc9366'},
 {id:'horn',x:-7.2,z:3.7,label:'뿔 창고',color:'#d7be89'},
 {id:0,x:0,z:-3.7,label:'① 몸체 가공 · 5초',color:'#4eaaa1'},
 {id:1,x:0,z:3.7,label:'② 뿔 결합 · 6초',color:'#e1a449'},
 {id:2,x:7.2,z:-3.7,label:'③ 마감 · 4초',color:'#9994ca'},
 {id:'ship',x:7.2,z:3.7,label:'출고 · +100점',color:'#79a763'}];
const radius=.43, speed=4.2, orderDuration=45, orderYearDays=365;
class Game{
 constructor(){this.reset();this.state='TITLE'}
 reset(){this.time=180;this.score=0;this.delivered=0;this.expired=0;this.collisions=0;this.orders=[orderDuration];this.dropped=[];this.players=[-1,1].map((x,i)=>({x,z:0,vx:0,vz:0,held:null,fallen:0,guard:0,face:{x:0,z:1},message:i?'방향키 / Enter / 오른쪽 Shift':'WASD / F / G',notice:0}));this.stations=[5,6,4].map((duration,i)=>({state:'idle',input:null,t:0,duration,output:['body','joined','bow'][i]}));}
 start(){this.reset();this.state='PLAYING'}
 say(p,text){p.message=text;p.notice=3}
 valid(x,z){return Math.abs(x)<=8.5&&Math.abs(z)<=5.3&&!benches.some(b=>Math.abs(x-b.x)<1.16+radius&&Math.abs(z-b.z)<.76+radius)}
 move(p,dx,dz,dt){p.vx=p.vz=0;if(p.fallen>0)return;const n=Math.max(1,Math.hypot(dx,dz));dx/=n;dz/=n;if(dx||dz)p.face={x:dx,z:dz};const ox=p.x,oz=p.z;const x=ox+dx*speed*dt,z=oz+dz*speed*dt;if(this.valid(x,p.z))p.x=x;if(this.valid(p.x,z))p.z=z;p.vx=(p.x-ox)/dt;p.vz=(p.z-oz)/dt;}
 drop(i,crash=false){const p=this.players[i];if(this.state!=='PLAYING'||(!crash&&p.fallen)||!p.held)return;let x=p.x+p.face.x*.65,z=p.z+p.face.z*.65;if(!this.valid(x,z)){x=p.x;z=p.z}this.dropped.push({type:p.held,x,z});p.held=null;if(!crash)this.say(p,'바닥에 놓았어요. 빈손으로 행동하면 회수!')}
 collide(){const [a,b]=this.players;let dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d>=radius*2)return;const nx=d<.0001?1:dx/d,nz=d<.0001?0:dz/d;const approach=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;if(approach>3&&!a.guard&&!b.guard&&!a.fallen&&!b.fallen){this.collisions++;this.players.forEach((p,i)=>{p.fallen=.7;p.guard=1.7;this.drop(i,true);this.say(p,'쿵! 떨어진 물건을 다시 주워요')})}const push=(radius*2-d)/2+.002;for(const [p,s] of [[a,-1],[b,1]]){if(this.valid(p.x+s*nx*push,p.z))p.x+=s*nx*push;if(this.valid(p.x,p.z+s*nz*push))p.z+=s*nz*push}}
 focus(i){const p=this.players[i];return benches.map(b=>({...b,d:Math.hypot(p.x-b.x,p.z-b.z)})).filter(b=>b.d<2.25).sort((a,b)=>a.d-b.d)[0]||null}
 action(i){if(this.state!=='PLAYING')return;const p=this.players[i];if(p.fallen)return; // Dropped items take priority only within easy reach.
 if(!p.held){let best=-1,d=1.1;this.dropped.forEach((v,j)=>{const n=Math.hypot(v.x-p.x,v.z-p.z);if(n<d){d=n;best=j}});if(best>=0){p.held=this.dropped.splice(best,1)[0].type;this.say(p,names[p.held]+' 회수');return}}
 const b=this.focus(i);if(!b){this.say(p,'작업대나 바닥 물건 가까이 이동하세요');return}this.actAt(i,b.id)}
 actAt(i,id){if(this.state!=='PLAYING')return false;const p=this.players[i];if(p.fallen)return false;const fail=s=>{this.say(p,s);return false};
 if(id==='wood'||id==='horn'){if(p.held)return fail('손에는 하나만! 먼저 내려놓으세요');p.held=id;this.say(p,names[id]+' 집기');return true}
 if(id==='ship'){if(p.held!=='bow')return fail('완성 활만 출고할 수 있어요');if(!this.orders.length)return fail('남은 주문이 없어요');p.held=null;this.orders.shift();this.score+=100;this.delivered++;if(this.time>20)this.orders.push(orderDuration);this.say(p,'납품 완료! 공동 점수 +100');return true}
 const s=this.stations[id];if(!s)return false;if(s.state==='processing')return fail('작업 중! 다른 주문을 도와주세요');if(s.state==='ready'){if(p.held)return fail('빈손으로 결과물을 집으세요');p.held=s.output;s.state='idle';s.input=null;s.t=0;this.say(p,names[p.held]+' 완성!');return true}
 const expected=id===0?'wood':id===1?(s.input?'horn':'body'):'joined';if(p.held!==expected)return fail('필요한 물건: '+names[expected]);p.held=null;if(id===1&&!s.input){s.input='body';this.say(p,'활 몸체 투입! 이제 뿔 재료를 가져오세요');return true}s.state='processing';s.t=0;this.say(p,'작업 시작! 다른 일을 도와주세요');return true}
 tick(dt,axes=[[0,0],[0,0]]){if(this.state!=='PLAYING'||dt<=0)return; // Substeps prevent tunnelling and keep collisions independent of frame rate.
 let left=Math.min(dt,this.time);while(left>1e-7){const h=Math.min(left,1/120);this.players.forEach((p,i)=>{p.fallen=Math.max(0,p.fallen-h);p.guard=Math.max(0,p.guard-h);p.notice=Math.max(0,p.notice-h);this.move(p,...axes[i],h)});this.collide();this.stations.forEach(s=>{if(s.state==='processing'){s.t=Math.min(s.duration,s.t+h);if(s.t>=s.duration-1e-7)s.state='ready'}});this.time=Math.max(0,this.time-h);this.orders=this.orders.map(t=>t-h).filter(t=>{if(t<=0){this.expired++;return false}return true});while(this.orders.length<1&&this.time>20)this.orders.push(orderDuration);left-=h;}if(this.time<1e-6){this.time=0;this.state='RESULT'}}
}
root.Workshop={Game,names,benches,radius,orderDuration,orderYearDays};
})(typeof globalThis!=='undefined'?globalThis:this);
