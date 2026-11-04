(function(){'use strict';
// Direct WebGL: CPU orthographic projection, triangle geometry, flat lit faces,
// one batched color pass and one RGBA UI texture pass. No external engine.
class Renderer{
 constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:true});if(!this.gl)throw Error('이 기기는 WebGL을 사용할 수 없습니다');const gl=this.gl;
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
 const program=(vs,fs)=>{const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p};
 this.color=program('attribute vec2 a;attribute vec4 c;attribute vec2 u;varying vec4 v;varying vec2 uv;void main(){gl_Position=vec4(a,0.,1.);v=c;uv=u;}','precision mediump float;uniform sampler2D modelTex;varying vec4 v;varying vec2 uv;void main(){gl_FragColor=uv.x<0.?v:v*texture2D(modelTex,vec2((fract(uv.x)+step(5.,uv.x))*.5,fract(uv.y)));}');
 this.ui=program('attribute vec2 a;varying vec2 uv;void main(){gl_Position=vec4(a,0.,1.);uv=vec2((a.x+1.)*.5,(1.-a.y)*.5);}','precision mediump float;uniform sampler2D t;varying vec2 uv;void main(){gl_FragColor=texture2D(t,uv);}');
 this.buffer=gl.createBuffer();this.quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);this.tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 this.modelTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.modelTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));const image=new Image();image.onload=()=>{gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.modelTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.activeTexture(gl.TEXTURE0)};image.onerror=()=>console.error('캐릭터 내장 텍스처를 읽지 못했습니다');image.src=WorkshopCharacters.atlas;gl.activeTexture(gl.TEXTURE0);
 this.layer=document.createElement('canvas');this.ctx=this.layer.getContext('2d');this.vertices=[];
 }
 resize(){const d=Math.min(devicePixelRatio||1,1.75),w=innerWidth,h=innerHeight;this.canvas.width=Math.round(w*d);this.canvas.height=Math.round(h*d);this.W=w<h?900:1280;this.H=this.W*h/w;this.layer.width=this.W;this.layer.height=Math.round(this.H);if(this.touchUI===undefined)this.touchUI=true;const top=100,bottom=this.H-(this.touchUI?190:68);this.scale=Math.max(8,Math.min((this.W-60)/18.5,(bottom-top)/9.7));this.cy=(top+bottom)/2+.49*this.scale;this.gl.viewport(0,0,this.canvas.width,this.canvas.height)}
 project(x,y,z){if(this.itemPose){const p=this.itemPose,xx=x*p.co+z*p.si;z=z*p.co-x*p.si;x=p.x+xx;z+=p.z}return [this.W/2+x*this.scale,this.cy+(z*.72-y*.85)*this.scale]}
 rgb(hex,f=1){return [parseInt(hex.slice(1,3),16)/255*f,parseInt(hex.slice(3,5),16)/255*f,parseInt(hex.slice(5,7),16)/255*f,1]}
 polygon(points,color,f=1){const c=this.rgb(color,f);for(let i=1;i<points.length-1;i++)for(const p of [points[0],points[i],points[i+1]])this.vertices.push(p[0]/this.W*2-1,1-p[1]/this.H*2,...c,-1,-1)}
 box(x,y,z,w,h,d,color){const p=(a,b,c)=>this.project(x+a,y+b,z+c);const a=p(-w/2,0,-d/2),b=p(w/2,0,-d/2),c=p(w/2,0,d/2),e=p(-w/2,0,d/2),A=p(-w/2,h,-d/2),B=p(w/2,h,-d/2),C=p(w/2,h,d/2),E=p(-w/2,h,d/2);this.polygon([e,c,C,E],color,.7);this.polygon([c,b,B,C],color,.52);this.polygon([A,B,C,E],color)}
 circle(x,y,z,r,color){const center=this.project(x,y,z),pts=[];for(let i=0;i<24;i++)pts.push(this.project(x+Math.cos(i*Math.PI/12)*r,y,z+Math.sin(i*Math.PI/12)*r));this.polygon(pts,color)}
 beam(x1,y,z1,x2,z2,width,height,color){const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz)||1,px=-dz/len*width/2,pz=dx/len*width/2;const p=(x,h,z)=>this.project(x,h,z);const a=p(x1+px,y,z1+pz),b=p(x2+px,y,z2+pz),c=p(x2-px,y,z2-pz),d=p(x1-px,y,z1-pz),A=p(x1+px,y+height,z1+pz),B=p(x2+px,y+height,z2+pz),C=p(x2-px,y+height,z2-pz),D=p(x1-px,y+height,z1-pz);this.polygon([d,c,C,D],color,.65);this.polygon([c,b,B,C],color,.8);this.polygon([A,B,C,D],color)}
 item(type,x,y,z){
 if(type==='wood'){this.box(x,y,z,.85,.14,.25,'#bd8a54');this.box(x-.12,y+.14,z-.035,.55,.06,.2,'#d3a76d');return}
 if(type==='horn'){// Tapered ivory horn, curved silhouette and dark root.
 const points=[[x-.42,z-.14],[x-.27,z+.03],[x-.04,z+.17],[x+.2,z+.18],[x+.39,z+.08],[x+.49,z-.11]];for(let k=0;k<points.length-1;k++)this.beam(points[k][0],y,points[k][1],points[k+1][0],points[k+1][1],.22*(1-k/5),.13*(1-k/6),'#f4e4ba');this.box(x-.39,y+.01,z-.11,.2,.14,.18,'#5b4534');for(let k=0;k<3;k++)this.beam(x-.24,y+.14+k*.035,z+.28,x+.32,z+.28,.035,.025,'#cead76');return}
 const completed=type==='bow',formed=completed||type==='balanced',joined=type==='joined'||type==='dried',points=[];for(let k=0;k<=12;k++){const t=k/12;points.push([x+(t-.5)*1.22,z+.36*Math.sin(t*Math.PI)-(formed?.09*Math.cos(t*4*Math.PI):0)])}
 for(let k=0;k<points.length-1;k++){const [a,b]=points[k], [c,d]=points[k+1];if(joined)this.beam(a,y,b,c,d,.16,.08,'#573b2d');this.beam(a,y+(joined?.08:0),b,c,d,joined?.09:.105,.09,completed?'#e3ba66':joined?'#bf8d4e':'#e2b879')}
 if(joined){for(const k of [2,5,8,10]){const [a,b]=points[k];this.box(a,y+.18,b,.095,.035,.2,type==='dried'?'#a9c990':'#f5dcab')}}
 if(type==='balanced')this.box(x,y+.1,z+.36,.19,.07,.18,'#8bb6c0');
 if(completed){const first=points[0],last=points.at(-1);this.beam(first[0],y+.05,first[1],last[0],last[1],.018,.02,'#fff1cd');for(const k of [1,6,11]){const [a,b]=points[k];this.box(a,y+.1,b,k===6?.2:.105,.09,.16,k===6?'#284f63':'#a94336')}}
 }
 station(b,game){const x=b.x,z=b.z;
 if(b.id==='wood'||b.id==='horn'){// Open wooden stock crates with slats.
 this.box(x,0,z,2.15,.18,1.45,'#5b402c');for(const xx of [-1,1])this.box(x+xx,.18,z,.13,.68,1.45,'#a47745');this.box(x,.18,z-.67,2.15,.68,.12,'#a47745');for(let k=0;k<3;k++)this.box(x,.2+k*.16,z+.67,2.15,.1,.12,'#ba9057');for(let k=0;k<3;k++)this.item(b.id,x+(k-1)*.52,.42+k*.07,z-.1+(k%2)*.24);return}
 if(b.id==='ship'){this.box(x,0,z,2.15,.66,1.45,'#71694b');this.box(x,.66,z,2.32,.13,1.6,'#7c9a65');this.box(x-.65,.79,z+.05,.7,.14,.9,'#b28b57');for(let k=0;k<3;k++)this.box(x-.65,.94+k*.11,z+.05,.7,.07,.9,'#bd9c6e');const arrow=[[x+.05,.81,z-.15],[x+.55,.81,z-.15],[x+.55,.81,z-.4],[x+.95,.81,z],[x+.55,.81,z+.4],[x+.55,.81,z+.15],[x+.05,.81,z+.15]];this.polygon(arrow.map(p=>this.project(...p)),'#e6e8b6');return}
 // Four legs and a thick top replace the solid identical cubes.
 for(const dx of [-.86,.86])for(const dz of [-.53,.53])this.box(x+dx,0,z+dz,.19,.88,.19,'#614631');this.box(x,.78,z,2.27,.17,1.55,'#a57b4c');this.box(x,.95,z,2.35,.1,1.65,'#c8a675');
 if(b.id===0){this.box(x-.18,1.05,z,1.65,.025,1.15,'#487c6c');this.box(x-.7,1.08,z-.15,.21,.29,.45,'#586469');this.box(x+.58,1.08,z-.15,.21,.29,.45,'#586469');this.box(x-.05,1.11,z-.15,1.1,.11,.2,'#dfb984');this.beam(x+.3,1.12,z+.43,x+.8,z+.16,.07,.05,'#6a4b2d');this.box(x+.8,1.16,z+.13,.3,.14,.16,'#8a9396')}
 if(b.id===1){this.box(x,1.05,z,1.9,.03,1.27,'#bd944e');this.item(game?.stations[1].state==='processing'&&game.stations[1].t<2?'body':'joined',x,1.12,z-.1);for(const dx of [-.75,.75]){this.box(x+dx,1.08,z-.12,.18,.32,.55,'#595d5e');this.box(x+dx,1.4,z-.12,.36,.07,.12,'#869092')}this.circle(x+.75,1.11,z+.43,.16,'#e6cf89')}
 if(b.id===3){this.box(x,1.05,z,1.9,.03,1.25,'#658f8b');for(const dx of [-.64,.64]){this.box(x+dx,1.08,z-.07,.16,.44,.45,'#ae8959');this.box(x+dx,1.48,z-.07,.33,.08,.12,'#d0b67f')}this.item('balanced',x,1.32,z-.1);this.box(x,1.08,z+.48,.12,.35,.12,'#79684b');this.box(x,1.42,z+.48,.6,.06,.08,'#d3bc87')}
 if(b.id===2){this.box(x-.15,1.05,z,1.82,.03,1.25,'#777298');this.item('bow',x-.16,1.12,z-.05);this.box(x+.82,1.08,z-.36,.27,.3,.28,'#a8553b');this.box(x+.82,1.38,z-.36,.3,.04,.3,'#e9d7a7');this.beam(x+.44,1.12,z+.43,x+.87,z+.1,.06,.055,'#dec5a0');this.box(x+.87,1.12,z+.12,.17,.06,.22,'#ece1c2')}
 }
 prop(b,game){const x=b.x,z=b.z;
 if(b.id==='dry'){this.box(x,0,z,2.2,.18,4.2,'#866744');for(const dx of [-.93,.93])for(const dz of [-1.85,1.85])this.box(x+dx,.18,z+dz,.14,1.35,.14,'#74533a');for(const dz of [-1.85,0,1.85])this.box(x,1.35,z+dz,2.05,.12,.12,'#b79a65');for(const dx of [-.6,0,.6])this.box(x+dx,.18,z,.08,.1,4,'#bc9d65');if(game.dry.state!=='idle'){this.item(game.dry.state==='ready'?'dried':'joined',x,1.02,z-.65);this.item('joined',x,.65,z+.7)}return}
 if(b.id==='shelf'){this.box(x,0,z,1.4,.18,.9,'#685139');for(const dx of [-.58,.58])this.box(x+dx,.18,z,.14,.8,.75,'#937043');this.box(x,.94,z,1.5,.12,1,'#c1a365');if(game.shelf)this.item(game.shelf.type,x,1.08,z);return}
 this.box(x,0,z,b.w,.5,b.d,'#6e6651');this.box(x,.5,z,b.w+.05,.12,b.d,'#a3926c');for(const dz of [-b.d/2+.65,0,b.d/2-.65]){this.box(x,.62,z+dz,.64,.16,.65,'#886849');this.box(x,.78,z+dz,.5,.06,.49,'#baa16c')}
 }
 heldItem(p){if(!p.held||p.fallen)return;const angle=Math.atan2(p.face.x,p.face.z);this.itemPose={x:p.x,z:p.z,co:Math.cos(angle),si:Math.sin(angle)};try{this.item(p.held,0,.94,.62)}finally{this.itemPose=null}}
 character(p,index){const model=WorkshopCharacters.models[index],moving=Math.hypot(p.vx,p.vz)>.1,motion=model.motions[moving?'walk':'idle'],clock=performance.now()/1000,frame=motion.frames[Math.floor(clock%motion.duration/motion.duration*motion.frames.length)],angle=Math.atan2(p.face.x,p.face.z),co=Math.cos(angle),si=Math.sin(angle),points=[];
 for(let n=0;n<frame.length;n+=3){let x=frame[n],y=frame[n+1],z=frame[n+2];if(p.fallen){const ox=x;x=y-.45;y=-ox+.5}const xx=x*co+z*si,zz=z*co-x*si;points.push([p.x+xx,y+.025,p.z+zz])}
 const triangles=[];for(let n=0;n<points.length;n+=3){const tri=points.slice(n,n+3);triangles.push({n,tri,depth:tri.reduce((v,p)=>v+p[2]+p[1]*.85,0)})}triangles.sort((a,b)=>a.depth-b.depth);
 for(const {n,tri}of triangles){for(let k=0;k<3;k++){const screen=this.project(...tri[k]),uv=(n+k)*2;this.vertices.push(screen[0]/this.W*2-1,1-screen[1]/this.H*2,1,1,1,1,model.uv[uv]+2+index*4,model.uv[uv+1])}}
 }
 draw(game,paint){this.vertices=[];this.box(0,-.3,0,18,.3,12,'#b69a73');for(let x=-8;x<=8;x++)this.box(x,.001,0,.025,.003,12,'#a68a66');this.box(0,0,-6,18,1.1,.2,'#765c4b');this.box(-9,0,0,.2,.5,12,'#765c4b');this.box(9,0,0,.2,.5,12,'#765c4b');
 this.box(1.92,.005,0,.06,.008,4.1,'#d3ba79');this.box(-5,.005,0,.06,.008,4.6,'#a9bf9a');const objects=Workshop.benches.map(b=>({z:b.z,draw:()=>{this.station(b,game);if(typeof b.id==='number'){const state=game.stations[b.id];if(state.state==='ready')this.item(state.output,b.x,1.65,b.z);else if(state.input)this.item('body',b.x,1.65,b.z)}}}));
 Workshop.props.forEach(b=>objects.push({z:b.z,draw:()=>this.prop(b,game)}));
 game.dropped.forEach(d=>objects.push({z:d.z,draw:()=>{this.circle(d.x,.015,d.z,.43,'#dfca9e');this.item(d.type,d.x,.05,d.z)}}));
 game.players.forEach((p,i)=>objects.push({z:p.z,draw:()=>{this.circle(p.x,.02,p.z,.52,i?'#dc906c':'#81c5e3');const blink=p.guard>0&&Math.floor(p.guard*10)%2;if(blink)return;if(p.face.z<0)this.heldItem(p);this.character(p,i);if(p.face.z>=0)this.heldItem(p)}}));objects.sort((a,b)=>a.z-b.z).forEach(o=>o.draw());
 const gl=this.gl;gl.clearColor(.055,.12,.14,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.disable(gl.BLEND);gl.useProgram(this.color);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.modelTexture);gl.uniform1i(gl.getUniformLocation(this.color,'modelTex'),1);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(this.vertices),gl.DYNAMIC_DRAW);for(const [name,size,offset]of [['a',2,0],['c',4,8],['u',2,24]]){const a=gl.getAttribLocation(this.color,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,32,offset)}gl.drawArrays(gl.TRIANGLES,0,this.vertices.length/8);
 paint(this.ctx,this);gl.useProgram(this.ui);gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);const a=gl.getAttribLocation(this.ui,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.layer);gl.uniform1i(gl.getUniformLocation(this.ui,'t'),0);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.TRIANGLES,0,6);
 }
}
window.WorkshopRenderer=Renderer;
})();




