import { el, mount, unmount, list, setAttr, setChildren } from "redom";
import { v4 as uuidv4 } from 'uuid';

import { id } from './id.js';
import { mutate, getState } from './state.js';

import * as mutators from './mutators.js';


export const refresh = () => {
  console.log('refresh ui', getState());
  let {meta, grims} = getState();

  refreshGrims();
  refreshST();
  refreshControls();
};

const add_seat = document.body.querySelector("#st-add-player");
add_seat.addEventListener("click", () => {
  mutate(mutators.add_seat);
});

const st_ctrls = document.body.querySelector("#st-controls");

export const refreshControls = () => {
  st_ctrls.classList.remove("gone");
  if (getState()['meta']['st'] !== id)
    st_ctrls.classList.add("gone");
};


const st_who = document.body.querySelector("#st-who");
const st_become = document.body.querySelector("#st-become");

st_become.onclick = () => {
  mutate(mutators.become_st);
};

export const refreshST = () => {
  let {meta} = getState();
  st_who.innerText = meta.st ?? 'unselected';
}

const mount_point = document.body.querySelector("#grims");

export const refreshGrims = () => {
  let {meta, grims} = getState();
  setChildren(mount_point,[]);
  /*  [el('div', Object.entries(grims).map(g => {
      console.log(g);
      const remove = el('button', "REMOVE");
      remove.addEventListener('click', () => {
        console.log('removed');
      });
      return el('div', [el('p', JSON.stringify(g)), remove]);
    }))],
  ); */
}


