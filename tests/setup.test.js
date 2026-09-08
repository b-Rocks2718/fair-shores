import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {SCENARIOS,RESOURCES} from '../src/scenarios.js';
import {generateBoard,validateBoard,resourceBalanceScore,balanceScore} from '../src/generator.js';
import {renderBoard} from '../src/render.js';
import {key} from '../src/geometry.js';

test('robber starts on a desert, or on 12 in scenarios without deserts',()=>{
 for(const s of SCENARIOS)for(let i=0;i<12;i++) {
  const b=generateBoard(s.id,`pieces-${i}`),t=b.tiles.find(t=>key(t)===key(b.pieces.robber));
  assert.ok(t);assert.equal(b.pieces.robber.location,'tile');
  if(b.tiles.some(t=>t.resource==='desert'))assert.equal(t.resource,'desert');else assert.equal(t.number,12);
  assert.deepEqual(validateBoard(b),[]);
 }
});
test('pirate coordinates match each printed scenario, including sea-frame starts',()=>{
 const expected={
  'shores-3':[3,4,'frame'],'shores-4':[3,5,'frame'],'shores-6':[3,-2,'frame'],
  'islands-3':[3,1,'tile'],'islands-4':[3,4,'frame'],'islands-6':[3,-2,'frame'],
  'desert-3':[3,4,'frame'],'desert-4':[3,5,'frame'],'desert-6':[0,7,'tile'],
 };
 for(const s of SCENARIOS){
  const b=generateBoard(s.id,'pirate'),p=b.pieces.pirate;
  if(s.family==='base'){assert.equal(p,null);continue;}
  assert.deepEqual([p.q,p.r,p.location],expected[s.id]);
  const t=b.tiles.find(t=>key(t)===key(p));
  if(p.location==='frame')assert.equal(t,undefined);else assert.equal(t.resource,'sea');
 }
});
test('desert-barrier scenarios put the robber on their pictured middle desert',()=>{
 for(const s of SCENARIOS.filter(s=>s.family==='desert')){
  const b=generateBoard(s.id,'barrier');assert.deepEqual(b.pieces.robber,{q:5,r:s.players===6?2:-1,location:'tile'});
 }
});
test('invalid starting-piece placements are caught by the board validator',()=>{
 const b=generateBoard('base-4','wrong-piece');b.pieces.robber={q:999,r:999,location:'tile'};
 assert.ok(validateBoard(b).includes('Invalid robber starting position.'));
 b.pieces.pirate={q:0,r:0,location:'tile'};assert.ok(validateBoard(b).includes('The base game does not use a pirate.'));
 const sea=generateBoard('shores-4','wrong-sea');sea.pieces.pirate.location='tile';assert.ok(validateBoard(sea).includes('Invalid pirate starting position.'));
});
test('SVG and print/export content includes the right pieces without hiding number tokens',()=>{
 for(const s of SCENARIOS){
  const b=generateBoard(s.id,'draw-pieces'),svg=renderBoard(b,s);
  assert.equal((svg.match(/data-piece="robber"/g)||[]).length,1);
  assert.equal((svg.match(/data-piece="pirate"/g)||[]).length,s.family==='base'?0:1);
  if(b.pieces.pirate?.location==='frame')assert.match(svg,/ON FRAME/);
  if(!b.tiles.some(t=>t.resource==='desert'))assert.match(svg,/>12<\/text>/);
 }
});
function resourceTotals(main,foreign){
 return RESOURCES.flatMap((resource,i)=>[
  ...Array.from({length:main[i]},()=>({resource,number:2,group:'main'})),
  ...Array.from({length:foreign[i]},()=>({resource,number:2,group:'foreign'})),
 ]);
}
test('equal relative imbalances are slightly worse on the main island than overall',()=>{
 // A: 10% deviations on mainland; perfectly balanced overall.
 // B: perfect mainland; 10% deviations overall.
 const a=resourceTotals([11,9,10,10,10],[9,11,10,10,10]);
 const b=resourceTotals([10,10,10,10,10],[12,8,10,10,10]);
 for(const family of ['shores','desert']){
  const sa=resourceBalanceScore(a,'total',{family}),sb=resourceBalanceScore(b,'total',{family});
  assert.ok(sb<sa);assert.ok(Math.abs(sa/sb-1.15)<1e-9);
 }
 // Islands are all available to start on, so they keep the whole-board score.
 for(const family of ['base','islands'])assert.equal(resourceBalanceScore(a,'total',{family}),balanceScore(a,'total'));
 assert.equal(resourceBalanceScore(a,'perTile',{family:'shores'}),balanceScore(a,'perTile'));
});
test('main-island preference improves starting-region evenness across fixed seeds',()=>{
 let before=0,after=0;
 for(const s of SCENARIOS.filter(s=>['shores','desert'].includes(s.family)))for(let i=0;i<12;i++){
  const seed=`main-priority-${i}`,options={balance:'total',balanceStarts:false};
  const old=generateBoard(s.id,seed,options,{version:2}),current=generateBoard(s.id,seed,options,{version:3});
  before+=balanceScore(old.tiles.filter(t=>t.group==='main'));
  after+=balanceScore(current.tiles.filter(t=>t.group==='main'));
  assert.deepEqual(validateBoard(current),[]);
 }
 assert.ok(after<before*.6,`Main-island variance ${before} -> ${after}`);
});
test('version 2 shared maps keep their original tile and harbor layouts',()=>{
 const expected={'base-4':'4ca769e209e4a76ba3c0c87e44b4b65e59fb5bc7a5a1aa22ea50a87383bc4b72','shores-6':'8d392ac0c61e1d16a67008924331028589f5cd9615aac1eb52558331c23e1c9d','desert-3':'25998d685cd6fd346370213fdbde3c8fa074215fcd0102b3eca2220bbcd1c67f'};
 for(const [id,hash] of Object.entries(expected)){
  const b=generateBoard(id,'version-two',{}, {version:2});assert.equal(createHash('sha256').update(JSON.stringify([b.tiles,b.harbors])).digest('hex'),hash);
 }
});
