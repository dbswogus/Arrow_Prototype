(function(G){
G.ArcheryRange=class ArcheryRange {
constructor(THREE,canvas){
this.THREE=THREE;
this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setClearColor(0xb8d9da);
this.renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=this.scene=new THREE.Scene();scene.fog=new THREE.Fog(0xb8d9da,65,155);
const camera=this.camera=new THREE.PerspectiveCamera(55,1,.1,250);
scene.add(new THREE.HemisphereLight(0xfff4d6,0x597760,2.5));
const sun=new THREE.DirectionalLight(0xffe6b9,2.4);sun.position.set(-20,35,10);scene.add(sun);
const materials=new Map();function mat(c){if(!materials.has(c))materials.set(c,new THREE.MeshLambertMaterial({color:c}));return materials.get(c)}
function box(w,h,d,c,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);scene.add(m);return m;}
box(240,.3,240,0x779b70,0,-.2,45);box(12,.12,56,0xb5b18c,0,0,25);box(17,.35,7,0x8d7760,0,.03,-3);
for(let i=0;i<9;i++)box(.04,.015,7,0xb6a083,-8+i*2,.215,-3);
// Stylized target only; exact historic proportions remain a curatorial TODO.
box(5.3,6.3,.35,0x473c32,0,4,48.2);box(5,6,.08,0xece4ca,0,4,47.97);box(3.5,3.4,.04,0x262f2b,0,4,47.9);box(2.5,2.4,.04,0xbc5641,0,4,47.86);box(1.55,1.45,.04,0xe6dec5,0,4,47.82);box(.8,.72,.04,0x292f2b,0,4,47.78);
for(const x of [-2.3,2.3])box(.22,4,.3,0x614e37,x,1.9,48.3);
for(let i=0;i<26;i++){const side=i%2?1:-1,x=side*(13+(i%5)*5),z=8+i*3.5;box(.5,3,.5,0x716047,x,1.5,z);const crown=new THREE.Mesh(new THREE.ConeGeometry(2.4+(i%3)*.4,6,7),mat(i%2?0x426b53:0x567e5c));crown.position.set(x,5,z);scene.add(crown);}
for(let i=0;i<7;i++){const hill=new THREE.Mesh(new THREE.SphereGeometry(23,12,8),mat(0x7b9c87));hill.scale.set(1,1.2,.6);hill.position.set(-90+i*30,0,125);scene.add(hill);}
// A small pavilion frames the range without external assets.
for(const x of [-13,-7])for(const z of [-3,3])box(.3,4,.3,0x674839,x,2,z);
box(7,.35,7,0x734838,-10,4,0);const roof=new THREE.Mesh(new THREE.ConeGeometry(5.8,2,4),mat(0x344e4c));roof.rotation.y=Math.PI/4;roof.position.set(-10,5,0);scene.add(roof);
const flags=[];for(const z of [9,29,45]){box(.12,6,.12,0x806c4d,8,3,z);const flag=new THREE.Mesh(new THREE.PlaneGeometry(2.3,1.05,8,3),new THREE.MeshLambertMaterial({color:0xf0c16b,side:THREE.DoubleSide}));flag.position.set(9.15,5.3,z);scene.add(flag);flags.push(flag);}
const grasses=[];for(let i=0;i<55;i++){const g=box(.07,.5+(i%3)*.12,.07,0x587e50,(i%2?1:-1)*(7+i%7),.3,4+i*.9);grasses.push(g);}
function archer(x,c){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.CylinderGeometry(.32,.43,1.1,7),mat(c));body.position.y=1;g.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.23,10,8),mat(0xd9ac7d));head.position.y=1.8;g.add(head);for(const xx of [-.16,.16]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.65,6),mat(0x344b47));leg.position.set(xx,.3,0);g.add(leg);}g.position.set(x,.23,0);scene.add(g);return g;}
archer(-3,0xe1ac59);
const bow=new THREE.Group();const pts=[];for(let i=0;i<=32;i++){const a=-1.5+i/32*3;pts.push(new THREE.Vector3(Math.cos(a)*.4,Math.sin(a)*.85,0));}bow.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x67402a})));const string=new THREE.Line(new THREE.BufferGeometry().setFromPoints([pts[0],new THREE.Vector3(0,0,0),pts[32]]),new THREE.LineBasicMaterial({color:0xf6edd5}));bow.add(string);camera.add(bow);scene.add(camera);
const grip=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.26,8),mat(0x382c24));grip.position.set(.38,0,0);bow.add(grip);const hand=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),mat(0xd9ac7d));hand.scale.set(.8,1,1.1);hand.position.set(.36,-.04,.06);bow.add(hand);const forearm=new THREE.Mesh(new THREE.CylinderGeometry(.09,.14,.95,8),mat(0xd7d4ba));forearm.position.set(.17,-.57,.12);forearm.rotation.z=-.3;bow.add(forearm);
const arrow=new THREE.Group();const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.5,6),mat(0x795538));shaft.rotation.x=Math.PI/2;arrow.add(shaft);const tip=new THREE.Mesh(new THREE.ConeGeometry(.065,.22,6),mat(0xc8d1cd));tip.rotation.x=Math.PI/2;tip.position.z=.84;arrow.add(tip);for(const r of [0,Math.PI/2]){const f=new THREE.Mesh(new THREE.BoxGeometry(.22,.015,.3),mat(0xf6d483));f.position.z=-.55;f.rotation.z=r;arrow.add(f);}scene.add(arrow);arrow.visible=false;
const trail=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xf9dfa0,transparent:true,opacity:.8}));scene.add(trail);

Object.assign(this,{bow,string,arrow,trail,flags,grasses});
this.trailPoints=[];this.markers=[];this.forward=new THREE.Vector3(0,0,1);
this.resize();window.addEventListener('resize',()=>this.resize());
}
resize(){this.renderer.setSize(innerWidth,innerHeight,false);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
resetTrail(){this.trailPoints=[];this.trail.geometry.dispose();this.trail.geometry=new this.THREE.BufferGeometry();this.trail.visible=false;this.trail.material.opacity=.8;}
clear(){for(const m of this.markers){this.scene.remove(m);m.geometry.dispose();m.material.dispose();}this.markers=[];this.resetTrail();this.arrow.visible=false;}
showArrow(a){const T=this.THREE;this.arrow.visible=true;this.arrow.position.set(a.x,a.y,a.z);this.arrow.quaternion.setFromUnitVectors(this.forward,new T.Vector3(a.vx,a.vy,a.vz).normalize());this.trailPoints.push({point:new T.Vector3(a.x,a.y,a.z),time:a.t});while(this.trailPoints.length>1&&a.t-this.trailPoints[0].time>G.Config.trailDuration)this.trailPoints.shift();this.trail.visible=true;this.trail.geometry.dispose();this.trail.geometry=new T.BufferGeometry().setFromPoints(this.trailPoints.map(p=>p.point));}
showImpact(a){this.arrow.visible=false;const T=this.THREE;const m=new T.Mesh(new T.SphereGeometry(.12,8,6),new T.MeshBasicMaterial({color:a.hit?0xf4d174:0xc76f59}));m.position.set(a.x,Math.max(.08,a.y),a.z-.15);this.scene.add(m);this.markers.push(m);}
update(time,wind,aim,aiming){
for(const f of this.flags){const p=f.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)+1.15;p.setZ(i,Math.sin(time*4-x*2)*.13*x+wind*.12*x);}p.needsUpdate=true;f.rotation.y=wind>0?Math.PI:0;}
for(const g of this.grasses)g.rotation.z=wind*.12+Math.sin(time*3+g.position.z)*.08;
this.bow.visible=aiming;this.bow.position.set(-.95,-.35,-2.1);this.bow.rotation.set(aim.pitch-G.Config.aim.defaultPitch,aim.yaw,0);this.bow.scale.setScalar(.85);
const p=this.string.geometry.attributes.position;p.setXYZ(1,.06,0,aim.power*.38);p.needsUpdate=true;
}
render(){this.renderer.render(this.scene,this.camera);}
};
})(Gukgung);