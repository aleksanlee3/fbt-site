/* FBT Online · голосовой ввод для страницы /biznes-model.
   POST /api/bm-voice  {audio: '<base64 записи>', mime: 'audio/webm'}  →  {text}
   Расшифровка — Whisper (Workers AI, @cf/openai/whisper-large-v3-turbo), русский язык.
   Нужна привязка Workers AI в Cloudflare Pages: Settings → Bindings → Add → Workers AI, имя переменной AI.
   Нет привязки → 503 {error:'no_ai'}: страница использует распознавание речи самого браузера (если оно есть). */

const MAX_B64 = 6 * 1024 * 1024;   // ~4,5 МБ звука ≈ несколько минут речи; страница сама останавливает запись через 2 минуты

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.AI) return json({ error: 'no_ai' }, 503);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'bad_json' }, 400); }
  const audio = body && typeof body.audio === 'string' ? body.audio.replace(/^data:[^,]*,/, '') : '';
  if (!audio || audio.length > MAX_B64) return json({ error: 'bad_audio' }, 400);
  try {
    const res = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
      audio,
      task: 'transcribe',
      language: 'ru',
      vad_filter: true,   // отрезает тишину и шум
      initial_prompt: 'Предприниматель рассказывает о своём бизнесе в Узбекистане: товары, клиенты, цены в сумах, заказы, расходы.'
    });
    const text = String((res && res.text) || '').replace(/\s+/g, ' ').trim();
    return json({ text });
  } catch (e) {
    console.log('bm-voice error', String(e));
    return json({ error: 'stt_failed' }, 502);
  }
}

export function onRequestGet({ env }) {
  return json({ ok: true, ai: !!env.AI });
}
