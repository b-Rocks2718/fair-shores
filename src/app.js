import {SCENARIOS,getScenario,RESOURCES} from './scenarios.js';
import {DEFAULTS,boardStats,tally,production} from './generator.js';
import {renderBoard,LABELS,COLORS,escape} from './render.js';
const $ = id=>document.getElementById(id);
const booleanKeys=Object.keys(DEFAULTS).filter(k=>typeof DEFAULTS[k]==='boolean');
let board=null,worker=null,busy=false,seedEdited=false,generatorVersion=4,savedPlayers=null;
const playerLabel=b=>b.version>=3&&b.players===6?'5–6':String(b.players);
const freshSeed=()=>Array.from(crypto.getRandomValues(new Uint8Array(5)),n=>n.toString(16).padStart(2,'0')).join('');
function readForm(){return {v:generatorVersion,family:$('family').value,players:savedPlayers??Number(document.querySelector('[name=players]:checked').value),seed:$('seed').value.trim()||freshSeed(),options:{balance:$('balance').value,...Object.fromEntries(booleanKeys.map(k=>[k,$(k).checked])),variance:Number($('variance').value)}};}
function setForm(state){
  generatorVersion=[1,2,3].includes(state.v)?state.v:4;
  savedPlayers=generatorVersion<3&&state.players===5?5:null;
  if(['base','shores','islands','desert'].includes(state.family))$('family').value=state.family;
  if([3,4,5,6].includes(state.players))document.querySelector(`[name=players][value="${state.players>4?6:state.players}"]`).checked=true;
  $('seed').value=typeof state.seed==='string'?state.seed.slice(0,64):freshSeed();
  $('balance').value=['total','perTile','off'].includes(state.options?.balance)?state.options.balance:DEFAULTS.balance;
  $('variance').value=Number.isInteger(state.options?.variance)&&state.options.variance>=0&&state.options.variance<=100?state.options.variance:DEFAULTS.variance;
  for(const k of booleanKeys)$(k).checked=typeof state.options?.[k]==='boolean'?state.options[k]:DEFAULTS[k];
  if(generatorVersion===1)$('balanceStarts').checked=false;
  updateHelp();
}
const varianceLabel=v=>v===0?'As even as possible':v<40?'Slightly varied':v<60?'Moderately varied':v<=75?'Like a random board':'Lopsided';
function save(state){try{localStorage.setItem('fair-shores-v1',JSON.stringify(state));}catch{/* Browsing without storage still works. */}}
function updateHelp(){
  const state=readForm(),s=getScenario(state.family,state.players),notes=[];
  $('balance').disabled=state.options.recommendedTiles;
  $('balanceStarts').disabled=state.options.recommendedTiles;
  $('variance').disabled=state.options.recommendedTiles||state.options.balance==='off';
  $('variance-value').textContent=varianceLabel(state.options.variance);
  $('balance-help').textContent=state.options.recommendedTiles?'The rulebook’s exact numbers take priority over both balance options.':state.options.balance==='total'?(generatorVersion>=3&&['shores','desert'].includes(s.family)?'Balance resource totals, with a slight preference for the starting island over the whole board.':'Aim for similar total production across all five resources.'):state.options.balance==='perTile'?'Keep average tile strength similar; more tiles still means more production.':'Resource totals are not optimized. Starting-location balance can still be used separately.';
  if(!state.options.noAdjacentRed)notes.push('Allowing adjacent 6s and 8s is a house-rule variant.');
  if(state.options.recommendedTiles)notes.push('Recommended tiles preserve the printed setup. Conflicting placement options may need to be switched off.');
  if(s.noRedGold)notes.push('The desert barrier stays fixed. Gold never receives a 6 or 8.');
  if(s.recommendedMainVariable&&state.options.recommendedTiles)notes.push('The mainland is variable in this diagram; we use the base extension’s beginner setup.');
  if(s.harborNote&&state.options.recommendedHarbors)notes.push(s.harborNote);
  $('settings-note').hidden=!notes.length;$('settings-note').textContent=notes.join(' ');
}
function setBusy(value){
  busy=value;$('generate').disabled=value;$('generate').innerHTML=value?'Charting your shores…':'<span aria-hidden="true">⤨</span> Generate map <span aria-hidden="true">→</span>';
  $('board').setAttribute('aria-busy',String(value));$('map-canvas').classList.toggle('loading',value);
}
function generate(){
  const state=readForm(),scenario=getScenario(state.family,state.players);$('seed').value=state.seed;save(state);
  seedEdited=false;
  if(worker)worker.terminate();setBusy(true);$('status').className='status';$('status').textContent='Finding a board that fits your preferences…';
  worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{
    worker.terminate();worker=null;setBusy(false);
    if(data.error){$('status').className='status error';$('status').textContent=data.error+(board?' The previous map is still shown.':'');return;}
    board=data.board;render();
    if(location.hash)history.replaceState(null,'',`#${encodeURIComponent(JSON.stringify(state))}`);
    const now=readForm();$('status').textContent=JSON.stringify(now)!==JSON.stringify(state)?'Preferences changed while generating. Generate again to apply them.':'Your map is ready. Generate again for a fresh island, or enter a seed to recreate a favorite.';
  };
  worker.onerror=()=>{worker?.terminate();worker=null;setBusy(false);$('status').className='status error';$('status').textContent='The generator could not start. Refresh the page and try again.';};
  worker.postMessage({scenarioId:scenario.id,seed:state.seed,options:state.options,players:state.players,version:state.v});
}
function render(){
  const s=SCENARIOS.find(s=>s.id===board.scenarioId),stats=boardStats(board),land=board.tiles.filter(t=>t.resource!=='sea').length;
  $('board').innerHTML=renderBoard(board,s);$('map-title').textContent=s.title;
  $('map-category').textContent=`${s.family==='base'?'BASE GAME':'SEAFARERS'} / ${playerLabel(board)} PLAYERS / ${s.points} POINTS`;
  $('board-seed').textContent=`SEED / ${board.seed}`;
  $('board-inventory').textContent=`${land} land · ${board.tiles.filter(t=>t.number).length} tokens · ${stats.totalPips} pips`;
  $('validation').textContent=board.options.noAdjacentRed?'✓ Inventory & options checked':'✓ Inventory checked · house rules';
  $('spread-badge').textContent=`${stats.spread}-pip resource spread`;
  const max=Math.max(...stats.rows.map(r=>r.total),1);
  $('production').innerHTML=stats.rows.map(r=>`<button class="resource-stat" data-highlight="${r.resource}" aria-pressed="false" aria-label="Highlight ${LABELS[r.resource]}: ${r.total} pips across ${r.count} tiles"><div class="resource-name"><i style="background:${COLORS[r.resource]}"></i>${LABELS[r.resource]}<b>${r.total}<small> pips</small></b></div><div class="bar-track"><span style="width:${r.total/max*100}%;background:${COLORS[r.resource]}"></span></div><div class="resource-detail">${r.count} tiles <span>${r.average.toFixed(2)} / tile</span></div></button>`).join('');
  $('chart-note').textContent=`One pip = 1/36 production chance per roll. ${stats.goldPips?`Gold’s ${stats.goldPips} pips are separate. `:''}${board.options.recommendedTiles?'Rulebook numbers; both balance optimizations are off.':board.options.balance==='off'?'Resource-total optimization is off.':`${board.options.variance?`Resource variance set to ${board.options.variance} of 100 (${varianceLabel(board.options.variance).toLowerCase()}) for ${board.options.balance==='total'?'resource totals':'pips per tile'}`:`Optimized for ${board.options.balance==='total'?'even resource totals':'even pips per tile'}`}; the result is best effort.`}`;
  const starts=stats.starts;
  $('starts-count').textContent=`${starts.nearBest} strong choices · ${playerLabel(board)} players`;
  $('starts-count').classList.toggle('needs-attention',starts.nearBest<starts.players);
  $('starts-description').textContent=`${starts.nearBest} starting spots with at least ${starts.threshold} pips can coexist under the settlement distance rule. Best legal start: ${starts.best} pips. ${['shores','desert'].includes(s.family)?'Only the main island counts. ':''}${board.options.recommendedTiles?'Printed layout; starting-location optimization is off.':board.options.balanceStarts?(starts.penalty===0?'Enough comparable choices for one per player.':'A few starts still stand out; the search could not remove this gap.'):'Starting-location optimization is off.'}${board.version>=3&&board.players===6?' The 5–6-player option aims for six strong choices.':''} This compares production, not resource mix, ports, or the full settlement draft.`;
  const inventory=tally(board.tiles.map(t=>t.resource));
  const starting=s.family==='base'?'Place the robber on a desert.':s.family==='islands'?'Start on any one or two islands. The robber starts on the 12 (choose either 12 for Six Islands).':`Build your starting settlements on the main island${s.family==='desert'?', on the larger side of the fixed desert barrier':''}. Gold outlines mark foreign-area positions. ${s.family==='shores'&&s.players===3?'The robber starts on the tile carrying 12.':'Place the robber on a desert.'}`;
  const foreign=s.family==='islands'?'Earn 2 bonus points for your first settlement on each foreign island.':s.family==='base'?'First to 10 victory points on their turn wins.':'Earn 2 bonus points for your first settlement in each foreign area.';
  const mainRows=production(board.tiles.filter(t=>t.group==='main'));
  $('setup-notes').innerHTML=`<p>${starting} ${foreign}</p><p>The pawn marks the robber’s starting tile.${s.family!=='base'?' The ship marks the pirate. A dashed circle labeled ON FRAME is part of the sea frame, not an extra hex tile. Use the linked diagram to assemble the physical frame.':''}</p><p>${s.players===6?(s.family==='base'?'Requires the base game and its 5–6 player extension.':'Requires all four boxes: base game, Seafarers, and both 5–6 player extensions.'):(s.family==='base'?'Requires the base game.':'Requires the base game and Seafarers.')}</p>${['shores','desert'].includes(s.family)?`<p><b>Main-island production:</b> ${mainRows.map(r=>`${LABELS[r.resource]} ${r.total}`).join(' · ')} pips. ${board.version>=3&&board.options.balance==='total'?'Even-total-pip balance gives starting-island evenness 15% more weight than whole-board evenness, after adjusting for their different sizes. ':''}Separate main and foreign token pools are preserved.</p>`:''}${s.harborNote?`<p>${s.harborNote}</p>`:''}<div class="inventory-list">${Object.entries(inventory).map(([r,n])=>`<span>${LABELS[r]} <b>${n}</b></span>`).join('')}<span>Harbors <b>${board.harbors.length}</b></span><span>Total pips <b>${stats.totalPips}</b></span></div><p class="source-note">Setup reference: <a href="${s.source}#page=${s.page}" target="_blank" rel="noreferrer">Official ${s.players===6?'extension':'rulebook'}, page ${s.page} ↗</a>. Uses the 2020/2021 game editions and 2023 extensions.</p>`;
  for(const id of ['share','print','download'])$(id).disabled=false;
}
$('settings-form').addEventListener('submit',e=>{
  e.preventDefault();
  generatorVersion=4;savedPlayers=null;
  updateHelp();
  const state=readForm();
  if(board&&!seedEdited&&board.seed===state.seed&&board.players===state.players&&board.version===state.v&&board.scenarioId===getScenario(state.family,state.players).id&&JSON.stringify(state.options)===JSON.stringify(board.options))$('seed').value=freshSeed();
  generate();
});
$('settings-form').addEventListener('change',()=>{generatorVersion=4;savedPlayers=null;updateHelp();save(readForm());if(board&&!busy)$('status').textContent='Preferences changed. Generate a map to apply them.';});
$('seed').addEventListener('input',()=>{seedEdited=true;if(board&&!busy)$('status').textContent='Seed changed. Generate a map to apply it.';});
$('variance').addEventListener('input',()=>{$('variance-value').textContent=varianceLabel(Number($('variance').value));});
$('new-seed').onclick=()=>{generatorVersion=4;savedPlayers=null;$('seed').value=freshSeed();updateHelp();generate();};
$('reset').onclick=()=>{setForm({...readForm(),v:4,options:DEFAULTS,seed:freshSeed()});generate();};
$('production').onclick=e=>{
  const button=e.target.closest('[data-highlight]');if(!button)return;
  const resource=button.dataset.highlight,active=button.getAttribute('aria-pressed')!=='true';
  document.querySelectorAll('[data-highlight]').forEach(b=>b.setAttribute('aria-pressed',String(active&&b===button)));
  document.querySelectorAll('.hex').forEach(h=>h.classList.toggle('muted',active&&h.dataset.resource!==resource));
};
$('share').onclick=async()=>{
  if(!board)return;
  const s=SCENARIOS.find(s=>s.id===board.scenarioId),state={v:board.version,family:s.family,players:board.players,seed:board.seed,options:board.options};
  const url=new URL(location.href);url.hash=encodeURIComponent(JSON.stringify(state));
  try{await navigator.clipboard.writeText(url.href);$('status').textContent='Map link copied. It includes this map’s seed and settings.';}
  catch{history.replaceState(null,'',url);$('status').textContent='The map link is in your address bar. Copy it to share this board.';}
};
$('print').onclick=()=>window.print();
$('download').onclick=()=>{
  if(!board)return;
  const svg=$('board').querySelector('svg').cloneNode(true);svg.querySelectorAll('.muted').forEach(el=>el.classList.remove('muted'));
  const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`fair-shores-${board.scenarioId}-${board.seed.replace(/[^a-z0-9_-]/gi,'_')}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('about-button').onclick=()=>$('about').showModal();document.querySelector('.dialog-close').onclick=()=>$('about').close();
function restore(){
  let state=null;
  try{
    if(location.hash){state=JSON.parse(decodeURIComponent(location.hash.slice(1)));if(![1,2,3,4].includes(state.v))throw Error('Unsupported map link version.');}
    else {
      state=JSON.parse(localStorage.getItem('fair-shores-v1')||'null');
      if(state)state={...state,v:4,players:state.players>4?6:state.players};
    }
  }
  catch{state=null;}
  setForm(state||{family:'base',players:4,seed:freshSeed(),options:DEFAULTS});generate();
}
window.addEventListener('hashchange',restore);restore();
