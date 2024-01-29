import { el, mount } from "redom";
import { v4 as uuidv4 } from "uuid";
import { generate } from "json-merge-patch";

let id = uuidv4();
console.log(`Your id is: ${id}`)

// TODO use location to decide room
const ws = new WebSocket("ws://localhost:3141/hansel/test")

await new Promise((res, rej) => {
  ws.addEventListener("open", () => {
    console.log('connected to ws');
    res()
  });
});

let state = {};

// Changes the state and only sends changes if it diffs our id 
let mutate = (f, s) => {
  let prior = JSON.parse(JSON.stringify(s));
  let post = f(s);
  let diff = generate(prior[id], post[id]);
  if (Object.keys(diff) == 0)
    return
};
ws.addEventListener("message", async (m) => {
  state = JSON.parse(await m.data.text());
  let old_state = JSON.parse(JSON.stringify(state)); //deep clone




  console.log('received state update', state);
  // ensure tokens in circle for players
  for (let p of Object.keys(state)) {
    if (p in state[id].circle) {
      continue
    }
    state[id].circle[p] = {
      token: {
        name: 'blank',
      },
      reminders: {},
      notes: {},
    };
  }
  let selfDiff = generate(old_state[id], state[id]);
  if (Object.keys(selfDiff) == 0)
    return

  let diff = {
    [id]: selfDiff
  };
  console.log('push diff after receive');
  pushDiff(diff);
});

function pushDiff(diff) {
  if (Object.keys(diff).length == 0)
    return
  console.log('sending diff');
  ws.send(JSON.stringify(diff));
}

/*function pushState(updatedState) {
  let diff = generate(state, updatedState);
  if (Object.keys(diff).length != 0)
    ws.send(JSON.stringify(diff));
}*/

function initGrim() {
  return {
    'bluffs': {},
    'circle': {
      [ id ] : {
        'token': {'name': 'foobar'},
        'reminders': {},
        'notes': {},
      },
    },
  };
}



pushDiff({[id]: initGrim()});

const reset = el("button", "reset");

reset.addEventListener("click", () => {
  console.log('resetting state');
  ws.send(JSON.stringify(null));
})

mount(document.body, reset);

let dom = {};

function refreshUI() {
  // ensure dom exists for all objects
  for (let p_id of Object.keys(state)) {
    if (!(p_id in dom)) {
      console.log(`init grim dom: ${p_id}`);
      dom[p_id] = {'grim': {}, 'circle': {}}
    }
    dom[p_id]['grim'] = tokenGrim(dom[p_id]?.grim);
    for (let t_id of Object.keys(state[p_id].circle)) {
      dom[p_id].circle[t_id] = token(
        dom[p_id].grim,
        dom[p_id].circle[t_id],
        state[p_id].circle[t_id]);
    }
  }

  console.log(dom);
}

function tokenGrim(old) {
  if (old !== undefined) {
    return old;
  }
  return el("div.grim");
}

function token(parent, old, state) {
  let e = old;
  if (e == undefined) {
    e = el("p.tok", JSON.stringify(state));
  }
  // TODO sometimes update state

  return e;
}

