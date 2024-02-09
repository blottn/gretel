import { el, mount, unmount, list, setAttr, setChildren } from "redom";
import { v4 as uuidv4 } from "uuid";
import { generate } from "json-merge-patch";

let id = uuidv4();
console.log(id);

// TODO use location to decide room
const ws_out_url = "ws://localhost:3141/hansel/test";
const ws_in_url = `${ws_out_url}/trail`
const ws_in = new WebSocket(ws_in_url);
const ws_out = new WebSocket(ws_out_url);

(await Promise.all([ws_in, ws_out].map(ws => new Promise((r) => {
  ws.addEventListener('open', () => {
    r(`connected to ${ws.url}`);
  });
})))).forEach(m => console.log(m));

// Changes the state and only sends changes if it diffs our id 
let mutate = (f) => {
  let prior = JSON.parse(JSON.stringify(state));
  let post = f(state);
  let diff = generate(prior[id], post[id]);
  if (Object.keys(diff) == 0)
    return
  pushDiff({[id]: diff});
};

let state = {};
ws_in.addEventListener("message", async (m) => {
  state = JSON.parse(await m.data.text());
  console.log(state);
  if (state === null) {
    return;
  }
  reconcile();
  refreshUI();
});

function reconcile() {
  let prior = JSON.parse(JSON.stringify(state));
  tokenPerPlayer();
  let selfDiff = generate(prior[id], state[id]);
  if (Object.keys(selfDiff) == 0)
    return
  pushDiff({[id]: selfDiff});
}

function tokenPerPlayer() {
  // ensure tokens in circle for players
  for (let p of Object.keys(state)) {
    if (p in state[id].circle) {
      continue
    }
    // adding token for player
    state[id].circle[p] = {
      token: {
        name: '<unknown>',
      },
      reminders: {},
      notes: {},
    };
  }
}

function pushDiff(diff) {
  if (Object.keys(diff).length == 0)
    return
  ws_out.send(JSON.stringify(diff));
}

function initGrim() {
  return {
    'bluffs': {},
    'circle': {
      [ id ] : {
        'token': {'name': 'ravenkeeper'},
        'reminders': {
          0: 'imp.dead',
        },
        'notes': {},
      },
    },
  };
}

pushDiff({[id]: initGrim()});

const reset = el("button", "reset");
mount(document.body, reset);
reset.addEventListener("click", () => {
  ws_out.send(JSON.stringify(null));
})

let dom = {};
function refreshUI() {
  for (let p_id of Object.keys(state)) {
    dom[p_id] = refreshGrim(p_id, dom[p_id], state[p_id].circle);
  }
  setChildren(document.body.querySelector('#grims'),
    Object.entries(dom)
      .sort(([item_id, a], b) => {
        if (item_id === id) {
          return -1;
        }
        return 1;
      })
      .map(([_, x]) => x)
  );
}

function refreshGrim(p_id, old, circle) {
  let container = old;
  if (container === undefined) {
    // List is not quite right but makes reuse and ordering easier
    container = list(`div${p_id === id ? '.self' : ''}`, CircLi, null, p_id);
  }
  container.update(Object.entries(state[p_id].circle));
  return container;
}

class CircLi {
  constructor(grim_id) {
    this.grim_id = grim_id
    this.el = el("div.tok");
    this.name = el("p.tok-core");
    this.tok = el("input.tok-core");
    this.addButton = el("button.tok-add", "+");
    this.rems = [];
    mount(this, this.name);
    mount(this, this.tok);
    mount(this, this.addButton);
  }

  // Bind to some data
  update([token_id, { token, reminders }]) {
    this.token_id = token_id;

    this.name.textContent = token_id.substr(0,8);
    this.tok.value = token.name;
    this.tok.onblur = () => {
      mutate(s => {
        s[this.grim_id].circle[this.token_id].token.name = this.tok.value;
        return s;
      });
    };

    this.rems.slice(Object.keys(reminders).length).forEach(r => unmount(this, r))
    this.rems = this.rems.slice(0, Object.keys(reminders).length);

    Object.entries(reminders).forEach(([i, r]) => {
      i = parseInt(i);
      if (i >= this.rems.length)
        this.rems[i] = el("input.tok-reminder", {'type': 'text'});
      setAttr(this.rems[i], {
        'value': r,
        'size': Math.max(1, Math.min(r.length, 20)),
      });
      mount(this, this.rems[i]);
    });

    // listeners
    this.rems.forEach((r, i) => {
      r.onblur = () => {
        mutate((s) => {
          s[this.grim_id].circle[this.token_id].reminders[i] = r.value;
          if (r.value.length > 0 || (/\s+/.exec(r.value)?.[0].length == r.value.length))
            return s
          delete s[this.grim_id].circle[this.token_id].reminders[i];
          return s;
        });
      }
      r.oninput = () => { // auto resize
        setAttr(r, {'size': Math.max(
          1,
          Math.min(r.value.length, 20)
        )});
      };
    });

    // Set handlers
    this.addButton.onclick = () => {
      console.log(`adding: ${this.grim_id}`);
      mutate((s) => {
        let t = Object.keys(s[this.grim_id].circle[this.token_id].reminders).length;
        s[this.grim_id].circle[this.token_id].reminders[t] = 'empty';
        return s;
      });
    };

    setChildren(this, [this.name, 
      this.tok,
      this.rems,
      this.addButton].flat())
  }
}
