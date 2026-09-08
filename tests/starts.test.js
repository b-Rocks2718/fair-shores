import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {startingGraph,compatibleCount,startProfile,scoreStarts} from '../src/starts.js';
import {generateBoard,boardStats,balanceScore,resourceBalanceScore,validateBoard} from '../src/generator.js';
import {SCENARIOS,getScenario} from '../src/scenarios.js';

const independent = length => ({neighbors:Array.from({length},()=>[]),colors:Array(length).fill(0)});
test('a small elite group scores worse than a broad strong field, without a cap',()=>{
 const graph=independent(6);
 const elite=startProfile(graph,[13,13,13,9,8,8],4);
 const broad=startProfile(graph,[13,13,12,12,8,8],4);
 assert.deepEqual(elite.levels,[13,13,13,9]);assert.equal(elite.penalty,9);
 assert.equal(broad.penalty,0);assert.equal(broad.nearBest,4);
 assert.equal(startProfile(graph,[15,15,14,14,10,10],4).penalty,0);
 assert.equal(startProfile(graph,[10,10,10,6,5,5],4).penalty,elite.penalty);
});
test('player count changes whether two or three exceptional spots are sufficient',()=>{
 const graph=independent(6),scores=[13,13,13,9,9,8];
 assert.equal(startProfile(graph,scores,3).penalty,0);
 assert.ok(startProfile(graph,scores,4).penalty>0);
 assert.ok(startProfile(graph,scores,6).penalty>startProfile(graph,scores,5).penalty);
});
test('neighboring corners cannot be counted as separate usable settlements',()=>{
 const graph={neighbors:[[1],[0,2],[1]],colors:[0,1,0]};
 assert.equal(compatibleCount(graph,[13,13,13],12),2);
 // A greedy first choice of the middle would incorrectly return only one.
 assert.equal(compatibleCount({neighbors:[[1,2],[0],[0]],colors:[1,0,0]},[13,13,13],12),2);
 const hex=startingGraph([{q:0,r:0,resource:'grain',number:6,group:'main'}],'base');
 assert.equal(hex.vertices.length,6);assert.equal(scoreStarts(hex,4).nearBest,3);
});
test('matching capacity agrees with brute force on small bipartite graphs',()=>{
 for(let mask=0;mask<256;mask++){
  const neighbors=Array.from({length:6},()=>[]),colors=[0,0,0,1,1,1];
  for(let i=0;i<3;i++)for(let j=3;j<6;j++)if(mask&(1<<((i*3+j-3)%8))){neighbors[i].push(j);neighbors[j].push(i);}
  const graph={neighbors,colors},scores=[13,12,9,13,11,12];
  for(const threshold of [9,12,13]) {
   let max=0;
   for(let chosen=0;chosen<64;chosen++) {
    const selected=scores.flatMap((score,i)=>chosen&(1<<i)?[i]:[]);
    if(selected.every(i=>scores[i]>=threshold&&neighbors[i].every(j=>!(chosen&(1<<j)))))max=Math.max(max,selected.length);
   }
   assert.equal(compatibleCount(graph,scores,threshold),max);
  }
 }
});
test('foreign regions are excluded from starting choices where the scenario requires it',()=>{
 for(const family of ['shores','desert'])for(const players of [3,4,6]){
  const b=generateBoard(getScenario(family,players).id,'regions',{balanceStarts:false});
  const graph=startingGraph(b.tiles,family);
  assert.ok(graph.vertices.length>0);
  assert.ok(graph.vertices.every(v=>v.tiles.some(t=>t.group==='main')&&!v.tiles.some(t=>t.group==='foreign')));
  for(const t of b.tiles)if(t.group==='foreign'&&t.number)t.number=6;
  assert.ok(scoreStarts(graph,players).best<=15);
  assert.equal(graph.vertices.some(v=>v.tiles.some(t=>t.group==='foreign')),false);
 }
});
test('no productive choices cannot report a successful balance',()=>{
 const empty=startProfile(independent(0),[],4);
 assert.equal(empty.nearBest,0);assert.ok(empty.penalty>0);
});
test('starting-choice optimization improves or preserves starts and resource balance',()=>{
 let improved=0;
 for(const family of ['base','shores','islands','desert'])for(const players of [3,4,5,6])for(let i=0;i<12;i++){
  const id=getScenario(family,players).id,settings={balance:i%2?'perTile':'total',noAdjacentResources:i%3===0},context={players};
  const before=generateBoard(id,`starts-${i}`,{...settings,balanceStarts:false},context);
  const after=generateBoard(id,`starts-${i}`,{...settings,balanceStarts:true},context);
  const a=boardStats(before).starts,b=boardStats(after).starts;
  assert.ok(b.penalty<=a.penalty,`${id}, ${players} players: worsened starts`);
  assert.ok(resourceBalanceScore(after.tiles,settings.balance,getScenario(family,players))<=resourceBalanceScore(before.tiles,settings.balance,getScenario(family,players))+1e-8);
  assert.deepEqual(validateBoard(after),[]);assert.equal(b.players,players);
  assert.deepEqual(after.harbors,before.harbors);
  if(b.penalty<a.penalty)improved++;
 }
 assert.ok(improved>20,`Expected meaningful improvements; got ${improved}`);
});
test('starting balance also works with resource balancing off',()=>{
 let improved=false;
 for(let i=0;i<20;i++){
  const before=generateBoard('base-4',`no-resource-${i}`,{balance:'off',balanceStarts:false});
  const after=generateBoard('base-4',`no-resource-${i}`,{balance:'off',balanceStarts:true});
  const a=boardStats(before).starts.penalty,b=boardStats(after).starts.penalty;
  assert.ok(b<=a);if(b<a)improved=true;assert.deepEqual(validateBoard(after),[]);
 }
 assert.ok(improved);
});
test('recommended tiles remain exact when starting balance is selected',()=>{
 for(const s of SCENARIOS){
  const b=generateBoard(s.id,'printed',{recommendedTiles:true,balanceStarts:true});
  assert.deepEqual(b.tiles,s.tiles);assert.deepEqual(validateBoard(b),[]);
 }
});
test('version 1 seed links reproduce their existing boards exactly',()=>{
 const fixtures={'base-4':'9c781bd99295fae7ae8223f1bce7c52c9a20bfd78b6343c4d9341a47f732a237','shores-6':'4d41349626aa7d128d4070f532a6ecff4d81a3d274f969f83ed48ab680712aa1','desert-3':'27826e4e7cceaed432e6e3800be6042f00abcafc1bace5a6ed7dbac685b01592'};
 for(const [id,expected] of Object.entries(fixtures)){
  const b=generateBoard(id,'legacy-night',{}, {version:1});
  assert.equal(b.version,1);assert.equal(b.options.balanceStarts,false);
  assert.equal(createHash('sha256').update(JSON.stringify([b.tiles,b.harbors])).digest('hex'),expected);
 }
});
test('version 2 uses actual player count and is reproducible',()=>{
 const options={balanceStarts:true},context={players:5,version:2};
 assert.deepEqual(generateBoard('base-6','players',options,context),generateBoard('base-6','players',options,context));
 assert.equal(boardStats(generateBoard('base-6','players',options,context)).starts.players,5);
 assert.throws(()=>generateBoard('base-6','players',options,{players:4}),/Player count/);
});
