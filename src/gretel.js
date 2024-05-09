import { el, mount, unmount, list, setAttr, setChildren } from "redom";
import { v4 as uuidv4 } from "uuid";
import { generate } from "json-merge-patch";
import { id } from './id.js';
import { start_liveness, liveness_adder, dead_remover } from './liveness.js';
import { create_grim } from './mutators.js';
import { setupWS } from './ws.js';
import { getBase, mutate, getState, setup, rcvUpdate, addR, reconcile } from './state.js';
import { refresh } from './ui/ui.js';

let {ws_in, ws_out} = await setupWS();

// This is technically in the wrong order since the initial setup should trigger reconcile and refresh anyways
let s = await setup(ws_out, ws_in);

// initialiser for resets
addR((s) => {
  if (s !== null &&
      s !== undefined &&
      Object.keys(s).length !== 0)
    return s
  return getBase();
});

// Grim adder
addR(create_grim);

// Liveness
addR(dead_remover);
addR(liveness_adder);

// Seat remover
addR(({grims, seats, ...rest}) => {
  Object.keys(grims[id])
    .filter(s => !(s in seats))
    .forEach(s => delete grims[id][s]);
  return {grims, seats, ...rest};
})

addR(({grims, seats, ...rest}) => {
  Object.keys(seats)
    .filter(s => !(s in grims[id]))
    .forEach(s => grims[id][s] = {token: 'unset', reminders: {}});
  return {grims, seats, ...rest};
});

ws_in.addEventListener("message", async (m) => {
  await rcvUpdate(m); // Has a reconcile inside
  refresh();
})

// Manually reconcile in case room has never been used
reconcile();
refresh();

start_liveness();

