// Render-only motion state: input and hitboxes remain immediate and deterministic.
const MOTION={cycleDistance:96,frames:12,turnSpeed:18,settleSpeed:14};
function angleDelta(from,to){return Math.atan2(Math.sin(to-from),Math.cos(to-from))}
function dampAngle(from,to,rate,dt){return from+angleDelta(from,to)*(1-Math.exp(-rate*dt))}
function motionEase(t){t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)}
function resetMotion(){player.motion={heading:Math.PI/2,weaponAngle:Math.PI/2,bodyRow:0,oldBodyRow:0,bodyMix:1,lean:0,aimWeight:0,breath:0,stop:0};player.animationFrame=0}
function updateMotion(dt,dx,dy,traveled){if(!player.motion)resetMotion();const m=player.motion;if(battle.frozen>0)return;
 const moving=traveled>.001,targetHeading=moving?Math.atan2(dy,dx):m.heading;m.heading=dampAngle(m.heading,targetHeading,MOTION.turnSpeed,dt);m.lean+=(Math.cos(targetHeading)*(moving?1:0)-m.lean)*(1-Math.exp(-12*dt));m.breath+=dt;m.stop=moving?0:Math.min(1,m.stop+dt*8);
 const attacking=aim.inside&&aim.held&&battle.mode==='playing';m.aimWeight+=((attacking?1:0)-m.aimWeight)*(1-Math.exp(-20*dt));
 const targetWeapon=aim.inside?Math.atan2(aim.y-player.y,aim.x-player.x):m.heading;
 if(battle.swing)m.weaponAngle=swordPose(battle.swing);else m.weaponAngle=dampAngle(m.weaponAngle,targetWeapon-(battle.weapons[0]?.id==='sword'?.65:0),24,dt);
 const facing=attacking?targetWeapon:m.heading,oldAngle=[Math.PI/2,Math.PI,0,-Math.PI/2][m.bodyRow];
 // Hysteresis avoids flickering between front and side near diagonal mouse angles.
 if(Math.abs(angleDelta(oldAngle,facing))>Math.PI/4+.12){m.oldBodyRow=m.bodyRow;m.bodyRow=Math.abs(Math.cos(facing))>Math.abs(Math.sin(facing))?(Math.cos(facing)>0?2:1):(Math.sin(facing)>0?0:3);m.bodyMix=0}
 m.bodyMix=Math.min(1,m.bodyMix+dt/ .09);player.animationFrame=Math.floor((player.gaitDistance%MOTION.cycleDistance)/MOTION.cycleDistance*MOTION.frames);
}
function locomotionSample(time,row,blend,heading){
 const pose=gaitPose(time,row,true,blend);if(!Number.isFinite(heading))return pose;
 // Interpolate between horizontal stride and foreshortened vertical stride for diagonals.
 const side=Math.cos(heading),vertical=Math.sin(heading),phase=((time/.64)%1+1)%1;
 pose.legs.forEach((l,i)=>{const t=(phase+i*.5)%1,stance=t<.6,u=(t-.6)/.4;
 const reach=stance?1-2*t/.6:(-1+2*motionEase(u)),lift=stance?0:Math.sin(Math.PI*u)**2*15;
 const spread=i?7:-7;l.hx=spread*(1-Math.abs(side)*.55);l.ax=l.hx+side*reach*28.8*blend;l.ay=28+vertical*reach*7*blend-lift*blend;l.lift=lift*blend;l.stance=stance;
 const dx=l.ax-l.hx,dy=l.ay-4-l.hy,length=Math.hypot(dx,dy)||1,bend=Math.sqrt(Math.max(0,23*23-Math.min(45.8,length)**2/4));const sign=Math.abs(side)>.3?Math.sign(side):(i?1:-1);l.kx=(l.hx+l.ax)/2+dy/length*bend*sign*.65;l.ky=(l.hy+l.ay-4)/2-dx/length*bend*sign*.65;l.depth=Math.abs(side)>.7?i:l.ay;
 });return pose
}
