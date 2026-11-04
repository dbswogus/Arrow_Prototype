/* Offline, engine-free game rules. All craft timing and quality systems are game abstractions. */
(function(root){'use strict';
const names={wood:'몸체 재료',horn:'접합 재료 묶음',body:'활 몸체',joined:'결합 몸체',dried:'건조 몸체',balanced:'균형 잡은 활',bow:'완성 활'};
const benches=[
 {id:'wood',x:-10,z:-3.7,label:'몸체 창고',color:'#bc9366'},
 {id:'horn',x:-10,z:3.7,label:'접합 재료 창고',color:'#d7be89'},
 {id:0,x:-6.3,z:-3.7,label:'몸체 · 3초',color:'#4eaaa1'},
 {id:1,x:-6.3,z:3.7,label:'접합 · 4초',color:'#e1a449'},
 {id:3,x:7.3,z:1.0,label:'⑥ 해궁 · 2초',color:'#82aca7'},
 {id:2,x:10,z:-3.7,label:'⑦ 화피단장 · 2초',color:'#9994ca'},
 {id:'ship',x:10,z:3.7,label:'⑧ 각궁 완성 · 출고',color:'#79a763'}];
const props=[{id:'dry',x:0,z:0,w:2.2,d:4.2,label:'건조 · 3초'},
 {id:'shelf',x:0,z:-3.7,w:1.6,d:.9,label:''},
 {id:'divider',x:4.2,z:.4,w:.9,d:4.2,label:'도구 보관대'},
 {id:'partition',x:0,z:-5.2,w:.3,d:1.6,label:''}];
const radius=.43,speed=4.2,orderDuration=30,room={halfWidth:12,halfDepth:6};
const facts={body:{title:'몸체',text:'나무를 손질해 활의 기본 몸체를 만들어요.'},bond:{title:'뿔 붙이기',text:'부레풀로 나무와 뿔을 단단히 붙여요.'},sinew:{title:'심줄 올리기',text:'뿔·대나무·심줄이 함께 활의 탄력을 만들어요.'},dry:{title:'건조',text:'재료가 붙도록 말릴 때 온도와 습도도 살펴요.'},balance:{title:'해궁',text:'해궁은 활의 모양과 균형을 잡는 과정이에요.'},finish:{title:'화피단장',text:'겉면을 나무껍질로 감싸 습기로부터 보호해요.'}};
function cargo(p){return {type:p.held,quality:p.quality||0,polished:!!p.polished,makers:p.makers||0}}
function clearHand(p){p.held=null;p.quality=0;p.makers=0;p.polished=false;p.polish=null}
function give(p,item){p.held=item.type;p.quality=item.quality||0;p.makers=item.makers||0;p.polished=!!item.polished;p.polish=null}
class Game{
 constructor(){this.reset();this.state='TITLE'}
 reset(){this.time=180;this.score=0;this.delivered=0;this.expired=0;this.collisions=0;this.orders=[orderDuration];this.dropped=[];this.shelf=null;this.dry={state:'idle',t:0,duration:3,item:null};this.effects=[];this.effectId=0;this.handoffs=0;this.qualityBows=0;this.streak=0;this.bestStreak=0;this.bestBow=0;this.teamBows=0;this.shelfPasses=0;this.learningSeen=new Set();this.lessonQueue=[];this.lesson=null;this.clock=0;
 this.players=[{x:-8,z:-1.2},{x:8,z:-1}].map((v,i)=>({...v,vx:0,vz:0,held:null,quality:0,polished:false,polish:null,fallen:0,guard:0,face:{x:i?-1:1,z:0},message:i?'오른쪽 마무리 담당 · 선반에서 이어받아요':'왼쪽 재료 담당 · 선반으로 건네요',notice:5}));
 this.stations=[3,4,2,2].map((duration,i)=>({state:'idle',input:null,t:0,duration,output:['body','joined','bow','balanced'][i],item:null,balanceTried:false,balanced:false}));}
 learn(key){if(this.learningSeen.has(key))return;this.learningSeen.add(key);const card={...facts[key],key,life:4};if(!this.lesson)this.lesson=card;else this.lessonQueue.push(card)}
 balanceMarker(){const t=this.stations[3].t;return 1-Math.abs((t%2)-1)}
 start(){this.reset();this.state='PLAYING'}
 say(p,message){p.message=message;p.notice=3}
 solid(x,z){return benches.some(b=>Math.abs(x-b.x)<1.16&&Math.abs(z-b.z)<.76)||props.some(b=>Math.abs(x-b.x)<b.w/2&&Math.abs(z-b.z)<b.d/2)}
 valid(x,z){return Math.abs(x)<=room.halfWidth-.5&&Math.abs(z)<=room.halfDepth-.7&&!benches.some(b=>Math.abs(x-b.x)<1.16+radius&&Math.abs(z-b.z)<.76+radius)&&!props.some(b=>Math.abs(x-b.x)<b.w/2+radius&&Math.abs(z-b.z)<b.d/2+radius)}
 move(p,dx,dz,dt){p.vx=p.vz=0;if(p.fallen||p.polish)return;const n=Math.max(1,Math.hypot(dx,dz));dx/=n;dz/=n;if(dx||dz){const f=Math.hypot(dx,dz);p.face={x:dx/f,z:dz/f}}const ox=p.x,oz=p.z,x=ox+dx*speed*dt,z=oz+dz*speed*dt;if(this.valid(x,p.z))p.x=x;if(this.valid(p.x,z))p.z=z;p.vx=(p.x-ox)/dt;p.vz=(p.z-oz)/dt}
 drop(i,crash=false){const p=this.players[i];if(this.state!=='PLAYING'||(!crash&&p.fallen)||!p.held)return;let x=p.x+p.face.x*.65,z=p.z+p.face.z*.65;if(!this.valid(x,z)){x=p.x;z=p.z}this.dropped.push({...cargo(p),x,z});clearHand(p);if(!crash)this.say(p,'바닥에 놓았어요. 파트너도 집을 수 있어요')}
 collide(){const [a,b]=this.players,dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d>=radius*2)return;const nx=d<.0001?1:dx/d,nz=d<.0001?0:dz/d,approach=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;if(approach>3&&!a.guard&&!b.guard&&!a.fallen&&!b.fallen){this.collisions++;this.players.forEach((p,i)=>{p.fallen=.7;p.guard=1.7;this.drop(i,true);this.say(p,'쿵! 물건을 다시 주워요')})}const push=(radius*2-d)/2+.002;for(const [p,s]of [[a,-1],[b,1]]){if(this.valid(p.x+s*nx*push,p.z))p.x+=s*nx*push;if(this.valid(p.x,p.z+s*nz*push))p.z+=s*nz*push}}
 visible(p,b){for(let t=.12;t<1;t+=.1)if(this.solid(p.x+(b.x-p.x)*t,p.z+(b.z-p.z)*t))return false;return true}
 focus(i){const p=this.players[i],options=[...benches,...props.filter(b=>b.id!=='divider'&&b.id!=='partition')];return options.map(b=>({...b,d:Math.hypot(p.x-b.x,p.z-b.z)})).filter(b=>b.d<(b.id==='dry'?2.65:2.25)).sort((a,b)=>a.d-b.d)[0]||null}
 handoff(i){const p=this.players[i],other=this.players[1-i];if(!p.held||other.held||p.fallen||other.fallen||p.polish||other.polish)return false;const dx=other.x-p.x,dz=other.z-p.z,d=Math.hypot(dx,dz);if(d<.5||d>1.55||(p.face.x*dx+p.face.z*dz)/d<.55||(-other.face.x*dx-other.face.z*dz)/d<.25||!this.visible(p,other))return false;give(other,{...cargo(p),makers:(p.makers||0)|(1<<(1-i))});clearHand(p);this.handoffs++;this.say(p,'파트너에게 건넸어요');this.say(other,'재료를 받았어요!');return true}
 polishMarker(p){return p.polish?1-Math.abs((p.polish.t%2)-1):0}
 finishPolish(p){if(!p.polish)return;const marker=this.polishMarker(p),success=p.polish.t>=.3&&Math.abs(marker-.5)<=.13;if(success)p.quality=Math.min(50,p.quality+25);p.polish=null;this.say(p,success?'화피단장 성공! 품질 +25':'기본 품질 유지! 바로 납품해도 좋아요')}
 action(i){if(this.state!=='PLAYING')return;const p=this.players[i];if(p.fallen)return;if(p.polish){this.finishPolish(p);return}if(this.handoff(i))return;
 if(!p.held){let best=-1,d=1.1;this.dropped.forEach((item,j)=>{const n=Math.hypot(item.x-p.x,item.z-p.z);if(n<d){d=n;best=j}});if(best>=0){give(p,this.dropped.splice(best,1)[0]);this.say(p,names[p.held]+' 회수');return}}
 const b=this.focus(i);if(!b){this.say(p,'파트너나 작업대 가까이 이동하세요');return}this.actAt(i,b.id)}
 actAt(i,id){if(this.state!=='PLAYING')return false;const p=this.players[i];if(p.fallen)return false;const fail=s=>{this.say(p,s);return false};
 if(id==='wood'||id==='horn'){if(p.held)return fail('손에는 하나만 들 수 있어요');give(p,{type:id,makers:1<<i});this.say(p,names[id]+' 집기');return true}
 if(id==='shelf'){if(p.held&&this.shelf)return fail('선반이 가득 찼어요');if(p.held){this.shelf={...cargo(p),from:i};clearHand(p);this.say(p,'전달 선반에 맡겼어요');return true}if(!this.shelf)return fail('선반이 비어 있어요');if(this.shelf.from!==i)this.shelfPasses++;give(p,{...this.shelf,makers:(this.shelf.makers||0)|(1<<i)});this.shelf=null;this.say(p,'선반에서 받았어요');return true}
 if(id==='dry'){const d=this.dry;if(d.state==='processing')return fail('건조 중이에요. 다른 일을 도와주세요');if(d.state==='ready'){if(p.held)return fail('빈손으로 건조 몸체를 집으세요');give(p,{...d.item,type:'dried'});d.state='idle';d.item=null;this.say(p,'건조 완료! 해궁대로 가져가요');return true}if(p.held!=='joined')return fail('접합된 몸체를 건조대에 걸어요');d.item=cargo(p);clearHand(p);d.state='processing';d.t=0;this.learn('dry');this.say(p,'건조 시작! 3초 후 꺼내요');return true}
 if(id==='ship'){if(p.held!=='bow')return fail('완성 활만 출고할 수 있어요');if(!this.orders.length)return fail('남은 주문이 없어요');const value=100+(p.quality||0);this.orders.shift();this.score+=value;this.delivered++;this.streak++;this.bestStreak=Math.max(this.bestStreak,this.streak);this.bestBow=Math.max(this.bestBow,value);if(p.quality)this.qualityBows++;if((p.makers&3)===3)this.teamBows++;this.effects.push({id:++this.effectId,type:'delivery',value,life:2.5,x:10,z:3.7});clearHand(p);if(this.time>20)this.orders.push(orderDuration);this.say(p,`포장·납품 완료! +${value}점`);return true}
 const s=this.stations[id];if(!s)return false;
 if(id===2&&p.held==='bow'){if(p.polished)return fail('추가 화피단장은 한 번만! 이제 출고해요');p.polished=true;p.polish={t:0};this.say(p,'표시가 초록 구간에 오면 행동!');return true}
 if(s.state==='processing'){if(id===3&&!p.held&&s.t<s.duration-1e-7){if(s.balanceTried)return fail('균형 맞추기는 한 번만! 해궁 완료를 기다려요');s.balanceTried=true;const success=s.t>=.3&&Math.abs(this.balanceMarker()-.5)<=.13;if(success){s.balanced=true;s.item.quality=Math.min(50,(s.item.quality||0)+25)}this.say(p,success?'해궁 균형 성공! 품질 +25':'균형 보너스 없이 계속 만들어요');return success}return fail('작업 중! 다른 일을 도와주세요')}
if(s.state==='ready'){if(p.held)return fail('빈손으로 결과물을 집으세요');give(p,{type:s.output,quality:s.item?.quality||0,makers:(s.item?.makers||0)|(1<<i)});s.state='idle';s.input=null;s.item=null;s.t=0;s.balanceTried=false;s.balanced=false;this.say(p,names[p.held]+' 완성!');return true}
 const expected=id===0?'wood':id===1?(s.input?'horn':'body'):id===3?'dried':'balanced';if(p.held!==expected)return fail('필요한 물건: '+names[expected]);const item={...cargo(p),makers:(p.makers||0)|(1<<i)};clearHand(p);if(id===1&&!s.input){s.input='body';s.baseMakers=item.makers;this.say(p,'활 몸체 투입! 뿔·심줄 재료 묶음도 넣어요');return true}s.item={...item,makers:item.makers|(id===1?(s.baseMakers||0):0)};this.learn(id===0?'body':id===1?'bond':id===3?'balance':'finish');s.state='processing';s.t=0;s.balanceTried=false;s.balanced=false;this.say(p,id===3?'해궁 시작! 초록 구간에서 행동하면 품질 +25':'작업 시작! 다른 일을 도와주세요');return true}
 tick(dt,axes=[[0,0],[0,0]]){if(this.state!=='PLAYING'||dt<=0)return;let left=Math.min(dt,this.time);while(left>1e-7){const h=Math.min(left,1/120);this.clock+=h;if(this.lesson){this.lesson.life-=h;if(this.lesson.life<=0)this.lesson=this.lessonQueue.shift()||null}this.players.forEach((p,i)=>{p.fallen=Math.max(0,p.fallen-h);p.guard=Math.max(0,p.guard-h);p.notice=Math.max(0,p.notice-h);if(p.polish){p.polish.t+=h;if(p.polish.t>=3){p.polish=null;this.say(p,'화피단장 종료! 기존 품질 유지')}}this.move(p,...axes[i],h)});this.collide();this.stations.forEach((s,i)=>{if(s.state==='processing'){const oldT=s.t;s.t=Math.min(s.duration,s.t+h);if(i===1&&oldT<2&&s.t>=2-1e-7)this.learn('sinew');if(s.t>=s.duration-1e-7)s.state='ready'}});const s=this.dry;if(s.state==='processing'){s.t=Math.min(s.duration,s.t+h);if(s.t>=s.duration-1e-7)s.state='ready'}this.effects=this.effects.map(e=>({...e,life:e.life-h})).filter(e=>e.life>0);this.time=Math.max(0,this.time-h);this.orders=this.orders.map(t=>t-h).filter(t=>{if(t<=0){this.expired++;this.streak=0;return false}return true});while(this.orders.length<1&&this.time>20)this.orders.push(orderDuration);left-=h}if(this.time<1e-6){this.time=0;this.state='RESULT';this.players.forEach(p=>p.polish=null)}}
}
function processName(id,t){return id===0?(t<1.5?'① 재료 손질':'② 활 몸체 만들기'):id===1?(t<2?'③ 물소뿔 붙이기':'④ 쇠심줄 올리기'):id===3?'⑥ 해궁하기':id===2?'⑦ 화피단장':'⑤ 건조하기'}
root.Workshop={Game,names,benches,props,radius,orderDuration,processName,room,facts};
})(typeof globalThis!=='undefined'?globalThis:this);






