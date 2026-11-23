const libraries = new WeakMap();

function library(T) {
  if (libraries.has(T)) return libraries.get(T);
  const materials = {
    paint: new T.MeshStandardMaterial({vertexColors:true, metalness:.68, roughness:.3}),
    trim: new T.MeshStandardMaterial({vertexColors:true, metalness:.18, roughness:.48}),
    glass: new T.MeshStandardMaterial({vertexColors:true, metalness:.54, roughness:.13}),
    glazing: new T.MeshPhysicalMaterial({vertexColors:true,metalness:.15,roughness:.15,clearcoat:1,transparent:true,opacity:.48,depthWrite:false,side:T.DoubleSide}),
    chrome: new T.MeshStandardMaterial({vertexColors:true, metalness:.87, roughness:.23}),
    lamp: new T.MeshBasicMaterial({vertexColors:true}),
    brake: new T.MeshStandardMaterial({color:0xff4134,emissive:0xff1408,emissiveIntensity:.9})
  };
  const data = {materials, bodies:new Map(), wheels:new Map()};
  libraries.set(T,data);
  return data;
}

// Bake vertex colours and world-space normals so an entire coach shares a few draws.
function builder(T) {
  const batches = new Map();
  const matrix = new T.Matrix4(), euler = new T.Euler(), quat = new T.Quaternion();
  function put(g, m, color, x=0,y=0,z=0, rx=0,ry=0,rz=0) {
    matrix.compose(new T.Vector3(x,y,z),quat.setFromEuler(euler.set(rx,ry,rz)),new T.Vector3(1,1,1));
    g.applyMatrix4(matrix);
    const batch = batches.get(m) || {p:[],n:[],c:[]};
    batches.set(m,batch);
    const c = new T.Color(color), p=g.attributes.position, n=g.attributes.normal;
    for(let i=0;i<(g.index?.count ?? p.count);i++){
      const j=g.index?g.index.getX(i):i;
      batch.p.push(p.getX(j),p.getY(j),p.getZ(j));
      batch.n.push(n.getX(j),n.getY(j),n.getZ(j));
      batch.c.push(c.r,c.g,c.b);
    }
    g.dispose();
  }
  function box(m,c,x,y,z,w,h,d,...rot) {put(new T.BoxGeometry(w,h,d),m,c,x,y,z,...rot);}
  function rod(m,c,a,b,r,r2=r,n=8) {
    const A=new T.Vector3(...a), B=new T.Vector3(...b), v=B.clone().sub(A);
    const g=new T.CylinderGeometry(r2,r,v.length(),n);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));
    A.lerp(B,.5);put(g,m,c,A.x,A.y,A.z);
  }
  // Cross-sections run tail to nose. Each ring specifies z, half width, sill, shoulder and crown.
  function shell(m,c,rings) {
    const p=[], rings3=rings.map(([z,w,l,s,h])=>[
      [-w*.86,l,z],[-w,s,z],[-w*.84,h,z],[w*.84,h,z],[w,s,z],[w*.86,l,z]
    ]);
    function tri(a,b,c){p.push(...a,...b,...c);}
    for(let j=1;j<rings3.length;j++)for(let i=0;i<6;i++){
      const k=(i+1)%6,a=rings3[j-1],b=rings3[j]; tri(a[i],b[i],a[k]);tri(a[k],b[i],b[k]);
    }
    const a=rings3[0],b=rings3.at(-1);
    for(let i=1;i<5;i++){tri(a[0],a[i],a[i+1]);tri(b[0],b[i+1],b[i]);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();put(g,m,c);
  }
  function finish(){
    return [...batches].map(([key,b])=>{
      const g=new T.BufferGeometry();
      for(const [name,arr] of [['position',b.p],['normal',b.n],['color',b.c]])g.setAttribute(name,new T.Float32BufferAttribute(arr,3));
      g.computeBoundingSphere();return [key,g];
    });
  }
  return {put,box,rod,shell,finish};
}
const ink=0x151a22, glass=0x243d4b, steel=0xb9bec0, yellow=0xffbf26;
const specs={
  coupe:{w:.94,r:.34,front:1.31,back:-1.29,track:.85},taxi:{w:.85,r:.33,front:1.22,back:-1.24,track:.76},
  auto:{w:.69,r:.255,front:1.00,back:-.78,track:.61},bus:{w:1.19,r:.475,front:2.91,back:-2.66,track:1.07}
};
// Segment strokes are real raised geometry, visible from either end of the street.
const strokes=[[0,1,1,1],[1,1,1,.5],[1,.5,1,0],[0,0,1,0],[0,.5,0,0],[0,1,0,.5],[0,.5,1,.5],[.5,1,.5,0],[0,1,.5,.5],[1,1,.5,.5]];
const alphabet={'0':'012345','1':'12','2':'01643','3':'01623','4':'5612','5':'05623','6':'056423','7':'012','8':'0123456','9':'015623',M:'548912',H:'54126',A:'054612',B:'0123456',T:'07',S:'05623',E:'05463'};
function sign(b,text,x,y,z,h,front=false,c=ink){
  const scale=h*.53, step=scale*1.5,dir=front?1:-1;
  for(let i=0;i<text.length;i++)for(const k of alphabet[text[i]]||''){
    const [ax,ay,bx,by]=strokes[k], left=(i-(text.length-1)/2)*step-scale/2;
    b.rod('trim',c,[x+dir*(left+ax*scale),y+ay*h,z],[x+dir*(left+bx*scale),y+by*h,z],h*.064,h*.064,4);
  }
}
function buildGT(T,b,paint){
  const {box,rod}=b;
  // Share vertices along each longitudinal ribbon for continuous curved highlights.
  function ribbon(material,color,rows){
    const positions=[],indices=[],width=rows[0].length;
    for(let j=0;j<rows.length;j++)for(let i=0;i<width;i++){
      positions.push(...rows[j][i]);
      if(j&&i){const n=j*width+i;indices.push(n-width-1,n-1,n-width,n-width,n-1,n);}
    }
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
    b.put(g,material,color);
  }
  function rail(m,c,path,r){for(let i=1;i<path.length;i++)rod(m,c,path[i-1],path[i],r,r,8);}
  const sections=[[-2.14,.76,.742],[-2.07,.88,.79],[-1.83,.95,.82],[-1.29,.99,.84],[-.68,.94,.80],[.36,.91,.80],[1.30,.965,.793],[1.72,.92,.72],[2.00,.86,.65],[2.12,.74,.58]];
  function section(z){
    let j=1;while(j<sections.length-1&&sections[j][0]<z)j++;
    const [za,wa,ha]=sections[j-1],[zb,wb,hb]=sections[j], f=(z-za)/(zb-za);
    return [wa+(wb-wa)*f,ha+(hb-ha)*f];
  }
  function arch(z){const d=Math.min(Math.abs(z-1.31),Math.abs(z+1.29));return Math.sqrt(Math.max(0,.407**2-d*d));}
  const rows=[];
  for(let i=0;i<=120;i++){
    const z=-2.14+4.26*i/120,[w,h]=section(z),rise=arch(z),sill=.336+rise;
    const outline=[[w*.966,sill],[w*.997,Math.max(sill+.014,h-.12)],[w,h-.050+rise*.14],[w*.969,h+.008+rise*.14],[w*.895,h+.034+rise*.14],[w*.73,h+.027],[w*.57,h+.005]];
    const a=outline.map(([x,y])=>[-x,y,z]),b=[...outline].reverse();
    rows.push([...a,[0,h+.020,z],...b.map(([x,y])=>[x,y,z])]);
  }
  ribbon('paint',paint,rows);
  for(const s of [-1,1]){
    for(const axle of [-1.29,1.31]){
      const lip=[];
      for(let i=0;i<=20;i++){
        const a=Math.PI*i/20,z=axle+.406*Math.cos(a),[w]=section(z);
        lip.push([s*w*.971,.337+.405*Math.sin(a),z]);
      }
      rail('trim',0x37434a,lip,.016);
    }
    rail('chrome',0x687c81,[[s*.924,.349,-.85],[s*.903,.303,-.6],[s*.899,.30,.65],[s*.922,.354,.88]],.028);
    rail('trim',0x455257,[[s*.936,.672,-.59],[s*.922,.66,.28],[s*.917,.688,.68]],.009);
    box('chrome',steel,s*.937,.735,-.38,.023,.025,.13);
    rod('trim',ink,[s*.81,.865,.57],[s*.94,.903,.58],.021);
    box('paint',paint,s*.966,.912,.578,.179,.073,.167,0,-s*.17,0);
  }
  // Windscreen, side glass and rear hatch share one swept cabin outline.
  const cabin=[[-1.56,.76,.841,.72,.864],[-1.40,.782,.851,.708,.937],[-.92,.785,.856,.627,1.175],[-.54,.79,.849,.608,1.292],[-.31,.792,.841,.603,1.325],[.14,.794,.835,.592,1.316],[.34,.793,.831,.598,1.278],[.97,.772,.824,.721,.867]];
  function canopy([z,w,belt,top,h]){
    return [[-w,belt,z],[-top,h-.037,z],[-top*.93,h,z],[0,h+.021,z],[top*.93,h,z],[top,h-.037,z],[w,belt,z]];
  }
  ribbon('glazing',0x4f7b8c,cabin.map(canopy));
  for(const s of [-1,1]){
    rail('chrome',0x9ba9a8,cabin.map(([z,w,y])=>[s*w,y,z]),.014);
    rail('paint',paint,cabin.map(([z,w,bot,t,h])=>[s*t,h-.024,z]),.029);
    rail('trim',0x24282a,[[s*.786,.85,-.48],[s*.61,1.27,-.37]],.036);
    rail('paint',paint,[[s*.782,.856,-1.32],[s*.728,.96,-1.10],[s*.628,1.186,-.83]],.047);
    const x=s*.369;
    box('trim',0x433d37,x,.902,-.15,.45,.14,.51);
    box('trim',0x3c3634,x,1.012,-.38,.41,.36,.14,-.20);
    box('trim',0x514941,x,1.218,-.39,.208,.137,.125,-.15);
    for(let i=0;i<3;i++)box('trim',0x655a50,x,1.01+i*.056,-.294,.32,.012,.014);
    rail('trim',0x172126,[[s*.48,.871,.942],[s*.22,.882,.908],[s*.065,.89,.89]],.009);
    rod('trim',ink,[s*.47,.868,.946],[s*.20,.883,.904],.012,.008);
  }
  ribbon('paint',paint,cabin.slice(3,7).map(row=>canopy(row).slice(2,5)));
  box('trim',0x232d32,0,.861,.59,1.36,.084,.289);
  for(let i=0;i<6;i++){
    const z=-1.41+i*.085,h=.938+i*.042;
    rod('trim',0x73675a,[-.675+i*.011,h,z],[.675-i*.011,h,z],.006);
  }
  // Short ducktail above recessed rear lamps and a wraparound lower valance.
  b.shell('paint',paint,[[-2.17,.797,.763,.795,.812],[-2.09,.879,.77,.82,.847],[-1.95,.886,.777,.79,.811]]);
  b.shell('trim',0x243137,[[-2.155,.768,.465,.704,.748],[-2.096,.871,.429,.722,.769],[-1.99,.884,.429,.725,.757]]);
  b.shell('paint',paint,[[-2.176,.711,.351,.397,.448],[-2.122,.817,.324,.421,.488],[-2.04,.878,.333,.431,.481],[-1.92,.914,.366,.456,.483]]);
  for(const s of [-1,1]){
    box('trim',0x481719,s*.547,.665,-2.157,.406,.109,.034);
    for(let k=0;k<3;k++){
      const x=s*(.399+k*.135);
      rail('brake',0xffffff,[[x-s*.05,.68,-2.180],[x+s*.045,.68,-2.180],[x+s*.054,.659,-2.178],[x+s*.04,.646,-2.178]],.012);
    }
    box('lamp',0xffbe62,s*.737,.66,-2.169,.053,.053,.024);
    rod('chrome',0x838990,[s*.64,.356,-2.18],[s*.64,.356,-2.045],.055,.05,14);
    rod('trim',ink,[s*.64,.356,-2.187],[s*.64,.356,-2.181],.039,.039,14);
    for(let k=0;k<2;k++)box('trim',ink,s*(.24+k*.14),.336,-2.105,.032,.107,.20);
    const line=[[s*.66,.841,-1.76],[s*.69,.855,-1.47],[s*.648,.847,-1.40]];
    rail('trim',0x67777a,line,.009);
    rail('trim',0x64747a,[[s*.63,.836,.96],[s*.59,.825,1.29],[s*.49,.728,1.72],[s*.42,.67,1.92]],.009);
  }
  box('chrome',0xc1c2b7,0,.685,-2.162,.127,.033,.017);
  b.shell('paint',paint,[[1.97,.828,.338,.494,.667],[2.088,.792,.33,.498,.607],[2.132,.736,.355,.476,.565]]);
  box('trim',0x182125,0,.455,2.138,1.25,.143,.03);
  for(let k=0;k<3;k++)box('chrome',0x57646a,0,.414+k*.04,2.157,.67,.012,.012);
  for(const s of [-1,1]){
    box('trim',ink,s*.56,.534,2.137,.35,.105,.037);
    for(let k=0;k<2;k++)box('lamp',0xffe6ba,s*(.489+k*.139),.543,2.159,.111,.066,.013);
    box('lamp',0xf8b467,s*.732,.52,2.142,.046,.055,.015);
  }
}
function buildBody(T,type,paint) {
  const b=builder(T),{box,rod,shell}=b;
  const {w}=specs[type];
  function driver(x,y,z){
    box('trim',0x185660,x,y,z,.32,.39,.23);
    b.put(new T.SphereGeometry(.134,9,7),'trim',0xa66c50,x,y+.29,z);
    b.put(new T.SphereGeometry(.14,9,5,0,Math.PI*2,0,1.43),'trim',0x222127,x,y+.30,z);
    for(const s of [-1,1])rod('trim',0xa66c50,[x+s*.14,y+.12,z],[x+s*.15,y+.02,z+.31],.049);
  }
  let tail,plateY;
  if(type==='coupe'){
    tail=-2.14;plateY=.535;
    buildGT(T,b,paint??0xa2b4bb);
  }else if(type==='taxi'){
    const sport=type==='coupe', c=sport?(paint??0xa5b5bb):0x222329;
    const top=sport?1.29:1.59, belt=sport?.82:.98;
    tail=sport?-2.09:-2.04;plateY=.46;
    shell('paint',c,[[tail,w*.93,.38,belt-.19,belt-.07],[-1.58,w,.32,belt-.06,belt],[.56,w,.32,belt-.07,belt+.015],[1.65,w*.99,.34,belt-.12,belt-.03],[2.09,w*.90,.39,belt-.21,belt-.15]]);
    const roof=sport?-.27:-.05;
    shell('glass',glass,[[-1.47,w*.84,belt-.025,belt,belt+.02],[roof-.47,w*.76,belt-.025,top-.09,top],[roof+.43,w*.74,belt-.025,top-.1,top],[1.03,w*.80,belt-.025,belt,belt+.025]]);
    box('paint',sport?c:yellow,0,top+.012,roof,w*1.30,.046,.94);
    for(const s of [-1,1]){
      for(const [z1,z2] of [[-1.43,roof-.47],[1,roof+.43],[roof-.13,roof-.13]])rod('paint',sport?c:yellow,[s*w*.81,belt,z1],[s*w*.63,top,z2],.032);
      box('chrome',steel,s*w*.975,belt-.1,-.1,.034,.038,.18);
      box('trim',ink,s*w,.4,0,.036,.12,1.70);
      box('paint',c,s*(w+.044),belt+.12,.55,.155,.104,.18);
      box('lamp',0xffedb0,s*w*.66,belt-.21,2.094,.32,.073,.026);
      if(sport){
        box('trim',ink,s*.65,.78,-1.75,.073,.17,.13);
        for(let k=0;k<4;k++)box('trim',ink,s*.53,belt+.014,-1.53-k*.076,.38,.019,.038);
      }
    }
    box('trim',ink,0,.47,2.087,.74,.12,.055);
    box('trim',ink,0,.48,tail,.99,.19,.04);
    box('brake',0xffffff,0,belt-.17,tail-.022,w*1.65,.054,.035);
    if(sport){
      box('paint',0x233b43,0,.89,-1.83,1.89,.055,.23);
      for(const s of [-1,1])box('chrome',steel,s*.71,.38,tail,.18,.075,.10);
    }else{
      box('trim',yellow,0,top+.12,0,.45,.15,.22);
      for(const s of [-1,1])box('trim',yellow,s*w*.979,.87,0,.029,.048,2.98);
    }
  }else if(type==='auto'){
    tail=-1.30;plateY=.53;
    shell('paint',0x272828,[[tail,.64,.29,.69,.92],[-.99,.70,.27,.72,.91],[.36,.65,.30,.45,.51],[.99,.37,.34,.57,.66],[1.30,.23,.42,.59,.65]]);
    box('trim',yellow,0,.94,-1.18,1.28,.24,.19);
    box('trim',0x282628,0,.72,-.70,1.04,.16,.44);
    box('trim',0x353035,0,.94,-.91,1.04,.43,.13);
    box('trim',ink,0,.71,.27,.44,.16,.42);driver(0,1.03,.23);
    shell('paint',yellow,[[.61,.59,.78,1.09,1.17],[.86,.52,.70,.98,1.03],[1.12,.33,.55,.75,.83]]);
    box('glass',glass,0,1.35,.66,1.03,.43,.025,-.20);
    shell('trim',0x242425,[[-1.29,.61,1.52,1.61,1.69],[-1.09,.70,1.57,1.70,1.79],[.49,.65,1.55,1.69,1.75],[.68,.58,1.54,1.60,1.66]]);
    for(const s of [-1,1]){
      rod('chrome',steel,[s*.54,1.06,.77],[s*.55,1.62,.58],.033);
      rod('trim',ink,[s*.63,.9,-1.18],[s*.60,1.62,-1.18],.059);
      rod('chrome',steel,[s*.65,.61,-.35],[s*.65,.90,-.35],.025);
      box('brake',0xffffff,s*.49,.68,tail,.105,.15,.04);
      box('lamp',0xffdc88,s*.28,.76,.998,.13,.09,.07);
    }
    box('trim',ink,0,1.26,-1.222,1.15,.59,.10);
    box('glass',glass,0,1.35,-1.279,.74,.25,.031);
    rod('chrome',steel,[-.24,1.02,.58],[.24,1.02,.58],.028);
  }else{
    tail=-4.55;plateY=.61;
    shell('paint',0xb82c28,[[tail,1.14,.42,2.80,2.94],[-4.32,w,.38,2.89,3.02],[4.22,w,.38,2.89,3.02],[4.50,1.13,.46,2.80,2.94]]);
    for(const s of [-1,1]){
      box('trim',0xe9ba69,s*w,1.51,-.05,.025,.11,8.6);
      for(let i=0;i<10;i++){
        const z=-3.90+i*.85;
        box('trim',ink,s*w,2.17,z,.026,.99,.80);
        box('glass',glass,s*(w+.022),2.17,z,.018,.85,.72);
        box('chrome',steel,s*(w+.038),2.28,z,.018,.021,.72);
      }
      box('lamp',0xffdb9b,s*.84,.98,4.51,.35,.18,.03);
      box('brake',0xffffff,s*.94,.96,tail-.014,.18,.23,.035);
    }
    box('glass',glass,0,2.07,4.507,2.03,.98,.037);
    box('trim',ink,0,2.80,4.509,1.70,.26,.039);
    sign(b,'138',0,2.71,4.536,.175,true,0xffce64);
    box('glass',glass,0,2.15,tail-.012,1.92,.82,.035);
    box('trim',0xffca61,0,1.5,tail-.013,2.21,.11,.032);
    sign(b,'BEST',0,1.11,tail-.032,.245,false,0xffe8c4);
    for(const z of [-2.2,.3,2.2])box('trim',0xdacbb8,0,3.045,z,1.30,.11,.72);
  }
  box('trim',type==='coupe'?0xe8e1cf:yellow,0,plateY,tail-.040,.49,.135,.026);
  sign(b,'MH02A138',0,plateY-.042,tail-.060,.084);
  return b.finish();
}
function wheel(T,r){
  const b=builder(T), width=r*.67;
  b.rod('trim',0x1e2023,[-width/2,0,0],[width/2,0,0],r,r,20);
  for(const s of [-1,1]){
    const face=s*(width/2+.004);
    b.rod('chrome',0x9b9fac,[face,0,0],[face+s*.015,0,0],r*.70,r*.70,20);
    b.rod('trim',0x20272c,[face+s*.016,0,0],[face+s*.018,0,0],r*.59,r*.59,18);
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3;
      b.rod('chrome',steel,[face+s*.025,0,0],[face+s*.025,Math.sin(a)*r*.59,Math.cos(a)*r*.59],r*.085,r*.063,5);
    }
  }
  return b.finish();
}
export function createVehicle(THREE,type='coupe',paint){
  const T=THREE, lib=library(T), spec=specs[type]||specs.coupe;
  if(!specs[type])type='coupe';
  const key=type+'-'+(type==='coupe'&&paint!=null?new T.Color(paint).getHexString():'default');
  if(!lib.bodies.has(key))lib.bodies.set(key,buildBody(T,type,paint));
  if(!lib.wheels.has(spec.r))lib.wheels.set(spec.r,wheel(T,spec.r));
  const group=new T.Group(), brake=lib.materials.brake.clone(), wheels=[];
  function add(parent,batches){
    for(const [key,geometry] of batches){
      const mesh=new T.Mesh(geometry,key==='brake'?brake:lib.materials[key]);parent.add(mesh);
    }
  }
  add(group,lib.bodies.get(key));
  for(const [front,z] of [[true,spec.front],[false,spec.back]]){
    const tracks=front&&type==='auto'?[0]:[-spec.track,spec.track];
    for(const x of tracks){
      const swivel=new T.Group(),spin=new T.Group();swivel.position.set(x,spec.r,z);
      group.add(swivel);swivel.add(spin);add(spin,lib.wheels.get(spec.r));wheels.push({front,swivel,spin});
    }
  }
  return {group,update(distance=0,steer=0,braking=0,time=0){
    for(const {front,swivel,spin} of wheels){
      if(front)swivel.rotation.y=steer;
      spin.rotation.x=distance/spec.r;
    }
    brake.emissiveIntensity=.75+2.8*Math.min(1,Math.max(0,Number(braking)));
  }};
}

