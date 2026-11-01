const environmentImage=new Image(),enemyAtlas=new Image();
environmentImage.src='assets/wasteland.png';enemyAtlas.src='assets/enemies-realistic.png';
function lightPhase(time){const t=(time%240)/60;return {index:Math.floor(t),blend:t%1,name:['晨雾','白昼','黄昏','深夜'][Math.floor(t)]}}
const mapImages=Object.fromEntries(['yard','ice','foundry'].map(id=>{const img=new Image();img.src='assets/maps/'+id+'-v2.png';return [id,img]}));
function weatherStrength(time,map){return map==='ice'?.25+.75*(.5-.5*Math.cos(time*Math.PI/36)):map==='foundry'?.65+.15*Math.sin(time*1.8):.35+.2*Math.sin(time/19)}
function drawEnvironment(){const selected=mapImages[battle.map],modern=selected?.complete&&selected.naturalWidth,img=modern?selected:environmentImage;if(!img.complete||!img.naturalWidth)return false;ctx.save();ctx.imageSmoothingEnabled=true;
 // Crop only at draw time: keep original art intact and fit the walkable floor to the arena.
 if(modern)ctx.drawImage(img,img.naturalWidth*.03,img.naturalHeight*.065,img.naturalWidth*.94,img.naturalHeight*.80,0,0,864,576);else ctx.drawImage(img,0,0,864,576);
 const phase=lightPhase(battle.time),colors=battle.map==='foundry'?[[62,28,16,.06],[180,89,25,.04],[101,38,23,.10],[15,25,42,.14]]:[[91,129,147,.10],[232,204,150,.025],[167,83,49,.12],[15,34,65,.20]],a=colors[phase.index],b=colors[(phase.index+1)%4],mix=a.map((v,i)=>v+(b[i]-v)*phase.blend);ctx.fillStyle=`rgba(${mix.slice(0,3).map(Math.round).join(',')},${mix[3]})`;ctx.fillRect(0,0,864,576);
 const intensity=weatherStrength(battle.time,battle.map)*feedbackSettings.effects;
 if(intensity>0){const count=battle.map==='ice'?65:battle.map==='foundry'?28:22;for(let i=0;i<count;i++){const speed=battle.map==='ice'?22+intensity*28:battle.map==='foundry'?8:5,x=(i*137+battle.time*speed)%864,y=battle.map==='foundry'?576-(i*53+battle.time*(12+i%7))%576:(i*79+battle.time*(9+i%5))%576;ctx.globalAlpha=intensity*(battle.map==='ice'?.25:.32);ctx.fillStyle=battle.map==='ice'?'#d6efff':battle.map==='foundry'?'#ffb25d':'#d4c4a3';ctx.fillRect(x,y,battle.map==='ice'?2:1.5,battle.map==='foundry'?3:1.5)}ctx.globalAlpha=1;
 // Broad, low-opacity moving haze stays beneath combatants and danger telegraphs.
 if(battle.map==='ice'){ctx.fillStyle=`rgba(155,190,211,${.035*intensity})`;for(let i=0;i<3;i++)ctx.fillRect((battle.time*14+i*340)%1200-340,80+i*150,320,70)}
 if(battle.map==='foundry'){ctx.fillStyle=`rgba(255,114,38,${.025+.015*Math.sin(battle.time*2)})`;ctx.fillRect(0,0,864,75)}
 }
 ctx.restore();return true;}
function drawDetailedEnemy(e){if(!enemyAtlas.complete||!enemyAtlas.naturalWidth)return false;const row=['normal','charger','tank','artillery','mother'].indexOf(({finalboss:'mother',icebomb:'charger',frostshot:'artillery',flame:'artillery',spitter:'artillery'}[e.type]||e.type));if(row<0)return false;const cuts=[0,230,505,746,1060,1402],frame=e.frozen>0?0:Math.floor(battle.time*(e.state==='dash'?16:7)+e.x*.01)%4,sw=enemyAtlas.naturalWidth/4,sy=cuts[row]/1402*enemyAtlas.naturalHeight,sh=(cuts[row+1]-cuts[row])/1402*enemyAtlas.naturalHeight;const size={normal:48,charger:56,tank:64,artillery:57,mother:94,finalboss:132,icebomb:50,frostshot:57,flame:57,spitter:54}[e.type];
 const angle=e.state==='dash'||e.state==='warning'?Math.atan2(e.uy,e.ux)-Math.PI/2:Math.atan2(player.y-e.y,player.x-e.x)-Math.PI/2;
 ctx.save();ctx.translate(Math.round(e.x),Math.round(e.y)-(e.state==='air'?Math.sin(Math.PI*(1-e.timer/.6))*90:0));ctx.rotate(angle);ctx.imageSmoothingEnabled=true;ctx.shadowColor='rgba(0,0,0,.7)';ctx.shadowBlur=5;ctx.shadowOffsetY=3;if(['icebomb','frostshot'].includes(e.type))ctx.filter='hue-rotate(150deg)';if(e.type==='flame')ctx.filter='sepia(.7) saturate(2)';if(e.type==='spitter')ctx.filter='hue-rotate(60deg)';if(e.hitFlash>0)ctx.filter='brightness(3)';ctx.drawImage(enemyAtlas,frame*sw,sy,sw,sh,-size/2,-size/2,size,size);ctx.restore();
 ctx.fillStyle='#172333';ctx.fillRect(e.x-18,e.y-size/2-6,36,4);ctx.fillStyle=ENEMY_TYPES[e.type].color;ctx.fillRect(e.x-18,e.y-size/2-6,36*Math.max(0,e.hp/e.maxHp),4);return true;}
const soundLast={};let noiseBuffer,noiseContext;
function audioReady(){try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;audioContext??=new Audio();audioContext.resume().catch(()=>{});return true}catch{return false}}
addEventListener('pointerdown',audioReady);addEventListener('keydown',audioReady);
function combatSound(kind){if(sampleSound(kind))return;if(feedbackSettings.volume<=0||!audioContext||audioContext.state!=="running")return;const now=audioContext.currentTime;if(now-(soundLast[kind]??-100)<({gun:.07,hit:.09,kill:.08,missile:.3,arc:.12,frost:.25,drone:.12,wind:3}[kind]||.1))return;soundLast[kind]=now;
 try{const preset={gun:[.09,160,.065,1800],hit:[.055,340,.025,2200],kill:[.17,95,.055,1100],missile:[.45,55,.14,650],arc:[.13,780,.04,3800],frost:[.2,500,.025,4500],drone:[.07,380,.025,2600],wind:[2.5,45,.012,280]}[kind];if(!preset)return;const [length,hz,gain,cutoff]=preset;
 if(noiseContext!==audioContext){noiseContext=audioContext;noiseBuffer=audioContext.createBuffer(1,audioContext.sampleRate*3,audioContext.sampleRate);const data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1}
 const envelope=audioContext.createGain(),filter=audioContext.createBiquadFilter(),noise=audioContext.createBufferSource();filter.type='lowpass';filter.frequency.value=cutoff;envelope.gain.setValueAtTime(.0001,now);envelope.gain.exponentialRampToValueAtTime(Math.max(.0002,gain*feedbackSettings.volume),now+.008);envelope.gain.exponentialRampToValueAtTime(.0001,now+length);filter.connect(envelope);envelope.connect(audioContext.destination);noise.buffer=noiseBuffer;noise.connect(filter);noise.start(now);noise.stop(now+length);
 if(kind!=='frost'&&kind!=='wind'){const tone=audioContext.createOscillator();tone.type=kind==='arc'?'sawtooth':'triangle';tone.frequency.setValueAtTime(hz,now);tone.frequency.exponentialRampToValueAtTime(Math.max(25,hz*.3),now+length);tone.connect(envelope);tone.start(now);tone.stop(now+length)}
 }catch{/* No audio must never interrupt combat. */}}


