// Temporary modifiers are derived, never written into permanent upgrade stats.
const OVERLOAD={capacity:100,perKill:10,duration:6,fireMultiplier:2.5,pickupBonus:220};
let audioContext;
function overloadTone(kind){
 try{
  const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!Audio||feedbackSettings.volume<=0)return;
  audioContext??=new Audio();
  audioContext.resume().catch(()=>{});
  const patterns={start:[220,440,880],end:[440,220,110],ready:[660,880],shot:[180,90]};
  (patterns[kind]||[]).forEach((hz,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain(),t=audioContext.currentTime+i*.07;
   o.type='square';o.frequency.setValueAtTime(hz,t);g.gain.setValueAtTime((kind==='shot'?.015:.04)*feedbackSettings.volume,t);g.gain.exponentialRampToValueAtTime(.001,t+.09);o.connect(g);g.connect(audioContext.destination);o.start(t);o.stop(t+.1);
  });
 }catch{/* Audio is optional when the browser disallows playback. */}
}
function initOverload(){
 const panel=document.createElement('div');panel.className='overload-panel';panel.innerHTML='<div class="meter-label"><b>OVERLOAD / 过载核心</b><span id="overload-text"></span></div><div class="meter overload-meter"><div id="overload-fill"></div></div><button id="overload-button">R / 启动过载</button><span class="overload-hint">击杀充能 · 6 秒爆发 · 仍会受伤</span>';
 ui.append(panel);document.getElementById('overload-button').onclick=activateOverload;
 addEventListener('keydown',e=>{if(e.code==='KeyR'){e.preventDefault();if(!e.repeat)activateOverload()}});
}
function overloaded(){return battle.overloadLeft>0}
function fireInterval(){return battle.interval*(hasModule('feed')?.9:1)/(overloaded()?OVERLOAD.fireMultiplier:1)}
function pickupRange(){return battle.magnet+(battle.map==="ice"?30:0)+(overloaded()?OVERLOAD.pickupBonus:0)}
function chargeOverload(){
 if(overloaded())return; // Burst kills do not refill the next burst.
 const before=battle.overloadEnergy;battle.overloadEnergy=Math.min(OVERLOAD.capacity,before+OVERLOAD.perKill);
 if(before<OVERLOAD.capacity&&battle.overloadEnergy===OVERLOAD.capacity)overloadTone('ready');
}
function activateOverload(){
 if(battle.mode!=='playing'||battle.frozen>0||overloaded()||battle.overloadEnergy<OVERLOAD.capacity)return false;
 battle.shake=Math.max(battle.shake,4);battle.overloadEnergy=0;battle.overloadLeft=OVERLOAD.duration;battle.shot=0;
 overloadTone('start');refreshHud();return true;
}
function tickOverload(dt){
 if(battle.mode!=='playing'||!overloaded())return;
 battle.overloadLeft=Math.max(0,battle.overloadLeft-dt);
 if(!overloaded())overloadTone('end');
}
function updateOverloadHud(){
 const active=overloaded(),ready=battle.overloadEnergy>=OVERLOAD.capacity;
 document.getElementById('overload-text').textContent=active?`爆发中 ${battle.overloadLeft.toFixed(1)}s`:ready?'已充满 · 可保留':`${battle.overloadEnergy} / 100`;
 document.getElementById('overload-fill').style.width=`${active?battle.overloadLeft/OVERLOAD.duration*100:battle.overloadEnergy}%`;
 const button=document.getElementById('overload-button');button.disabled=battle.mode!=='playing'||active||!ready;
 button.textContent=active?'过载中 · 穿透机炮':ready?'R / 释放过载':'R / 过载充能中';
 document.getElementById('overload-fill').style.background=active?'#55d9d2':'#eaa33b';
}
function fireCannon(target){
 const w=weapon('cannon');if(!w)return;combatSound('gun');
 const active=overloaded()||w.evolved;
 if(!active){damageEnemy(target,battle.damage,'cannon');battle.effects.push({kind:'shot',x:player.x,y:player.y,tx:target.x,ty:target.y,life:.12});if(w.level>=3){const bounce=aliveInRange(target.x,target.y,100).find(e=>e!==target);if(bounce){damageEnemy(bounce,battle.damage*.5,'cannon');battle.arcLines.push({x:target.x,y:target.y,tx:bounce.x,ty:bounce.y,life:.1,drone:true})}}}
 else{
  const dx=target.x-player.x,dy=target.y-player.y,len=Math.hypot(dx,dy),ux=len?dx/len:1,uy=len?dy/len:0;
  for(const enemy of battle.enemies){const ex=enemy.x-player.x,ey=enemy.y-player.y,along=ex*ux+ey*uy,across=Math.abs(ex*uy-ey*ux);if(enemy.hp>0&&along>=0&&along<=(w.evolved?540:420)&&across<=(w.evolved?24:15))damageEnemy(enemy,battle.damage,'cannon')}
  battle.effects.push({kind:'shot',overload:true,x:player.x,y:player.y,tx:player.x+ux*(w.evolved?540:420),ty:player.y+uy*(w.evolved?540:420),evolved:w.evolved,life:.12});overloadTone('shot');
 }
 battle.shot=fireInterval();
}
function drawOverload(){
 if(!overloaded())return;
 const x=Math.round(player.x),y=Math.round(player.y),beat=Math.floor(battle.time*16)%2;
 // Hard-edged exhaust and armor accents use the existing sprite palette.
 const exhaust=[[0,1],[1,0],[-1,0],[0,-1]][player.row];
 for(let i=0;i<4;i++){ctx.fillStyle=i%2?'#f1dfb0':'#55d9d2';const n=8-i;ctx.fillRect(x+exhaust[0]*(25+i*7)-n/2,y+exhaust[1]*(25+i*7)-n/2,n,n+beat*3)}
 ctx.fillStyle='#55d9d2';ctx.fillRect(x-23,y-23,7,4);ctx.fillRect(x+16,y-23,7,4);
 ctx.fillStyle=beat?'#f1dfb0':'#55d9d2';ctx.fillRect(x-8,y-12,16,4);
 ctx.strokeStyle='#55d9d2';ctx.lineWidth=4;ctx.strokeRect(2,2,860,572);
 ctx.font='bold 14px monospace';ctx.fillStyle='#55d9d2';ctx.fillText(`OVERLOAD ${battle.overloadLeft.toFixed(1)}s`,18,24);
}




