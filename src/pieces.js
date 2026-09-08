import { key } from './geometry.js';

export function startingPieces(tiles,scenario) {
  const deserts=tiles.filter(t=>t.resource==='desert');
  const tile=deserts.find(t=>scenario.robberStart&&key(t)===key(scenario.robberStart))
    ||deserts[0]||tiles.find(t=>t.number===12);
  if(!tile)throw Error('No valid starting position for the robber.');
  return {robber:{q:tile.q,r:tile.r,location:'tile'},pirate:scenario.pirateStart?{...scenario.pirateStart}:null};
}

export function validatePieces(board,scenario) {
  const errors=[],pieces=board.pieces;
  if(!pieces)return ['Missing robber/pirate placement.'];
  const robber=board.tiles.find(t=>key(t)===key(pieces.robber||{}));
  const hasDesert=board.tiles.some(t=>t.resource==='desert');
  if(pieces.robber?.location!=='tile'||!robber||(hasDesert?robber.resource!=='desert':robber.number!==12))errors.push('Invalid robber starting position.');
  const expected=scenario.pirateStart,pirate=pieces.pirate;
  if(expected) {
    if(!pirate||key(pirate)!==key(expected)||pirate.location!==expected.location)errors.push('Invalid pirate starting position.');
    else if(pirate.location==='tile'&&!board.tiles.some(t=>key(t)===key(pirate)&&t.resource==='sea'))errors.push('Pirate must start at sea.');
  }else if(pirate)errors.push('The base game does not use a pirate.');
  return errors;
}
