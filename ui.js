import { el, mount, unmount, list, setAttr, setChildren } from "redom";
import { id } from './id.js';
import { mutate, getState } from './state.js';

const mount_point = document.body.querySelector("#grims");

const st_who = document.body.querySelector("#st-who");
const st_become = document.body.querySelector("#st-become");

st_become.onclick = () => {
  mutate((s) => {
    s.meta['st'] = id
    return s;
  });
};
export const refreshST = () => {
  let {meta} = getState();
  st_who.innerText = meta.st ?? 'unselected';
}

export const refreshGrims = () => {
  let {meta, grims} = getState();
  setChildren(mount_point,
    [el('div', Object.entries(grims ?? {'a': 'foo'}).map(([p_id, a]) => {
      return el('p', JSON.stringify(a));
    }))],
  );
}

export const refresh = () => {
  console.log('refresh ui', getState());
  let {meta, grims} = getState();

  refreshGrims();
  refreshST()
};

