import { el, mount, unmount, list, setAttr, setChildren } from "redom";
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
ws.addEventListener("message", async (m) => {
  state = JSON.parse(await m.data.text());
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
  ws.send(JSON.stringify(diff));
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

reset.addEventListener("click", () => {
  console.log('resetting state');
  ws.send(JSON.stringify(null));
})

mount(document.body, reset);

let dom = {};
function refreshUI() {
  console.log('ui refresh triggerd');
  for (let p_id of Object.keys(state)) {
    dom[p_id] = refreshGrim(dom[p_id], state[p_id].circle);
  }
  dom[id] = refreshGrim(dom[id], state[id].circle);
  mount(document.body, dom[id]);

}

function refreshGrim(old, circle) {
  let container = old;
  if (container === undefined) {
    // List is not quite right but makes reuse and ordering easier
    container = list("div", CircLi, null, id);
  }
  container.update(Object.entries(state[id].circle));
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
    this.tok.onclick = () => {

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
          if (!(r.value.length >= 0) && !((/\s+/.exec(r.value)[0].length == r.value.length))) {
            delete s[this.grim_id].circle[this.token_id].reminders[i];
          }
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
