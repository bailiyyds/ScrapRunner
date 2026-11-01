const ENEMY_TYPES={
 icebomb:{name:'冰爆虫',hp:25,speed:48,damage:16,size:13,color:'#98e8ff',xp:8},
 frostshot:{name:'冰棘射手',hp:32,speed:26,damage:12,size:15,color:'#6bb9ff',xp:10},
 flame:{name:'喷焰虫',hp:36,speed:27,damage:14,size:15,color:'#ff793b',xp:10},
 spitter:{name:'酸液射手',hp:30,speed:29,damage:16,size:14,color:'#bbdf65',xp:9},
 finalboss:{name:'终极首领',hp:2000,speed:25,damage:18,size:42,color:'#e66b3f',xp:100},
 normal:{name:'机械虫',hp:24,speed:38,damage:10,size:12,color:'#b65c29',xp:5},
 charger:{name:'冲锋虫',hp:42,speed:42,damage:18,size:12,color:'#eaa33b',xp:8},
 tank:{name:'重甲虫',hp:60,speed:22,damage:16,size:19,color:'#647786',xp:12},
 artillery:{name:'炮击虫',hp:36,speed:28,damage:10,size:14,color:'#55d9d2',xp:10},
 mother:{name:'精英母虫',hp:240,speed:18,damage:22,size:27,color:'#b4c6ca',xp:35}
};
function wavePlan(n){return campaignPlan(n)}
function resetWaves(){battle.wave=0;battle.cores=[];battle.coreCount=0;battle.blasts=[];startWave()}
function startWave(){if(battle.wave>=20){campaignVictory();return}battle.wave++;battle.wavePhase='combat';battle.restLeft=0;battle.queue=wavePlan(battle.wave);battle.spawnTimer=.4}
function createEnemy(type='normal',position){const def=ENEMY_TYPES[type],scale=type==="normal"?1+Math.min(.5,(battle.wave-1)*.015):1+(battle.wave-1)*.06;let x,y;
 if(position){x=position.x;y=position.y}else{let candidates=[{x:24,y:40+Math.random()*490},{x:840,y:40+Math.random()*490},{x:40+Math.random()*784,y:24},{x:40+Math.random()*784,y:552}];const safe=candidates.filter(p=>Math.hypot(p.x-player.x,p.y-player.y)>200);const p=(safe.length?safe:candidates)[Math.floor(Math.random()*(safe.length||candidates.length))];x=p.x;y=p.y}
 const enemy={type,x,y,hp:Math.round(def.hp*scale*(battle.difficulty?1.2:1)),maxHp:Math.round(def.hp*scale*(battle.difficulty?1.2:1)),speed:def.speed*(1+Math.min(.5,(battle.wave-1)*.025)),damage:Math.round(def.damage*(1+(battle.wave-1)*.04)*(battle.difficulty?1.2:1)),size:def.size,state:'walk',timer:type==='mother'?4:1.5+Math.random()*1.5,summons:0};battle.enemies.push(enemy);notifyEnemy(type);if(type==="finalboss")initBoss(enemy);return enemy}
function updateWaves(dt){if(battle.wavePhase==='rest'){battle.restLeft=Math.max(0,battle.restLeft-dt);if(battle.restLeft<=1e-8)startWave();return}battle.spawnTimer-=dt;if(battle.queue.length&&battle.enemies.filter(e=>e.hp>0).length<70&&battle.spawnTimer<=0){createEnemy(battle.queue.shift());battle.spawnTimer=Math.max(.25,.8-battle.wave*.03)}}
function finishWave(){if(battle.mode==='playing'&&battle.wavePhase==='combat'&&!battle.queue.length&&!battle.enemies.some(e=>e.hp>0)&&!battle.blasts.length&&!battle.hazards.length&&!battle.enemyShots.length){if(battle.wave===20){campaignVictory();return}battle.wavePhase='rest';battle.restLeft=5}}
function enemyMove(e,dx,dy,speed,dt){const d=Math.hypot(dx,dy);if(d){e.x+=dx/d*speed*dt*(e.slow>0?.45:1);e.y+=dy/d*speed*dt*(e.slow>0?.45:1)}e.x=Math.max(18,Math.min(846,e.x));e.y=Math.max(18,Math.min(558,e.y))}
function updateEnemies(dt){
 for(const e of [...battle.enemies]){if(e.hp<=0)continue;if(e.type==="finalboss"){bossAttack(e,dt);if(battle.mode!=="playing")return;continue}if(enemyStatus(e,dt))continue;const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy);e.timer-=dt;
  if(['icebomb','frostshot','flame','spitter'].includes(e.type)){rangedBug(e,dt,dx,dy,d);if(battle.mode!=='playing')return;continue}
  if(e.type==='charger'){
   if(e.state==='walk'){enemyMove(e,dx,dy,e.speed,dt);if(e.timer<=0&&d<350){e.state='warning';e.timer=.8;e.ux=d?dx/d:1;e.uy=d?dy/d:0}}
   else if(e.state==='warning'){if(e.timer<=0){e.state='dash';e.timer=.65}}
   else if(e.state==='dash'){enemyMove(e,e.ux,e.uy,310,dt);if(e.timer<=0){e.state='recover';e.timer=.9}}
   else if(e.timer<=0){e.state='walk';e.timer=2.5}
  }else if(e.type==='artillery'){
   if(d>270)enemyMove(e,dx,dy,e.speed,dt);else if(d<140)enemyMove(e,-dx,-dy,e.speed,dt);
   if(e.timer<=0){battle.blasts.push({x:player.x,y:player.y,r:42,left:1.3,damage:Math.round(34*(1+(battle.wave-1)*.04)*(battle.difficulty?1.2:1))});e.timer=3.5}
  }else{enemyMove(e,dx,dy,e.speed,dt);if(e.type==='mother'&&e.timer<=0&&e.summons<3&&battle.enemies.length<=67){for(let i=0;i<3;i++)createEnemy('normal',{x:Math.max(20,Math.min(844,e.x+(i-1)*24)),y:Math.max(20,Math.min(556,e.y+28))});e.summons++;e.timer=5}}
  if(Math.hypot(e.x-player.x,e.y-player.y)<(e.size||12)+13){elementHit(e.damage||12,battle.map==='foundry'?'burn':'');if(battle.mode==='dead')return}
 }
 for(const b of battle.blasts){b.left-=dt;if(b.left<=0){if(Math.abs(player.x-b.x)<=b.r&&Math.abs(player.y-b.y)<=b.r)elementHit(b.damage,battle.map==='foundry'?'burn':battle.map==='ice'?'cold':'');battle.effects.push({kind:'blast',x:b.x,y:b.y,r:b.r,life:.25})}}
 battle.blasts=battle.blasts.filter(b=>b.left>0);
}
function dropEnemyLoot(e){battle.gems.push({x:e.x,y:e.y,value:ENEMY_TYPES[e.type]?.xp||5});if(e.type==='mother'){battle.cores.push({x:e.x-18,y:e.y});rollWeaponDrop(e)}}
function collectCores(){battle.cores=battle.cores.filter(c=>{if(Math.hypot(c.x-player.x,c.y-player.y)>28)return true;battle.coreCount++;addNotice("获得进化核心 · 满足条件后点击核心进化");return false})}
function drawEnemies(){for(const e of battle.enemies){if(e.hp<=0)continue;if(drawDetailedEnemy(e))continue;const def=ENEMY_TYPES[e.type]||ENEMY_TYPES.normal,x=Math.round(e.x),y=Math.round(e.y),s=def.size;
 ctx.fillStyle='#172333';ctx.fillRect(x-s-3,y-s-2,s*2+6,s*2+4);ctx.fillStyle=e.hitFlash>0?'#ffffff':def.color;ctx.fillRect(x-s,y-s,s*2,s*2);
 for(const side of [-1,1])for(let i=-1;i<=1;i++){ctx.fillStyle='#304354';ctx.fillRect(x+side*(s+4)-3,y+i*8-2,6,4)}
 ctx.fillStyle='#172333';ctx.fillRect(x-8,y-5,16,7);ctx.fillStyle='#f1dfb0';ctx.fillRect(x-6,y-3,4,3);ctx.fillRect(x+3,y-3,4,3);
 if(e.type==='tank'){ctx.fillStyle='#b4c6ca';ctx.fillRect(x-s+3,y+5,s*2-6,6);ctx.fillRect(x-3,y-s,6,9)}
 if(e.type==='artillery'){ctx.fillStyle='#304354';ctx.fillRect(x-4,y-s-10,8,14)}
 if(['icebomb','frostshot','flame','spitter'].includes(e.type)){rangedBug(e,dt,dx,dy,d);if(battle.mode!=='playing')return;continue}
  if(e.type==='charger'){ctx.fillStyle='#f1dfb0';ctx.fillRect(x-3,y-s-7,6,7)}
 if(e.type==='mother'){ctx.fillStyle='#eaa33b';ctx.fillRect(x-17,y-27,34,5);ctx.fillRect(x-16,y+8,8,9);ctx.fillRect(x+8,y+8,8,9)}
 ctx.fillStyle='#172333';ctx.fillRect(x-s,y-s-17,2*s,4);ctx.fillStyle=def.color;ctx.fillRect(x-s,y-s-17,Math.round(2*s*e.hp/e.maxHp),4);
 }}
function drawEnemyWarnings(){
 for(const e of battle.enemies)if(e.hp>0&&e.state==='warning'){ctx.strokeStyle='#eaa33b';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+e.ux*202,e.y+e.uy*202);ctx.stroke();ctx.setLineDash([])}
 for(const b of battle.blasts){ctx.strokeStyle='#eaa33b';ctx.lineWidth=3;ctx.strokeRect(Math.round(b.x-b.r),Math.round(b.y-b.r),b.r*2,b.r*2);ctx.fillStyle='#eaa33b';ctx.fillRect(Math.round(b.x)-10,Math.round(b.y)-2,20,4);ctx.fillRect(Math.round(b.x)-2,Math.round(b.y)-10,4,20);ctx.fillRect(Math.round(b.x-b.r),Math.round(b.y+b.r+5),Math.round(2*b.r*(1-b.left/1.3)),4)}
 for(const c of battle.cores){ctx.fillStyle='#172333';ctx.fillRect(Math.round(c.x)-10,Math.round(c.y)-10,20,20);ctx.fillStyle='#eaa33b';ctx.fillRect(Math.round(c.x)-7,Math.round(c.y)-7,14,14);ctx.fillStyle='#f1dfb0';ctx.fillRect(Math.round(c.x)-3,Math.round(c.y)-3,6,6)}
 ctx.fillStyle='#f1dfb0';ctx.font='bold 14px monospace';ctx.fillText(battle.wavePhase==='rest'?`第 ${battle.wave} 波完成 · ${battle.restLeft.toFixed(1)} 秒后进入下一波`:`第 ${battle.wave} 波 · 剩余 ${battle.queue.length+battle.enemies.filter(e=>e.hp>0).length} 敌人`,20,52);
}





