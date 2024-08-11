import { diff } from 'json-patcher';
import { id } from './id.js';
import { pushDiff } from './ws.js';
import { refresh } from './ui/ui.js';

import { tb } from './scripts/tb.js';

export const getBase = () => {
  return {
    'meta': {
      'st': 'unset',
    },
    'alias': {},
    'liveness': {},
    'seats': {},
    'grims': {},
  }
};

// Ensures at minimum the base state keys exist
export const withBase = (s) => {
  Object.entries(getBase())
    .filter(([k]) => !(k in s))
    .forEach(([k, v]) => s[k] = v)
  return s;
}

// Singleton instance of the state
let state = getBase();

export function mutate(f) {
  let old_state = JSON.parse(JSON.stringify(state));
  let new_state = f(state);
  pushDiff(
    diff(
      old_state,
      new_state
    )
  );
  state = new_state;
}

export function getState() {
  return JSON.parse(JSON.stringify(state));
}

// Sends an empty message to provoke a state update
export async function setup(sender, rcv) {
  let init = new Promise((res) => {
    let initState = async (m) => {
      state = JSON.parse(await m.data.text());
      rcv.removeEventListener('message', initState);
      res(state);
    }
    rcv.addEventListener('message', initState);
  });
  sender.send(JSON.stringify({}));
  await init;
}

export async function rcvUpdate(m) {
  state = JSON.parse(await m.data.text())
  console.log('new state: ', state);
  reconcile();
}

let reconcilers = [];
export function addR(r) {
  reconcilers.push(r);
}

export const reconcile = () => {
  mutate((s) => reconcilers.reduce((acc, f) => f(acc), s));  
}

export const get_player_name = (player_id) => {
  const { alias } = getState();
  if (player_id in alias) {
    return alias[player_id];
  }
  return player_id.substring(0, 16);
}

