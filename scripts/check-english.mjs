const baseUrl = process.env.CHECK_BASE_URL || 'http://127.0.0.1:8787';
const han = /[\u3400-\u9fff]/u;

function assertNoHan(label, value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (han.test(text)) {
    throw new Error(`${label} contains untranslated Chinese text`);
  }
}

const pageResponse = await fetch(`${baseUrl}/?lang=en`);
if (!pageResponse.ok) throw new Error(`English page returned ${pageResponse.status}`);
const html = await pageResponse.text();
const visibleText = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ');
assertNoHan('English page', visibleText);

const generateResponse = await fetch(`${baseUrl}/api/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Fresh, clean, and not sweet for a summer commute',
    history: [],
    sessionId: '',
    lang: 'en'
  })
});
const generated = await generateResponse.json();
if (!generateResponse.ok) throw new Error(generated.error || `Generate API returned ${generateResponse.status}`);
assertNoHan('English generated result', generated);
if (process.env.REQUIRE_LLM === '1' && generated.mode !== 'llm') {
  throw new Error(`Expected live model mode, received ${generated.mode}`);
}

const explanationResponse = await fetch(`${baseUrl}/api/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: `Why did you add ${generated.formula.formula.baseNotes[0].name}?`,
    history: [],
    sessionId: generated.sessionId,
    currentFormula: generated.formula,
    lang: 'en'
  })
});
const explanation = await explanationResponse.json();
if (!explanationResponse.ok) throw new Error(explanation.error || `Explanation API returned ${explanationResponse.status}`);
assertNoHan('English explanation', explanation);

console.log('PASS: English page, generated result, and follow-up explanation contain no Chinese characters.');
