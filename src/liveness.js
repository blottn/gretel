import { getState, mutate } from './state.js';
import { id } from './id.js';

const liveness_interval_ms = 2000;
const max_silence_ms = 10000;

const livepinger = () => {
  mutate(({liveness, ...rest}) => {
    liveness[id] = Date.now();
    return {liveness, ...rest};
  });
  setTimeout(livepinger, liveness_interval_ms);
}

// Adds our liveness if we havent registered yet
export const liveness_adder = ({liveness, ...rest}) => {
  if (id in liveness)
    return {liveness, ...rest};
  liveness[id] = Date.now();
  return {liveness, ...rest};
}
// Removes grims for dead players
export const dead_remover = ({liveness, grims, ...rest}) => {
  let dead = [];
  for (let p_id in liveness) {
    if (Date.now() - liveness[p_id] > max_silence_ms) {
      dead.push(p_id);
    }
  }
  for (let p_id of dead) {
    delete liveness[p_id];
    delete grims[p_id];
  }
  return {liveness, grims, ...rest};
}

export const start_liveness = livepinger
