import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENARIOS,getScenario} from '../src/scenarios.js';
import {DEFAULTS,generateBoard,validateBoard,pips,tally,balanceScore,resourceBalanceScore,islandSizes,harborSpacing} from '../src/generator.js';
import {createHash} from 'node:crypto';
import {adjacent,edge,harborsConflict,coastEdges,key} from '../src/geometry.js';

// Independent component tables from the official rulebooks. Resource order:
// lumber, brick, wool, grain, ore, gold, desert, sea. Token order: 2..6,8..12.
const inventories = {
 'base-4': [[4,3,4,4,3,0,1,0],[1,2,2,2,2,2,2,2,2,1],58,9],
 'base-6': [[6,5,6,6,5,0,2,0],[2,3,3,3,3,3,3,3,3,2],88,11],
 'shores-3': [[3,4,5,4,4,2,0,13],[1,2,3,3,2,3,2,3,2,1],73,8],
 'shores-4': [[5,5,5,5,5,2,1,14],[2,3,3,3,3,3,3,3,3,1],87,9],
 'shores-6': [[7,7,7,7,7,3,2,16],[3,4,4,4,4,4,4,4,4,3],118,11],
 'islands-3': [[4,4,4,4,4,0,0,15],[1,2,2,3,2,2,3,2,2,1],66,9],
 'islands-4': [[5,4,5,5,4,0,0,12],[1,2,3,3,2,2,3,3,3,1],74,9],
 'islands-6': [[7,6,7,6,6,0,0,24],[2,3,4,4,4,3,4,4,2,2],105,11],
 'desert-3': [[5,3,4,4,4,2,3,10],[1,2,3,3,3,3,3,2,2,0],78,8],
 'desert-4': [[5,5,5,5,5,2,3,12],[1,3,3,3,3,3,3,3,3,2],87,9],
 'desert-6': [[7,7,7,7,7,3,5,20],[3,4,4,4,4,4,4,4,4,3],118,11],
};
const resources=['lumber','brick','wool','grain','ore','gold','desert','sea'],numbers=[2,3,4,5,6,8,9,10,11,12];
function checkInventory(board){
 const [terrain, tokens, total, harbors]=inventories[board.scenarioId],r=tally(board.tiles.map(t=>t.resource)),n=tally(board.tiles.filter(t=>t.number).map(t=>t.number));
 assert.deepEqual(resources.map(k=>r[k]||0),terrain);
 assert.deepEqual(numbers.map(k=>n[k]||0),tokens);
 assert.equal(board.tiles.reduce((s,t)=>s+pips(t.number),0),total);
 assert.equal(board.harbors.length,harbors);
 assert.deepEqual(validateBoard(board),[]);
}
test('requested defaults and player mappings',()=>{
 assert.deepEqual(DEFAULTS,{balance:'total',noAdjacentHarbors:true,noAdjacentRed:true,noAdjacentResources:false,recommendedHarbors:false,recommendedTiles:false,balanceStarts:true,variance:0});
 for(const family of ['base','shores','islands','desert'])for(const players of [3,4,5,6])assert.ok(getScenario(family,players));
});
test('probability pips match the 36 dice outcomes',()=>{
 const outcomes=Array(13).fill(0);for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)outcomes[a+b]++;
 for(const n of numbers)assert.equal(pips(n),outcomes[n]);assert.equal(pips(null),0);assert.equal(pips(7),0);
});
for(const s of SCENARIOS){
 test(`${s.id}: exact printed setup and inventories`,()=>{
  checkInventory(generateBoard(s.id,'printed',{recommendedTiles:true,recommendedHarbors:true}));
 });
 test(`${s.id}: constrained random boards preserve the official inventory`,()=>{
  for(let seed=0;seed<30;seed++){
   const options={noAdjacentResources:seed%2===0,recommendedHarbors:seed%3===0,balance:seed%4===0?'perTile':'total'};
   checkInventory(generateBoard(s.id,`property-${seed}`,options));
  }
 });
 test(`${s.id}: deterministic seeds and settings`,()=>{
  assert.deepEqual(generateBoard(s.id,'game-night',{noAdjacentResources:true}),generateBoard(s.id,'game-night',{noAdjacentResources:true}));
  assert.notDeepEqual(generateBoard(s.id,'game-night').tiles,generateBoard(s.id,'different-night').tiles);
 });
 test(`${s.id}: balancing improves or preserves the same random board`,()=>{
  for(let i=0;i<10;i++){
   const seed=`balance-${i}`,raw=generateBoard(s.id,seed,{balance:'off',balanceStarts:false});
   for(const mode of ['total','perTile'])assert.ok(resourceBalanceScore(generateBoard(s.id,seed,{balance:mode,balanceStarts:false}).tiles,mode,s)<=resourceBalanceScore(raw.tiles,mode,s)+1e-8);
  }
 });
}
test('New Shores preserves the sea moat and distinct terrain pools',()=>{
 for(const [id,foreignSize,moat] of [['shores-3',12,9],['shores-4',13,10],['shores-6',12,14]]){
  const b=generateBoard(id,'moat');assert.equal(b.tiles.filter(t=>t.group==='foreign').length,foreignSize);assert.equal(b.tiles.filter(t=>t.group==='sea').length,moat);
  for(const t of b.tiles.filter(t=>t.group==='foreign'))assert.ok(!b.tiles.some(o=>o.group==='main'&&adjacent(t,o)));
 }
});
test('Through the Desert keeps its exact barrier and foreign area pools',()=>{
 for(const [id,foreign,moat] of [['desert-3',10,8],['desert-4',12,10],['desert-6',19,18]]){
  const b=generateBoard(id,'deserts',{noAdjacentResources:true,noAdjacentRed:false});
  assert.equal(b.tiles.filter(t=>t.group==='foreign').length,foreign);assert.equal(b.tiles.filter(t=>t.group==='sea').length,moat);
  const expected=SCENARIOS.find(s=>s.id===id).tiles.filter(t=>t.group==='barrier');
  assert.deepEqual(b.tiles.filter(t=>t.group==='barrier'),expected);
  assert.ok(b.tiles.filter(t=>t.resource==='gold').every(t=>![6,8].includes(t.number)));
 }
});
test('Four / Six Islands keep the printed island contours',()=>{
 for(const id of ['islands-3','islands-4','islands-6']){
  const b=generateBoard(id,'islands');let left=b.tiles.filter(t=>t.resource!=='sea'),count=0;
  while(left.length){count++;const queue=[left.pop()];while(queue.length){const t=queue.pop(),connected=left.filter(o=>adjacent(t,o));left=left.filter(o=>!connected.includes(o));queue.push(...connected);}}
  assert.equal(count,id==='islands-6'?6:4);
 }
});
test('red numbers and harbor adjacency can be disabled without changing inventory',()=>{
 let foundRed=false,foundHarbors=false;
 for(let i=0;i<30;i++){
  const b=generateBoard('base-4',`relaxed-${i}`,{balance:'off',noAdjacentRed:false,noAdjacentHarbors:false});checkInventory(b);
  foundRed ||= b.tiles.some(t=>[6,8].includes(t.number)&&b.tiles.some(o=>adjacent(t,o)&&[6,8].includes(o.number)));
  const edges=b.harbors.map(h=>edge(h,h.side));foundHarbors ||= edges.some((a,i)=>edges.slice(i+1).some(b=>harborsConflict(a,b,true)));
 }
 assert.ok(foundRed);assert.ok(foundHarbors);
});
test('validator detects independent mutations rather than just total pips',()=>{
 const b=generateBoard('base-4','tamper');
 const bad=structuredClone(b),numbered=bad.tiles.filter(t=>t.number);numbered[0].number=7;assert.ok(validateBoard(bad).length);
 const bag=structuredClone(b);bag.tiles.find(t=>t.resource==='lumber').resource='ore';assert.ok(validateBoard(bag).some(e=>e.includes('terrain inventory')));
 const invalidHarbor=structuredClone(b);invalidHarbor.harbors[0]={...invalidHarbor.harbors[0],q:100};assert.ok(validateBoard(invalidHarbor).length);
 const region=structuredClone(b);region.tiles[0].group='foreign';assert.ok(validateBoard(region).some(e=>e.includes('region')));
});
test('recommended layout never silently ignores resource separation',()=>{
 const s=SCENARIOS.find(s=>s.tiles.some((t,i)=>resources.slice(0,6).includes(t.resource)&&s.tiles.slice(i+1).some(o=>o.resource===t.resource&&adjacent(t,o))));
 assert.ok(s);assert.throws(()=>generateBoard(s.id,'conflict',{recommendedTiles:true,noAdjacentResources:true}),/conflicts/);
});
test('harbors attach to genuine coast edges and distinct coastal corners',()=>{
 const b=generateBoard('shores-4','coast'),coast=coastEdges(b.tiles,true);
 for(const h of b.harbors)assert.ok(coast.some(e=>e.id===`${key(h)}:${h.side}`));
 const edges=b.harbors.map(h=>edge(h,h.side));for(const [i,a] of edges.entries())for(const b of edges.slice(i+1))assert.equal(harborsConflict(a,b,true),false);
});
test('variance setting moves resource balance from even toward lopsided',()=>{
 for(const id of ['base-4','shores-4','base-6']){
  const s=SCENARIOS.find(s=>s.id===id),mean=variance=>{let sum=0;for(let i=0;i<12;i++){const b=generateBoard(id,`variance-${i}`,{variance});checkInventory(b);sum+=resourceBalanceScore(b.tiles,'total',s);}return sum/12;};
  const levels=[0,25,50,100].map(mean);
  for(let i=1;i<levels.length;i++)assert.ok(levels[i]>levels[i-1],`${id}: ${levels}`);
  assert.ok(levels[0]<3,`${id}: variance 0 should stay even`);
 }
 assert.deepEqual(generateBoard('base-4','same',{variance:40}),generateBoard('base-4','same',{variance:40}));
 for(const variance of [-1,101,2.5,'10'])assert.throws(()=>generateBoard('base-4','bad',{variance}),/Variance/);
});
test('version 4 Seafarers foreign areas form fewer, larger islands',()=>{
 for(const s of SCENARIOS.filter(s=>['shores','desert'].includes(s.family))){
  let before=0,after=0,lone=0;
  for(let i=0;i<20;i++){
   const old=islandSizes(generateBoard(s.id,`islands-${i}`,{},{version:3}).tiles),now=islandSizes(generateBoard(s.id,`islands-${i}`).tiles);
   before+=old.length+old.filter(n=>n===1).length;after+=now.length+now.filter(n=>n===1).length;lone+=now.filter(n=>n===1).length;
  }
  assert.ok(after<before,`${s.id}: ${before} -> ${after}`);assert.ok(lone<=12,`${s.id}: ${lone} single-hex islands`);
 }
});
test('version 4 harbors are spaced further apart on average',()=>{
 let before=0,after=0;
 for(const s of SCENARIOS)for(let i=0;i<10;i++){
  before+=harborSpacing(generateBoard(s.id,`ports-${i}`,{},{version:3}).harbors);
  const b=generateBoard(s.id,`ports-${i}`);checkInventory(b);after+=harborSpacing(b.harbors);
 }
 assert.ok(after>before*1.04,`${before} -> ${after}`);
});
test('version 3 shared maps keep their original tile and harbor layouts',()=>{
 const expected={'base-4':'5f7679cc55ab84aeccd8837856016adb8f8bc31415c1403bad92203278ea2f97','shores-4':'fe568ce213c859ad89d765d658fa507e47b4615343dff60ba545367d65c69778','desert-6':'4a4294ed150dc5da51d00423abaab865aeb54de8b02b3c24e162f714966767cc'};
 for(const [id,hash] of Object.entries(expected)){
  const b=generateBoard(id,'version-three',{}, {version:3});assert.equal(createHash('sha256').update(JSON.stringify([b.tiles,b.harbors])).digest('hex'),hash);
 }
});
