'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { BoothStep, ChatMessage, GenerateResponse, NoteItem } from '@/lib/types';
import { type Lang, t } from '@/lib/i18n';

const quickPrompts = [
  '清爽、不甜、适合夏天通勤',
  '雨天、安静、像图书馆',
  '温柔一点，适合约会',
  '木质、沉稳、适合阅读',
  '甜一点，但不要腻',
  '适合面试，干净、有亲和力',
  '适合运动后，清凉、轻盈',
  '适合晚会，成熟、有记忆点',
  '像白衬衫，皂感、低调',
  '适合睡前，放松、柔和',
  '想要茶香，不要太花',
  '想要高级感，但不要太浓',
  '今天心情低落，想要治愈一点',
  '适合拍照打卡，明亮、有氛围',
  '适合秋冬，温暖、木质',
  '想要海风感，清透、干净',
  '适合第一次体验，安全不出错',
  '像刚洗完澡，清洁、舒服',
  '有咖啡感，但不要太苦',
  '像校园午后，轻松、有茶感'
];

const scrollingPrompts = [...quickPrompts, ...quickPrompts];

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('zh');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(GenerateResponse & { debug?: string }) | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const qrCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!qrCanvas.current) return;
    QRCode.toCanvas(qrCanvas.current, window.location.origin, {
      width: 112,
      margin: 1,
      color: { dark: '#334155', light: '#ffffff' }
    });
  }, []);

  function tr(key: keyof typeof t) {
    return t[key][lang];
  }

  async function handleGenerate(nextInput?: string) {
    const message = (nextInput ?? input).trim();
    if (!message) return;

    const userMessage: ChatMessage = { role: 'user', content: message };
    const nextHistory = [...history, userMessage];

    setLoading(true);
    setError('');
    setFeedbackStatus('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, sessionId, currentFormula: result?.formula })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Generation failed');

      const reply = data.mode === 'fallback' && !data.replyText ? tr('fallbackReply') : (data.replyText || '');
      const assistantMessage: ChatMessage = { role: 'assistant', content: reply };

      setHistory([...nextHistory, assistantMessage]);
      setResult(data);
      setSessionId(data.sessionId || sessionId);
      setInput('');
      setRating(0);
      setComment('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setHistory([]);
    setResult(null);
    setSessionId('');
    setError('');
    setInput('');
    setRating(0);
    setComment('');
    setFeedbackStatus('');
  }

  async function handleFeedback() {
    if (!result || !rating) return;
    setFeedbackStatus('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: result.sessionId,
          rating,
          comment
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Feedback failed');
      setFeedbackStatus(tr('feedbackThanks'));
    } catch (e) {
      setFeedbackStatus(e instanceof Error ? e.message : 'Feedback failed');
    }
  }

  return (
    <main className="booth-page relative min-h-screen overflow-hidden text-slate-900">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="booth-aurora booth-aurora-a" />
        <div className="booth-aurora booth-aurora-b" />
        <div className="booth-aurora booth-aurora-c" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6">
        <header className="booth-glass-strong grid min-w-0 gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.25em] text-fuchsia-700">{tr('siteTitle')}</p>
            <h1 className="mt-2 text-3xl font-semibold md:text-5xl">{tr('heroTitle')}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">{tr('heroDesc')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-fuchsia-100 bg-white/90 p-2 shadow-lg">
              <canvas ref={qrCanvas} className="rounded" />
              <p className="mt-1 text-center text-xs text-slate-500">{tr('qrHint')}</p>
            </div>
            <div className="flex overflow-hidden rounded-2xl border border-fuchsia-200 bg-white/80 shadow-lg">
              <button onClick={() => setLang('zh')} className={lang === 'zh' ? 'bg-slate-900 px-3 py-2 text-sm text-white' : 'px-3 py-2 text-sm text-slate-600'}>中文</button>
              <button onClick={() => setLang('en')} className={lang === 'en' ? 'bg-slate-900 px-3 py-2 text-sm text-white' : 'px-3 py-2 text-sm text-slate-600'}>EN</button>
            </div>
            <div className="rounded-2xl border border-fuchsia-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-lg backdrop-blur">
              {result?.mode === 'llm' ? tr('modeLLM') : tr('modeFallback')}
            </div>
          </div>
        </header>

        <section className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 space-y-5">
            <Panel>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">{tr('quickTitle')}</h2>
                <span className="text-xs text-slate-500">{tr('quickHint')}</span>
              </div>
              <div className="quick-prompt-rail mt-3">
                <div className="quick-prompt-track">
                  {scrollingPrompts.map((prompt, idx) => (
                    <button
                      key={`${prompt}-${idx}`}
                      onClick={() => handleGenerate(prompt)}
                      disabled={loading}
                      className="quick-prompt-chip rounded-full border border-fuchsia-200 bg-white/75 px-4 py-2 text-sm text-fuchsia-900 shadow-sm transition hover:bg-fuchsia-50 disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel>
              <label className="block text-base font-semibold">{tr('inputLabel')}</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                className="mt-3 min-h-[150px] w-full resize-none rounded-2xl border border-fuchsia-100 bg-white/90 p-4 text-sm outline-none transition focus:border-fuchsia-400"
                placeholder={tr('inputPlaceholder')}
              />
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleGenerate()}
                  disabled={loading || !input.trim()}
                  className="rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-5 py-3 text-sm font-medium text-white shadow-[0_12px_32px_rgba(217,70,239,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? tr('btnLoading') : history.length ? tr('btnContinue') : tr('btnFirst')}
                </button>
                <button
                  onClick={handleReset}
                  className="rounded-2xl border border-fuchsia-100 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-fuchsia-50"
                >
                  {tr('btnReset')}
                </button>
                <span className="text-sm text-slate-500">{tr('hintFollowUp')}</span>
              </div>
              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
              {result?.debug ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  <div className="font-semibold">{tr('debugTitle')}</div>
                  <div>{result.debug}</div>
                </div>
              ) : null}
            </Panel>

            <Panel>
              <h2 className="text-base font-semibold">{tr('historyTitle')}</h2>
              <div className="mt-3 max-h-[300px] space-y-3 overflow-auto">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-500">{tr('historyEmpty')}</p>
                ) : (
                  history.map((msg, idx) => (
                    <div key={idx} className={msg.role === 'user' ? 'rounded-2xl border border-fuchsia-100 bg-gradient-to-r from-fuchsia-100 to-pink-100 p-3 text-sm' : 'rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-violet-100 p-3 text-sm'}>
                      <p className="mb-1 text-xs font-medium text-slate-500">{msg.role === 'user' ? tr('roleYou') : tr('roleAgent')}</p>
                      <p className="leading-6">{msg.content}</p>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>

          <section className="min-w-0 space-y-5">
            <Panel>
              <h2 className="text-2xl font-semibold">{tr('resultTitle')}</h2>
              <p className="mt-2 text-sm text-slate-600">{tr('resultHint')}</p>
              {loading ? (
                <div className="mt-5 space-y-3">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="h-16 animate-pulse rounded-2xl bg-white/60" />
                  ))}
                </div>
              ) : !result ? (
                <p className="mt-5 rounded-2xl border border-white/60 bg-white/60 p-5 text-sm text-slate-500">{tr('resultEmpty')}</p>
              ) : (
                <div className="mt-5 space-y-5">
                  <Block title={tr('blockAIReply')}>
                    <p className="text-sm leading-6">{result.replyText}</p>
                  </Block>

                  <Block title={tr('blockBlending')}>
                    <div className="space-y-3">
                      {result.formula.boothSteps.length > 0 ? (
                        result.formula.boothSteps.map((item, idx) => <StepRow key={`${item.material}-${idx}`} index={idx + 1} step={item} />)
                      ) : (
                        <p className="text-sm leading-6">{result.formula.blendingSuggestion.recommendedConcentration}</p>
                      )}
                      <p className="rounded-2xl border border-amber-200 bg-amber-50/90 p-3 text-sm leading-6 text-amber-900">{result.formula.safetyNote}</p>
                    </div>
                  </Block>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Block title={tr('blockPositioning')}>
                      <Line label={tr('labelStyle')} value={result.formula.fragrancePositioning.style} />
                      <Line label={tr('labelKeywords')} value={result.formula.fragrancePositioning.keywords.join('、')} />
                      <Line label={tr('labelScenarios')} value={result.formula.fragrancePositioning.suitableScenarios.join('、')} />
                    </Block>

                    <Block title={tr('blockEffect')}>
                      <Line label={tr('labelOpening')} value={result.formula.finalEffect.opening} />
                      <Line label={tr('labelHeart')} value={result.formula.finalEffect.heart} />
                      <Line label={tr('labelDrydown')} value={result.formula.finalEffect.drydown} />
                      <Line label={tr('labelSillage')} value={result.formula.finalEffect.sillage} />
                      <Line label={tr('labelLongevity')} value={result.formula.finalEffect.longevity} />
                    </Block>
                  </div>

                  <Block title={tr('blockFormula')}>
                    <div className="grid gap-3 md:grid-cols-3">
                      <NotesSection title={tr('topNotes')} items={result.formula.formula.topNotes} />
                      <NotesSection title={tr('heartNotes')} items={result.formula.formula.heartNotes} />
                      <NotesSection title={tr('baseNotes')} items={result.formula.formula.baseNotes} />
                    </div>
                  </Block>
                </div>
              )}
            </Panel>

            {result ? (
              <Panel>
                <h2 className="text-base font-semibold">{tr('feedbackTitle')}</h2>
                <p className="mt-1 text-sm text-slate-500">{tr('feedbackHint')}</p>
                <div className="mt-3 flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() => setRating(score)}
                      className={score <= rating ? 'h-10 w-10 rounded-full bg-fuchsia-600 text-sm font-semibold text-white shadow-lg' : 'h-10 w-10 rounded-full border border-fuchsia-200 bg-white/80 text-sm font-semibold text-slate-600'}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mt-3 min-h-[86px] w-full resize-none rounded-2xl border border-fuchsia-100 bg-white/90 p-3 text-sm outline-none focus:border-fuchsia-400"
                  placeholder={tr('feedbackPlaceholder')}
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={handleFeedback}
                    disabled={!rating}
                    className="rounded-2xl bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {tr('feedbackSubmit')}
                  </button>
                  {feedbackStatus ? <span className="text-sm text-slate-600">{feedbackStatus}</span> : null}
                </div>
              </Panel>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="booth-glass min-w-0 p-5">
      {children}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="booth-inner-card p-4">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function StepRow({ index, step }: { index: number; step: BoothStep }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-fuchsia-100 bg-white/90 p-3 shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-violet-500 text-sm font-semibold text-white">{index}</div>
      <div>
        <p className="font-medium">{step.material}</p>
        <p className="mt-1 text-sm text-slate-600">{step.instruction}</p>
      </div>
      <div className="text-sm text-slate-500">{step.percentage}% · {step.distance}</div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm leading-6">
      <span className="mr-2 text-slate-500">{label}:</span>
      <span>{value || '-'}</span>
    </p>
  );
}

function NotesSection({ title, items }: { title: string; items: NoteItem[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={`${title}-${item.name}`} className="rounded-2xl border border-white/60 bg-white/85 px-3 py-2 text-sm shadow-sm">
            <div className="font-medium">{item.name}</div>
            <div className="mt-1 text-slate-500">{item.percentage}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
