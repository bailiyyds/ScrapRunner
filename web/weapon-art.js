const weaponTextures=Object.fromEntries(['cannon','howitzer','sword'].map(id=>{const image=new Image();image.src='assets/weapons/'+id+'-detail.png';return [id,image]}));
function drawWeaponTexture(id,recoil,reach){const img=weaponTextures[id];if(!img||!img.complete||!img.naturalWidth)return false;ctx.save();ctx.imageSmoothingEnabled=true;
 if(id==='sword'){const width=(reach+14)/.977,height=width*img.naturalHeight/img.naturalWidth;ctx.drawImage(img,-14-width*.011,-height*.488,width,height)}else{const width=id==='howitzer'?87:65,height=width*img.naturalHeight/img.naturalWidth;ctx.drawImage(img,id==='howitzer'?-24:-12,-height*(id==='howitzer'?.45:.36),width,height);if(recoil>.35){const x=id==='howitzer'?62:52;weaponPoly([[x,-3],[x+8,-6],[x+5,-2],[x+16,0],[x+5,2],[x+8,6],[x,3]],'#f7d991',null)}}ctx.restore();return true}
// Original beveled silhouettes, inspired by sci-fi hand cannons and heavy ordnance.
function weaponPoly(points,fill,stroke='#101a23',width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}}
function weaponRivet(x,y){ctx.fillStyle='#0c1720';ctx.fillRect(x-1.5,y-1.5,3,3);ctx.fillStyle='#c4d1d1';ctx.fillRect(x-1,y-1,1,1)}
function drawWeaponModel(id,color='#7ce4ef',recoil=0,reach=86){
 if(drawWeaponTexture(id,recoil,reach))return;
 const dark='#17232f',steel='#849aa5',light='#d0dbdc',gold='#b49759',ivory='#b9b8aa';
 if(id==='sword'){
  weaponPoly([[0,-4],[13,-4],[16,0],[13,4],[0,4],[-3,0]],dark);for(let x=0;x<11;x+=3){ctx.fillStyle='#788b91';ctx.fillRect(x,-3,1,6)}
  weaponPoly([[11,-13],[17,-11],[21,-4],[21,4],[17,11],[11,13],[13,4],[13,-4]],gold);
  weaponPoly([[19,-7],[reach-20,-6],[reach,-1],[reach-9,5],[28,8],[20,4]],steel);
  weaponPoly([[21,-6],[reach-20,-5],[reach,-1],[reach-13,0],[25,1]],light,null);
  weaponPoly([[25,1],[reach-13,0],[reach-9,4],[28,7]],'#455969',null);
  weaponPoly([[26,-2],[reach-23,-2],[reach-12,0],[reach-26,2],[26,3]],dark,null);
  ctx.strokeStyle=color;ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(29,0);ctx.lineTo(reach-24,0);ctx.lineTo(reach-16,-1);ctx.stroke();
  for(let x=32;x<reach-22;x+=12){ctx.strokeStyle='#607582';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,3);ctx.lineTo(x+4,6);ctx.stroke()}
  weaponRivet(20,0);return;
 }
 if(id==='howitzer'){
  weaponPoly([[-18,-9],[-10,-14],[29,-14],[39,-10],[61,-10],[66,-6],[66,6],[60,11],[31,11],[25,15],[-11,15],[-18,8]],dark);
  weaponPoly([[-13,-9],[-7,-12],[28,-12],[37,-8],[52,-8],[52,6],[29,6],[24,11],[-12,11]],ivory);
  weaponPoly([[-12,7],[24,7],[31,3],[52,3],[52,8],[30,8],[24,13],[-11,13]],'#4d606a',null);
  weaponPoly([[-9,-11],[27,-11],[34,-7],[-9,-7]],light,null);
  ctx.fillStyle=dark;ctx.fillRect(52,-11,11,23);ctx.fillStyle=steel;ctx.fillRect(53,-9,3,19);ctx.fillRect(60,-9,3,19);ctx.fillStyle='#070e15';ctx.fillRect(64,-6,3,12);
  weaponPoly([[-15,-6],[-7,-6],[-7,7],[-15,7]],gold);ctx.fillStyle='#425968';ctx.fillRect(-21,-5,5,11);
  weaponPoly([[-3,10],[7,10],[6,25],[-3,25],[-7,20]],dark);ctx.fillStyle='#627781';ctx.fillRect(-2,14,4,8);
  weaponPoly([[12,10],[25,10],[27,20],[14,20]],gold);for(let x=16;x<25;x+=4){ctx.fillStyle=dark;ctx.fillRect(x,12,2,6)}
  ctx.fillStyle=dark;ctx.fillRect(7,-18,22,5);ctx.fillStyle=color;ctx.fillRect(11,-17,11,2);
  for(let x=30;x<49;x+=5){ctx.fillStyle=dark;ctx.fillRect(x,-6,2,8)}
  ctx.fillStyle=gold;ctx.fillRect(-4,-4,18,8);ctx.fillStyle=dark;ctx.fillRect(-2,-2,14,4);ctx.fillStyle=color;ctx.fillRect(0,-1,10,2);
  for(const p of [[-9,-8],[-9,9],[25,-8],[25,9],[47,-5],[47,5]])weaponRivet(...p);
 }else{
  weaponPoly([[-8,-6],[-2,-13],[14,-14],[20,-10],[43,-10],[48,-6],[48,2],[23,5],[15,11],[-6,9]],dark);
  weaponPoly([[2,-12],[14,-12],[21,-8],[44,-8],[46,-5],[21,-4],[14,-7],[0,-7]],light);
  weaponPoly([[22,-3],[47,-4],[47,1],[23,3]],steel);ctx.fillStyle='#060f17';ctx.fillRect(45,-5,4,6);
  weaponPoly([[-6,7],[8,9],[5,25],[-5,24],[-10,19]],'#293a49');weaponPoly([[-5,11],[4,12],[1,21],[-5,20]],'#765237');
  for(let y=13;y<21;y+=3){ctx.fillStyle=gold;ctx.fillRect(-4,y,5,1)}
  weaponPoly([[6,8],[18,6],[20,11],[15,17],[7,17]],steel);weaponPoly([[9,9],[16,9],[16,12],[13,14],[9,14]],dark,null);
  weaponPoly([[-5,-5],[10,-7],[17,-3],[17,4],[10,8],[-5,6]],'#3b4e5c');
  for(let x=-3;x<=11;x+=5){ctx.fillStyle='#98a9ae';ctx.fillRect(x,-4,2,9);ctx.fillStyle='#c5c9b7';ctx.fillRect(x,-4,2,2)}
  ctx.fillStyle=gold;ctx.fillRect(23,-7,15,2);ctx.fillStyle=color;ctx.fillRect(27,-2,10,1);ctx.fillRect(39,-13,3,3);ctx.fillStyle=dark;ctx.fillRect(-3,-15,7,3);
  weaponRivet(19,-5);weaponRivet(-6,8);weaponRivet(41,-6);
 }
 if(recoil>.35){const muzzle=id==='howitzer'?67:49;weaponPoly([[muzzle,-3],[muzzle+8,-6],[muzzle+5,-2],[muzzle+16,0],[muzzle+5,2],[muzzle+8,6],[muzzle,3]],'#f7d991',null);ctx.fillStyle='#fff6dc';ctx.fillRect(muzzle,-1,8,2)}
}
function swordPose(s){const t=Math.max(0,Math.min(1,1-s.left/s.total)),direction=s.combo%2?1:-1,start=s.angle-direction*s.halfAngle,end=s.angle+direction*s.halfAngle;if(t<.16)return (s.startAngle??start)+angleDelta(s.startAngle??start,start)*motionEase(t/.16);if(t<.82)return start+(end-start)*motionEase((t-.16)/.66);return end}
function drawHeldWeapon(){const id=battle.weapons?.[0]?.id||'cannon',s=battle.swing;let angle=aim.inside?Math.atan2(aim.y-player.y,aim.x-player.x):[Math.PI/2,Math.PI,0,-Math.PI/2][player.row];angle=player.motion?.weaponAngle??angle;ctx.save();ctx.translate(player.x,player.y);if(id==='sword'){angle=s?swordPose(s):(player.motion?angle:angle-.65);ctx.rotate(angle);drawWeaponModel(id,pathDef().color,0,s?s.range:72)}else{ctx.translate(8,-12);ctx.rotate(angle);ctx.translate(-(battle.recoil||0)*5,0);drawWeaponModel(id,pathDef().color,battle.recoil||0)}ctx.restore()}
