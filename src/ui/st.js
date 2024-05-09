import { mutate, getState } from '../state.js';
import { id } from '../id.js';
import * as mutators from '../mutators.js';

const st_who = document.body.querySelector("#st-who");
const st_become = document.body.querySelector("#st-become");

st_become.onclick = () => {
  mutate(mutators.become_st);
};

export const refreshST = () => {
  let {meta} = getState();
  st_who.innerText = meta.st ?? 'unselected';
  refreshControls();
}

// ST controls
const st_ctrls = document.body.querySelector("#st-controls");

export const refreshControls = () => {
  st_ctrls.classList.remove("gone");
  if (getState()['meta']['st'] !== id)
    st_ctrls.classList.add("gone");
};

const add_seat = document.body.querySelector("#st-add-player");
add_seat.addEventListener("click", () => {
  mutate(mutators.add_seat);
});


