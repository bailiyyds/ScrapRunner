const SAVE_KEY='scrap-runner-progress-v1';
function freshProgress(){return {yardWins:0,iceWins:0,foundryWins:0,kills:0,bosses:0,sawKills:0,missileKills:0,credits:0,hull:0,recovery:0}}
let progress=freshProgress(),saveAvailable=true;
try{const data=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(data)for(const key of Object.keys(progress))if(Number.isSafeInteger(data[key])&&data[key]>=0)progress[key]=Math.min(data[key],key==='hull'||key==='recovery'?3:100000000)}catch{saveAvailable=false}
const WEAPON_CHALLENGES={arc:10,saw:25,missile:40,frost:60,drone:80};
const loadoutChoice={starter:'cannon',path:'solar',aspect:0,fragment:'focus',mech:'balanced',difficulty:0,map:'yard'};
function unlockedWeapon(id){return ['cannon','sword','howitzer'].includes(id)||progress.kills>=WEAPON_CHALLENGES[id]}
function mechUnlocked(id){return id==='balanced'||id==='shield'&&progress.sawKills>=30||id==='bomber'&&progress.missileKills>=30}
function saveProgress(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(progress));saveAvailable=true}catch{saveAvailable=false}}
function recordProgressKill(e,source){const before=progress.kills;progress.kills++;progress.credits++;if(source==='saw')progress.sawKills++;if(source==='missile')progress.missileKills++;if(e.type==='mother'||e.type==='finalboss'){progress.bosses++;progress.credits+=20;addNotice('首领挑战完成 · 高难度与冰原已解锁')}
 for(const [id,goal]of Object.entries(WEAPON_CHALLENGES))if(before<goal&&progress.kills>=goal)addNotice(`永久解锁：${WEAPONS[id].name}`);
 if(source==='saw'&&progress.sawKills===30)addNotice('永久解锁：近战护盾型');if(source==='missile'&&progress.missileKills===30)addNotice('永久解锁：远程爆破型');saveProgress();
}
function applyProgress(){battle.mech=mechUnlocked(loadoutChoice.mech)?loadoutChoice.mech:'balanced';battle.difficulty=progress.bosses>0?loadoutChoice.difficulty:0;battle.map=progress.bosses>0?loadoutChoice.map:'yard';battle.maxHp+=progress.hull*5;battle.hp=battle.maxHp;battle.heal+=progress.recovery*3;battle.shield=0;battle.shieldTimer=0;
 if(battle.mech==='shield'){battle.maxHp+=15;battle.hp=battle.maxHp;battle.shield=15}
 if(battle.mech==='bomber'){battle.maxHp-=10;battle.hp=battle.maxHp}
}
function updateMech(dt){if(battle.mech!=='shield')return;battle.shieldTimer+=dt;if(battle.shieldTimer>=12){battle.shieldTimer=0;battle.shield=15}}
function buyPermanent(key){if(battle.mode!=='hangar'||!['hull','recovery'].includes(key)||progress[key]>=3)return false;const cost=40*(progress[key]+1);if(progress.credits<cost)return false;progress.credits-=cost;progress[key]++;saveProgress();showHangar();return true}
function showHangar(){battle.mode='hangar';showOverlay('机库 · 局外成长',`累计击杀 ${progress.kills} · 首领 ${progress.bosses} · 回收点 ${progress.credits} · ${saveAvailable?'进度已保存':'存档不可用：本次进度只保留到关闭页面'}`);
 showBuildChoices();overlayButton('出击 · '+WEAPONS[loadoutChoice.starter].name+' / '+PATHS[loadoutChoice.path].name,()=>{enableGameAudio();resetBattle();canvas.focus()});
 const status=document.createElement('p');status.textContent=Object.entries(WEAPON_CHALLENGES).map(([id,goal])=>`${WEAPONS[id].name} ${progress.kills>=goal?'已解锁':Math.min(progress.kills,goal)+'/'+goal}`).join(' ｜ ');overlay.append(status);
 const challenge=document.createElement('p');challenge.textContent=`锯刃击杀 ${Math.min(30,progress.sawKills)}/30 解锁护盾型；导弹击杀 ${Math.min(30,progress.missileKills)}/30 解锁爆破型。解锁的武器进入母虫掉落池，开局武器与流派可自由搭配。`;overlay.append(challenge);
 for(const [id,name,desc]of [['balanced','均衡型','100 基础生命'],['shield','近战护盾型','115 基础生命，每 12 秒刷新 15 护盾，锯刃伤害 +20%'],['bomber','远程爆破型','90 基础生命，导弹伤害 +20%，爆炸范围 +15']])if(mechUnlocked(id))overlayButton(`${loadoutChoice.mech===id?'✓ ':''}${name} · ${desc}`,()=>{loadoutChoice.mech=id;showHangar()});
 overlayButton(`难度：${loadoutChoice.difficulty?'危险（敌人生命/伤害 +20%）':'标准'}${progress.bosses?'':' · 击败任意母虫解锁危险'}`,()=>{if(progress.bosses){loadoutChoice.difficulty=1-loadoutChoice.difficulty;showHangar()}});
 for(const [id,map]of Object.entries(MAPS))overlayButton(`${loadoutChoice.map===id?"✓ ":""}${map.name} · 20 波 · ${map.desc}${id!=="yard"&&!progress.bosses?"（击败母虫解锁）":""}`,()=>{if(id==="yard"||progress.bosses){loadoutChoice.map=id;showHangar()}});
 for(const [key,name]of [['hull','强化机体：每级 +5 生命'],['recovery','维修训练：每级修复 +3']])overlayButton(`${name} · ${progress[key]}/3 · ${progress[key]>=3?'已满级':40*(progress[key]+1)+' 回收点'}`,()=>buyPermanent(key));
 overlayButton('开始新一局',()=>{enableGameAudio();resetBattle();canvas.focus()});
}

