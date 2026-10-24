import { center, corners, edge } from './geometry.js';
import { pips, isRed } from './generator.js';
import { startingPieces } from './pieces.js';
export const COLORS = {lumber:'#3d7354',brick:'#c06a48',wool:'#8fbf63',grain:'#e3b94f',ore:'#8a9aa6',desert:'#e2cb94',gold:'#d4a73c',sea:'#2a6a72',any:'#efe6d2'};
export const LABELS = {lumber:'Lumber',brick:'Brick',wool:'Wool',grain:'Grain',ore:'Ore',desert:'Desert',gold:'Gold',sea:'Sea',any:'Any'};
export const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SIZE=48;
const hexPoints = (r,cx=0,cy=0) => corners({q:0,r:0},r).map(p=>`${(p.x+cx).toFixed(2)},${(p.y+cy).toFixed(2)}`).join(' ');
// Terrain base gradients: light (top) to dark (bottom).
const GROUND = {lumber:['#3f7a50','#24503a'],brick:['#d27c55','#9c4f34'],wool:['#a6d27a','#6f9d4b'],grain:['#f0cd6a','#c99a35'],ore:['#a1aeb6','#66777f'],desert:['#efdcab','#cdb27a'],gold:['#b88a45','#7d5a2c']};

// Artwork is drawn in hex-local coordinates (flat-top, radius 48) around a
// clear centre for the number token and a clear strip for the label.
const tree = (x,y,s=1,dark='#1f4a33',light='#2f6b45') => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-1.3" y="5" width="2.6" height="5" fill="#5b3b22"/><path d="M0-12 8 1H-8Z" fill="${dark}"/><path d="M0-8 9 6H-9Z" fill="${light}"/><path d="M0-12-8 1H0Z M0-8-9 6H0Z" fill="#fff" opacity=".08"/></g>`;
const sheep = (x,y,s=1,flip=1) => `<g transform="translate(${x} ${y}) scale(${s*flip} ${s})"><ellipse cx="0" cy="7.5" rx="7.5" ry="1.6" fill="#2d4a1e" opacity=".25"/><path d="M-3 4v3.5M3 4v3.5" stroke="#3a3a35" stroke-width="1.3"/><g fill="#faf6ea"><circle cx="-3.5" cy="0" r="3.6"/><circle cx="0" cy="-1.5" r="3.8"/><circle cx="3.5" cy="0" r="3.6"/><circle cx="0" cy="2" r="3.6"/></g><ellipse cx="6.5" cy="-1" rx="2.4" ry="1.9" fill="#3a3a35"/></g>`;
const tuft = (x,y) => `<path d="M${x-2.5} ${y}l1-3.5M${x} ${y}v-4.5M${x+2.5} ${y}l-1-3.5" stroke="#5a8a3b" stroke-width="1" stroke-linecap="round" fill="none"/>`;
const stalk = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="#8a6420" stroke-width="1" stroke-linecap="round" fill="#b8862d"><path d="M0 9V-6" fill="none"/>${[-5,-1.5,2].map(d=>`<ellipse cx="-1.6" cy="${d}" rx="1.3" ry="2.2" transform="rotate(-25 -1.6 ${d})"/><ellipse cx="1.6" cy="${d}" rx="1.3" ry="2.2" transform="rotate(25 1.6 ${d})"/>`).join('')}<ellipse cx="0" cy="-8" rx="1.2" ry="2.3"/></g>`;
const bricks = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="#6e3420" stroke-width=".6"><rect x="-8" y="0" width="7.5" height="3.5" fill="#b4573a"/><rect x=".5" y="0" width="7.5" height="3.5" fill="#a54d32"/><rect x="-4" y="-3.5" width="7.5" height="3.5" fill="#c5664a"/><ellipse cx="0" cy="4.8" rx="10" ry="1.4" fill="#5e2c1a" stroke="none" opacity=".3"/></g>`;
const rock = (x,y,s=1,fill='#5b6a72') => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6 3-4-2 0-4 5-2 6 3Z" fill="${fill}"/><path d="M-4-2 0-4 1 0-3 1Z" fill="#fff" opacity=".18"/></g>`;
const cactus = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#6f8f4a" stroke="#4d6a31" stroke-width=".6"><rect x="-1.8" y="-9" width="3.6" height="15" rx="1.8"/><path d="M-1.8-1H-5V-6" fill="none" stroke="#6f8f4a" stroke-width="2.6" stroke-linecap="round"/><path d="M1.8 1H5V-4" fill="none" stroke="#6f8f4a" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="0" cy="6.5" rx="6" ry="1.3" fill="#a78a52" stroke="none" opacity=".45"/></g>`;
const nugget = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-3 1-1-2 2-2 3 1 0 3Z" fill="#ffd34d" stroke="#a3741d" stroke-width=".6"/><path d="M-1-2 2-2 1 0-1 0Z" fill="#fff6c4"/></g>`;
const sparkle = (x,y,s=1) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-4 .8-.8 4 0 .8.8 0 4-.8.8-4 0-.8-.8Z" fill="#fff7d0"/>`;
const peak = (x,y,w,h,snow=true) => `<g transform="translate(${x} ${y})"><path d="M${-w} 0 0 ${-h} ${w} 0Z" fill="#6c7d86"/><path d="M0 ${-h} ${w} 0H${w*.15}Z" fill="#4d5d66"/>${snow?`<path d="M0 ${-h} ${w*.36} ${-h*.64} ${w*.16} ${-h*.68} 0 ${-h*.58} ${-w*.14} ${-h*.7} ${-w*.36} ${-h*.64}Z" fill="#f4f6f2"/>`:''}</g>`;
const ART = {
  lumber: [[-31,-24,1],[-12,-31,1.05],[8,-32,1],[27,-24,1.05],[-40,-6,.9],[39,-5,.95],[-17,-19,.8],[18,-17,.82],[-33,13,1],[33,13,1],[-23,27,.95],[23,28,.95],[-41,23,.75],[41,22,.75]]
    .sort((a,b)=>a[1]-b[1]).map(([x,y,s],i)=>tree(x,y,s,i%2?'#1b4a2f':'#22573a',i%3?'#4c9461':'#3f8756')).join(''),
  brick: `<path d="M-50-14Q-30-40-8-22Q12-44 34-24Q44-34 52-26V-50H-50Z" fill="#b25b3c"/><path d="M-50-8Q-28-30-6-14Q16-34 50-12" fill="none" stroke="#e59a72" stroke-width="1.2" opacity=".6"/><path d="M-50 24Q-36 12-22 22M24 22Q36 12 50 22" fill="none" stroke="#8f4129" stroke-width="1.2" opacity=".5"/>`
    +[[-31,-6,1],[30,-8,1.05],[-36,14,.9],[35,12,.9],[-14,-30,.75],[15,-30,.75]].map(([x,y,s])=>bricks(x,y,s)).join('')
    +`<ellipse cx="-24" cy="29" rx="7" ry="2.2" fill="#7c3b26" opacity=".45"/><ellipse cx="25" cy="29" rx="6" ry="2" fill="#7c3b26" opacity=".45"/>`,
  wool: [[-26,-28],[-6,-34],[16,-30],[34,-16],[-38,-4],[-30,22],[36,22],[18,30],[-14,30],[40,6],[-42,12]].map(([x,y])=>tuft(x,y)).join('')
    +`<path d="M-48 -6H-22M22 -6H48" stroke="#8d6b43" stroke-width="1" opacity=".55"/>${[-44,-36,-28,26,34,42].map(x=>`<path d="M${x}-9v6" stroke="#8d6b43" stroke-width="1.2" opacity=".55"/>`).join('')}`
    +sheep(-24,-20,1)+sheep(22,-24,.95,-1)+sheep(31,10,1.05)+sheep(-31,12,.9,-1),
  grain: `<g stroke="#b88d33" stroke-width="2.2" opacity=".55">${Array.from({length:14},(_,i)=>`<path d="M${-70+i*10} 50L${-30+i*10}-50"/>`).join('')}</g>`
    +[[-30,-26,1],[-20,-30,1.05],[-10,-32,1],[10,-32,1],[20,-30,1.05],[30,-26,1],[-37,-8,.95],[37,-8,.95],[-36,14,1],[-27,22,.95],[27,22,.95],[36,14,1]].map(([x,y,s])=>stalk(x,y,s)).join(''),
  ore: `<path d="M-50-2-36-20-28-14-14-38 0-24 12-42 28-20 36-26 50-6V-50H-50Z" fill="#7d8d96"/>`
    +peak(-26,-6,17,30)+peak(26,-6,17,32)+peak(0,-16,15,30)+peak(-41,10,10,16,false)+peak(41,10,10,17,false)
    +rock(-27,24,1.2)+rock(28,25,1.1)+rock(-40,24,.8,'#4f5d64')+rock(41,24,.8,'#4f5d64')
    +`<path d="M-30 20l3-2 2 2M30 21l3-2" stroke="#c9d2d6" stroke-width=".9" fill="none"/>`,
  desert: `<path d="M-50-10Q-26-30 0-14Q24-32 50-12V-50H-50Z" fill="#f3e3b8"/><g fill="none" stroke="#c6a76c" stroke-width="1.2" stroke-linecap="round" opacity=".75"><path d="M-44-18Q-30-28-16-20M12-22Q26-30 40-20M-46 18Q-34 10-22 16M22 16Q34 9 46 17M-40 28Q-30 22-20 27M20 28Q30 22 40 27"/></g>`
    +cactus(-28,-6,1)+cactus(30,4,.85)+rock(-36,22,.6,'#b49866')+rock(36,-24,.6,'#b49866'),
  gold: `<path d="M-50-6-34-24-20-12-4-34 10-20 24-36 50-8V-50H-50Z" fill="#8a6533"/><path d="M-4-34 10-20 24-36" fill="none" stroke="#c99a52" stroke-width="1.2"/><path d="M-50 20Q-30 4-18 22T12 28T50 16" fill="none" stroke="#5aa3b8" stroke-width="5" stroke-linecap="round" opacity=".85"/><path d="M-50 20Q-30 4-18 22T12 28T50 16" fill="none" stroke="#bde3ea" stroke-width="1.2" stroke-dasharray="3 6" opacity=".8"/>`
    +[[-30,-4,1.2],[30,-6,1.1],[-38,10,.9],[38,10,.9],[-24,-24,.8],[22,-26,.85]].map(([x,y,s])=>nugget(x,y,s)).join('')
    +[[-34,-14,.9],[34,-18,.8],[-26,6,.7],[26,4,.7],[0,-38,.7]].map(([x,y,s])=>sparkle(x,y,s)).join(''),
};
const hash = t => { let h=Math.imul(t.q*73856093^t.r*19349663,0x9E3779B1); h^=h>>>15; return h>>>0; };
function defs() {
  const grads=Object.entries(GROUND).map(([k,[a,b]])=>`<linearGradient id="fs-g-${k}" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join('');
  return `<defs>${grads}
<radialGradient id="fs-ocean" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#2f7880"/><stop offset=".7" stop-color="#1e5359"/><stop offset="1" stop-color="#143c42"/></radialGradient>
<linearGradient id="fs-sea-tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a8890"/><stop offset="1" stop-color="#2a6b73"/></linearGradient>
<pattern id="fs-waves" width="44" height="26" patternUnits="userSpaceOnUse"><path d="M2 8q5-4 10 0t10 0M24 21q5-4 10 0t10 0" fill="none" stroke="#bfe3e2" stroke-width="1" stroke-linecap="round" opacity=".22"/></pattern>
<linearGradient id="fs-bevel" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
<radialGradient id="fs-token" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fffaf0"/><stop offset=".75" stop-color="#f1e3c0"/><stop offset="1" stop-color="#ddc796"/></radialGradient>
<radialGradient id="fs-pawn" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#8c918d"/><stop offset="1" stop-color="#2a2e2c"/></radialGradient>
<linearGradient id="fs-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6a3c"/><stop offset="1" stop-color="#5e3d20"/></linearGradient>
<clipPath id="fs-hex"><polygon points="${hexPoints(SIZE-1.6)}"/></clipPath>
<filter id="fs-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.4" flood-color="#0b2427" flood-opacity=".45"/></filter>
${Object.entries(ART).map(([k,body])=>`<symbol id="fs-art-${k}" viewBox="-50 -50 100 100" width="100" height="100" x="-50" y="-50" overflow="visible">${body}</symbol>`).join('')}
</defs>`;
}
const robberArt='<ellipse cx="0" cy="13" rx="9" ry="2.6" fill="#0b1c1d" opacity=".35"/><path d="M-5.5-3Q-9 4-7 8L-9 12.5Q0 16 9 12.5L7 8Q9 4 5.5-3Z" fill="url(#fs-pawn)" stroke="#f7ecd0" stroke-width=".9"/><circle cx="0" cy="-8" r="6" fill="url(#fs-pawn)" stroke="#f7ecd0" stroke-width=".9"/><ellipse cx="-2" cy="-10" rx="2" ry="1.3" fill="#fff" opacity=".35"/>';
const pirateArt='<ellipse cx="0" cy="15" rx="20" ry="3" fill="#081d20" opacity=".4"/><path d="M-20 5H20L13 15H-12Z" fill="url(#fs-wood)" stroke="#2a1a0c" stroke-width="1"/><path d="M-18 8H18" stroke="#c9a46a" stroke-width=".8" opacity=".6"/><path d="M0-20V5" stroke="#2a1a0c" stroke-width="1.6"/><path d="M1-18Q12-10 1 1Z" fill="#1d2224" stroke="#0e1112" stroke-width=".8"/><path d="M-1-15Q-14-7-1 2Z" fill="#262c2e" stroke="#0e1112" stroke-width=".8"/><circle cx="5.5" cy="-8.5" r="2.1" fill="#ede3c8"/><path d="M4.4-6.8h2.2" stroke="#ede3c8" stroke-width=".9"/><path d="M0-20h8l-2.5 3H0Z" fill="#b8352b"/>';
function renderPieces(board,scenario) {
  const pieces=board.pieces||startingPieces(board.tiles,scenario);
  const t=board.tiles.find(t=>t.q===pieces.robber.q&&t.r===pieces.robber.r),r=center(pieces.robber,SIZE);
  const robber=`<g data-piece="robber" role="img" aria-label="Robber starts on ${LABELS[t.resource]}${t.number?' '+t.number:''}" transform="translate(${r.x+(t.number?24:0)} ${r.y+(t.number?-20:-2)})"><title>Robber starts here${t.number?' (leave the '+t.number+' token beneath it)':''}</title>${robberArt}${t.number?'':'<text y="25" text-anchor="middle" font-size="6" font-family="system-ui,sans-serif" font-weight="700" letter-spacing=".8" fill="#4a3a1c">ROBBER</text>'}</g>`;
  let pirate='';
  if(pieces.pirate) {
    const p=center(pieces.pirate,SIZE),frame=pieces.pirate.location==='frame';
    pirate=`<g data-piece="pirate" data-location="${pieces.pirate.location}" role="img" aria-label="Pirate starts ${frame?'on this frame position':'on this sea hex'}" transform="translate(${p.x} ${p.y})"><title>Pirate starts ${frame?'on the sea frame; do not add a hex tile':'here'}</title>${frame?'<circle r="28" fill="#0f3236" fill-opacity=".35" stroke="#9cc4bf" stroke-dasharray="2 3" opacity=".75"/>':''}${pirateArt}<text y="27" text-anchor="middle" font-size="6" font-family="system-ui,sans-serif" font-weight="700" letter-spacing=".8" fill="#f0e5c7">PIRATE</text>${frame?'<text y="36" text-anchor="middle" font-size="5.5" font-family="system-ui,sans-serif" letter-spacing=".6" fill="#b8d0c8">ON FRAME</text>':''}</g>`;
  }
  return robber+pirate;
}
function token(n) {
  const red=isRed(n),ink=red?'#b3291f':'#263632',p=pips(n);
  return `<g class="token"><circle cx=".8" cy="2.6" r="17.5" fill="#0b2427" opacity=".35"/><circle r="17.5" fill="url(#fs-token)" stroke="#b49e6c" stroke-width="1"/><circle r="14.8" fill="none" stroke="#c9b282" stroke-width=".6" opacity=".7"/><text y="5.5" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="${n>9?17:19}" font-weight="bold" fill="${ink}">${n}</text>${Array.from({length:p},(_,i)=>`<circle cx="${((i-(p-1)/2)*3.6).toFixed(1)}" cy="11" r="1.25" fill="${ink}"/>`).join('')}</g>`;
}
function landTile(t) {
  const {x,y}=center(t,SIZE),flip=hash(t)%2?-1:1,foreign=t.group==='foreign';
  const label=`${LABELS[t.resource]}${t.number?`, ${t.number}, ${pips(t.number)} pips`:''}${foreign?', foreign area':''}`;
  const name=LABELS[t.resource].toUpperCase();
  return `<g class="hex" data-resource="${t.resource}" tabindex="0" role="img" aria-label="${escape(label)}" transform="translate(${x} ${y})"><title>${escape(label)}</title>`
    +`<g clip-path="url(#fs-hex)"><polygon points="${hexPoints(SIZE-1.6)}" fill="url(#fs-g-${t.resource})"/><use href="#fs-art-${t.resource}" transform="scale(${flip} 1)"/><polygon points="${hexPoints(SIZE-1.6)}" fill="url(#fs-bevel)"/></g>`
    +`<polygon class="tile-outline" points="${hexPoints(SIZE-2.2)}" fill="none" stroke="${foreign?'#f6d77c':'#fff6dc'}" stroke-opacity="${foreign?1:.35}" stroke-width="${foreign?2.4:1.2}"${foreign?' stroke-dasharray="7 3"':''}/>`
    +(t.number?token(t.number):'')
    +`<text y="38" text-anchor="middle" font-family="system-ui,sans-serif" font-size="6.4" font-weight="700" letter-spacing="1.3" fill="#fffaf0" stroke="#1d2f2a" stroke-width="2.2" stroke-opacity=".55" paint-order="stroke">${name}</text></g>`;
}
function seaTile(t) {
  const {x,y}=center(t,SIZE);
  return `<g transform="translate(${x} ${y})"><polygon points="${hexPoints(SIZE-1)}" fill="url(#fs-sea-tile)" fill-opacity=".55" stroke="#8fc6c6" stroke-opacity=".22"/><path d="M-14 4q4-4 8 0t8 0t8 0M-4-14q3-3 6 0t6 0" fill="none" stroke="#cdeceb" stroke-width="1" stroke-linecap="round" opacity=".3"/></g>`;
}
function harbor(h) {
  const e=edge(h,h.side),c=center(h),mid={x:(e.a.x+e.b.x)/2,y:(e.a.y+e.b.y)/2},dx=(mid.x-c.x)/Math.sqrt(.75),dy=(mid.y-c.y)/Math.sqrt(.75);
  const x=(mid.x+dx*.46)*SIZE,y=(mid.y+dy*.46)*SIZE,any=h.resource==='any',ring=COLORS[h.resource];
  const pier=p=>{const ax=p.x*SIZE,ay=p.y*SIZE,bx=ax+(x-ax)*.62,by=ay+(y-ay)*.62;return `<path d="M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}" stroke="#3b2612" stroke-width="5.6" stroke-linecap="round"/><path d="M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}" stroke="#a9773f" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="2.2 1.1"/>`;};
  return `<g class="harbor" role="img" aria-label="${LABELS[h.resource]} ${any?'3':'2'} to 1 harbor"><title>${LABELS[h.resource]} ${any?'3':'2'}:1 harbor</title>${pier(e.a)}${pier(e.b)}<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" filter="url(#fs-shadow)"><circle r="14" fill="url(#fs-token)" stroke="${any?'#5d6f6a':ring}" stroke-width="3"/>${any?'':`<polygon points="${hexPoints(3.4,0,-8)}" fill="${ring}" stroke="#3b3a2c" stroke-width=".5"/>`}<text y="${any?1.5:3.3}" text-anchor="middle" fill="#22332f" font-family="system-ui,sans-serif" font-weight="800" font-size="8.6">${any?'3:1':'2:1'}</text><text y="${any?8.8:9.6}" text-anchor="middle" fill="#4b5b55" font-family="system-ui,sans-serif" font-weight="700" font-size="${any?5:4.4}" letter-spacing=".4">${any?'ANY':LABELS[h.resource].toUpperCase()}</text></g></g>`;
}
export function renderBoard(board,scenario) {
  const points=board.tiles.map(t=>center(t,SIZE));
  const minX=Math.min(...points.map(p=>p.x))-90,maxX=Math.max(...points.map(p=>p.x))+90,minY=Math.min(...points.map(p=>p.y))-92,maxY=Math.max(...points.map(p=>p.y))+92;
  const land=board.tiles.filter(t=>t.resource!=='sea');
  // Shallows and beach sit beneath the land so each island gets a coastline;
  // the sand shows through as seams between neighbouring tiles.
  const shore=(r,fill,opacity)=>land.map(t=>{const c=center(t,SIZE);return `<polygon points="${hexPoints(r,c.x,c.y)}" fill="${fill}" fill-opacity="${opacity}"/>`;}).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${maxX-minX} ${maxY-minY}" role="group" aria-labelledby="board-svg-title board-svg-desc"><title id="board-svg-title">${escape(scenario.title)} map, seed ${escape(board.seed)}</title><desc id="board-svg-desc">${land.length} land tiles. Resource names and token pips are printed on each tile. Gold outlines mark foreign areas. Piers connect each harbor to its two coastal intersections. A pawn marks the robber's starting tile. A ship marks the pirate's starting position when in use; dashed circles indicate the sea frame.</desc>${defs()}`
    // The page hides the ocean fill and lets the waves run past the viewBox
    // so the map blends into its panel; exported SVGs keep both, clipped.
    +`<rect class="ocean" x="${minX}" y="${minY}" width="${maxX-minX}" height="${maxY-minY}" fill="url(#fs-ocean)"/><rect x="${minX-2000}" y="${minY-2000}" width="${maxX-minX+4000}" height="${maxY-minY+4000}" fill="url(#fs-waves)"/>`
    +board.tiles.filter(t=>t.resource==='sea').map(seaTile).join('')
    +`<g>${shore(SIZE+12,'#6fb7b3',.28)}${shore(SIZE+5,'#e8d6a3',1)}</g>`
    +land.map(landTile).join('')
    +board.harbors.map(harbor).join('')
    +renderPieces(board,scenario)+'</svg>';
}
