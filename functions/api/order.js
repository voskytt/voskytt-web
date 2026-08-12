export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: false, error: 'BADAMAN DROP je ukončen. Objednávky jsou uzavřeny.' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
export async function onRequest() {
  return new Response(JSON.stringify({ ok: false, error: 'BADAMAN DROP je ukončen.' }), {
    status: 410,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
