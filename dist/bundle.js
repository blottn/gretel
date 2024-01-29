function createElement (query, ns) {
  const { tag, id, className } = parse(query);
  const element = ns ? document.createElementNS(ns, tag) : document.createElement(tag);

  if (id) {
    element.id = id;
  }

  if (className) {
    if (ns) {
      element.setAttribute('class', className);
    } else {
      element.className = className;
    }
  }

  return element;
}

function parse (query) {
  const chunks = query.split(/([.#])/);
  let className = '';
  let id = '';

  for (let i = 1; i < chunks.length; i += 2) {
    switch (chunks[i]) {
      case '.':
        className += ` ${chunks[i + 1]}`;
        break;

      case '#':
        id = chunks[i + 1];
    }
  }

  return {
    className: className.trim(),
    tag: chunks[0] || 'div',
    id
  };
}

function doUnmount (child, childEl, parentEl) {
  const hooks = childEl.__redom_lifecycle;

  if (hooksAreEmpty(hooks)) {
    childEl.__redom_lifecycle = {};
    return;
  }

  let traverse = parentEl;

  if (childEl.__redom_mounted) {
    trigger(childEl, 'onunmount');
  }

  while (traverse) {
    const parentHooks = traverse.__redom_lifecycle || {};

    for (const hook in hooks) {
      if (parentHooks[hook]) {
        parentHooks[hook] -= hooks[hook];
      }
    }

    if (hooksAreEmpty(parentHooks)) {
      traverse.__redom_lifecycle = null;
    }

    traverse = traverse.parentNode;
  }
}

function hooksAreEmpty (hooks) {
  if (hooks == null) {
    return true;
  }
  for (const key in hooks) {
    if (hooks[key]) {
      return false;
    }
  }
  return true;
}

/* global Node, ShadowRoot */


const hookNames = ['onmount', 'onremount', 'onunmount'];
const shadowRootAvailable = typeof window !== 'undefined' && 'ShadowRoot' in window;

function mount (parent, child, before, replace) {
  const parentEl = getEl(parent);
  const childEl = getEl(child);

  if (child === childEl && childEl.__redom_view) {
    // try to look up the view if not provided
    child = childEl.__redom_view;
  }

  if (child !== childEl) {
    childEl.__redom_view = child;
  }

  const wasMounted = childEl.__redom_mounted;
  const oldParent = childEl.parentNode;

  if (wasMounted && (oldParent !== parentEl)) {
    doUnmount(child, childEl, oldParent);
  }

  if (before != null) {
    if (replace) {
      const beforeEl = getEl(before);

      if (beforeEl.__redom_mounted) {
        trigger(beforeEl, 'onunmount');
      }

      parentEl.replaceChild(childEl, beforeEl);
    } else {
      parentEl.insertBefore(childEl, getEl(before));
    }
  } else {
    parentEl.appendChild(childEl);
  }

  doMount(child, childEl, parentEl, oldParent);

  return child;
}

function trigger (el, eventName) {
  if (eventName === 'onmount' || eventName === 'onremount') {
    el.__redom_mounted = true;
  } else if (eventName === 'onunmount') {
    el.__redom_mounted = false;
  }

  const hooks = el.__redom_lifecycle;

  if (!hooks) {
    return;
  }

  const view = el.__redom_view;
  let hookCount = 0;

  view && view[eventName] && view[eventName]();

  for (const hook in hooks) {
    if (hook) {
      hookCount++;
    }
  }

  if (hookCount) {
    let traverse = el.firstChild;

    while (traverse) {
      const next = traverse.nextSibling;

      trigger(traverse, eventName);

      traverse = next;
    }
  }
}

function doMount (child, childEl, parentEl, oldParent) {
  const hooks = childEl.__redom_lifecycle || (childEl.__redom_lifecycle = {});
  const remount = (parentEl === oldParent);
  let hooksFound = false;

  for (const hookName of hookNames) {
    if (!remount) { // if already mounted, skip this phase
      if (child !== childEl) { // only Views can have lifecycle events
        if (hookName in child) {
          hooks[hookName] = (hooks[hookName] || 0) + 1;
        }
      }
    }
    if (hooks[hookName]) {
      hooksFound = true;
    }
  }

  if (!hooksFound) {
    childEl.__redom_lifecycle = {};
    return;
  }

  let traverse = parentEl;
  let triggered = false;

  if (remount || (traverse && traverse.__redom_mounted)) {
    trigger(childEl, remount ? 'onremount' : 'onmount');
    triggered = true;
  }

  while (traverse) {
    const parent = traverse.parentNode;
    const parentHooks = traverse.__redom_lifecycle || (traverse.__redom_lifecycle = {});

    for (const hook in hooks) {
      parentHooks[hook] = (parentHooks[hook] || 0) + hooks[hook];
    }

    if (triggered) {
      break;
    } else {
      if (traverse.nodeType === Node.DOCUMENT_NODE ||
        (shadowRootAvailable && (traverse instanceof ShadowRoot)) ||
        (parent && parent.__redom_mounted)
      ) {
        trigger(traverse, remount ? 'onremount' : 'onmount');
        triggered = true;
      }
      traverse = parent;
    }
  }
}

function setStyle (view, arg1, arg2) {
  const el = getEl(view);

  if (typeof arg1 === 'object') {
    for (const key in arg1) {
      setStyleValue(el, key, arg1[key]);
    }
  } else {
    setStyleValue(el, arg1, arg2);
  }
}

function setStyleValue (el, key, value) {
  el.style[key] = value == null ? '' : value;
}

/* global SVGElement */


const xlinkns = 'http://www.w3.org/1999/xlink';

function setAttrInternal (view, arg1, arg2, initial) {
  const el = getEl(view);

  const isObj = typeof arg1 === 'object';

  if (isObj) {
    for (const key in arg1) {
      setAttrInternal(el, key, arg1[key], initial);
    }
  } else {
    const isSVG = el instanceof SVGElement;
    const isFunc = typeof arg2 === 'function';

    if (arg1 === 'style' && typeof arg2 === 'object') {
      setStyle(el, arg2);
    } else if (isSVG && isFunc) {
      el[arg1] = arg2;
    } else if (arg1 === 'dataset') {
      setData(el, arg2);
    } else if (!isSVG && (arg1 in el || isFunc) && (arg1 !== 'list')) {
      el[arg1] = arg2;
    } else {
      if (isSVG && (arg1 === 'xlink')) {
        setXlink(el, arg2);
        return;
      }
      if (initial && arg1 === 'class') {
        arg2 = el.className + ' ' + arg2;
      }
      if (arg2 == null) {
        el.removeAttribute(arg1);
      } else {
        el.setAttribute(arg1, arg2);
      }
    }
  }
}

function setXlink (el, arg1, arg2) {
  if (typeof arg1 === 'object') {
    for (const key in arg1) {
      setXlink(el, key, arg1[key]);
    }
  } else {
    if (arg2 != null) {
      el.setAttributeNS(xlinkns, arg1, arg2);
    } else {
      el.removeAttributeNS(xlinkns, arg1, arg2);
    }
  }
}

function setData (el, arg1, arg2) {
  if (typeof arg1 === 'object') {
    for (const key in arg1) {
      setData(el, key, arg1[key]);
    }
  } else {
    if (arg2 != null) {
      el.dataset[arg1] = arg2;
    } else {
      delete el.dataset[arg1];
    }
  }
}

function text (str) {
  return document.createTextNode((str != null) ? str : '');
}

function parseArgumentsInternal (element, args, initial) {
  for (const arg of args) {
    if (arg !== 0 && !arg) {
      continue;
    }

    const type = typeof arg;

    if (type === 'function') {
      arg(element);
    } else if (type === 'string' || type === 'number') {
      element.appendChild(text(arg));
    } else if (isNode(getEl(arg))) {
      mount(element, arg);
    } else if (arg.length) {
      parseArgumentsInternal(element, arg, initial);
    } else if (type === 'object') {
      setAttrInternal(element, arg, null, initial);
    }
  }
}

function getEl (parent) {
  return (parent.nodeType && parent) || (!parent.el && parent) || getEl(parent.el);
}

function isNode (arg) {
  return arg && arg.nodeType;
}

function html (query, ...args) {
  let element;

  const type = typeof query;

  if (type === 'string') {
    element = createElement(query);
  } else if (type === 'function') {
    const Query = query;
    element = new Query(...args);
  } else {
    throw new Error('At least one argument required');
  }

  parseArgumentsInternal(getEl(element), args, true);

  return element;
}

const el = html;

html.extend = function extendHtml (...args) {
  return html.bind(this, ...args);
};

// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
let getRandomValues;
const rnds8 = new Uint8Array(16);
function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);

    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }

  return getRandomValues(rnds8);
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

const byteToHex = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}

function unsafeStringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
}

const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native = {
  randomUUID
};

function v4(options, buf, offset) {
  if (native.randomUUID && !buf && !options) {
    return native.randomUUID();
  }

  options = options || {};
  const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return unsafeStringify(rnds);
}

var utils = {};

utils.serialize = function(value) {
  return (value && typeof value.toJSON === 'function') ? value.toJSON() : value;
};

// do not edit .js files directly - edit src/index.jst



var fastDeepEqual = function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false;

    var length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!equal(a[i], b[i])) return false;
      return true;
    }



    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0;)
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      var key = keys[i];

      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a!==a && b!==b;
};

var equal = fastDeepEqual;
var serialize = utils.serialize;

var generate$1 = function generate(before, after) {
  before = serialize(before);
  after = serialize(after);

  // An undefined target is a deletion attempt
  if (after === undefined) {
    return null;
  }

  if (!(before instanceof Object) &&
      !(after instanceof Object) &&
      before === after) { // Return no op when values match
    return {}
  }

  if (before === null || after === null ||
    typeof before !== 'object' || typeof after !== 'object' ||
    Array.isArray(before) || Array.isArray(after)) {
    return serialize(after);
  }

  let patch = {};
  for (let key of Object.keys(before)) {
    let newVal = generate(before[key], after[key]);
    // Omit noops
    if (equal(newVal, {})) {
      continue;
    }
    patch[key] = serialize(newVal);
  }

  for (let key of Object.keys(after)) {
    if (!(key in before)) {
      patch[key] = serialize(after[key]);
    }
  }

  return (Object.keys(patch).length > 0 ? patch : {});
};

var generate = generate$1;

let id = v4();
console.log(`Your id is: ${id}`);

// TODO use location to decide room
const ws = new WebSocket("ws://localhost:3141/hansel/test");

await new Promise((res, rej) => {
  ws.addEventListener("open", () => {
    console.log('connected to ws');
    res();
  });
});

let state = {};
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
});

mount(document.body, reset);
