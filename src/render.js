import { center, corners, edge, DIRECTIONS } from './geometry.js';
import { pips, isRed } from './generator.js';
import { startingPieces } from './pieces.js';
export const COLORS = {lumber:'#437461',brick:'#bd7358',wool:'#91ac70',grain:'#d7b566',ore:'#839698',desert:'#d8c395',gold:'#c4a15b',sea:'#25545a',any:'#efe6d2'};
export const LABELS = {lumber:'Lumber',brick:'Brick',wool:'Wool',grain:'Grain',ore:'Ore',desert:'Desert',gold:'Gold',sea:'Sea',any:'Any'};
export const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const art = {
  lumber:'<path d="M-31 8-21-12-11 8ZM-16 6-3-22 10 6ZM9 10 21-15 33 10Z" fill="#234f40"/><path d="M-21 7v6M-3 5v10M21 9v7" stroke="#dccca1" stroke-width="2"/>',
  brick:'<path d="M-37 11Q-23-24-7 2Q11-24 36 12Z" fill="#96513d"/><path d="m-24 9 8-9 9 9m8 2 10-17 13 17" fill="none" stroke="#e8ad81" stroke-width="2"/>',
  wool:'<path d="M-38 11Q-17-11 4 8Q25-10 38 11Z" fill="#6f945b"/><g fill="#f3ead6"><ellipse cx="-14" cy="-1" rx="9" ry="6"/><circle cx="-5" cy="-3" r="4"/><ellipse cx="16" cy="8" rx="7" ry="5"/></g><path d="M-18 4v4m8-4v4m22 4v4m7-4v4" stroke="#375e4a" stroke-width="2"/>',
  grain:'<g fill="none" stroke="#87652e" stroke-width="2"><path d="M-21 15V-14M0 15V-18M21 15V-14"/><path d="m-21-4-7-7m7 15-7-7m7-1 7-7m-7 15 7-7M0-8l-7-7M0 0l-7-7M0-8l7-7M0 0l7-7m14 3-7-7m7 15-7-7m7-1 7-7m-7 15 7-7"/></g>',
  ore:'<path d="m-39 14 20-31 15 18 15-29 30 42Z" fill="#526d75"/><path d="m-26-6 7-11 9 11-9-4Zm28-6 9-16 12 16-12-5Z" fill="#dfe2d9"/><path d="M11-17v31h30" fill="#67838a"/>',
  desert:'<path d="M-37 10Q-19-14 4 6Q23-8 37 10M-28 17Q-10 4 13 17" fill="none" stroke="#b29a6a" stroke-width="3"/><circle cx="20" cy="-12" r="6" fill="#eddda8"/>',
  gold:'<path d="m-33 13 21-33 13 18 12-22 24 37Z" fill="#826d48"/><path d="m-6 3 6-7 7 7-7 7ZM14 5l6-7 7 7-7 7Z" fill="#ffdb70"/>',
};
const robberArt='<circle cx="0" cy="-10" r="4.5"/><path d="M-4-5Q-8 1-6 6L-8 12Q0 15 8 12L6 6Q8 1 4-5Z"/>';
const pirateArt='<path d="M-18 7H18L11 16H-10Z" fill="#172c30"/><path d="M0-19V7M0-16L-15 3H0M3-13L15 3H3Z" fill="#eddfb8" stroke="#172c30" stroke-width="1.7"/><path d="M0-19h9l-3 4H0Z" fill="#172c30"/>';
function renderPieces(board,scenario,size) {
  const pieces=board.pieces||startingPieces(board.tiles,scenario);
  const t=board.tiles.find(t=>t.q===pieces.robber.q&&t.r===pieces.robber.r),r=center(pieces.robber,size);
  const robber=`<g data-piece="robber" role="img" aria-label="Robber starts on ${LABELS[t.resource]}${t.number?' '+t.number:''}" transform="translate(${r.x+(t.number?25:0)} ${r.y+(t.number?-18:-2)})"><title>Robber starts here${t.number?' (leave the '+t.number+' token beneath it)':''}</title><g fill="#29322d" stroke="#f7ecd0" stroke-width="1.2">${robberArt}</g>${t.number?'':'<text y="24" text-anchor="middle" font-size="6" font-family="system-ui,sans-serif" font-weight="700" fill="#29322d">ROBBER</text>'}</g>`;
  let pirate='';
  if(pieces.pirate) {
    const p=center(pieces.pirate,size),frame=pieces.pirate.location==='frame';
    pirate=`<g data-piece="pirate" data-location="${pieces.pirate.location}" role="img" aria-label="Pirate starts ${frame?'on this frame position':'on this sea hex'}" transform="translate(${p.x} ${p.y})"><title>Pirate starts ${frame?'on the sea frame; do not add a hex tile':'here'}</title>${frame?'<circle r="27" fill="none" stroke="#88aaa5" stroke-dasharray="2 3" opacity=".65"/>':''}${pirateArt}<text y="25" text-anchor="middle" font-size="6" font-family="system-ui,sans-serif" font-weight="700" fill="#f0e5c7">PIRATE</text>${frame?'<text y="36" text-anchor="middle" font-size="5.5" font-family="system-ui,sans-serif" fill="#b8c8b7">ON FRAME</text>':''}</g>`;
  }
  return robber+pirate;
}
export function renderBoard(board,scenario) {
  const size=48, points=board.tiles.map(t=>center(t,size));
  const minX=Math.min(...points.map(p=>p.x))-90,maxX=Math.max(...points.map(p=>p.x))+90,minY=Math.min(...points.map(p=>p.y))-92,maxY=Math.max(...points.map(p=>p.y))+92;
  const tiles=board.tiles.map(t=>{
    const {x,y}=center(t,size),polygon=corners({q:0,r:0},size-1).map(p=>`${p.x},${p.y}`).join(' ');
    const label=`${LABELS[t.resource]}${t.number?`, ${t.number}, ${pips(t.number)} pips`:''}${t.group==='foreign'?', foreign area':''}`;
    if(t.resource==='sea')return `<g transform="translate(${x} ${y})"><polygon points="${polygon}" fill="${COLORS.sea}" stroke="#518086" stroke-opacity=".26"/><path d="M-15 0q5-5 10 0t10 0t10 0" fill="none" stroke="#75a3a7" stroke-opacity=".25"/></g>`;
    return `<g class="hex" data-resource="${t.resource}" tabindex="0" role="img" aria-label="${escape(label)}" transform="translate(${x} ${y})"><title>${escape(label)}</title><polygon class="tile-outline" points="${polygon}" fill="${COLORS[t.resource]}" stroke="${t.group==='foreign'?'#efd69a':'#d5d3ad'}" stroke-width="${t.group==='foreign'?2:1}"/><path d="M-40 14Q-5-4 40 13" fill="none" stroke="#fff" stroke-opacity=".1"/><g transform="translate(0 -18) scale(.68)">${art[t.resource]}</g>${t.number?`<circle cx="0" cy="5" r="18" fill="#183739" opacity=".15"/><circle cx="0" cy="3" r="18" fill="#f5ead0" stroke="#fff4d8" stroke-width="1.3"/><text x="0" y="8" text-anchor="middle" font-family="Georgia,serif" font-size="22" font-weight="bold" fill="${isRed(t.number)?'#b34335':'#283b38'}">${t.number}</text>${Array.from({length:pips(t.number)},(_,i)=>`<circle cx="${(i-(pips(t.number)-1)/2)*4}" cy="15" r="1.25" fill="${isRed(t.number)?'#b34335':'#283b38'}"/>`).join('')}`:''}<text x="0" y="31" text-anchor="middle" font-family="system-ui,sans-serif" font-size="7.3" font-weight="650" letter-spacing="1.1" fill="${t.resource==='lumber'?'#f0ead6':'#273e36'}">${LABELS[t.resource].toUpperCase()}</text></g>`;
  }).join('');
  const harbors=board.harbors.map(h=>{
    const e=edge(h,h.side),c=center(h),mid={x:(e.a.x+e.b.x)/2,y:(e.a.y+e.b.y)/2},dx=(mid.x-c.x)/Math.sqrt(.75),dy=(mid.y-c.y)/Math.sqrt(.75);
    const x=(mid.x+dx*.43)*size,y=(mid.y+dy*.43)*size;
    return `<g role="img" aria-label="${LABELS[h.resource]} ${h.resource==='any'?'3':'2'} to 1 harbor"><title>${LABELS[h.resource]} ${h.resource==='any'?'3':'2'}:1 harbor</title><path d="M${e.a.x*size} ${e.a.y*size}L${x} ${y}L${e.b.x*size} ${e.b.y*size}" fill="none" stroke="#dfd1aa" stroke-width="1.7"/><circle cx="${x}" cy="${y}" r="13" fill="#173f44" stroke="${COLORS[h.resource]}" stroke-width="2"/><text x="${x}" y="${y+1}" text-anchor="middle" fill="#f4ead4" font-family="system-ui,sans-serif" font-weight="700" font-size="9">${h.resource==='any'?'3:1':'2:1'}</text><text x="${x}" y="${y+9}" text-anchor="middle" fill="${h.resource==='any'?'#d7cba7':COLORS[h.resource]}" font-family="system-ui,sans-serif" font-weight="700" font-size="5.5">${h.resource==='any'?'ANY':LABELS[h.resource].toUpperCase()}</text></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${maxX-minX} ${maxY-minY}" role="group" aria-labelledby="board-svg-title board-svg-desc"><title id="board-svg-title">${escape(scenario.title)} map, seed ${escape(board.seed)}</title><desc id="board-svg-desc">${board.tiles.filter(t=>t.resource!=='sea').length} land tiles. Resource names and token pips are printed on each tile. Gold outlines mark foreign areas. Lines connect each harbor to its two coastal intersections. A pawn marks the robber's starting tile. A ship marks the pirate's starting position when in use; dashed circles indicate the sea frame.</desc><rect x="${minX}" y="${minY}" width="${maxX-minX}" height="${maxY-minY}" fill="#1c454b"/>${tiles}${harbors}${renderPieces(board,scenario,size)}</svg>`;
}
