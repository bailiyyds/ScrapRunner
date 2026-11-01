const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const portrait=document.getElementById('portrait'),pc=portrait.getContext('2d');
ctx.imageSmoothingEnabled=false;pc.imageSmoothingEnabled=false;
const palette=['172333','304354','647786','b4c6ca','f1dfb0','eaa33b','b65c29','55d9d2'];
document.getElementById('palette').innerHTML=palette.map(c=>`<span style="background:#${c}" title="#${c}"></span>`).join('');
const sprite=new Image();sprite.src='assets/hero-run-8.png';
const keys=new Set(),player={x:432,y:312,row:0,frame:0,clock:0,moving:false};
const directions=['下','左','右','上'];
const movementKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'];
addEventListener('keydown',e=>{if(movementKeys.includes(e.code)){e.preventDefault();keys.add(e.code)}});
addEventListener('keyup',e=>keys.delete(e.code));
function clearKeys(){if(typeof aim!=="undefined")aim.held=false;keys.clear();player.moving=false;player.frame=0;player.clock=0}
addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearKeys()});
document.getElementById('reset').onclick=()=>{saveProgress();showHangar();canvas.focus()};
function update(dt){
 const frozen=battle.frozen>0;
 let dx=frozen?0:Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
 let dy=frozen?0:Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
 const len=Math.hypot(dx,dy),oldX=player.x,oldY=player.y;
 if(len){const speed=150*(battle.map==='ice'?.92:1)*(battle.haste>0?1.35:1);player.x=Math.max(48,Math.min(816,player.x+dx/len*speed*dt));player.y=Math.max(80,Math.min(536,player.y+dy/len*speed*dt));player.row=dx?(dx>0?2:1):(dy>0?0:3)}
 const traveled=Math.hypot(player.x-oldX,player.y-oldY);player.moving=traveled>.001;const previous=player.gaitDistance||0;player.gaitDistance=previous+traveled;
 player.gaitBlend=(player.gaitBlend||0)+((player.moving?1:0)-(player.gaitBlend||0))*Math.min(1,dt*14);player.leanX=(player.leanX||0)+((len?dx/len:0)-(player.leanX||0))*Math.min(1,dt*12);
 if(player.moving){player.clock+=traveled/150;player.frame=Math.floor(player.clock*12.5)%8;if(Math.floor(previous/48)!==Math.floor(player.gaitDistance/48)){sampleSound('step');(player.footDust??=[]).push({x:player.x,y:player.y+28,left:.25})}}else{player.frame=0;player.clock=0}
 if(typeof updateMotion==='function')updateMotion(dt,dx,dy,traveled);
 player.footDust=(player.footDust||[]).filter(p=>(p.left-=dt)>0);
 document.getElementById('state').textContent=`${frozen?'冻结':player.moving?'跑动':'待命'} · 朝${directions[player.row]}`;
}
function ground(){if(drawEnvironment())return;
 ctx.fillStyle=battle.map==='ice'?'#304354':'#22322e';ctx.fillRect(0,0,864,576);
 for(let y=0;y<12;y++)for(let x=0;x<18;x++){ctx.fillStyle=(x*7+y*13)%5===0?(battle.map==='ice'?'#647786':'#293b33'):(battle.map==='ice'?'#405969':'#25372f');ctx.fillRect(x*48+1,y*48+1,46,46);if((x*17+y*11)%9===0){ctx.fillStyle='#38483a';ctx.fillRect(x*48+12,y*48+29,8,2);ctx.fillRect(x*48+32,y*48+12,3,3)}}
 ctx.strokeStyle='#52624a';ctx.lineWidth=2;ctx.strokeRect(26,26,812,524);
 ctx.setLineDash([8,12]);ctx.strokeStyle='#667248';ctx.strokeRect(96,96,672,384);ctx.setLineDash([]);
 for(const [x,y] of [[48,48],[792,48],[48,504],[792,504]]){ctx.fillStyle='#152921';ctx.fillRect(x+4,y+5,24,24);ctx.fillStyle='#657152';ctx.fillRect(x,y,24,24);ctx.fillStyle='#a1a46b';ctx.fillRect(x+3,y+3,18,3);ctx.fillStyle='#344b36';ctx.fillRect(x+4,y+10,16,10)}
 ctx.fillStyle='#718064';ctx.font='11px monospace';ctx.fillText('SALVAGE YARD / SECTOR 01',42,565);
}
function draw(){ctx.imageSmoothingEnabled=true;ground();drawRunner()}
let previous=0;function loop(t){const dt=previous?Math.min((t-previous)/1000,.05):0;previous=t;tickStory(t);if(battle.mode==='playing'){update(dt);updateBattle(dt)}renderGame();requestAnimationFrame(loop)}
sprite.onload=()=>requestAnimationFrame(loop);
sprite.onerror=()=>document.getElementById('state').textContent='角色素材加载失败，请检查游戏资源。';





