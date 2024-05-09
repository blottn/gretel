import { generate } from 'json-merge-patch';
import { id } from './id.js';
import { pushDiff } from './ws.js';
import { refresh } from './ui.js';

export const getBase = () => {
  return {
    'meta': {
      'alias': {}
    },
    'liveness': {},
    'seats': {},
    'grims': {},
  }
};

// Singleton instance of the state
let state = getBase();

export function mutate(f) {
  let old_state = JSON.parse(JSON.stringify(state));
  let new_state = f(state);
  pushDiff(
    generate(
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

