import { intersections } from './geometry.js';

// Build once per terrain layout. Number swaps can then score the same graph.
// At a corner, one edge to a neighbor is one road length: those two corners
// cannot both hold settlements. The hex-corner graph is bipartite.
export function startingGraph(tiles, family) {
  const restricted = family === 'shores' || family === 'desert';
  const vertices = intersections(tiles).filter(v => !restricted || (
    v.tiles.some(t => t.group === 'main') && !v.tiles.some(t => t.group === 'foreign')
  ));
  const neighbors = vertices.map((v,i) => vertices.flatMap((other,j) =>
    i !== j && Math.abs(Math.hypot(v.x-other.x,v.y-other.y)-1)<0.0001 ? [j] : []));
  const colors = Array(vertices.length).fill(-1);
  for(let i=0;i<vertices.length;i++) {
    if(colors[i]!==-1)continue;
    colors[i]=0;
    const queue=[i];
    for(let index=0;index<queue.length;index++) for(const next of neighbors[queue[index]]) {
      if(colors[next]===-1){colors[next]=1-colors[queue[index]];queue.push(next);}
      else if(colors[next]===colors[queue[index]])throw Error('Starting-position graph is not bipartite.');
    }
  }
  return {vertices,neighbors,colors};
}

// Exact maximum number of mutually legal corners at a given pip threshold.
// For a bipartite graph, maximum independent-set size = vertices - maximum
// matching size (Kőnig's theorem). This avoids greedy tie/order bias.
export function compatibleCount(graph, scores, threshold) {
  const eligible=scores.map(score=>score>=threshold),matched=Array(scores.length).fill(-1);
  let matching=0;
  function augment(i,seen) {
    for(const j of graph.neighbors[i]) {
      if(!eligible[j]||seen[j])continue;
      seen[j]=true;
      if(matched[j]===-1||augment(matched[j],seen)){matched[j]=i;return true;}
    }
    return false;
  }
  for(let i=0;i<scores.length;i++) if(eligible[i]&&graph.colors[i]===0&&augment(i,Array(scores.length).fill(false)))matching++;
  return eligible.filter(Boolean).length-matching;
}

export function startProfile(graph, scores, players) {
  const best=Math.max(0,...scores),target=Math.max(3,Math.min(6,players));
  const levels=[];
  let nearBest=0;
  // level k is the highest production threshold at which k non-neighboring
  // starts can coexist. Different thresholds may use different sets of spots.
  for(let threshold=best;threshold>=1;threshold--) {
    const count=compatibleCount(graph,scores,threshold);
    if(threshold===Math.max(1,best-1))nearBest=count;
    while(levels.length<Math.min(count,target))levels.push(threshold);
    if(levels.length===target&&threshold<=best-1)break;
  }
  while(levels.length<target)levels.push(0);
  // One pip of natural variation is fine. Penalize the gap below a small
  // exceptional group, without an absolute cap on the best corner's strength.
  const penalty=levels.reduce((sum,level)=>sum+(level===0?1:0)+Math.max(0,best-level-1)**2,0);
  return {best,nearBest,players:target,levels,penalty,threshold:Math.max(1,best-1),spread:best-levels.at(-1)};
}

export function scoreStarts(graph,players) {
  const scores=graph.vertices.map(v=>v.tiles.reduce((sum,t)=>sum+(t.number&&t.number!==7?6-Math.abs(7-t.number):0),0));
  return startProfile(graph,scores,players);
}
