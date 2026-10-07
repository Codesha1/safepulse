// Optional real vision provider — used only when AI_API_KEY is set.
// It only identifies foods + rough nutrition. Status and suggestions still come from our
// own deterministic, safety-reviewed rules (never from free-form model output).
import { config } from '../../../config.js';
import { FOODS } from '../foods.js';

const SYSTEM = `You are a food-recognition helper inside a school nutrition-awareness prototype.
Look at the meal photo and list the foods you can see with a rough per-portion nutrition estimate.
Rules: respond with JSON only. Never give medical advice, insulin, medication or diagnosis.
If the image is not food, return {"foods":[]}.
Prefer these known keys when they match: ${Object.keys(FOODS).join(', ')}.
Schema: {"foods":[{"key":"known_key_or_null","name_en":"","name_ar":"","portion_en":"","portion_ar":"","carbs":0,"protein":0,"fat":0,"fiber":0,"sugary_drink":false}]}`;

export async function recognizeFoods(buffer, mime) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': config.ai.apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: config.ai.model,
      max_tokens: 1000,
      system: SYSTEM,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mime, data: buffer.toString('base64') } },
        { type: 'text', text: 'Identify the foods in this meal and estimate nutrition per visible portion. JSON only.' },
      ] }],
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`AI provider responded ${res.status}`);
  const data = await res.json();
  const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  const json = JSON.parse(text.replace(/```json|```/g, '').trim());
  if (!Array.isArray(json.foods)) throw new Error('Unexpected AI response');
  const num = (v) => Math.max(0, Math.min(400, Number(v) || 0));
  return json.foods.slice(0, 12).map((f) => {
    if (f.key && FOODS[f.key]) return { key: f.key, ...FOODS[f.key] };
    return {
      key: null,
      name: { en: String(f.name_en || 'Food item').slice(0, 60), ar: String(f.name_ar || f.name_en || 'عنصر غذائي').slice(0, 60) },
      portion: { en: String(f.portion_en || '1 portion').slice(0, 40), ar: String(f.portion_ar || 'حصة واحدة').slice(0, 40) },
      carbs: num(f.carbs), protein: num(f.protein), fat: num(f.fat), fiber: num(f.fiber),
      drink: !!f.sugary_drink, sugary: !!f.sugary_drink,
    };
  });
}
