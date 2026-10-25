import { RESOURCES, SCENARIOS } from './scenarios.js';
import { adjacent, coastEdges, edge, harborsConflict, key, intersections } from './geometry.js';
import { startingGraph, scoreStarts } from './starts.js';
import { startingPieces, validatePieces } from './pieces.js';
export const DEFAULTS = { balance:'total', noAdjacentHarbors:true, noAdjacentRed:true, noAdjacentResources:false, recommendedHarbors:false, recommendedTiles:false, balanceStarts:true, foreignHarbors:true, variance:0 };
export const pips = n => n && n!==7 ? 6-Math.abs(7-n) : 0;
export const isRed = n => n===6 || n===8;
export function random(seed) {
  let state=2166136261;
  for(const c of String(seed)) state=Math.imul(state^c.charCodeAt(0),16777619);
  return () => { state=(state+0x6D2B79F5)>>>0; let t=state; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
}
export function shuffle(values,rng) {
  const a=[...values]; for(let i=a.length-1;i>0;i--) {const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a;
}
export const tally = values => values.reduce((a,v)=>(a[v]=(a[v]||0)+1,a),{});
const equalBag = (a,b) => {const x=tally(a),y=tally(b);return Object.keys({...x,...y}).every(k=>x[k]===y[k]);};
export function production(tiles) {
  return RESOURCES.map(resource=>{
    const group=tiles.filter(t=>t.resource===resource), total=group.reduce((s,t)=>s+pips(t.number),0);
    return {resource,count:group.length,total,average:group.length?total/group.length:0};
  });
}
export function balanceScore(tiles,mode='total') {
  const rows=production(tiles).filter(r=>r.count), values=rows.map(r=>mode==='perTile'?r.average:r.total);
  const mean=values.reduce((a,b)=>a+b,0)/values.length;
  return values.reduce((sum,v)=>sum+(v-mean)**2,0);
}
export function resourceBalanceScore(tiles,mode,scenario,version=3) {
  const overall=balanceScore(tiles,mode);
  if(version<3||mode!=='total'||!['shores','desert'].includes(scenario.family))return overall;
  const main=tiles.filter(t=>t.group==='main');
  const mean=rows=>rows.reduce((sum,r)=>sum+r.total,0)/rows.length;
  const overallMean=mean(production(tiles)),mainMean=mean(production(main));
  if(!mainMean)return overall;
  // Compare relative spread at each scale, so a larger overall pip pool
  // doesn't drown out the starting island. Main-island balance gets 15%
  // more weight; dividing keeps the annealing score on its existing scale.
  return (overall+1.15*balanceScore(main,'total')*(overallMean/mainMean)**2)/2.15;
}
export function islandSizes(tiles) {
  let left=tiles.filter(t=>t.resource!=='sea');const sizes=[];
  while(left.length){
    let size=0;const queue=[left.pop()];
    while(queue.length){const t=queue.pop();size++;const next=left.filter(o=>adjacent(t,o));left=left.filter(o=>!next.includes(o));queue.push(...next);}
    sizes.push(size);
  }
  return sizes;
}
// Seafarers foreign areas: from version 4, keep the land/sea layout with the
// fewest islands (lone hexes count extra) out of a few random candidates.
// Sampling rather than minimizing keeps some variety in island shapes.
// From version 5, single-hex islands are not allowed at all: only layouts
// without one are candidates.
function clusterForeign(tiles,cells,rng,version) {
  const seaCount=cells.filter(t=>t.resource==='sea').length;
  let best=null,bestCost=Infinity,candidates=0;
  for(let i=0;version>=5?candidates<8&&i<400:i<8;i++){
    const order=shuffle(cells,rng);order.forEach((t,j)=>t.resource=j<seaCount?'sea':'land');
    const sizes=islandSizes(tiles),lone=sizes.filter(n=>n===1).length;
    if(version>=5&&lone)continue;
    candidates++;
    const cost=sizes.length+1.5*lone;
    if(cost<bestCost){bestCost=cost;best=cells.map(t=>t.resource);}
  }
  if(!best)return false;
  cells.forEach((t,i)=>t.resource=best[i]);
  return true;
}
function assignTerrain(template,options,scenario,rng,version) {
  const tiles=template.map(t=>({...t}));
  if(options.recommendedTiles)return tiles;
  for(const group of ['main','foreign']) {
    let cells=tiles.filter(t=>t.group===group),resources=cells.map(t=>t.resource);
    if(version>=4&&group==='foreign'&&['shores','desert'].includes(scenario.family)){
      if(!clusterForeign(tiles,cells,rng,version))return null;
      cells=cells.filter(t=>t.resource!=='sea');resources=resources.filter(r=>r!=='sea');
    }
    const bag=tally(resources);
    if(!options.noAdjacentResources) {
      resources=shuffle(resources,rng);cells.forEach((t,i)=>t.resource=resources[i]);continue;
    }
    cells.forEach(t=>t.resource=null);
    const neighbors=new Map(cells.map(t=>[t,tiles.filter(o=>adjacent(t,o))]));
    let budget=90000;
    const solve = left => {
      if(!left.length)return true;
      if(--budget<0)return false;
      const candidates=left.map(t=>({t,values:shuffle(Object.keys(bag).filter(v=>bag[v]>0 && (v==='sea' || v==='desert' || !neighbors.get(t).some(o=>o.resource===v))),rng)})).sort((a,b)=>a.values.length-b.values.length);
      const {t,values}=candidates[0];
      for(const v of values){t.resource=v;bag[v]--;if(solve(left.filter(o=>o!==t)))return true;bag[v]++;t.resource=null;}
      return false;
    };
    if(!solve(cells))return null;
  }
  tiles.forEach(t=>t.number=null);return tiles;
}
function assignNumbers(tiles,template,options,scenario,rng) {
  if(options.recommendedTiles)return true;
  const redOK = (t,n) => !(isRed(n) && ((scenario.noRedGold && t.resource==='gold') || (options.noAdjacentRed && tiles.some(o=>isRed(o.number)&&adjacent(t,o)))));
  for(const group of ['main','foreign']) {
    const cells=tiles.filter(t=>t.group===group && !['sea','desert'].includes(t.resource));
    const numbers=template.filter(t=>t.group===group && t.number).map(t=>t.number);
    const reds=shuffle(numbers.filter(isRed),rng),other=shuffle(numbers.filter(n=>!isRed(n)),rng);
    let budget=20000;
    const putRed = index => {
      if(index===reds.length)return true;
      if(--budget<0)return false;
      for(const t of shuffle(cells.filter(t=>!t.number&&redOK(t,reds[index])),rng)){
        t.number=reds[index];if(putRed(index+1))return true;t.number=null;
      }return false;
    };
    if(!putRed(0))return false;
    cells.filter(t=>!t.number).forEach((t,i)=>t.number=other[i]);
  }
  return true;
}
// Variance setting: 0 is as even as possible. Otherwise aim for a score
// relative to a typical random token shuffle of this terrain: 100 is 1.5x its
// resource spread (standard deviation), so about 67 matches a random board.
function varianceTarget(tiles,cells,options,scenario,rng,version) {
  if(!options.variance)return 0;
  const saved=cells.map(t=>t.number);let sum=0;
  for(let i=0;i<40;i++){
    for(const group of ['main','foreign']){const g=cells.filter(t=>t.group===group),n=shuffle(g.map(t=>t.number),rng);g.forEach((t,j)=>t.number=n[j]);}
    sum+=resourceBalanceScore(tiles,options.balance,scenario,version);
  }
  cells.forEach((t,i)=>t.number=saved[i]);
  return sum/40*(1.5*options.variance/100)**2;
}
function optimize(tiles,options,scenario,rng,version) {
  if(options.balance==='off'||options.recommendedTiles)return 0;
  const cells=tiles.filter(t=>t.number),neighbors=new Map(cells.map(t=>[t,cells.filter(o=>adjacent(t,o))]));
  const target=varianceTarget(tiles,cells,options,scenario,rng,version);
  const objective=()=>Math.abs(resourceBalanceScore(tiles,options.balance,scenario,version)-target);
  let score=objective(),best=score,bestNumbers=cells.map(t=>t.number);
  for(let i=0;i<9000;i++){
    const a=cells[Math.floor(rng()*cells.length)],b=cells[Math.floor(rng()*cells.length)];
    if(a===b || a.group!==b.group || a.number===b.number)continue;
    [a.number,b.number]=[b.number,a.number];
    const valid = [a,b].every(t=>(!scenario.noRedGold||t.resource!=='gold'||!isRed(t.number))&&(!options.noAdjacentRed||!isRed(t.number)||!neighbors.get(t).some(o=>isRed(o.number))));
    if(!valid){[a.number,b.number]=[b.number,a.number];continue;}
    const next=objective(),temp=(options.balance==='perTile'?0.3:3)*(1-i/9000)**2;
    if(next<=score || rng()<Math.exp((score-next)/Math.max(temp,0.001)))score=next;
    else [a.number,b.number]=[b.number,a.number];
    if(score<best){best=score;bestNumbers=cells.map(t=>t.number);}
    if(best<(options.balance==='perTile'?0.03:0.81))break;
  }
  cells.forEach((t,i)=>t.number=bestNumbers[i]);
  return target;
}
function optimizeStarts(tiles,options,scenario,players,rng,version,target) {
  if(!options.balanceStarts||options.recommendedTiles)return;
  const graph=startingGraph(tiles,scenario.family),cells=tiles.filter(t=>t.number);
  const neighbors=new Map(cells.map(t=>[t,cells.filter(o=>adjacent(t,o))]));
  const objective=()=>Math.abs(resourceBalanceScore(tiles,options.balance,scenario,version)-target);
  const resourceLimit=options.balance==='off'?Infinity:objective();
  let best=scoreStarts(graph,players).penalty,score=best,bestNumbers=cells.map(t=>t.number);
  if(best===0)return;
  for(let i=0;i<2400;i++) {
    const a=cells[Math.floor(rng()*cells.length)],b=cells[Math.floor(rng()*cells.length)];
    if(a===b||a.group!==b.group||a.number===b.number)continue;
    [a.number,b.number]=[b.number,a.number];
    const valid=[a,b].every(t=>(!scenario.noRedGold||t.resource!=='gold'||!isRed(t.number))&&(!options.noAdjacentRed||!isRed(t.number)||!neighbors.get(t).some(o=>isRed(o.number))));
    if(!valid||(options.balance!=='off'&&objective()>resourceLimit+1e-9)) {
      [a.number,b.number]=[b.number,a.number];continue;
    }
    const next=scoreStarts(graph,players).penalty,temp=1.2*(1-i/2400)**2;
    if(next<=score||rng()<Math.exp((score-next)/Math.max(.001,temp)))score=next;
    else [a.number,b.number]=[b.number,a.number];
    if(score<best){best=score;bestNumbers=cells.map(t=>t.number);}
    if(best===0)break;
  }
  cells.forEach((t,i)=>t.number=bestNumbers[i]);
}
// Mean distance from each harbor to its nearest neighbor, in hex sizes.
export function harborSpacing(harbors) {
  const points=harbors.map(h=>{const e=edge(h,h.side);return {x:(e.a.x+e.b.x)/2,y:(e.a.y+e.b.y)/2};});
  return points.reduce((sum,p,i)=>sum+Math.min(...points.filter((_,j)=>j!==i).map(o=>Math.hypot(p.x-o.x,p.y-o.y))),0)/points.length;
}
// New Shores and Through the Desert print every harbor on the starting island.
// The foreign-harbor option opens the outer islands and the far side of the
// desert, but keeps at least half the harbors where players start.
const restrictedHarbors = scenario => ['shores','desert'].includes(scenario.family);
const minMainHarbors = (scenario,options) => restrictedHarbors(scenario)&&options.foreignHarbors?Math.ceil(scenario.harborTypes.length/2):0;
function placeHarbors(tiles,scenario,options,rng,version) {
  const coast=coastEdges(tiles,restrictedHarbors(scenario)&&!options.foreignHarbors);
  const mainKeys=new Set(tiles.filter(t=>t.group==='main').map(key)),onMain=e=>mainKeys.has(key(e));
  const minMain=minMainHarbors(scenario,options);
  let selected=[];
  if(options.recommendedHarbors) {
    selected=scenario.harbors.map(h=>coast.find(e=>e.id===`${key(h)}:${h.side}`));
    if(selected.some(e=>!e))return null;
    if(selected.some((a,i)=>selected.slice(i+1).some(b=>harborsConflict(a,b,options.noAdjacentHarbors))))return null;
    while(selected.length<scenario.harborTypes.length){
      const extra=shuffle(coast,rng).find(e=>selected.every(o=>!harborsConflict(e,o,options.noAdjacentHarbors)));
      if(!extra)return null;selected.push(extra);
    }
  }else {
    // From version 4, keep the most spread-out of a few legal layouts.
    let bestSpacing=-Infinity;
    for(let attempt=0;attempt<(version>=4?3:1);attempt++){
      let found=null,budget=40000;
      const search = (candidates,picked) => {
        if(picked.length===scenario.harborTypes.length){if(picked.filter(onMain).length<minMain)return false;found=picked;return true;}
        if(--budget<0 || candidates.length<scenario.harborTypes.length-picked.length)return false;
        if(minMain&&picked.filter(onMain).length+candidates.filter(onMain).length<minMain)return false;
        const foreignFull=minMain&&picked.filter(e=>!onMain(e)).length>=scenario.harborTypes.length-minMain;
        for(let i=0;i<candidates.length;i++){
          if(foreignFull&&!onMain(candidates[i]))continue;
          const e=candidates[i], remaining=candidates.slice(i+1).filter(o=>!harborsConflict(e,o,options.noAdjacentHarbors));
          if(search(remaining,[...picked,e]))return true;
        }return false;
      };
      if(!search(shuffle(coast,rng),[]))continue;
      const spacing=version>=4?harborSpacing(found):0;
      if(spacing>bestSpacing){bestSpacing=spacing;selected=found;}
    }
    if(!selected.length)return null;
  }
  const types=shuffle(scenario.harborTypes,rng);
  return selected.map((e,i)=>({q:e.q,r:e.r,side:e.side,resource:types[i]}));
}
export function validateBoard(board) {
  const errors=[],s=SCENARIOS.find(s=>s.id===board.scenarioId);
  if(!s)return ['Unknown scenario.'];
  const {tiles,harbors,options}=board;
  if(!equalBag(tiles.map(key),s.tiles.map(key)))errors.push('Incorrect board coordinates.');
  for(const group of ['main','foreign','sea','barrier']) {
    const actual=tiles.filter(t=>t.group===group),expected=s.tiles.filter(t=>t.group===group);
    if(!equalBag(actual.map(key),expected.map(key)))errors.push(`Incorrect ${group} region.`);
    if(!equalBag(actual.map(t=>t.resource),expected.map(t=>t.resource)))errors.push(`Incorrect ${group} terrain inventory.`);
    if(!equalBag(actual.filter(t=>t.number).map(t=>t.number),expected.filter(t=>t.number).map(t=>t.number)))errors.push(`Incorrect ${group} token inventory.`);
  }
  if(tiles.some(t=>['sea','desert'].includes(t.resource)?t.number!==null:!Number.isInteger(t.number)||t.number<2||t.number>12||t.number===7))errors.push('Invalid token on a tile.');
  if(options.noAdjacentRed && tiles.some((t,i)=>isRed(t.number)&&tiles.slice(i+1).some(o=>isRed(o.number)&&adjacent(t,o))))errors.push('Adjacent red tokens.');
  if(s.noRedGold&&tiles.some(t=>t.resource==='gold'&&isRed(t.number)))errors.push('Red token on gold.');
  if(options.noAdjacentResources && tiles.some((t,i)=>!['sea','desert'].includes(t.resource)&&tiles.slice(i+1).some(o=>o.resource===t.resource&&adjacent(t,o))))errors.push('Adjacent matching resources.');
  if(!equalBag(harbors.map(h=>h.resource),s.harborTypes))errors.push('Incorrect harbor inventory.');
  const coast=coastEdges(tiles,restrictedHarbors(s)&&!options.foreignHarbors);
  if(harbors.filter(h=>tiles.some(t=>t.group==='main'&&key(t)===key(h))).length<minMainHarbors(s,options))errors.push('Too few harbors on the starting island.');
  if(harbors.some(h=>!coast.some(e=>e.id===`${key(h)}:${h.side}`)))errors.push('Harbor is not on an eligible coast.');
  const edges=harbors.map(h=>edge(h,h.side));
  if(edges.some((a,i)=>edges.slice(i+1).some(b=>harborsConflict(a,b,options.noAdjacentHarbors))))errors.push('Harbors too close together.');
  if((board.version??1)>=5&&!options.recommendedTiles&&['shores','desert'].includes(s.family)&&islandSizes(tiles).includes(1))errors.push('Single-hex island.');
  if(options.recommendedTiles && tiles.some(t=>{const expected=s.tiles.find(o=>key(o)===key(t));return !expected||expected.resource!==t.resource||expected.number!==t.number;}))errors.push('Recommended tiles changed.');
  if(options.recommendedHarbors&&s.harbors.some(h=>!harbors.some(a=>key(h)===key(a)&&h.side===a.side)))errors.push('Recommended harbors changed.');
  errors.push(...validatePieces(board,s));
  return errors;
}
export function generateBoard(scenarioId,seed,settings={},context={}) {
  const s=SCENARIOS.find(s=>s.id===scenarioId);if(!s)throw Error('Choose a supported scenario.');
  const version=context.version??5,players=context.players??s.players;
  if(![1,2,3,4,5].includes(version))throw Error('Unsupported map link version.');
  if(![3,4,5,6].includes(players)||(s.family==='base'? (players>4?6:4):players>4?6:players)!==s.players)throw Error('Player count does not match this scenario.');
  const options={...DEFAULTS,...settings,...(version===1?{balanceStarts:false}:{}),...(version<4?{foreignHarbors:false}:{})};
  if(!['total','perTile','off'].includes(options.balance))throw Error('Unknown balance mode.');
  if(!Number.isInteger(options.variance)||options.variance<0||options.variance>100)throw Error('Variance must be a whole number from 0 to 100.');
  const rng=random(`${scenarioId}:${seed}:v1`);
  // Recommended layouts are exact; reject conflicting optional constraints.
  for(let attempt=0;attempt<50;attempt++){
    const tiles=assignTerrain(s.tiles,options,s,rng,version);if(!tiles)continue;
    if(!assignNumbers(tiles,s.tiles,options,s,rng))continue;
    const harbors=placeHarbors(tiles,s,options,rng,version);if(!harbors)continue;
    const target=optimize(tiles,options,s,rng,version);
    optimizeStarts(tiles,options,s,players,rng,version,target);
    const board={version,players,scenarioId,seed:String(seed),options,tiles,harbors,pieces:startingPieces(tiles,s)};
    const errors=validateBoard(board);
    if(!errors.length)return board;
    if(options.recommendedTiles)throw Error(`The rulebook layout conflicts with these settings: ${errors.join(' ')} Turn off the conflicting option or recommended tile placement.`);
  }
  throw Error('Could not find a board satisfying all selected constraints. Try another seed or relax a placement option. No rules were silently disabled.');
}
export function boardStats(board) {
  const rows=production(board.tiles),totals=rows.map(r=>r.total);
  const scenario=SCENARIOS.find(s=>s.id===board.scenarioId);
  return {rows,totalPips:board.tiles.reduce((s,t)=>s+pips(t.number),0),spread:Math.max(...totals)-Math.min(...totals),
    starts:scoreStarts(startingGraph(board.tiles,scenario.family),board.players??scenario.players),
    maxIntersection:Math.max(...intersections(board.tiles).map(v=>v.tiles.reduce((s,t)=>s+pips(t.number),0))),goldPips:board.tiles.filter(t=>t.resource==='gold').reduce((s,t)=>s+pips(t.number),0)};
}
