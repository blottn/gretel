import { el, mount, unmount, list, setAttr, setChildren } from "redom";
import { v4 as uuidv4 } from 'uuid';

import { id } from '../id.js';
import { mutate, getState } from '../state.js';
import * as mutators from '../mutators.js';

import { refreshGrims } from './grims.js';
import { refreshST } from './st.js';
import * as player from './player.js';

export const refresh = () => {
  console.log('refresh ui', getState());

  refreshGrims();
  refreshST();
  refreshTitle();
};

const title = document.querySelector('title');
const refreshTitle = () => {
  const { alias } = getState();
  let title_text = 'Gretel';
  if (alias[id] !== undefined && alias[id] !== '') {
    title_text = `Gretel - ${alias[id]}`;
  }

  title.innerHTML = title_text;
}

