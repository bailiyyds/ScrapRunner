function experienceRequired(level){return 40+20*(level-1)+5*(level-1)*(level-1)}
const ui=document.createElement('section');ui.className='combat-hud';
ui.innerHTML='<div class="meter-label"><b id="level"></b><span id="hp-text"></span></div><div class="meter health"><div id="hp-fill"></div></div><div class="meter-label"><span>能源经验</span><span id="xp-text"></span></div><div class="meter experience"><div id="xp-fill"></div></div><div id="battle-stats"></div><div class="skill-buttons"><button id="pulse">Q / 电磁脉冲</button><button id="repair">E / 紧急修复</button><button id="pause">P / 暂停</button></div><p id="skill-info"></p>';
document.querySelector('.stage-wrap').prepend(ui);
const overlay=document.createElement('div');overlay.className='battle-overlay';overlay.hidden=true;document.querySelector('.stage-wrap').append(overlay);
const battle={};
const upgrades=[
 {id:'damage',name:'重型弹头',desc:'机炮伤害 +8',apply:()=>battle.damage+=8},
 {id:'rate',name:'高速供弹',desc:'机炮射击间隔缩短 15%',apply:()=>battle.interval=Math.max(.12,battle.interval*.85)},
 {id:'armor',name:'强化装甲',desc:'生命上限 +25，恢复 25 点生命',apply:()=>{battle.maxHp+=25;battle.hp=Math.min(battle.maxHp,battle.hp+25)}},
 {id:'pulse',name:'脉冲增幅',desc:'脉冲伤害 +20，范围 +15',apply:()=>{battle.pulseDamage+=20;battle.radius+=15;battle.pulseLevel++}},
 {id:'repair',name:'维修模组',desc:'修复效果 +15，冷却缩短 2 秒（最低 8 秒）',apply:()=>{battle.heal+=15;battle.repairDuration=Math.max(8,battle.repairDuration-2);battle.repairLevel++}},
 {id:'magnet',name:'能源磁铁',desc:'经验吸取范围 +30',apply:()=>battle.magnet+=30}
];
function resetBattle(){Object.assign(battle,{mode:'playing',overloadEnergy:0,overloadLeft:0,hp:100,maxHp:100,level:1,xp:0,nextXp:experienceRequired(1),kills:0,time:0,damage:10,interval:.65,shot:0,spawn:1.2,invulnerable:0,pulseCd:0,repairCd:0,pulseDamage:55,radius:150,pulseLevel:1,repairLevel:1,heal:35,repairDuration:18,magnet:70,enemies:[],gems:[],effects:[],choices:[]});Object.assign(player,{x:432,y:312,row:0,frame:0,clock:0,gaitDistance:0,gaitBlend:0,leanX:0,footDust:[]});clearKeys();overlay.hidden=true;resetWeapons();battle.bullets=[];battle.finalBoss=null;battle.victory=false;aim.held=false;resetFeedback();applyProgress();resetThreats();resetBuild();resetMotion();resetWaves();refreshHud()}
function refreshHud(){
 updateOverloadHud();updateWeaponUI();
 document.getElementById('level').textContent=`LV.${battle.level} 回收者`;
 document.getElementById('hp-text').textContent=`生命 ${Math.ceil(battle.hp)} / ${battle.maxHp}`;
 document.getElementById('hp-fill').style.width=`${battle.hp/battle.maxHp*100}%`;
 document.getElementById('xp-text').textContent=`${battle.xp} / ${battle.nextXp}`;
 document.getElementById('xp-fill').style.width=`${Math.min(100,battle.xp/battle.nextXp*100)}%`;
 document.getElementById('battle-stats').textContent=`击杀 ${battle.kills} · 生存 ${Math.floor(battle.time)} 秒 · ${WEAPONS[battle.weapons[0].id].name} · ${lightPhase(battle.time).name} · 核心 ${battle.coreCount} · 护盾 ${battle.shield||0}`;
 for(const [id,cd,label]of[['pulse',battle.pulseCd,'Q / 电磁脉冲'],['repair',battle.repairCd,'E / 紧急修复']]){const button=document.getElementById(id);button.textContent=label+(cd>0?` ${Math.ceil(cd)}s`:' 就绪');button.disabled=battle.mode!=='playing'||cd>0||(id==='repair'&&battle.hp===battle.maxHp)}
 refreshSkillDock();
 document.getElementById('skill-info').textContent=`手动主武器 · 脉冲 Lv.${battle.pulseLevel} / ${battle.pulseDamage} 伤害 · 修复 Lv.${battle.repairLevel} / +${battle.heal} HP`;
}
function showOverlay(title,subtitle){clearKeys();overlay.hidden=false;overlay.innerHTML='';const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=subtitle;overlay.append(h,p)}
function overlayButton(text,fn){const b=document.createElement('button');b.textContent=text;b.onclick=fn;overlay.append(b)}
function checkLevel(){if(battle.mode!=="playing"||battle.xp<battle.nextXp)return;battle.xp-=battle.nextXp;battle.level++;battle.nextXp=experienceRequired(battle.level);battle.mode='upgrade';battle.choices=weaponUpgrades().sort(()=>Math.random()-.5).slice(0,3);showOverlay(`升级！ LV.${battle.level}`,'战斗已暂停 · 选择一个强化（或按 1 / 2 / 3）');battle.choices.forEach((u,i)=>overlayButton(`${i+1}. ${u.name} — ${u.desc}`,()=>chooseUpgrade(i)));refreshHud()}
function chooseUpgrade(index){if(battle.mode!=='upgrade'||!battle.choices[index])return;battle.choices[index].apply();battle.choices=[];battle.mode='playing';overlay.hidden=true;checkLevel();refreshHud()}
function hurt(amount){if(battle.mode!=='playing'||battle.invulnerable>0)return;const barrierHit=Math.min(battle.barrier||0,amount);battle.barrier=Math.max(0,(battle.barrier||0)-barrierHit);amount-=barrierHit;const absorbed=Math.min(battle.shield||0,amount);battle.shield-=absorbed;amount-=absorbed;battle.hp=Math.max(0,battle.hp-amount);battle.invulnerable=.85;battle.shake=Math.max(battle.shake,6);playFeedbackTone(100,.12,.06);if(battle.hp===0){battle.mode='dead';showOverlay('机甲失去动力',`等级 ${battle.level} · 击杀 ${battle.kills} · 坚持 ${Math.floor(battle.time)} 秒`);saveProgress();overlayButton('返回机库 · 进度已保留',showHangar)}refreshHud()}
function hit(enemy,amount,source){if(enemy.hp<=0)return;if(enemy.type==='finalboss'){amount=bossDamage(enemy,amount);if(amount<=0)return}const dealt=Math.min(enemy.hp,amount);enemy.hp-=amount;bossPhase(enemy);impactFeedback(enemy,dealt,enemy.hp<=0);if(enemy.hp<=0){battle.kills++;recordProgressKill(enemy,source);buildKill();chargeOverload();dropEnemyLoot(enemy);if(enemy.type==="finalboss")campaignVictory()}}
function castSkill(kind){const pathResult=castPathSkill(kind);if(pathResult!==null)return pathResult;if(battle.mode!=='playing'||battle.frozen>0)return false;if(kind==='pulse'&&battle.pulseCd<=0){battle.pulseCd=8;battle.effects.push({kind:'pulse',x:player.x,y:player.y,r:battle.radius,life:.35});for(const enemy of battle.enemies)if(Math.hypot(enemy.x-player.x,enemy.y-player.y)<=battle.radius)damageEnemy(enemy,battle.pulseDamage,"pulse");refreshHud();return true}if(kind==='repair'&&battle.repairCd<=0&&battle.hp<battle.maxHp){battle.hp=Math.min(battle.maxHp,battle.hp+battle.heal);battle.repairCd=battle.repairDuration;battle.effects.push({kind:'heal',x:player.x,y:player.y,r:38,life:.5});refreshHud();return true}return false}
function togglePause(){if(battle.mode==='playing'){battle.mode='paused';showOverlay('战斗暂停','按 P 或点击继续');overlayButton('继续战斗',togglePause)}else if(battle.mode==='paused'){battle.mode='playing';overlay.hidden=true;clearKeys()}refreshHud()}
document.getElementById('pulse').onclick=()=>castSkill('pulse');document.getElementById('repair').onclick=()=>castSkill('repair');document.getElementById('pause').onclick=togglePause;
addEventListener('keydown',e=>{if(e.repeat)return;if(['KeyQ','KeyE','KeyP','Digit1','Digit2','Digit3'].includes(e.code))e.preventDefault();if(e.code==='KeyQ')castSkill('pulse');if(e.code==='KeyE')castSkill('repair');if(e.code==='KeyP')togglePause();if(/^Digit[123]$/.test(e.code))chooseUpgrade(Number(e.code.slice(-1))-1)});
addEventListener('blur',()=>{if(battle.mode==='playing')togglePause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&battle.mode==='playing')togglePause()});

function updateBattle(dt){
 if(battle.mode!=='playing')return;combatSound("wind");updateFeedback(dt);updateMech(dt);tickOverload(dt);battle.time+=dt;for(const k of ['invulnerable','pulseCd','repairCd','shot'])battle[k]=Math.max(0,battle[k]-dt);
 updateBuild(dt);updateThreats(dt);if(battle.mode!=="playing")return;updateWaves(dt);
 if(weapon("cannon")&&battle.shot<=0&&battle.frozen<=0&&aim.held&&aim.inside)fireManualCannon();
 updateBullets(dt);if(battle.mode!=="playing")return;updateWeapons(dt);if(battle.mode!=="playing")return;updateEnemies(dt);
 battle.enemies=battle.enemies.filter(e=>e.hp>0);
 if(battle.mode==='playing'){battle.gems=battle.gems.filter(g=>{const dx=player.x-g.x,dy=player.y-g.y,d=Math.hypot(dx,dy);if(d<20){battle.xp+=g.value;pickupFeedback();return false}if(d<pickupRange()){g.x+=dx/d*Math.min(d,(overloaded()?480:240)*dt);g.y+=dy/d*Math.min(d,(overloaded()?480:240)*dt)}return true});collectCores();collectWeaponDrops();checkLevel()}
 for(const e of battle.effects)e.life-=dt;battle.effects=battle.effects.filter(e=>e.life>0);finishWave();refreshHud();
}
function drawBattle(){
 ctx.save();ctx.globalAlpha=feedbackSettings.effects;drawOverload();ctx.restore();
 for(const g of battle.gems){ctx.fillStyle='#55d9d2';ctx.fillRect(Math.round(g.x)-3,Math.round(g.y)-3,6,6)}
 drawEnemies();
 ctx.save();ctx.globalAlpha=feedbackSettings.effects;for(const e of battle.effects){ctx.strokeStyle=e.kind==='heal'||e.overload?'#55d9d2':'#eaa33b';ctx.lineWidth=e.evolved?7:3;if(e.kind==='shot'){ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.tx,e.ty);ctx.stroke()}else{ctx.strokeRect(Math.round(e.x-e.r),Math.round(e.y-e.r),e.r*2,e.r*2)}}
 ctx.restore();if(battle.invulnerable>0){ctx.strokeStyle='#eaa33b';ctx.lineWidth=2;ctx.strokeRect(Math.round(player.x)-27,Math.round(player.y)-40,54,65)}
 ctx.save();ctx.globalAlpha=.3+.7*feedbackSettings.effects;drawWeapons();drawBuild();ctx.restore();drawFeedback();drawAim();drawEnemyWarnings();drawThreats();drawNotices();drawBossHUD();
 ctx.fillStyle='#172333';ctx.fillRect(Math.round(player.x)-25,Math.round(player.y)-48,50,5);ctx.fillStyle='#55d9d2';ctx.fillRect(Math.round(player.x)-25,Math.round(player.y)-48,Math.round(50*battle.hp/battle.maxHp),5);
}
initWeaponUI();initOverload();initFeedback();initInterface();
resetBattle();
showStory();









