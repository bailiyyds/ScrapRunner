// Distance-driven gait: 60% planted stance, 40% swinging recovery.
function gaitPose(time,row,moving,blend=1){const phase=((time/.64)%1+1)%1,side=row===1||row===2,dir=row===1?-1:1,b=moving?blend:0;
 const legs=[0,.5].map((offset,i)=>{const t=(phase+offset)%1,stance=t<.6,swing=(t-.6)/.4,reach=stance?1-2*t/.6:-Math.cos(Math.PI*swing),lift=stance?0:Math.sin(Math.PI*swing)*14,spread=i?7:-7;
 const hx=side?(i?3:-3):spread,hy=-4,ax=side?dir*(reach*28.8*b+spread*.22*(1-b)):spread+reach*2*b,ay=side?28-lift*b:26+reach*7*b-lift*b;
 const dx=ax-hx,dy=ay-4-hy,d=Math.min(45.8,Math.max(1,Math.hypot(dx,dy))),bend=Math.sqrt(Math.max(0,23*23-d*d/4)),nx=dy/(Math.hypot(dx,dy)||1),ny=-dx/(Math.hypot(dx,dy)||1);
 return {hx,hy,kx:(hx+ax)/2+nx*bend*(side?dir:(i?1:-1))*.65,ky:(hy+ay-4)/2+ny*bend*(side?dir:(i?1:-1))*.65,ax,ay,stance,lift:lift*b,depth:side?i:ay};});
 return {legs,bob:(1-Math.cos(phase*Math.PI*4))*1.6*b,sway:Math.sin(phase*Math.PI*2)*1.8*b,twist:Math.sin(phase*Math.PI*2)*.035*b,arm:Math.sin(phase*Math.PI*2)*11*b}
}
function armorBone(ax,ay,bx,by,width,part,near){const sw=sprite.naturalWidth/8,sh=sprite.naturalHeight/4,length=Math.hypot(bx-ax,by-ay),crop=part==='thigh'?[.39,.48,.18,.23]:[.42,.69,.14,.19];ctx.save();ctx.translate(ax,ay);ctx.rotate(Math.atan2(by-ay,bx-ax)-Math.PI/2);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#1d2a30';ctx.fillRect(-width/2,-2,width,length+4);ctx.drawImage(sprite,crop[0]*sw,crop[1]*sh,crop[2]*sw,crop[3]*sh,-width/2,-2,width,length+4);if(!near){ctx.fillStyle='rgba(10,22,30,.22)';ctx.fillRect(-width/2,-2,width,length+4)}ctx.restore()}
function drawArmorLimb(l,near){armorBone(l.hx,l.hy,l.kx,l.ky,14,'thigh',near);armorBone(l.kx,l.ky,l.ax,l.ay-4,11,'calf',near);ctx.fillStyle='#26333a';ctx.fillRect(l.kx-5,l.ky-3,10,6);ctx.fillStyle='#849194';ctx.fillRect(l.kx-3,l.ky-3,5,2);const sw=sprite.naturalWidth/8,sh=sprite.naturalHeight/4;ctx.drawImage(sprite,.4*sw,.86*sh,.19*sw,.12*sh,l.ax-7,l.ay-6,17,10)}
function drawRunner(){const m=player.motion,pose=locomotionSample((player.gaitDistance||0)/150,player.row,player.gaitBlend||0,m?.heading),sw=sprite.naturalWidth/8,sh=sprite.naturalHeight/4,attacking=(m?.aimWeight||0)>.1,bodyRow=m?.bodyRow??player.row;
 const idle=(1-(player.gaitBlend||0))*Math.sin((m?.breath||0)*2)*.6;pose.bob+=idle;const strike=battle.swing?Math.sin((1-battle.swing.left/battle.swing.total)*Math.PI):0;pose.twist+=strike*.055*(battle.swing?.combo%2?1:-1);
 ctx.save();ctx.translate(Math.round(player.x),Math.round(player.y));ctx.fillStyle='rgba(0,0,0,.32)';ctx.fillRect(-20,28,40,6);
 for(const dust of player.footDust||[]){ctx.globalAlpha=dust.left/.25*.25;ctx.fillStyle='#c8bb97';ctx.fillRect(dust.x-player.x,dust.y-player.y,5,3)}ctx.globalAlpha=1;
 const legs=[...pose.legs].sort((a,b)=>a.depth-b.depth);legs.forEach((l,i)=>drawArmorLimb(l,i===1));
 ctx.save();ctx.translate(pose.sway+(m?.lean??player.leanX??0)*3,-pose.bob);ctx.rotate(pose.twist+(m?.lean??player.leanX??0)*.045);
 // Stable torso crop avoids frame-to-frame shape drift. Legs and arms carry the gait.
 const arm=(side)=>{const swing=pose.arm*side*(1-(m?.aimWeight||0)),elbowX=side*21,elbowY=-18+swing*.25;ctx.strokeStyle='#172333';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(side*15,-35);ctx.lineTo(elbowX,elbowY);ctx.lineTo(side*18+swing*.35,-6+swing*.4);ctx.stroke();armorBone(side*15,-35,elbowX,elbowY,12,'thigh',side>0);armorBone(elbowX,elbowY,side*18+swing*.35,-6+swing*.4,9,'calf',side>0);ctx.fillStyle='#9ca9aa';ctx.fillRect(elbowX-4,elbowY-4,8,7)};
 arm(-1);ctx.imageSmoothingEnabled=true;const torso=(row)=>ctx.drawImage(sprite,sw*.24,row*sh+sh*.025,sw*.52,sh*.575,-25,-61,50,57.6);if(m&&m.bodyMix<1){ctx.globalAlpha=1-m.bodyMix;torso(m.oldBodyRow);ctx.globalAlpha=m.bodyMix;torso(bodyRow);ctx.globalAlpha=1}else torso(bodyRow);arm(1);
 ctx.restore();ctx.restore();drawHeldWeapon();pc.clearRect(0,0,192,192);pc.drawImage(sprite,0,bodyRow*sh,sw,sh,0,0,192,192)
}
