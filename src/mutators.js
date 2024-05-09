import { v4 as uuidv4 } from 'uuid';
import { id } from './id.js';

import { tuple_to_obj } from './util.js';

// ST
export const become_st = ({meta, ...rest}) => {
  return {meta: {...meta, st: id}, ...rest};
}

// Seats
export const add_seat = ({seats, ...rest}) => {
  seats[Object.keys(seats).length] = {
    id: uuidv4(),
    owner: "undefined",
  }
  return {seats, ...rest}
}

export const remove_seat = (idx) => ({seats, ...rest}) => {
  delete seats[idx];
  return {seats, ...rest};
}

// Grims
export const create_grim = ({grims, seats, ...rest}) => {
  if (id in grims)
    return {grims, seats, ...rest};
  return {grims: {
    [id]: Object.keys(seats).map(seat_idx => [seat_idx, {
      token: 'unset',
      reminders: {},
    }]).reduce(tuple_to_obj, {}), ...grims},
    seats, ...rest
  };
}
