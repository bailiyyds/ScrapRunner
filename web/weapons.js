const WEAPONS={
 sword:{name:'动力刀剑',desc:'左键三连斩，第三击重斩；近距离扇形与击退，过载扩大范围',interval:.55},
 howitzer:{name:'重型火炮',desc:'向准星发射榴弹，范围爆炸，对重甲伤害 ×1.6；间隔2.4秒',interval:2.4},
 cannon:{name:'手枪',desc:'鼠标瞄准，按住左键射击；重甲承受 70% 伤害',interval:.65,module:'feed',evolution:'穿甲弹幕'},
 arc:{name:'电弧发生器',desc:'跳跃连锁、感电；对冲锋虫伤害 ×1.5',interval:1.5,module:'capacitor',evolution:'雷暴网络'},
 saw:{name:'环绕锯刃',desc:'旋转切割、击退；对普通虫伤害 ×1.4',interval:.4,module:'magnet',evolution:'磁暴切割环'},
 missile:{name:'导弹巢',desc:'左键向准星发射，范围破甲；发射间隔 5 秒',interval:5},
 frost:{name:'冰冻喷射器',desc:'近距扇形减速，积累冻结；对冲锋虫冻结更快',interval:.45},
 drone:{name:'无人机',desc:'跟随独立索敌，优先炮击虫；对炮击虫伤害 ×1.6',interval:.8}
};
const MODULES={feed:{name:'供弹器',desc:'全部武器攻击间隔缩短 10%'},capacitor:{name:'电容',desc:'电弧 +1 跳跃，感电持续更久'},magnet:{name:'磁场',desc:'拾取范围 +40，锯刃轨道扩大'},explosive:{name:'爆破芯片',desc:'导弹爆炸范围 +25'},coolant:{name:'冷却剂',desc:'冻结持续时间 +0.5 秒'},armor:{name:'装甲模块',desc:'生命上限 +25，恢复 25 生命'}};
function weapon(id){return battle.weapons.find(w=>w.id===id)}
function hasModule(id){return battle.modules.includes(id)}
function resetWeapons(){battle.weapons=[{id:['cannon','sword','howitzer'].includes(loadoutChoice.starter)?loadoutChoice.starter:'cannon',level:1,cd:0,evolved:false}];battle.modules=[];battle.weaponDrops=[];battle.pendingLoot=null;battle.projectiles=[];battle.notices=[];battle.arcLines=[];battle.frostVisual=null}
function addNotice(text){battle.notices.push({text,left:5});if(battle.notices.length>5)battle.notices.shift()}
function notifyEnemy(type){if(type!=='normal')addNotice(`${ENEMY_TYPES[type].name}出现 · ${ {charger:'横向躲避',tank:'导弹破甲',artillery:'注意落点',mother:'精英来袭',finalboss:'最终决战',icebomb:'远离冰爆，接触冻结 5 秒',frostshot:'躲避冰弹，防止寒冷累积',flame:'躲避扇形火焰',spitter:'横移躲避酸弹'}[type]}`)}
function damageEnemy(e,amount,source){let multiplier=1;if(e.type==='tank'){multiplier=source==='cannon'?.7:source==='howitzer'?1.6:source==='missile'?2:source==='arc'?.9:source==='saw'?.75:source==='drone'?.8:1}if(e.type==='charger'&&source==='arc')multiplier=1.5;if(e.type==='normal'&&source==='saw')multiplier=1.4;if(e.type==='artillery'&&source==='drone')multiplier=1.6;if((e.shock||0)>0&&source!=='arc')multiplier*=1.15;if(battle.mech==="shield"&&source==="saw")multiplier*=1.2;if(battle.mech==="bomber"&&source==="missile")multiplier*=1.2;if(e.hp<=0)return;if(e.weaken>0)multiplier*=1.25;const shielded=e.type==='finalboss'&&e.shieldHp>0;hit(e,Math.max(1,Math.round(amount*multiplier)),source);if(!shielded)applyElement(e,source)}
function equipModule(id){if(hasModule(id)||battle.modules.length>=4)return false;battle.modules.push(id);if(id==='magnet')battle.magnet+=40;if(id==='armor'){battle.maxHp+=25;battle.hp=Math.min(battle.maxHp,battle.hp+25)}return true}
function weaponUpgrades(){
 const options=upgrades.filter(u=>!['damage','rate','magnet','armor'].includes(u.id)).map(u=>u.id==='pulse'?{...u,name:pathDef().q+'增幅'}:u.id==='repair'?{...u,name:pathDef().e+'强化'}:u);
 if(battle.path!=='kinetic'&&battle.pathRank<3)options.push({name:pathDef().name+' · 共鸣 '+(battle.pathRank+1),desc:'元素爆发基础伤害 +4，流派 Q 技能伤害 +10',apply:()=>{battle.pathRank++;battle.pulseDamage+=10}});
 options.push({name:'应急补给',desc:'恢复 25 生命，生命上限 +5',apply:()=>{battle.maxHp+=5;battle.hp=Math.min(battle.maxHp,battle.hp+25)}});
 for(const w of battle.weapons)if(w.level<5)options.push({name:`${WEAPONS[w.id].name} Lv.${w.level+1}`,desc:'增强伤害、数量或控制效果',apply:()=>{w.level++;if(w.id==='cannon')battle.damage+=2}});
 if(battle.modules.length<4)for(const [id,m] of Object.entries(MODULES))if(!hasModule(id))options.push({name:`辅助模块：${m.name}`,desc:m.desc,apply:()=>equipModule(id)});
 return options;
}
function evolutionEligible(w){const def=WEAPONS[w.id];return !!def.evolution&&w.level>=5&&!w.evolved&&hasModule(def.module)}
function evolutionMenu(){if(battle.mode!=='playing'||battle.coreCount<=0)return;const eligible=battle.weapons.filter(evolutionEligible);if(!eligible.length)return;battle.mode='evolution';showOverlay('核心进化','消耗 1 枚核心，永久进化本局武器');for(const w of eligible)overlayButton(`${WEAPONS[w.id].name} → ${WEAPONS[w.id].evolution}`,()=>{if(battle.mode!=='evolution'||battle.coreCount<=0||!evolutionEligible(w))return;w.evolved=true;battle.coreCount--;closeLoot()});overlayButton('保留核心',closeLoot)}
function closeLoot(){battle.pendingLoot=null;battle.mode='playing';overlay.hidden=true;clearKeys();checkLevel();refreshHud()}
function rollWeaponDrop(e){const pool=Object.keys(WEAPONS).filter(id=>!['cannon','sword','howitzer'].includes(id)&&unlockedWeapon(id));if(!pool.length){battle.hp=Math.min(battle.maxHp,battle.hp+20);return}const unowned=pool.filter(id=>!weapon(id));const choices=unowned.length?unowned:pool;battle.weaponDrops.push({id:choices[Math.floor(Math.random()*choices.length)],x:e.x+22,y:e.y})}
function acceptWeapon(id,index){if(battle.mode!=='loot'||battle.pendingLoot!==id)return;const owned=weapon(id);if(owned){if(owned.level<5)owned.level++;else battle.hp=Math.min(battle.maxHp,battle.hp+30)}else if(battle.weapons.length<4)battle.weapons.push({id,level:1,cd:0,evolved:false});else{if(!Number.isInteger(index)||index<0||index>=4)return;battle.weapons[index]={id,level:1,cd:0,evolved:false}}closeLoot()}
function collectWeaponDrops(){if(battle.mode!=='playing')return;const i=battle.weaponDrops.findIndex(d=>Math.hypot(d.x-player.x,d.y-player.y)<35);if(i<0)return;const loot=battle.weaponDrops.splice(i,1)[0];battle.pendingLoot=loot.id;battle.mode='loot';showOverlay(`获得 ${WEAPONS[loot.id].name}`,WEAPONS[loot.id].desc);if(weapon(loot.id))overlayButton(weapon(loot.id).level<5?'强化已有武器':'武器已满级 · 转换为恢复 30 生命',()=>acceptWeapon(loot.id));else if(battle.weapons.length<4)overlayButton('装备武器',()=>acceptWeapon(loot.id));else battle.weapons.forEach((w,index)=>overlayButton(`替换 ${WEAPONS[w.id].name} Lv.${w.level}${w.evolved?'（已进化）':''}`,()=>acceptWeapon(loot.id,index)));overlayButton('放弃本次掉落',closeLoot);refreshHud()}
function initWeaponUI(){const panel=document.createElement('div');panel.className='loadout';panel.innerHTML='<b>武器 / 最多 4 件</b><div id="weapon-slots"></div><b>辅助模块 / 最多 4 件</b><div id="module-slots"></div><button id="evolve-button">核心进化</button><p id="evolve-hint"></p>';ui.append(panel);document.getElementById('evolve-button').onclick=evolutionMenu}
function updateWeaponUI(){
 document.getElementById('weapon-slots').textContent=battle.weapons.map(w=>`${w.evolved?WEAPONS[w.id].evolution:WEAPONS[w.id].name} Lv.${w.level}${w.id==='missile'?` [${Math.max(0,w.cd).toFixed(1)}s]`:''}`).join(' / ')+` (${battle.weapons.length}/4)`;
 document.getElementById('module-slots').textContent=(battle.modules.map(id=>MODULES[id].name).join(' / ')||'暂无模块')+` (${battle.modules.length}/4)`;
 document.getElementById('evolve-button').disabled=battle.mode!=='playing'||battle.coreCount<1||!battle.weapons.some(evolutionEligible);
 document.getElementById('evolve-button').textContent=`核心进化 · 剩余 ${battle.coreCount}`;
 document.getElementById('evolve-hint').textContent='武器 Lv.5 + 对应模块 + 1 核心：手枪/供弹器、电弧/电容、锯刃/磁场';
}
function aliveInRange(x,y,range){return battle.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-x,e.y-y)<=range)}
function intervalFor(w){return WEAPONS[w.id].interval*(hasModule('feed')?.9:1)/(overloaded()?2.5:1)}
function sawPositions(w){const n=1+Math.floor((w.level-1)/2)+(w.evolved?2:0),r=58+(hasModule('magnet')?15:0)+(w.evolved?15:0);return Array.from({length:n},(_,i)=>({x:player.x+Math.cos(battle.time*3+i*Math.PI*2/n)*r,y:player.y+Math.sin(battle.time*3+i*Math.PI*2/n)*r}))}
function fireSpecial(w){if(['sword','howitzer'].includes(w.id))return fireStarter(w);const targets=w.id==='arc'?aimedTargets(420):aliveInRange(player.x,player.y,w.id==='drone'?480:420);if(!targets.length&&!['missile','frost'].includes(w.id))return false;const level=w.level;
 if(w.id==='arc'){combatSound('arc');let from=player,remaining=[...targets],count=2+Math.floor(level/2)+(hasModule('capacitor')?1:0)+(w.evolved?3:0)+(overloaded()?2:0);while(count--&&remaining.length){remaining.sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y));const e=remaining.shift();if(Math.hypot(e.x-from.x,e.y-from.y)>(from===player?(w.evolved?350:260):(w.evolved?220:155)))break;battle.arcLines.push({x:from.x,y:from.y,tx:e.x,ty:e.y,life:.16,evolved:w.evolved});damageEnemy(e,15+level*4,'arc');e.shock=hasModule('capacitor')?4:2;from=e}}
 if(w.id==='saw'){for(const e of targets)if(sawPositions(w).some(p=>Math.hypot(e.x-p.x,e.y-p.y)<(e.size||12)+16)){damageEnemy(e,12+level*4,'saw');if(!['mother','finalboss'].includes(e.type)){const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy)||1;e.x=Math.max(18,Math.min(846,e.x+dx/d*14));e.y=Math.max(18,Math.min(558,e.y+dy/d*14))}}}
 if(w.id==='missile'){const count=level>=4?2:1;for(let i=0;i<count;i++)battle.projectiles.push({x:player.x,y:player.y,tx:aim.x+(i?18:0),ty:aim.y,damage:45+level*10,r:55+(hasModule('explosive')?25:0)+(battle.mech==='bomber'?15:0)})}
 if(w.id==='frost'){combatSound('frost');targets.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));const target=targets[0],angle=Math.atan2(aim.y-player.y,aim.x-player.x),range=105+level*8;battle.frostVisual={angle,range,left:.2};for(const e of targets){const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy),dot=(dx*Math.cos(angle)+dy*Math.sin(angle))/(d||1);if(d<=range&&dot>=.65){damageEnemy(e,3+level,'frost');e.slow=1.2;e.chill=(e.chill||0)+(e.type==='charger'?2:1);if(e.chill>=3){e.frozen=1+(hasModule('coolant')?.5:0);e.chill=0}}}}
 if(w.id==='drone'){combatSound('drone');targets.sort((a,b)=>(b.type==='artillery')-(a.type==='artillery')||Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));const n=level>=4?2:1;for(let i=0;i<n;i++){const target=targets[i%targets.length];damageEnemy(target,10+level*4,'drone');battle.arcLines.push({x:player.x+(i?32:-32),y:player.y-42,tx:target.x,ty:target.y,life:.1,drone:true})}}
 return true;
}
function updateWeapons(dt){for(const n of battle.notices)n.left-=dt;battle.notices=battle.notices.filter(n=>n.left>0);for(const l of battle.arcLines)l.life-=dt;battle.arcLines=battle.arcLines.filter(l=>l.life>0);if(battle.frostVisual){battle.frostVisual.left-=dt;if(battle.frostVisual.left<=0)battle.frostVisual=null}
 for(const w of battle.weapons){if(w.id==='cannon')continue;w.cd=Math.max(0,w.cd-dt);if(w.cd<=0&&(["drone","saw"].includes(w.id)||(battle.frozen<=0&&aim.held&&aim.inside))&&fireSpecial(w))w.cd=intervalFor(w)}
 battle.projectiles=battle.projectiles.filter(p=>{const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),step=240*dt;if(d<=step){combatSound("missile");battle.shake=Math.max(battle.shake,3);for(const e of aliveInRange(p.tx,p.ty,p.r))damageEnemy(e,p.damage,p.source||'missile');battle.effects.push({kind:'blast',x:p.tx,y:p.ty,r:p.r,life:.25});return false}p.x+=dx/d*step;p.y+=dy/d*step;return true});
}
function enemyStatus(e,dt){e.slow=Math.max(0,(e.slow||0)-dt);e.shock=Math.max(0,(e.shock||0)-dt);e.frozen=Math.max(0,(e.frozen||0)-dt);if(!e.slow)e.chill=0;return e.frozen>0}
function drawWeapons(){
 const saw=weapon('saw');if(saw)for(const p of sawPositions(saw)){ctx.fillStyle=saw.evolved?'#55d9d2':'#b4c6ca';ctx.fillRect(Math.round(p.x)-8,Math.round(p.y)-8,16,16);ctx.fillStyle='#304354';ctx.fillRect(Math.round(p.x)-3,Math.round(p.y)-3,6,6)}
 const drone=weapon('drone');if(drone)for(let i=0;i<(drone.level>=4?2:1);i++){ctx.fillStyle='#eaa33b';ctx.fillRect(Math.round(player.x)+(i?25:-39),Math.round(player.y)-49,14,10)}
 for(const p of battle.projectiles){ctx.fillStyle='#eaa33b';ctx.fillRect(Math.round(p.x)-4,Math.round(p.y)-4,8,8);ctx.fillStyle='#f1dfb0';ctx.fillRect(Math.round(p.x)-2,Math.round(p.y)+4,4,6)}
 for(const l of battle.arcLines){ctx.strokeStyle=l.drone?'#f1dfb0':'#55d9d2';ctx.lineWidth=l.evolved?5:2;ctx.beginPath();ctx.moveTo(l.x,l.y);ctx.lineTo((l.x+l.tx)/2+8,(l.y+l.ty)/2-8);ctx.lineTo(l.tx,l.ty);ctx.stroke()}
 if(battle.frostVisual){const {angle,range}=battle.frostVisual;ctx.fillStyle='#55d9d2';for(let r=20;r<range;r+=16)for(let a=-.7;a<=.7;a+=.35)ctx.fillRect(Math.round(player.x+Math.cos(angle+a)*r),Math.round(player.y+Math.sin(angle+a)*r),4,4)}
 for(const e of battle.enemies)if(e.frozen>0||e.slow>0||e.shock>0){ctx.strokeStyle='#55d9d2';ctx.lineWidth=2;ctx.strokeRect(Math.round(e.x)-17,Math.round(e.y)-17,34,34)}
 for(const d of battle.weaponDrops){ctx.fillStyle='#55d9d2';ctx.fillRect(Math.round(d.x)-9,Math.round(d.y)-7,18,14);ctx.fillStyle='#172333';ctx.fillRect(Math.round(d.x)-5,Math.round(d.y)-3,10,6)}
}
function drawNotices(){ctx.font='12px sans-serif';battle.notices.slice(-3).forEach((n,i)=>{ctx.fillStyle='#172333';ctx.fillRect(550,66+i*28,300,24);ctx.fillStyle='#eaa33b';ctx.fillText(n.text,558,83+i*28)})}





