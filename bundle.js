(function (redom, uuid) {
  'use strict';

  // First open the websocket
  // TODO use location to decide room
  const ws = new WebSocket("wss://wrm.blottn.ie/hansel/test");

  const reset = redom.el("button", "reset");

  uuid.v4();
  reset.addEventListener("click", () => {
    ws.send(JSON.stringify(null));
  });
  console.log(reset);
  const hello = redom.el("h1", "Hello world!");

  redom.mount(document.body, hello);
  redom.mount(document.body, reset);

})(redom, uuid);
