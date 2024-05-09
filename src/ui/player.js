import { id } from '../id.js';
import { mutate } from '../state.js';

const player_name = document.querySelector("#player-name");

player_name.addEventListener('input', () => mutate(set_player_name));

export const set_player_name = ({alias, ...rest}) => {
  alias[id] = player_name.value;
  return {alias, ...rest};
};
