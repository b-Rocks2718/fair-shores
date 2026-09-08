// Independently transcribed setup facts from the official 2020/2021 rulebooks
// and 2023 extensions. Columns run left to right; entries run top to bottom.
// Lowercase entries belong to the foreign-area pool; S is fixed sea.
export const RESOURCES = ['lumber', 'brick', 'wool', 'grain', 'ore'];
const codes = { L: 'lumber', B: 'brick', W: 'wool', G: 'grain', O: 'ore', A: 'gold', D: 'desert', S: 'sea' };
export const SOURCES = {
  base: 'https://www.catan.com/sites/default/files/2021-06/catan_base_rules_2020_200707.pdf',
  base6: 'https://www.catan.com/sites/default/files/2024-03/Catan%20Game%205-6%20Rules%202022%20240313.pdf',
  sea: 'https://www.catan.com/sites/default/files/2021-06/catan-seafarers_2021_rule_book_201201.pdf',
  sea6: 'https://www.catan.com/sites/default/files/2024-03/Catan%20Seafarers%205-6%202023%20Rules%20220313.pdf',
};
function scenario(id, family, players, columns, harbors, extra = {}) {
  const starts = family === 'base' ? (players === 6 ? [3,2,1,0,1,2,3] : [2,1,0,1,2]) : [2,1,0,1,0,1,2];
  const tiles = columns.flatMap((column, q) => column.split(' ').map((entry, row) => {
    const c = entry[0], resource = codes[c.toUpperCase()];
    return { q, r: (starts[q] + 2 * row - q) / 2, resource, number: Number(entry.slice(1)) || null,
      group: c === 'D' ? 'barrier' : c === 'S' ? 'sea' : c === c.toLowerCase() ? 'foreign' : 'main' };
  }));
  const base = family === 'base';
  return { id, family, players, tiles, harbors: harbors.map(([q,row,side]) => ({ q, r: (starts[q] + 2*row - q)/2, side })),
    harborTypes: [...RESOURCES, ...Array(players === 6 ? 5 : harbors.length - 5).fill('any'), ...(players === 6 ? ['wool'] : [])],
    title: base ? 'Base Catan' : family === 'shores' ? 'Heading for New Shores' : family === 'islands' ? (players === 6 ? 'The Six Islands' : 'The Four Islands') : 'Through the Desert',
    source: SOURCES[base ? players === 6 ? 'base6' : 'base' : players === 6 ? 'sea6' : 'sea'],
    points: base ? 10 : family === 'islands' ? 13 : 14,
    ...extra };
}
const base4 = ['L9 W2 O10','B10 W4 B6 G12','O8 L3 D L11 G9','W5 G4 O3 L8','W11 G6 B5'];
const base6 = ['D W6 B10','B11 O9 G2 B6','W4 G10 L5 O11 L3','G8 W3 O6 G4 W5 D','L11 B4 W2 O10 L12','G5 L9 G3 L8','O8 W12 B9'];
export const SCENARIOS = [
  scenario('base-4','base',4,base4,[[0,0,4],[0,1,3],[0,2,2],[1,3,1],[2,0,4],[3,0,5],[3,3,1],[4,1,5],[4,2,0]], { page: 3 }),
  scenario('base-6','base',6,base6,[[0,2,2],[0,1,3],[0,0,4],[3,0,4],[4,0,5],[6,0,4],[6,1,5],[6,2,0],[5,3,1],[4,4,1],[2,4,1]], { page: 5 }),
  scenario('shores-3','shores',3,[
    'G6 L5 S b10','G11 O3 B11 S o8','B8 W10 W9 L8 S s','W2 O5 L10 S a4','S G4 W6 S g3 s','s s S w4 o9','b12 a5 s s',
  ],[[0,0,4],[0,1,3],[0,1,1],[2,0,3],[2,3,0],[2,0,5],[4,1,4],[4,2,1]], {page:9}),
  scenario('shores-4','shores',4,[
    'G8 L2 O10 S g6','O3 W4 B9 W8 S b3','B6 L10 D G11 L5 S s','G12 B11 G3 W9 S a10','S W5 L6 O4 S l9 s','s s S S b5 o2','o8 w11 s a4 s',
  ],[[0,0,3],[0,1,2],[1,0,4],[1,3,2],[2,4,1],[3,0,4],[3,3,0],[4,1,5],[4,2,0]], {page:10}),
  scenario('shores-6','shores',6,[
    'a5 S D W6 B10 S a10','l2 S B11 O9 G2 B6 S s','b4 S W4 G10 L5 O11 L3 S g3','S G8 W3 O6 G4 W5 D S','w8 S L11 B4 W2 O10 L12 S b12','o11 S G5 L9 G3 L8 S s','a9 S O8 W12 B9 S o6',
  ],[[0,3,3],[0,4,2],[1,2,3],[1,5,1],[3,1,3],[3,6,2],[4,2,4],[4,6,1],[5,2,5],[5,5,0],[6,3,0]], {page:7, recommendedMainVariable:true}),
  scenario('islands-3','islands',3,[
    'W12 S S S','L5 W9 S O2 G5','G11 O8 L3 S B10 B6','S S S S S','W6 O10 S L8 B11 S','O4 L9 S G9 B5','S S G4 W3',
  ],[[2,0,3],[2,0,0],[1,1,2],[1,3,5],[2,5,2],[4,0,5],[5,1,2],[4,4,3],[5,4,0]],{page:12}),
  scenario('islands-4','islands',4,[
    'W10 G11 S G4','G6 O4 B2 S O8','B4 W9 S S L9 W11','S S L6 S S','G5 L3 S B5 O10 S','B10 S O3 G12 W5','W8 S L9 L11',
  ],[[0,0,4],[2,0,3],[1,1,0],[2,5,2],[2,5,5],[3,2,5],[5,0,4],[5,4,2],[4,0,2]],{page:13}),
  scenario('islands-6','islands',6,[
    'W5 O6 S W2 S B5 G2','L9 G12 S G5 O3 S B8 W9','S B4 S S W8 L10 S L5 G6','S S S S S S S S','B11 G9 S W3 L4 S S L4 S','L8 O10 S O11 B10 S G3 B10','W12 O4 S L6 S O9 W6',
  ],[[1,0,4],[0,1,0],[1,3,3],[1,7,1],[0,5,3],[4,1,3],[5,1,2],[6,1,5],[6,3,0],[5,6,3],[6,6,0]],{page:9}),
  scenario('desert-3','desert',3,[
    'W8 W4 S o5','O10 G9 L8 S g9','L11 B6 G2 B9 S s','S O3 L10 S a5','g6 D B5 W6 S s','l3 D L4 S w11','a4 D S o8',
  ],[[0,0,2],[0,1,1],[0,0,4],[2,0,3],[2,3,2],[2,3,0],[2,1,5],[5,2,0]],{page:18,noRedGold:true}),
  scenario('desert-4','desert',4,[
    'S L9 S o6 g12','W3 G11 O4 S S s','B12 B6 W5 L8 S a5 w3','S L10 B11 W9 S s','g8 D O8 G10 L4 S b2','o11 D B3 W6 S g4','a10 D L5 S o9',
  ],[[0,1,3],[0,1,1],[1,0,4],[1,0,2],[2,3,2],[3,1,4],[4,4,2],[4,4,0],[6,2,1]],{page:19,noRedGold:true}),
  scenario('desert-6','desert',6,[
    'W6 S w8 g2 s a4 S g9','B9 O11 S S S S S w11 l3','W12 G3 B12 O6 B11 O3 G9 S s o8','O4 L5 G10 B5 W10 L4 B8 S S','S S S G2 L8 W9 L10 S S a10','l5 w2 D D D D D S S','a4 o6 b11 S l12 g5 o3 b6',
  ],[[0,0,3],[1,0,4],[1,1,2],[2,2,2],[2,4,3],[2,6,3],[3,0,5],[3,2,5],[3,6,2],[4,6,1]],{page:13,noRedGold:true,harborNote:'The extension lists 11 harbors but pictures 10. Recommended placement preserves the 10 pictured edges and adds the last harbor to a legal main-island coast.'}),
];
// The base game's deserts move with its terrain pool; only Through the Desert
// has a fixed barrier. New Shores' mainland deserts also move.
for (const s of SCENARIOS) {
  if(s.family !== 'desert') for(const t of s.tiles) if(t.group === 'barrier') t.group = 'main';
  if(s.family === 'islands') for(const t of s.tiles) if(t.resource !== 'sea') t.group = 'main';
  if(s.family === 'shores') for(const t of s.tiles) if(t.resource === 'sea') t.group = s.tiles.some(o=>o.group==='main' && Math.max(Math.abs(t.q-o.q),Math.abs(t.r-o.r),Math.abs(t.q+t.r-o.q-o.r))===1) ? 'sea' : 'foreign';
}
// Pirate starting positions from the linked diagrams. Some are printed on
// the sea frame rather than on an inventory-counted interior hex.
const pirateStarts = {
  'shores-3': [3,4,'frame'], 'shores-4': [3,5,'frame'], 'shores-6': [3,-2,'frame'],
  'islands-3': [3,1,'tile'], 'islands-4': [3,4,'frame'], 'islands-6': [3,-2,'frame'],
  'desert-3': [3,4,'frame'], 'desert-4': [3,5,'frame'], 'desert-6': [0,7,'tile'],
};
for(const s of SCENARIOS) {
  const pirate=pirateStarts[s.id];
  s.pirateStart=pirate?{q:pirate[0],r:pirate[1],location:pirate[2]}:null;
  if(s.family==='desert')s.robberStart={q:5,r:s.players===6?2:-1};
}
export function getScenario(family, players) {
  return SCENARIOS.find(s => s.family === family && s.players === (players > 4 ? 6 : family === 'base' ? 4 : players));
}
