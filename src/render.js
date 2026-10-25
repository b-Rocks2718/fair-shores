import { center, corners, edge, coastEdges } from './geometry.js';
import { pips, isRed } from './generator.js';
import { startingPieces } from './pieces.js';
export const COLORS = {lumber:'#3d7354',brick:'#c06a48',wool:'#8fbf63',grain:'#e3b94f',ore:'#8a9aa6',desert:'#e2cb94',gold:'#d4a73c',sea:'#2a6a72',any:'#efe6d2'};
export const LABELS = {lumber:'Lumber',brick:'Brick',wool:'Wool',grain:'Grain',ore:'Ore',desert:'Desert',gold:'Gold',sea:'Sea',any:'Any'};
export const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SIZE=48, TILE=SIZE-1.8;
const f = n => +n.toFixed(2);
const hexPoints = (r,cx=0,cy=0) => corners({q:0,r:0},r).map(p=>`${f(p.x+cx)},${f(p.y+cy)}`).join(' ');
// Terrain ground: light (top-left) to dark (bottom-right), plus the colour of
// the tile's cardboard edge.
const GROUND = {lumber:['#4a8a5a','#24513a','#173a28'],brick:['#d8865c','#a5533a','#6f3524'],wool:['#acd77e','#6f9f4a','#4b7432'],grain:['#f3d277','#cc9b38','#8e6a24'],ore:['#a9b6bd','#66767e','#435057'],desert:['#f2e1b2','#cfb27c','#9c8255'],gold:['#bf9150','#7a5729','#523a1b']};

// A tiny deterministic generator so decoration is stable for every render.
function seeded(n) { let s=n>>>0||1; return () => (s=Math.imul(s^s>>>15,0x2c1b3c6d)+0x6d2b79f5>>>0)/4294967296; }
const hash = t => { let h=Math.imul(t.q*73856093^t.r*19349663,0x9E3779B1); h^=h>>>15; return h>>>0; };
// Inside the tile, clear of the number token and the label strip.
const open = (x,y,margin=5) => Math.abs(x)<=TILE-margin-Math.abs(y)/Math.sqrt(3) && Math.abs(y)<=TILE*.866-margin && (Math.abs(x)>24||y<-20);

// ---- Terrain artwork, drawn in tile-local coordinates (flat-top, radius 46).
const shadow = (x,y,rx,ry=rx*.32) => `<ellipse cx="${f(x+rx*.25)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="#0c2316" opacity=".3"/>`;
const conifer = (x,y,s,dark,light) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">${shadow(1,0,8)}<rect x="-1.3" y="-5" width="2.6" height="5.4" fill="#5b3a1f"/><path d="M0-26 6.5-17H3.6L8.6-10.5H5.2L10.5-4H-10.5L-5.2-10.5H-8.6L-3.6-17H-6.5Z" fill="${dark}"/><path d="M0-26-6.5-17H-3.6L-8.6-10.5H-5.2L-10.5-4H-1L0-24Z" fill="${light}"/><path d="M0-26 2-23" stroke="#cfe8c4" stroke-width=".8" opacity=".5"/></g>`;
const bush = (x,y,s) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">${shadow(0,1,8)}<circle cx="-4" cy="-4" r="5" fill="#2f6b42"/><circle cx="4" cy="-4" r="5" fill="#245a37"/><circle cx="0" cy="-8" r="5.5" fill="#3a7c4d"/><circle cx="-2" cy="-10" r="2.2" fill="#6fae74" opacity=".55"/></g>`;
const logEnd = (x,y,r=3.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e2bb84" stroke="#6b4422" stroke-width="1"/><circle cx="${x}" cy="${y}" r="${f(r*.5)}" fill="none" stroke="#b98b55" stroke-width=".6"/>`;
const logPile = (x,y) => `<g transform="translate(${x} ${y})">${shadow(1,4,11)}<path d="M-9-3H8V4H-9Z" fill="#7b5129"/>${logEnd(-6,0)}${logEnd(1,0)}${logEnd(-2.5,-5.6)}${logEnd(8,0)}</g>`;
function forest(rand) {
  const trees=[];
  for(let y=-34;y<=38;y+=8.5)for(let x=-46;x<=46;x+=10.5){
    const px=x+(rand()-.5)*6+(Math.round((y+34)/8.5)%2?5:0),py=y+(rand()-.5)*4;
    if(open(px,py-6,3))trees.push([px,py,.62+rand()*.38,rand()]);
  }
  return trees.sort((a,b)=>a[1]-b[1]).map(([x,y,s,v])=>v<.16?bush(x,y,s*.9):conifer(x,y,s,v<.55?'#1d4b30':'#26573a',v<.55?'#3f8653':'#4d9760')).join('')+logPile(-31,27);
}
const brickBlock = (x,y,w=7,h=3.2) => `<g transform="translate(${f(x)} ${f(y)})"><path d="M0 0H${w}L${w+2}-1.6H2Z" fill="#e08b62"/><rect y="0" width="${w}" height="${h}" fill="#b3523a"/><path d="M${w} 0L${w+2}-1.6V${h-1.6}L${w} ${h}Z" fill="#7d3524"/></g>`;
const brickStack = (x,y,s=1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">${shadow(2,3.6,12)}${brickBlock(-8,0)}${brickBlock(0,0)}${brickBlock(-4,-3.3)}${brickBlock(4,-3.3)}${brickBlock(0,-6.6)}</g>`;
const kiln = (x,y) => `<g transform="translate(${x} ${y})">${shadow(1,1,13)}<rect x="3" y="-21" width="4" height="11" fill="#8a3f2a"/><rect x="3" y="-21" width="1.6" height="11" fill="#b55a3e"/><path d="M-11 0Q-11-15 0-15Q11-15 11 0Z" fill="#a84c33"/><path d="M-11 0Q-11-15 0-15V0Z" fill="#c76649"/><path d="M-9.5-5H9.5M-7.5-10H7.5M-4-5V0M4-5V0M0-10V-5" stroke="#7a3322" stroke-width=".6" opacity=".7"/><path d="M-4 0V-4.5Q0-8 4-4.5V0Z" fill="#2e1710"/><path d="M-2.4-1.2Q0-3.6 2.4-1.2" stroke="#f0a246" stroke-width="1.2" fill="none" opacity=".85"/><g fill="#ece6dc" opacity=".55"><circle cx="6" cy="-25" r="2.6"/><circle cx="8.5" cy="-30" r="3.2"/><circle cx="7" cy="-36" r="3.6"/></g></g>`;
const ART_BRICK = `<path d="M-50-10Q-36-38-20-22Q-6-42 12-24Q28-40 50-18V-50H-50Z" fill="#b65a3b"/><path d="M-50-10Q-36-38-20-22L-26-14Q-36-26-50-4Z" fill="#cf7550"/><path d="M-6-42Q4-34 12-24L4-18Q-2-30-6-42Z" fill="#cf7550" opacity=".7"/>
<g fill="none" stroke="#8c4129" stroke-width="1" opacity=".55"><path d="M-46-12Q-34-28-22-18M-14-26Q-2-38 10-24M20-26Q32-34 46-20"/><path d="M-44 26Q-30 18-18 26M18 28Q32 18 46 26" stroke="#7d3a26"/></g>
<ellipse cx="30" cy="27" rx="10" ry="4" fill="#7a3624"/><ellipse cx="30" cy="26" rx="8" ry="2.6" fill="#94452d"/><path d="M22 26Q30 30 38 26" stroke="#e39871" stroke-width=".8" fill="none" opacity=".7"/>`;
const sheep = (x,y,s=1,flip=1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s*flip)} ${f(s)})"><ellipse cx="1" cy="7.6" rx="8.5" ry="1.9" fill="#21401a" opacity=".3"/><path d="M-3.4 3.5v4.4M-.8 4v4M2.4 4v4M4.6 3.5v4.4" stroke="#33332e" stroke-width="1.3" stroke-linecap="round"/><g fill="#e5dfcf"><circle cx="-4" cy="1" r="3.8"/><circle cx="0" cy="2.4" r="3.8"/><circle cx="4" cy="1" r="3.8"/></g><g fill="#fbf8ef"><circle cx="-3.6" cy="-1" r="3.6"/><circle cx="0" cy="-2.4" r="3.9"/><circle cx="3.6" cy="-1" r="3.6"/></g><ellipse cx="7.4" cy="-1.2" rx="2.7" ry="2.1" fill="#34342f"/><ellipse cx="6.6" cy="-3" rx="1.3" ry=".7" fill="#34342f" transform="rotate(-30 6.6 -3)"/><circle cx="8.3" cy="-1.7" r=".45" fill="#eee"/></g>`;
function pasture(rand) {
  let flowers='';
  for(let i=0;i<34;i++){const x=(rand()-.5)*90,y=(rand()-.5)*76;if(open(x,y,4))flowers+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(.7+rand()*.6)}" fill="${rand()<.6?'#fffbe9':'#f6d860'}" opacity=".9"/>`;}
  let tufts='';
  for(let i=0;i<22;i++){const x=(rand()-.5)*88,y=(rand()-.5)*74;if(open(x,y,4))tufts+=`<path d="M${f(x-2.2)} ${f(y)}l1-3M${f(x)} ${f(y)}v-3.8M${f(x+2.2)} ${f(y)}l-1-3" stroke="#4f8434" stroke-width=".9" stroke-linecap="round" fill="none"/>`;}
  const fence=[-46,-39,-32,-25].map((x,i)=>`<path d="M${x} ${-4+i*-1.2}v-6" stroke="#6e5232" stroke-width="1.6" stroke-linecap="round"/>`).join('');
  return `<path d="M-50-18Q-24-34 4-22T50-30V-50H-50Z" fill="#c4e597" opacity=".55"/><path d="M-50 16Q-20 4 6 14T50 8V50H-50Z" fill="#5f9140" opacity=".35"/>${tufts}${flowers}<path d="M-47-7.5-24-12.2M-47-4.5-24-9.2" stroke="#8c6a42" stroke-width="1.1"/>${fence}${bush(34,-24,.8)}`
    +sheep(-23,-24,1)+sheep(19,-28,.9,-1)+sheep(33,4,1.05,-1)+sheep(-32,14,.95)+sheep(29,24,.85);
}
const stalk = (x,y,s=1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><path d="M0 8Q.6 0 0-7" stroke="#9d7424" stroke-width=".9" fill="none"/>${[-6,-3,0].map(d=>`<ellipse cx="-1.5" cy="${d}" rx="1.25" ry="2.2" transform="rotate(-28 -1.5 ${d})" fill="#c99434"/><ellipse cx="1.5" cy="${d}" rx="1.25" ry="2.2" transform="rotate(28 1.5 ${d})" fill="#e6b84c"/>`).join('')}<ellipse cx="0" cy="-8.8" rx="1.1" ry="2.2" fill="#e6b84c"/></g>`;
const windmill = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})">${shadow(2,1,11)}<path d="M-5 0-3.4-17H3.4L5 0Z" fill="#efe4cc"/><path d="M0-17H3.4L5 0H0Z" fill="#cbbd9d"/><path d="M-4.4-17 0-22 4.4-17Z" fill="#9c3f2e"/><path d="M-1.4 0V-5H1.4V0Z" fill="#5b3a22"/><g transform="translate(0 -18) rotate(18)" stroke="#6b4a2c" stroke-width=".9">${[0,90,180,270].map(a=>`<g transform="rotate(${a})"><path d="M0 0V-15"/><rect x=".6" y="-15" width="3.6" height="10" fill="#f6efdc" stroke-width=".5"/></g>`).join('')}</g><circle cx="0" cy="-18" r="1.4" fill="#4d3420"/></g>`;
const bale = (x,y) => `<g transform="translate(${x} ${y})">${shadow(1,3.4,8)}<rect x="-6" y="-4" width="10" height="8" rx="1" fill="#d9ac4a"/><ellipse cx="4" cy="0" rx="2.6" ry="4" fill="#f0cd72" stroke="#b68a33" stroke-width=".7"/><path d="M4 0m-1.2 0a1.2 1.8 0 1 0 2.4 0a1.2 1.8 0 1 0-2.4 0" fill="none" stroke="#b68a33" stroke-width=".5"/></g>`;
function fields(rand) {
  const bands=Array.from({length:9},(_,i)=>{const x=-80+i*20;return `<path d="M${x} 50 ${x+10} 50 ${x+46}-50H${x+36}Z" fill="${i%2?'#e8c15c':'#d4a442'}"/>`;}).join('');
  const rows=Array.from({length:18},(_,i)=>`<path d="M${-82+i*10} 50 ${-46+i*10}-50" stroke="#b78a32" stroke-width=".7" opacity=".55"/>`).join('');
  const stalks=[];
  for(let y=-36;y<=34;y+=7)for(let x=-46;x<=46;x+=6.5){const px=x+(rand()-.5)*3,py=y+(rand()-.5)*3;if(open(px,py-4,3)&&rand()<.55)stalks.push([px,py,.75+rand()*.3]);}
  return bands+rows+stalks.sort((a,b)=>a[1]-b[1]).map(([x,y,s])=>stalk(x,y,s)).join('')+windmill(22,-17,.72)+bale(-33,24)+bale(-24,30);
}
const mountain = (x,y,w,h,snow=1) => `<g transform="translate(${f(x)} ${f(y)})"><path d="M${-w} 0 0 ${-h} ${w} 0Z" fill="#6c7b83"/><path d="M${-w} 0 0 ${-h} ${f(w*.12)} 0Z" fill="#a4b1b8"/><path d="M0 ${-h} ${f(w*.35)} ${f(-h*.45)} ${f(w*.18)} 0" fill="none" stroke="#56646c" stroke-width=".8"/>${snow?`<path d="M0 ${-h} ${f(w*.36)} ${f(-h*.64)} ${f(w*.2)} ${f(-h*.6)} ${f(w*.06)} ${f(-h*.67)} ${f(-w*.12)} ${f(-h*.58)} ${f(-w*.36)} ${f(-h*.64)}Z" fill="#f7f9f6"/><path d="M0 ${-h} ${f(w*.36)} ${f(-h*.64)} ${f(w*.2)} ${f(-h*.6)} ${f(w*.06)} ${f(-h*.67)} 0 ${f(-h*.64)}Z" fill="#cfd8dc"/>`:''}</g>`;
const rock = (x,y,s=1,light='#8e9ca4',dark='#56646c') => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">${shadow(1,2.6,7)}<path d="M-6 3-4.5-2.5 0-5 5-2.5 6.5 3Z" fill="${dark}"/><path d="M-6 3-4.5-2.5 0-5 .8 0-2 3Z" fill="${light}"/></g>`;
const mine = (x,y) => `<g transform="translate(${x} ${y})"><path d="M-10 4V-4Q-10-12 0-12Q10-12 10-4V4Z" fill="#59666d"/><path d="M-6.5 4V-3Q-6.5-8 0-8Q6.5-8 6.5-3V4Z" fill="#15191b"/><path d="M-7.5 4V-4.5M7.5 4V-4.5M-8.5-5H8.5" stroke="#7b5631" stroke-width="2.2" stroke-linecap="round"/><path d="M-4 4 -7 12M4 4 7 12M-5 6.5H5M-6 9.5H6" stroke="#5e4a37" stroke-width=".9"/></g>`;
const cart = (x,y) => `<g transform="translate(${x} ${y})">${shadow(0,3.6,9)}<g fill="#3c4a52"><circle cx="-4" cy="2.6" r="1.8"/><circle cx="4" cy="2.6" r="1.8"/></g><path d="M-7-5H7L5.4 2H-5.4Z" fill="#6b4a2c"/><path d="M-7-5H7" stroke="#3e2a18" stroke-width="1"/><path d="M-5-5-2-9 1-6.5 4-9.4 6-5Z" fill="#7e98a8"/><path d="M-2-9 1-6.5-1-5H-4Z" fill="#b8cfdb"/><path d="M3.6-8.4l.6-1.4.6 1.4-.6.4Z" fill="#fff"/></g>`;
const ART_ORE = `<path d="M-50-4-38-22-28-16-14-38 0-26 14-44 30-22 38-28 50-10V-50H-50Z" fill="#8795a0" opacity=".9"/>`
  +mountain(-27,-4,18,32)+mountain(27,-2,19,34)+mountain(1,-16,16,30)+mountain(-42,14,11,18,0)+mountain(42,16,11,19,0)
  +rock(-14,30,.9)+rock(38,30,.8)+mine(-30,24)+cart(27,27);
const dune = (x,y,w,h) => `<g transform="translate(${f(x)} ${f(y)})"><path d="M${-w} 0Q${f(-w*.4)} ${-h} ${f(w*.1)} ${-h}Q${f(w*.55)} ${f(-h*.8)} ${w} 0Z" fill="#d9bd85"/><path d="M${-w} 0Q${f(-w*.4)} ${-h} ${f(w*.1)} ${-h}Q${f(-w*.05)} ${f(-h*.45)} ${f(w*.2)} 0Z" fill="#f4e3b6"/></g>`;
const cactus = (x,y,s=1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">${shadow(1,0,7)}<path d="M-2-18Q0-20 2-18V0H-2Z" fill="#5f8340"/><path d="M-2-18Q-1-19.6 0-19.6V0H-2Z" fill="#83a95c"/><path d="M-2-7H-6.5V-12" fill="none" stroke="#6f9450" stroke-width="3" stroke-linecap="round"/><path d="M2-10H6.5V-15" fill="none" stroke="#5f8340" stroke-width="3" stroke-linecap="round"/><path d="M-.6-16v13" stroke="#466430" stroke-width=".5" opacity=".7"/></g>`;
const ART_DESERT = dune(-18,-18,30,16)+dune(24,-24,26,12)+dune(-30,14,22,10)+dune(30,22,24,11)
  +`<g fill="none" stroke="#c4a46b" stroke-width=".9" stroke-linecap="round" opacity=".8"><path d="M-44-6Q-34-11-24-7M16-12Q26-16 36-11M-42 26Q-34 22-26 25M14 32Q24 27 34 31M-12-30Q-4-34 4-31"/></g>`
  +cactus(-29,-4,1)+cactus(34,4,.8)+rock(-38,25,.6,'#cdb487','#9c8256')+rock(40,-22,.55,'#cdb487','#9c8256')
  +`<g transform="translate(26 30)"><path d="M-3 0Q-3-3 0-3Q3-3 3 0L2 2H-2Z" fill="#f4efe2"/><circle cx="-1" cy="-.8" r=".7" fill="#7a6a4c"/><circle cx="1" cy="-.8" r=".7" fill="#7a6a4c"/></g>`;
const nugget = (x,y,s=1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><ellipse cx=".6" cy="2.4" rx="3.6" ry="1" fill="#2a1a08" opacity=".35"/><path d="M-3.2 1-1.4-2.2 1.8-2.6 3.4.6.4 2.6Z" fill="#e9b73a" stroke="#8e6418" stroke-width=".5"/><path d="M-1.4-2.2 1.8-2.6 1.2-.2-1.2.2Z" fill="#fff1b0"/></g>`;
const sparkle = (x,y,s=1) => `<path transform="translate(${f(x)} ${f(y)}) scale(${f(s)})" d="M0-4.5.8-.8 4.5 0 .8.8 0 4.5-.8.8-4.5 0-.8-.8Z" fill="#fff8d6"/>`;
const crag = (x,y,w,h) => `<g transform="translate(${x} ${y})"><path d="M${-w} 0 ${f(-w*.3)} ${-h} ${f(w*.25)} ${f(-h*.8)} ${w} 0Z" fill="#6e4f2b"/><path d="M${-w} 0 ${f(-w*.3)} ${-h} ${f(-w*.05)} 0Z" fill="#a37744"/></g>`;
const ART_GOLD = crag(-28,-8,20,30)+crag(4,-22,18,22)+crag(30,-6,18,28)
  +`<path d="M-52 18Q-34 2-20 16T10 26T52 12" fill="none" stroke="#2f6f86" stroke-width="9" stroke-linecap="round"/><path d="M-52 18Q-34 2-20 16T10 26T52 12" fill="none" stroke="#5fb1c8" stroke-width="5.6" stroke-linecap="round"/><path d="M-46 14Q-36 6-26 12M2 23Q10 26 18 23M32 17Q40 14 48 12" fill="none" stroke="#e3f6fa" stroke-width="1" stroke-linecap="round" opacity=".85"/>`
  +[[-34,30,1.2],[30,32,1.1],[-40,4,.9],[40,4,.9],[-22,-22,.8],[22,-30,.85],[-12,32,.8]].map(([x,y,s])=>nugget(x,y,s)).join('')
  +[[-30,-16,1],[34,-16,.8],[-40,22,.7],[22,34,.7],[0,-36,.7],[44,24,.6]].map(([x,y,s])=>sparkle(x,y,s)).join('');
const ART = {
  lumber: forest(seeded(11)), brick: ART_BRICK+brickStack(-30,-4,1)+brickStack(-34,22,.85)+brickStack(36,4,.9)+kiln(18,-22),
  wool: pasture(seeded(23)), grain: fields(seeded(37)), ore: ART_ORE, desert: ART_DESERT, gold: ART_GOLD,
};
// Small harbor emblems, drawn in a 20 x 20 box around the origin.
const ICONS = {
  lumber: conifer(-3.5,7,.5,'#1d4b30','#3f8653')+conifer(3.5,8,.58,'#26573a','#4d9760'),
  brick: brickStack(-.5,5,.82),
  wool: sheep(-.8,1.5,.9),
  grain: stalk(-3.4,2.5,.85)+stalk(0,1,.95)+stalk(3.4,2.5,.85),
  ore: rock(-3,4,.75,'#9fb6c4','#5d7280')+rock(3.2,4.4,.65,'#9fb6c4','#5d7280')+rock(0,0,.85,'#b7cbd6','#6f8796')+sparkle(3.6,-4.5,.6),
};
function defs() {
  const grads=Object.entries(GROUND).map(([k,[a,b]])=>`<linearGradient id="fs-g-${k}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`).join('');
  const speck=seeded(5);let grain='';
  for(let i=0;i<70;i++)grain+=`<circle cx="${f(speck()*60)}" cy="${f(speck()*60)}" r="${f(.25+speck()*.45)}" fill="${speck()<.5?'#fff':'#000'}" opacity="${f(.05+speck()*.08)}"/>`;
  const wave=seeded(9);let waves='';
  for(let i=0;i<9;i++){const x=f(wave()*150),y=f(wave()*110),w=6+wave()*7;waves+=`<path d="M${x} ${y}q${f(w/2)}-${f(w/3)} ${f(w)} 0t${f(w)} 0" fill="none" stroke="#cdeeed" stroke-width="${f(.8+wave()*.6)}" stroke-linecap="round" opacity="${f(.12+wave()*.16)}"/>`;}
  return `<defs>${grads}
<radialGradient id="fs-ocean" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#2f7880"/><stop offset=".7" stop-color="#1e5359"/><stop offset="1" stop-color="#143c42"/></radialGradient>
<linearGradient id="fs-sea-tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a8890"/><stop offset="1" stop-color="#2a6b73"/></linearGradient>
<pattern id="fs-waves" width="150" height="110" patternUnits="userSpaceOnUse">${waves}</pattern>
<pattern id="fs-grain" width="60" height="60" patternUnits="userSpaceOnUse">${grain}</pattern>
<linearGradient id="fs-bevel" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></linearGradient>
<radialGradient id="fs-token" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fffaf0"/><stop offset=".75" stop-color="#f1e3c0"/><stop offset="1" stop-color="#ddc796"/></radialGradient>
<radialGradient id="fs-pawn" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#8c918d"/><stop offset="1" stop-color="#2a2e2c"/></radialGradient>
<linearGradient id="fs-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6a3c"/><stop offset="1" stop-color="#5e3d20"/></linearGradient>
<clipPath id="fs-hex"><polygon points="${hexPoints(TILE)}"/></clipPath>
${Object.entries(ART).map(([k,body])=>`<symbol id="fs-art-${k}" viewBox="-50 -50 100 100" width="100" height="100" x="-50" y="-50" overflow="visible">${body}</symbol>`).join('')}
</defs>`;
}
const robberArt='<ellipse cx="0" cy="13" rx="9" ry="2.6" fill="#0b1c1d" opacity=".35"/><path d="M-5.5-3Q-9 4-7 8L-9 12.5Q0 16 9 12.5L7 8Q9 4 5.5-3Z" fill="url(#fs-pawn)" stroke="#f7ecd0" stroke-width=".9"/><circle cx="0" cy="-8" r="6" fill="url(#fs-pawn)" stroke="#f7ecd0" stroke-width=".9"/><ellipse cx="-2" cy="-10" rx="2" ry="1.3" fill="#fff" opacity=".35"/>';
const pirateArt='<ellipse cx="0" cy="15" rx="21" ry="3.2" fill="#081d20" opacity=".4"/><path d="M-23 12q6-3 12 0t12 0t12 0t10 0" fill="none" stroke="#d7f0ee" stroke-width="1" opacity=".5"/><path d="M-20 4H20L14 14H-13Z" fill="url(#fs-wood)" stroke="#2a1a0c" stroke-width="1"/><path d="M-18 7H18" stroke="#c9a46a" stroke-width=".8" opacity=".6"/><g fill="#e9dcb8"><circle cx="-10" cy="9.5" r=".9"/><circle cx="-4" cy="9.5" r=".9"/><circle cx="2" cy="9.5" r=".9"/><circle cx="8" cy="9.5" r=".9"/></g><path d="M0-21V4" stroke="#2a1a0c" stroke-width="1.6"/><path d="M1-19Q13-10 1 1Z" fill="#1d2224" stroke="#0e1112" stroke-width=".8"/><path d="M-1-16Q-15-7-1 2Z" fill="#262c2e" stroke="#0e1112" stroke-width=".8"/><circle cx="5.8" cy="-9" r="2.2" fill="#ede3c8"/><path d="M4.6-7.2h2.4" stroke="#ede3c8" stroke-width=".9"/><path d="M0-21h8.5l-2.6 3H0Z" fill="#b8352b"/>';
function renderPieces(board,scenario) {
  const pieces=board.pieces||startingPieces(board.tiles,scenario);
  const t=board.tiles.find(t=>t.q===pieces.robber.q&&t.r===pieces.robber.r),r=center(pieces.robber,SIZE);
  const robber=`<g data-piece="robber" role="img" aria-label="Robber starts on ${LABELS[t.resource]}${t.number?' '+t.number:''}" transform="translate(${f(r.x+(t.number?24:0))} ${f(r.y+(t.number?-20:-2))})"><title>Robber starts here${t.number?' (leave the '+t.number+' token beneath it)':''}</title>${robberArt}${t.number?'':'<text y="25" text-anchor="middle" font-size="6" font-family="system-ui,sans-serif" font-weight="700" letter-spacing=".8" fill="#4a3a1c">ROBBER</text>'}</g>`;
  let pirate='';
  if(pieces.pirate) {
    const p=center(pieces.pirate,SIZE),frame=pieces.pirate.location==='frame';
    pirate=`<g data-piece="pirate" data-location="${pieces.pirate.location}" role="img" aria-label="Pirate starts ${frame?'on this frame position':'on this sea hex'}" transform="translate(${f(p.x)} ${f(p.y)})"><title>Pirate starts ${frame?'on the sea frame; do not add a hex tile':'here'}</title>${frame?'<circle r="28" fill="#0f3236" fill-opacity=".35" stroke="#9cc4bf" stroke-dasharray="2 3" opacity=".75"/>':''}${pirateArt}<text y="27" text-anchor="middle" font-size="6" font-family="system-ui,sans-serif" font-weight="700" letter-spacing=".8" fill="#f0e5c7">PIRATE</text>${frame?'<text y="36" text-anchor="middle" font-size="5.5" font-family="system-ui,sans-serif" letter-spacing=".6" fill="#b8d0c8">ON FRAME</text>':''}</g>`;
  }
  return robber+pirate;
}
function token(n) {
  const red=isRed(n),ink=red?'#b3291f':'#263632',p=pips(n);
  return `<g class="token"><circle cx=".8" cy="2.8" r="17.5" fill="#0b2427" opacity=".38"/><circle r="17.5" fill="url(#fs-token)" stroke="#a8915f" stroke-width="1"/><circle r="15" fill="none" stroke="#c9b282" stroke-width=".6" opacity=".7"/><text y="5.5" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="${n>9?17:19}" font-weight="bold" fill="${ink}">${n}</text>${Array.from({length:p},(_,i)=>`<circle cx="${f((i-(p-1)/2)*3.6)}" cy="11" r="1.25" fill="${ink}"/>`).join('')}</g>`;
}
function landTile(t) {
  const {x,y}=center(t,SIZE),flip=hash(t)%2?-1:1,foreign=t.group==='foreign';
  const label=`${LABELS[t.resource]}${t.number?`, ${t.number}, ${pips(t.number)} pips`:''}${foreign?', foreign area':''}`;
  // The darker copy below the face reads as the tile's cardboard thickness.
  return `<g class="hex" data-resource="${t.resource}" tabindex="0" role="img" aria-label="${escape(label)}" transform="translate(${f(x)} ${f(y)})"><title>${escape(label)}</title>`
    +`<polygon points="${hexPoints(TILE,0,3.2)}" fill="${GROUND[t.resource][2]}"/>`
    +`<g clip-path="url(#fs-hex)"><polygon points="${hexPoints(TILE)}" fill="url(#fs-g-${t.resource})"/><use href="#fs-art-${t.resource}" transform="scale(${flip} 1)"/><polygon points="${hexPoints(TILE)}" fill="url(#fs-grain)"/><polygon points="${hexPoints(TILE)}" fill="url(#fs-bevel)"/></g>`
    +`<polygon class="tile-outline" points="${hexPoints(TILE-.6)}" fill="none" stroke="${foreign?'#f6d77c':'#fff6dc'}" stroke-opacity="${foreign?1:.38}" stroke-width="${foreign?2.4:1.1}"${foreign?' stroke-dasharray="7 3"':''}/>`
    +(t.number?token(t.number):'')
    +`<text y="38.5" text-anchor="middle" font-family="system-ui,sans-serif" font-size="6" font-weight="700" letter-spacing="1.4" fill="#fffaf0" stroke="#1d2f2a" stroke-width="2.2" stroke-opacity=".5" paint-order="stroke">${LABELS[t.resource].toUpperCase()}</text></g>`;
}
function seaTile(t) {
  const {x,y}=center(t,SIZE);
  return `<g transform="translate(${f(x)} ${f(y)})"><polygon points="${hexPoints(SIZE-1)}" fill="url(#fs-sea-tile)" fill-opacity=".42" stroke="#9fd2d0" stroke-opacity=".2"/></g>`;
}
// Surf along every coastline edge, just beyond the beach.
function surf(tiles) {
  return coastEdges(tiles).map(e=>{
    const c=center(e,SIZE),a={x:e.a.x*SIZE,y:e.a.y*SIZE},b={x:e.b.x*SIZE,y:e.b.y*SIZE},m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    const len=Math.hypot(m.x-c.x,m.y-c.y),n={x:(m.x-c.x)/len,y:(m.y-c.y)/len},tx=(b.x-a.x)/SIZE,ty=(b.y-a.y)/SIZE;
    const line=(d,ext)=>`M${f(a.x+n.x*d-tx*ext)} ${f(a.y+n.y*d-ty*ext)}L${f(b.x+n.x*d+tx*ext)} ${f(b.y+n.y*d+ty*ext)}`;
    return `<path d="${line(6.2,3.2)}" stroke="#f4fbf7" stroke-width="1.6" stroke-linecap="round" opacity=".6"/><path d="${line(10.8,4.6)}" stroke="#d6f0ec" stroke-width="1" stroke-linecap="round" opacity=".22"/>`;
  }).join('');
}
function harbor(h) {
  const e=edge(h,h.side),c=center(h,SIZE),a={x:e.a.x*SIZE,y:e.a.y*SIZE},b={x:e.b.x*SIZE,y:e.b.y*SIZE},m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  const len=Math.hypot(m.x-c.x,m.y-c.y),n={x:(m.x-c.x)/len,y:(m.y-c.y)/len};
  const any=h.resource==='any',ring=any?'#6c7f79':COLORS[h.resource],p={x:m.x+n.x*24,y:m.y+n.y*24};
  // A plank pier from each of the harbor's two coastal corners.
  const pier=v=>{const s={x:v.x+(p.x-v.x)*.08,y:v.y+(p.y-v.y)*.08},t={x:v.x+(p.x-v.x)*.7,y:v.y+(p.y-v.y)*.7},d=`M${f(s.x)} ${f(s.y)}L${f(t.x)} ${f(t.y)}`;
    return `<path d="${d}" stroke="#0b2427" stroke-opacity=".35" stroke-width="7.4" stroke-linecap="round" transform="translate(.8 2.2)"/><path d="${d}" stroke="#4a2f17" stroke-width="7" stroke-linecap="round"/><path d="${d}" stroke="#b07d45" stroke-width="5.2"/><path d="${d}" stroke="#7a5229" stroke-width="5.2" stroke-dasharray=".7 2.3"/><circle cx="${f(t.x)}" cy="${f(t.y)}" r="2" fill="#3b2412"/>`;};
  return `<g class="harbor" data-resource="${h.resource}" role="img" aria-label="${LABELS[h.resource]} ${any?'3':'2'} to 1 harbor"><title>${LABELS[h.resource]} ${any?'3':'2'}:1 harbor</title>${pier(a)}${pier(b)}`
    +`<g transform="translate(${f(p.x)} ${f(p.y)})"><ellipse cx="0" cy="3.2" rx="17.5" ry="16" fill="#0b2427" opacity=".35"/><circle r="17" fill="none" stroke="#e7f6f2" stroke-width=".9" opacity=".35"/>`
    +`<circle r="14.8" fill="#f3e8cc" stroke="#5b3c1e" stroke-width="1"/><circle r="13.3" fill="none" stroke="#c49a5c" stroke-width="2.4"/><circle r="13.3" fill="none" stroke="#7f5a31" stroke-width="2.4" stroke-dasharray="1.2 1.6"/><circle r="11.5" fill="url(#fs-token)" stroke="${ring}" stroke-width="1.8"/>${any?'':`<circle r="10.6" fill="${ring}" opacity=".2"/>`}`
    +(any?`<text y="2.6" text-anchor="middle" fill="#22332f" font-family="Georgia,'Times New Roman',serif" font-weight="bold" font-size="9.6">3:1</text><text y="8.6" text-anchor="middle" fill="#55665f" font-family="system-ui,sans-serif" font-weight="700" font-size="3.6" letter-spacing=".5">ANY</text>`
      :`<g transform="translate(0 -3.4) scale(.82)">${ICONS[h.resource]}</g><path d="M-6.2 5.2H6.2" stroke="${ring}" stroke-width=".6" opacity=".8"/><text y="10" text-anchor="middle" fill="#22332f" font-family="Georgia,'Times New Roman',serif" font-weight="bold" font-size="5.2">2:1</text>`)
    +`</g></g>`;
}
export function renderBoard(board,scenario) {
  const points=board.tiles.map(t=>center(t,SIZE));
  const minX=Math.min(...points.map(p=>p.x))-90,maxX=Math.max(...points.map(p=>p.x))+90,minY=Math.min(...points.map(p=>p.y))-92,maxY=Math.max(...points.map(p=>p.y))+92;
  const land=board.tiles.filter(t=>t.resource!=='sea').sort((a,b)=>center(a).y-center(b).y||a.q-b.q);
  // Shallows and beach sit beneath the land so each island gets a coastline;
  // the sand shows through as seams between neighbouring tiles.
  const shore=(r,fill,opacity)=>land.map(t=>{const c=center(t,SIZE);return `<polygon points="${hexPoints(r,c.x,c.y)}" fill="${fill}" fill-opacity="${opacity}"/>`;}).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(minX)} ${f(minY)} ${f(maxX-minX)} ${f(maxY-minY)}" role="group" aria-labelledby="board-svg-title board-svg-desc"><title id="board-svg-title">${escape(scenario.title)} map, seed ${escape(board.seed)}</title><desc id="board-svg-desc">${land.length} land tiles. Resource names and token pips are printed on each tile. Gold outlines mark foreign areas. Piers connect each harbor to its two coastal intersections. A pawn marks the robber's starting tile. A ship marks the pirate's starting position when in use; dashed circles indicate the sea frame.</desc>${defs()}`
    // The page hides the ocean fill and lets the waves run past the viewBox
    // so the map blends into its panel; exported SVGs keep both, clipped.
    +`<rect class="ocean" x="${f(minX)}" y="${f(minY)}" width="${f(maxX-minX)}" height="${f(maxY-minY)}" fill="url(#fs-ocean)"/><rect x="${f(minX-2000)}" y="${f(minY-2000)}" width="${f(maxX-minX+4000)}" height="${f(maxY-minY+4000)}" fill="url(#fs-waves)"/>`
    +board.tiles.filter(t=>t.resource==='sea').map(seaTile).join('')
    +`<g>${shore(SIZE+14,'#79c2bd',.22)}${shore(SIZE+8,'#79c2bd',.25)}</g><g fill="none">${surf(board.tiles)}</g><g>${shore(SIZE+5,'#e9d7a4',1)}${shore(SIZE+2.5,'#d8c08a',1)}</g>`
    +land.map(landTile).join('')
    +board.harbors.map(harbor).join('')
    +renderPieces(board,scenario)+'</svg>';
}
