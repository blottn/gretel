import { el, mount, unmount, list, setAttr, setChildren } from "redom";
import { mutate, getState, get_player_name } from '../state.js';
import * as mutators from '../mutators.js';

const mount_point = document.body.querySelector("#grims");
export const refreshGrims = () => {
  let {meta, grims} = getState();
  setChildren(mount_point,
    Object.entries(grims)
      .map((g) => render_grim(...g))
  );
}

export const render_grim = (p_id, grim) => {
  const { seats, alias } = getState();
  console.log(p_id);
  return el('div',
    el('p', `${get_player_name(p_id)}`),
    el('div', { class: 'circle' },
      Object.entries(grim).map(([seat_id, {token, reminders}]) => {
        let owner = el('p', get_player_name(seats[seat_id].owner), 
                          {class: `seat ${seats[seat_id].owner}`})
        owner.addEventListener('click', () => mutate(mutators.claim_seat(seat_id)));
        return el('div',
          el('img', token, {class: 'token', src: "https://raw.githubusercontent.com/bra1n/townsquare/d9c2b17dc9b2d7b091b55c988707784f12980f44/src/assets/icons/amnesiac.png"}),
          owner,
          Object.keys(reminders)
                .map(r => el('p', get_player_name(seats[seat_id].owner)))
        );
      })
    )
  );
}

