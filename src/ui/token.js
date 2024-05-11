import { el } from "redom";

export const tb_tokens = {
  "imp": {
    "src": "",
    "reminders": ["Dead"]
  },
  "scarlet woman": {
    "src": "",
    "reminders": ["Demon"]
  },
  "spy": {
    "src": "",
    "reminders": []
  },
  "poisoner": {
    "src": "",
    "reminders": ["Poisoned"]
  },
  "baron": {
    "src": "",
    "reminders": []
  },

  "drunk": {
    "src": "",
    "reminders": ["Drunk"]
  },
  "saint": {
    "src": "",
    "reminders": []
  },
  "butler": {
    "src": "",
    "reminders": ["Master"]
  },
  "recluse": {
    "src": "",
    "reminders": []
  },

  "slayer": {
    "src": "",
    "reminders": ["No ability"]
  },
  "mayor": {
    "src": "",
    "reminders": []
  },
  "soldier": {
    "src": "",
    "reminders": []
  },
  "monk": {
    "src": "",
    "reminders": ["Protected"]
  },
  "virgin": {
    "src": "",
    "reminders": ["No ability"]
  },
  "ravenkeeper": {
    "src": "",
    "reminders": []
  },
  "undertaker": {
    "src": "",
    "reminders": ["Executed"]
  },
  "empath": {
    "src": "",
    "reminders": []
  },
  "fortune teller": {
    "src": "",
    "reminders": ["Red herring"]
  },
  "washerwoman": {
    "src": "",
    "reminders": ["Townsfolk", "Wrong"]
  },
  "chef": {
    "src": "",
    "reminders": []
  },
  "investigator": {
    "src": "",
    "reminders": ["Minion", "Wrong"]
  },
  "librarian": {
    "src": "",
    "reminders": ["Outsider", "Wrong"],
  },
}

export const tokens = {...tb_tokens};

// Reminders
const global_reminders = [
  "Good",
  "Evil",
  "Custom",
]

export const get_tok = (token_name) => {
  let empty_token = el("img");
  if (!(token_name in tokens)) {
    return empty_token;
  }
  return el("img", {src: tokens[token_name].src})
}
