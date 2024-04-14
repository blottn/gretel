let ws_in = undefined;
let ws_out = undefined;

export async function setupWS() {
  // TODO use location to decide room
  const ws_out_url = "ws://localhost:3141/hansel/test";
  const ws_in_url = `${ws_out_url}/trail`
  ws_in = new WebSocket(ws_in_url);
  ws_out = new WebSocket(ws_out_url);

  (await Promise.all([ws_in, ws_out].map(ws => new Promise((r) => {
    ws.addEventListener('open', () => {
      r(`connected to ${ws.url}`);
    });
  })))).forEach(m => console.log(m));
  return {ws_in, ws_out};
}

export function pushDiff(diff) {
  // This helps prevent thrashing
  console.log('pre push', diff);
  if (Object.keys(diff).length == 0)
    return
  console.log('push');
  ws_out.send(JSON.stringify(diff));
}
