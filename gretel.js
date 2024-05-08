import { el, mount, unmount, list, setAttr, setChildren } from "redom";
import { v4 as uuidv4 } from "uuid";
import { generate } from "json-merge-patch";
import { id } from './id.js';
import { setupWS } from './ws.js';
import { getBase, mutate, getState, setup, rcvUpdate, addR, reconcile } from './state.js';
import { refresh } from './ui.js';

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

ws_in.addEventListener("message", async (m) => {
  await rcvUpdate(m); // Has a reconcile inside
  refresh();
})

// Manually reconcile in case room has never been used
reconcile();
refresh();
