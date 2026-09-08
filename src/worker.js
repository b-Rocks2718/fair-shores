import { generateBoard } from './generator.js';
self.onmessage = ({data}) => {
  try {self.postMessage({board:generateBoard(data.scenarioId,data.seed,data.options,{players:data.players,version:data.version})});}
  catch(error){self.postMessage({error:error.message});}
};
