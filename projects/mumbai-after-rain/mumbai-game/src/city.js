/** Static, metre-scale set. All textures and forms are authored at startup. */
export function buildCity(THREE, scene, route) {
  let seed = 1947;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const pick = list => list[Math.floor(random() * list.length)];
  const root = new THREE.Group();
  root.name = 'Bombay after the last local';
  scene.add(root);
  const shapes = {
    block: new THREE.BoxGeometry(1, 1, 1),
    drum: new THREE.CylinderGeometry(.5, .5, 1, 14),
    ball: new THREE.SphereGeometry(.5, 10, 7),
    pipe: new THREE.CylinderGeometry(.5, .5, 1, 6)
  };
  const finishes = {
    masonry: new THREE.MeshStandardMaterial({ roughness: .83 }),
    enamel: new THREE.MeshStandardMaterial({ roughness: .37, metalness: .24 }),
    light: new THREE.MeshBasicMaterial({ toneMapped: false })
  };
  const buckets = new Map();
  const transform = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  function put(shape, finish, color) {
    const key = shape + '/' + finish;
    if (!buckets.has(key)) buckets.set(key, { shape, finish, poses: [], colors: [] });
    const batch = buckets.get(key);
    transform.updateMatrix();
    batch.poses.push(transform.matrix.clone());
    batch.colors.push(color);
  }
  function frame(s, side, offset) {
    const p = route.sample((s + route.length) % route.length);
    const f = { x: p.x + side * offset * p.nx, z: p.z + side * offset * p.nz,
      fx: -side * p.nx, fz: -side * p.nz };
    f.angle = Math.atan2(f.fx, f.fz);
    return f;
  }
  function xyz(f, x, y, z) {
    return new THREE.Vector3(f.x + f.fz * x + f.fx * z, y, f.z - f.fx * x + f.fz * z);
  }
  function solid(f, x, y, z, w, h, d, color, finish = 'masonry', shape = 'block', tilt = 0) {
    transform.position.copy(xyz(f, x, y, z));
    transform.rotation.set(0, f.angle, 0);
    transform.rotateX(tilt);
    transform.scale.set(w, h, d);
    put(shape, finish, color);
  }
  function line(a, b, diameter, color, finish = 'enamel') {
    const vector = new THREE.Vector3().subVectors(b, a);
    transform.position.copy(a).lerp(b, .5);
    transform.scale.set(diameter, vector.length(), diameter);
    transform.quaternion.setFromUnitVectors(up, vector.normalize());
    put('pipe', finish, color);
  }
  const ads = [
    ['रीगल सिनेमा', 'REGAL  •  CINEMA', '#73172d', '#fff0ac'],
    ['इराणी कैफ़े', 'IRANI CAFÉ  /  BUN MASKA', '#11645e', '#fff0cb'],
    ['कटिंग चाय', 'CUTTING CHAI', '#b34724', '#ffeeac'],
    ['समुद्र रिकॉर्ड्स', 'SAMUDRA RECORDS', '#313454', '#ffc3bd'],
    ['नूर इलेक्ट्रिक', 'NOOR ELECTRIC', '#134b68', '#bdf7ff'],
    ['प्रकाश स्टूडियो', 'PRAKASH PHOTO STUDIO', '#812d45', '#ffecd3'],
    ['सह्याद्री बुक हाउस', 'SAHYADRI BOOK HOUSE', '#315448', '#ffe6ac'],
    ['अपना बाज़ार', 'APNA BAZAAR', '#8a3325', '#ffda92'],
    ['सागर फ़िश मार्केट', 'SAGAR FISH MARKET', '#185264', '#d4fcff'],
    ['महालक्ष्मी फूल', 'MAHALAXMI FLOWERS', '#7d315a', '#ffdecc'],
    ['कोलाबा बेकरी', 'COLABA BAKERY', '#864526', '#fff2c3'],
    ['सुर संगीत', 'SUR SANGEET', '#3d566d', '#cfecff'],
    ['चर्चगेट', 'CHURCHGATE   /   WESTERN RAILWAY', '#142f4a', '#ffe4a2'],
    ['रात का सफ़र', 'TONIGHT   •   9.30 PM', '#452b51', '#ffceab']
  ];
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 1024;
  const g = canvas.getContext('2d');
  const aw = 512, ah = 256;
  ads.forEach(([hi, en, bg, ink], i) => {
    const x = i % 4 * aw, y = Math.floor(i / 4) * ah;
    g.fillStyle = bg; g.fillRect(x, y, aw, ah);
    g.strokeStyle = ink; g.lineWidth = 3; g.strokeRect(x+9,y+10,aw-18,ah-20);
    g.textAlign = 'center'; g.fillStyle = ink;
    g.font = 'bold 80px "Nirmala UI","Noto Sans Devanagari",sans-serif';
    g.fillText(hi,x+aw/2,y+135,aw-40);
    g.font = 'bold 27px Arial,sans-serif'; g.fillText(en,x+aw/2,y+205,aw-40);
    g.fillRect(x+aw*.22,y+157,aw*.56,2);
  });
  function printPoster(i, tea) {
    g.save();
    g.translate((i%4)*aw,Math.floor(i/4)*ah);
    const cream='#ffda91', dark=tea?'#074744':'#331d39', red=tea?'#198d82':'#eb554c';
    function poly(points, color) {
      g.fillStyle=color; g.beginPath();
      points.forEach(([x,y],k)=>k?g.lineTo(x,y):g.moveTo(x,y)); g.closePath(); g.fill();
    }
    function disc(x,y,r,color) {
      g.fillStyle=color; g.beginPath(); g.arc(x,y,r,0,Math.PI*2);g.fill();
    }
    function label(str,x,y,size,color,limit) {
      g.fillStyle=color;g.font='bold '+size+'px "Nirmala UI",Arial,sans-serif';
      g.textAlign='left';g.fillText(str,x,y,limit);
    }
    g.beginPath();g.rect(0,0,aw,ah);g.clip();
    g.fillStyle=red;g.fillRect(0,0,aw,ah);
    for(let k=0;k<25;k++) {
      const a=k/25*2*Math.PI;
      poly([[125,119],[125+410*Math.cos(a),119+410*Math.sin(a)],
        [125+410*Math.cos(a+.071),119+410*Math.sin(a+.071)]],tea?'#46a18b':'#ff9571');
    }
    disc(105,119,85,cream);
    if(tea) {
      // A kettle, its brass handle, and a fluted glass balanced on a saucer.
      g.strokeStyle=dark;g.lineWidth=14;g.beginPath();g.arc(79,103,33,Math.PI,2*Math.PI);g.stroke();
      poly([[40,102],[103,88],[119,121],[153,93],[147,118],[123,147],[78,163],[38,148]],dark);
      poly([[42,104],[89,88],[104,91],[98,99],[46,112]],red);
      poly([[143,144],[177,144],[168,181],[151,181]],dark);
      for(let j=0;j<3;j++)poly([[147+j*9,148],[150+j*8,148],[153+j*6,177]],cream);
      poly([[136,185],[184,185],[175,191],[147,191]],dark);
      for(let j=0;j<4;j++)disc(148+j*2,119+j*5,2.6,cream);
    } else {
      // Two-colour screen-printed profile: swept hair, lit cheek and high coat collar.
      poly([[15,230],[42,184],[75,163],[84,143],[68,130],[55,105],[60,74],[74,58],[85,42],[111,36],[142,44],[158,62],[150,82],[148,101],[161,118],[149,124],[147,139],[137,152],[115,155],[116,169],[145,179],[181,221]],dark);
      poly([[83,90],[102,73],[130,67],[144,76],[140,98],[151,115],[137,119],[140,127],[130,129],[139,132],[131,142],[115,146],[96,132],[94,114],[85,115]],'#f29870');
      poly([[112,96],[124,88],[140,90],[135,96],[124,94]],dark);
      poly([[74,167],[96,151],[108,167],[97,178],[116,203],[86,184],[79,191]],cream);
      poly([[119,160],[131,172],[117,191],[109,171]],red);
    }
    poly([[216,0],[512,0],[512,256],[164,256]],dark);
    label(tea?'ईरानी':'आख़िरी',211,90,67,cream,280);
    label(tea?'चाय':'लोकल',202,163,73,tea?'#71e6c9':'#ff8673',278);
    label(tea?'IRANI  •  CHAI':'THE LAST LOCAL',199,202,30,cream,286);
    label(tea?'FRESH BREW   /   BOMBAY':'REGAL TALKIES   /   9.30 PM',195,230,15,cream,285);
    g.strokeStyle=cream;g.lineWidth=4;g.strokeRect(5,5,502,246);
    g.restore();
  }
  printPoster(14,false); printPoster(15,true);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const vertices = [], uvs = [];
  function placard(f, id, x, y, z, w, h) {
    solid(f,x,y,z-.1,w+.19,h+.18,.18,'#342b33','enamel');
    const u = (id%4)/4, v = 1-Math.floor(id/4)/4;
    for (const [dx,dy] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]) {
      vertices.push(...xyz(f,x+(dx-.5)*w,y+(dy-.5)*h,z+.01).toArray());
      uvs.push(u+.001+dx*.248,v-.249+dy*.248);
    }
  }
  const teal = '#58d4d3', amber = '#ffc473', pink = '#ff705b';
  const plaster = ['#806952','#716960','#677d76','#7b685f','#577575','#826c65','#67607a'];
  const windows = ['#f3bb7a','#bf7951','#94b8ac','#eccd96','#c78c63'];
  const steel = '#354b4c';
  function tank(f, x, h, z) {
    solid(f,x,h+.34,z,2.25,.68,2.25,steel);
    solid(f,x,h+1.55,z,2.32,2,2.32,'#344547','enamel','drum');
    for (const y of [.69,1.19,1.84,2.43]) solid(f,x,h+y,z,2.43,.09,2.43,'#516160','enamel','drum');
  }
  function building(f,w,h,id,style) {
    const d = 5 + random()*4, wall = pick(plaster);
    solid(f,0,h/2,-d/2,w,h,d,wall);
    solid(f,0,h,-d/2,w+.42,.42,d+.45,'#98a198');
    solid(f,0,h+.36,.02,w,.53,.28,wall);
    if (random()<.72) tank(f,-w*.27,h,-d*.58);
    const cols = Math.max(2,Math.floor(w/2.45));
    for(let y=4.9;y<h-1;y+=2.78) {
      if(style===1 || style===2) {
        solid(f,0,y-.82,.42,w-.45,.2,1.08,'#929287');
        for(const height of [-.15,-.5]) solid(f,0,y+height,1,w-.59,.06,.07,'#536665','enamel');
        for(let i=0;i<cols*2;i++) solid(f,(i+.5)*w/(cols*2)-w/2,y-.46,1,.06,.8,.07,steel);
      }
      for(let c=0;c<cols;c++) {
        const x = (c+.5)*w/cols-w/2;
        solid(f,x,y,.02,1.51,1.72,.2,'#394344');
        solid(f,x,y,.14,1.23,1.37,.06,random()<.43?pick(windows):'#304344','light');
        solid(f,x,y,.21,.09,1.41,.065,steel);
        if(style===0) solid(f,x,y+.87,.26,1.8,.17,.55,wall);
        if(random()<.13) {
          solid(f,x+.68,y-.59,.48,.72,.48,.56,'#90938a','enamel');
          for(let v=0;v<3;v++) solid(f,x+.68,y-.74+v*.12,.77,.53,.035,.03,steel);
        }
      }
    }

    for(let k=0;k<cols;k++) {
      const x=(k+.5)*w/cols-w/2;
      solid(f,x,1.36,.04,w/cols-.26,2.6,.16,'#293735','enamel');
      if(k%2) {
        for(let j=0;j<9;j++) solid(f,x,.36+j*.24,.16,w/cols-.48,.045,.04,'#66716a','enamel');
      } else {
        solid(f,x,1.76,.17,w/cols-.55,1.35,.035,'#bc8b60','light');
        solid(f,x,1.76,.21,.10,1.41,.08,steel);
      }
    }
    const cloth=pick(['#983e30','#226461','#a37640','#47586e']);
    solid(f,0,2.7,.72,w-.15,.13,1.57,cloth,'masonry','block',.15);
    solid(f,0,2.51,1.46,w-.15,.25,.09,cloth);
    if(id>=0) placard(f,id,0,3.49,.28,Math.min(7.2,w-.56),1.06);
    else solid(f,0,3.35,.18,w-.5,.13,.18,pick([teal,pink,amber]),'light');
  }
  function theatre(f) {
    solid(f,0,8,-5,19,16,10,'#ad8267');
    solid(f,0,6,.10,18,.55,.7,'#dec6a0');
    for(let i=-3;i<=3;i++) {
      solid(f,i*2.45,9.6,.13,1.67,4.7,.3,'#314c50');
      for(let y=8;y<12;y+=.64) solid(f,i*2.45,y,.36,1.68,.09,.14,'#9e9983');
      solid(f,i*2.43,2,.12,1.95,3.75,.31,'#443739','enamel');
      solid(f,i*2.43,2.12,.33,1.68,2.24,.05,'#b06f4b','light');
    }
    for(let i=-2;i<=2;i++) {
      const top = 15.7+(2-Math.abs(i))*1.12;
      solid(f,i*.98,top/2,.45,.83,top,.95,'#d69e77');
      solid(f,i*.98,12.7,.97,.12,(top-12.7)*1.85,.13,pink,'light');
    }
    for(let i=0;i<3;i++) {
      solid(f,0,4.43+i*.32,1.07,19-i*.42,.31,2.75-i*.16,'#925448');
      solid(f,0,4.43+i*.32,2.45-i*.08,18.9-i*.42,.088,.09,i===1?amber:pink,'light');
    }
    placard(f,0,0,6.36,1.57,13.25,2.44);
    for(let i=0;i<30;i++) solid(f,-8.7+i*.6,4.24,2.39,.135,.135,.135,amber,'light','ball');
    for(const side of [-1,1]) placard(f,13,side*7.55,2.22,.49,1.52,2.13);
  }
  function stand(f,i) {
    const cloth = pick(['#ad4539','#b58843','#286b68','#645b82']);
    solid(f,0,.83,0,2.15,1,.85,cloth);
    solid(f,0,1.37,0,2.34,.13,1.13,'#b08a5c');
    for(const x of [-.95,.95]) solid(f,x,1.86,0,.08,1.37,.08,steel);
    solid(f,0,2.59,0,2.75,.15,1.83,cloth,'masonry','block',.11);
    for(let k=0;k<12;k++) solid(f,(k%6-2.5)*.29,1.56,Math.floor(k/6)*.24,.29,.28,.3,
      i%2?pick(['#f19b38','#a2b35f','#e0ba49']):pick(['#d38278','#edc57d','#bc5266']),'masonry','ball');
    solid(f,0,2.44,.45,1.46,.045,.08,amber,'light');
  }
  const start = route.sample(0);
  const outward = start.x*start.nx+start.z*start.nz>=0?1:-1;
  theatre(frame(26,outward,12.4));
  let usedSigns = 0;
  for(const side of [outward,-outward]) {
    for(let s=3;s<route.length-3;) {
      const width=8.1+random()*4.6;
      const center=s+width/2;
      s+=width+1.05;
      if(side===outward && Math.abs(center-26)<12+width/2) continue;
      const f=frame(center,side,12.5);
      const a=route.sample(center-4), b=route.sample(center+4);
      if(side===-outward && a.tx*b.tx+a.tz*b.tz<.999) continue;
      const transit=center>92 && center<145;
      if(transit && side===outward && center<117) continue;
      const h=transit?10+random()*6:8+Math.floor(random()*5)*2.78;
      const id=usedSigns%3===0 ? -1 : 1+(usedSigns%11);
      usedSigns++;
      building(f,width,h,id,Math.floor(random()*3));
      if(center>169 && center<237) stand(frame(center,side,9.9),usedSigns);
    }
  }
  function approaching(s,side,offset,bend=0) {
    const f=frame(s,side,offset),p=route.sample(s);
    f.angle=Math.atan2(-p.tx,-p.tz)+bend;
    f.fx=Math.sin(f.angle); f.fz=Math.cos(f.angle);
    return f;
  }
  // Projecting signboards read down the street before their host building comes into view.
  for(const [s,side,id,y,w,h] of [
    [26,outward,14,8,8.3,4.6],[68,-outward,3,6.7,4.2,2.3],
    [155,outward,12,7.4,5.1,2.55],[201,-outward,15,7.4,6.9,3.9],
    [266,outward,4,6.1,3.8,2.3],[348,-outward,10,6.3,4.6,2.5],
    [421,outward,6,6.2,4.3,2.2],[489,-outward,15,7.0,6.3,3.55],
    [route.length-7,outward,14,8.4,8.8,4.9]
  ]) {
    // The cinema blade projects over the kerb, clear of the marquee beneath it.
    const f=approaching(s,side,s===26?7.25:10.8,.13*side);
    for(const x of [-w*.35,w*.35]) {
      solid(f,x,y-h*.5-.75,-.13,.15,1.54,.17,steel,'enamel');
      line(xyz(f,x,y-h*.5-1.45,-.13),xyz(f,x,y-h*.5,-1.03),.11,steel);
    }
    placard(f,id,0,y,0,w,h);
    for(const yy of [-1,1]) solid(f,0,y+yy*(h*.5+.14),.025,w+.44,.115,.15,id===15?teal:pink,'light');
    if(id===14 || id===15) for(let k=0;k<12;k++)
      solid(f,-w*.46+k*w*.92/11,y-h*.5-.26,.065,.09,.09,.1,amber,'light','ball');
  }
  // Cinematic gateway and the flower market's scalloped strings of marigolds and lamps.
  const gate=approaching(33,outward,0);
  for(const x of [-8.9,8.9]){
    solid(gate,x,3.55,0,.36,7.1,.48,'#985731','enamel');
    for(const dx of [-.23,.23]) solid(gate,x+dx,3.62,.26,.08,6.75,.08,amber,'light');
    solid(gate,x,7.23,0,1.17,.46,.7,'#bd7252');
  }
  solid(gate,0,7.15,0,17.9,.37,.44,'#ab604c');
  solid(gate,0,7.24,.26,18.1,.10,.09,pink,'light');
  placard(gate,0,0,7.45,.34,7.4,1.7);
  for(const s of [177,190,205,218,485,498]){
    const f=approaching(s,outward,0);
    for(const x of [-9,9]) solid(f,x,3.8,0,.105,7.6,.105,'#746348','enamel','pipe');
    let prev=xyz(f,-9,7.42,0);
    for(let j=1;j<=36;j++){
      const x=j*.5-9, y=6.12+1.3*(x/9)**2;
      const next=xyz(f,x,y,0);line(prev,next,.041,'#674f36');prev=next;
      const drop=.12+.14*Math.abs(Math.sin(j*.65));
      solid(f,x,y-drop*.5,0,.13,drop,.14,j%4===0?'#ec7144':'#f3ab36','light','ball');
      if(j%4===0)solid(f,x,y-drop-.07,0,.19,.22,.19,amber,'light','ball');
    }
  }
  function pedestrian(f,x,z,height,shirt,skin) {
    const v=(dx,y,dz)=>xyz(f,x+dx,height*y,z+dz);
    for(const side of [-1,1]) {
      line(v(side*.12,.54,0),v(side*.15,.15,.03*side),.15,'#383c48','masonry');
      solid(f,x+side*.15,.26,z+.05*side,.18,.14,.28,'#45382f');
      line(v(side*.2,.77,0),v(side*.27,.55,.07),.115,shirt,'masonry');
      line(v(side*.27,.55,.07),v(side*.22,.48,.17),.10,skin,'masonry');
    }
    solid(f,x,height*.63,z,.53,height*.39,.34,shirt,'masonry','ball');
    solid(f,x,height*.907,z,.28,height*.205,.27,skin,'masonry','ball');
    solid(f,x,height*.986,z-.012,.29,.12,.29,'#30272b','masonry','ball');
  }
  for(const [s,side] of [[18,outward],[61,-outward],[178,outward],[194,-outward],
    [213,outward],[229,-outward],[341,-outward],[485,outward],[504,-outward]]) {
    const f=frame(s,side,9.31);
    pedestrian(f,-.47,.18,1.7,pick(['#c48137','#b6554d','#608b91']),'#925e48');
    pedestrian(f,.57,-.62,1.56,pick(['#af5176','#418886','#d3ab61']),'#aa7156');
    solid(f,-.47,1.94,.18,.039,.58,.039,steel,'enamel','pipe');
    solid(f,-.47,2.13,.18,1.64,.43,1.64,pick(['#db594c','#dd953e','#248c87']),'enamel','ball');
    solid(f,-.47,2.06,.18,1.67,.083,1.67,'#f4b671','masonry','drum');
  }
  // Curved pavement follows the route tangent. Small slabs keep joints visible in rain.
  for(let s=0;s<route.length;s+=2) for(const side of [-1,1]) {
    const f=frame(s,side,9.95);
    solid(f,0,.094,0,2.34,.19,4.12,'#59625f');
    solid(f,0,.14,2.05,2.12,.28,.18,Math.floor(s/4)%2?'#837e69':'#474d4d');
  }
  for(let s=6;s<route.length;s+=16) {
    const side=Math.floor(s/16)%2?outward:-outward;
    const f=frame(s,side,8.85);
    solid(f,0,2.83,0,.13,5.66,.13,steel,'enamel','pipe');
    solid(f,0,.46,0,.32,.9,.32,steel,'enamel','drum');
    line(xyz(f,0,5.36,0),xyz(f,0,6.08,1.2),.12,steel);
    solid(f,0,6.10,1.49,.49,.17,.86,'#476363','enamel');
    solid(f,0,5.99,1.50,.4,.055,.73,amber,'light');
  }
  // A steel portal for the suburban railway with triangulated trusses and catenary.
  for(const s of [98,112,127,142]) {
    const f=frame(s,outward,0);
    for(const x of [-1.4,1.4]) {
      line(xyz(f,x,7.35,-11),xyz(f,x,7.35,11),.29,steel);
      line(xyz(f,x,8.85,-11),xyz(f,x,8.85,11),.23,steel);
      for(let z=-10;z<10;z+=2) line(xyz(f,x,7.35,z),xyz(f,x,8.85,z+2),.13,'#647472');
      for(const z of [-10,10]) {
        solid(f,x,3.75,z,.34,7.5,.38,steel,'enamel');
        solid(f,x,.68,z,.64,1.36,.68,'#78776b');
      }
    }
    for(let z=-10;z<=10;z+=2) line(xyz(f,-1.5,8.85,z),xyz(f,1.5,8.85,z),.15,steel);
    if(s===112) {
      const face = {...f,angle:f.angle+Math.PI/2,fx:f.fz,fz:-f.fx};
      placard(face,12,0,7.98,1.51,6.95,1.07);
      const back={...face,angle:face.angle+Math.PI,fx:-face.fx,fz:-face.fz};
      placard(back,12,0,7.98,1.51,6.95,1.07);
    }
  }
  for(let s=12;s<route.length-26;s+=26) {
    const side=outward;
    const f=frame(s,side,10.6);
    solid(f,0,3.55,0,.2,7.1,.2,'#554e42','enamel','pipe');
    solid(f,0,6.84,0,1.45,.13,.18,steel);
    for(let wire=0;wire<3;wire++) {
      const p=xyz(f,wire*.35-.35,6.98,0);
      const q=xyz(frame(s+26,side,10.6),wire*.35-.35,6.98,0);
      let prev=p;
      for(let k=1;k<=5;k++) {
        const t=k/5, next=p.clone().lerp(q,t);
        next.y-=4*t*(1-t)*.95;
        line(prev,next,.034,'#292f34'); prev=next;
      }
    }
  }
  // Upper floors and rooftop plant form a second, taller layer behind the street walls.
  for(let s=1;s<route.length;s+=6.7+random()*6) {
    const f=frame(s,outward,24+random()*17);
    const w=6+random()*8,d=5+random()*7,h=17+random()*31;
    solid(f,0,h/2,0,w,h,d,pick(['#41555a','#40535a','#566063','#485156']));
    for(let y=9;y<h-1;y+=2.7) {
      for(let x=-w*.39;x<w*.45;x+=1.76) if(random()<.59) {
        solid(f,x,y,d/2+.03,.85,.9,.09,pick(['#728c89','#8a7c65','#a78d75','#64908b']),'light');
      }
    }
    if(random()<.52) tank(f,0,h,0);
  }
  for(const batch of buckets.values()){
    const mesh=new THREE.InstancedMesh(shapes[batch.shape],finishes[batch.finish],batch.poses.length);
    const col=new THREE.Color();
    batch.poses.forEach((matrix,i)=>{
      mesh.setMatrixAt(i,matrix);
      mesh.setColorAt(i,col.set(batch.colors[i]));
    });
    mesh.computeBoundingSphere();
    root.add(mesh);
  }
  const signs=new THREE.BufferGeometry();
  signs.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  signs.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  root.add(new THREE.Mesh(signs,new THREE.MeshBasicMaterial({map:tex,toneMapped:false})));
  return root;
}
