export const DIRECTIONS = [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
export const key = t => `${t.q},${t.r}`;
export const adjacent = (a,b) => Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r)) === 1;
export function center(t, size=1) { return { x: size*1.5*t.q, y: size*Math.sqrt(3)*(t.r+t.q/2) }; }
export function corners(t, size=1) {
  const c = center(t,size);
  return Array.from({length:6},(_,i)=>({x:c.x+size*Math.cos(i*Math.PI/3),y:c.y+size*Math.sin(i*Math.PI/3)}));
}
const pointKey = p => `${Math.round(p.x*10000)},${Math.round(p.y*10000)}`;
export function edge(t, side) {
  const vertices = corners(t), a=vertices[side], b=vertices[(side+1)%6];
  return {q:t.q,r:t.r,side,vertices:[pointKey(a),pointKey(b)],a,b,id:`${key(t)}:${side}`};
}
export function coastEdges(tiles, mainOnly=false) {
  const map = new Map(tiles.map(t=>[key(t),t]));
  return tiles.filter(t=>t.resource!=='sea' && (!mainOnly || t.group==='main')).flatMap(t=>DIRECTIONS.flatMap(([q,r],side)=>{
    const neighbor=map.get(`${t.q+q},${t.r+r}`);
    return !neighbor || neighbor.resource==='sea' ? [edge(t,side)] : [];
  }));
}
export function harborsConflict(a,b,spaced) {
  if(a.id===b.id)return true;
  // Two or more sides apart: harbors must not share an endpoint.
  return spaced && a.vertices.some(v=>b.vertices.includes(v));
}
export function intersections(tiles) {
  const vertices=new Map();
  for(const t of tiles.filter(t=>t.resource!=='sea')) for(const p of corners(t)) {
    const k=pointKey(p); if(!vertices.has(k))vertices.set(k,{...p,tiles:[]});
    vertices.get(k).tiles.push(t);
  }
  return [...vertices.values()];
}
