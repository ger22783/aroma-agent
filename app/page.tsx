'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { BoothStep, ChatMessage, GenerateResponse, NoteItem } from '@/lib/types';
import { quickPrompts, type Lang, t } from '@/lib/i18n';

type PageProps = {
  searchParams?: { lang?: string | string[] };
};

export default function HomePage({ searchParams }: PageProps) {
  const requestedLang = Array.isArray(searchParams?.lang) ? searchParams?.lang[0] : searchParams?.lang;
  const [lang, setLang] = useState<Lang>(requestedLang === 'en' ? 'en' : 'zh');
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

  const prompts = useMemo(() => quickPrompts.map((prompt) => prompt[lang]), [lang]);
  const scrollingPrompts = useMemo(() => [...prompts, ...prompts], [prompts]);

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  }, [lang]);

  useEffect(() => {
    if (!qrCanvas.current) return;
    QRCode.toCanvas(qrCanvas.current, window.location.origin, {
      width: 104,
      margin: 1,
      color: { dark: '#3f394b', light: '#fffaf4' }
    });
  }, []);

  function tr(key: keyof typeof t) {
    return t[key][lang];
  }

  function changeLanguage(nextLang: Lang) {
    if (nextLang === lang) return;
    setLang(nextLang);
    setHistory([]);
    setResult(null);
    setSessionId('');
    setError('');
    setInput('');
    setRating(0);
    setComment('');
    setFeedbackStatus('');
    const url = new URL(window.location.href);
    url.searchParams.set('lang', nextLang);
    window.history.replaceState({}, '', url);
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
        body: JSON.stringify({ message, history, sessionId, currentFormula: result?.formula, lang })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || tr('genericError'));
      const reply = data.mode === 'fallback' && !data.replyText ? tr('fallbackReply') : (data.replyText || '');
      const assistantMessage: ChatMessage = { role: 'assistant', content: reply };
      setHistory([...nextHistory, assistantMessage]);
      setResult(data);
      setSessionId(data.sessionId || sessionId);
      setInput('');
      setRating(0);
      setComment('');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : tr('genericError'));
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
        body: JSON.stringify({ sessionId: result.sessionId, rating, comment })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || tr('genericError'));
      setFeedbackStatus(tr('feedbackThanks'));
    } catch (caughtError) {
      setFeedbackStatus(caughtError instanceof Error ? caughtError.message : tr('genericError'));
    }
  }

  const listSeparator = lang === 'en' ? ', ' : '、';

  return (
    <main className="booth-page">
      <div className="paper-grain" aria-hidden="true" />
      <div className="doodle doodle-orbit" aria-hidden="true" />
      <div className="doodle doodle-spark" aria-hidden="true">✦</div>

      <div className="booth-shell">
        <header className="site-header">
          <div className="brand-lockup">
            <img src="/brand/team-logo-westlake.png" alt="Westlake iGEM" className="brand-logo" />
            <div>
              <p className="brand-name">{tr('brandName')}</p>
              <p className="brand-team">{tr('brandTeam')}</p>
            </div>
          </div>
          <div className="header-actions">
            <span className="mode-pill"><span className="mode-dot" />{result?.mode === 'llm' ? tr('modeLLM') : tr('modeFallback')}</span>
            <div className="language-switch" aria-label="Language">
              <button onClick={() => changeLanguage('zh')} className={lang === 'zh' ? 'is-active' : ''}>ZH</button>
              <button onClick={() => changeLanguage('en')} className={lang === 'en' ? 'is-active' : ''}>EN</button>
            </div>
          </div>
        </header>

        <section className="hero-card">
          <div className="hero-copy">
            <p className="eyebrow">{tr('eyebrow')}</p>
            <h1>{tr('heroTitle')}</h1>
            <p className="hero-description">{tr('heroDesc')}</p>
            <div className="hand-line" aria-hidden="true" />
          </div>
          <div className="qr-card"><canvas ref={qrCanvas} /><p>{tr('qrHint')}</p></div>
          <img src="/brand/floral-mascot.gif" alt="" className="hero-mascot" aria-hidden="true" />
        </section>

        <section className="workspace-grid">
          <div className="left-column">
            <Panel>
              <div className="panel-heading-row">
                <div><p className="section-kicker">01 · INSPIRATION</p><h2>{tr('quickTitle')}</h2></div>
                <span className="panel-hint">{tr('quickHint')}</span>
              </div>
              <div className="quick-prompt-rail">
                <div className="quick-prompt-track">
                  {scrollingPrompts.map((prompt, index) => (
                    <button key={`${prompt}-${index}`} onClick={() => handleGenerate(prompt)} disabled={loading} className="quick-prompt-chip">{prompt}</button>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel>
              <p className="section-kicker">02 · YOUR IDEA</p>
              <label className="input-label">{tr('inputLabel')}</label>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleGenerate();
                  }
                }}
                className="idea-input"
                placeholder={tr('inputPlaceholder')}
              />
              <div className="form-actions">
                <button onClick={() => handleGenerate()} disabled={loading || !input.trim()} className="primary-button">
                  {loading ? tr('btnLoading') : history.length ? tr('btnContinue') : tr('btnFirst')}
                </button>
                <button onClick={handleReset} className="secondary-button">{tr('btnReset')}</button>
              </div>
              <p className="follow-up-hint">{tr('hintFollowUp')}</p>
              {error ? <p className="error-message">{error}</p> : null}
              {result?.debug ? <div className="debug-card"><strong>{tr('debugTitle')}</strong><span>{result.debug}</span></div> : null}
            </Panel>

            <Panel>
              <p className="section-kicker">03 · CONVERSATION</p>
              <h2>{tr('historyTitle')}</h2>
              <div className="history-list">
                {history.length === 0 ? <p className="empty-copy">{tr('historyEmpty')}</p> : history.map((message, index) => (
                  <div key={index} className={`message-card ${message.role === 'user' ? 'message-user' : 'message-agent'}`}>
                    <p className="message-role">{message.role === 'user' ? tr('roleYou') : tr('roleAgent')}</p>
                    <p>{message.content}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <section className="right-column">
            <Panel className="result-panel">
              <div className="result-heading">
                <div><p className="section-kicker">{tr('cardNumber')}</p><h2>{tr('resultTitle')}</h2></div>
                <span className="bottle-doodle" aria-hidden="true">♧</span>
              </div>
              <p className="result-hint">{tr('resultHint')}</p>
              {loading ? (
                <div className="loading-stack">{[0, 1, 2, 3].map((item) => <div key={item} />)}</div>
              ) : !result ? (
                <div className="result-empty"><img src="/brand/floral-mascot.gif" alt="" aria-hidden="true" /><p>{tr('resultEmpty')}</p></div>
              ) : (
                <div className="result-content">
                  <Block title={tr('blockAIReply')}><p>{result.replyText}</p></Block>
                  <Block title={tr('blockBlending')}>
                    <div className="step-list">
                      {result.formula.boothSteps.length > 0
                        ? result.formula.boothSteps.map((item, index) => <StepRow key={`${item.material}-${index}`} index={index + 1} step={item} />)
                        : <p>{result.formula.blendingSuggestion.recommendedConcentration}</p>}
                    </div>
                    <p className="safety-note">{result.formula.safetyNote}</p>
                  </Block>
                  <div className="two-up">
                    <Block title={tr('blockPositioning')}>
                      <Line label={tr('labelStyle')} value={result.formula.fragrancePositioning.style} />
                      <Line label={tr('labelKeywords')} value={result.formula.fragrancePositioning.keywords.join(listSeparator)} />
                      <Line label={tr('labelScenarios')} value={result.formula.fragrancePositioning.suitableScenarios.join(listSeparator)} />
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
                    <div className="notes-grid">
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
                <p className="section-kicker">04 · FEEDBACK</p>
                <h2>{tr('feedbackTitle')}</h2>
                <p className="panel-hint feedback-hint">{tr('feedbackHint')}</p>
                <div className="rating-row">
                  {[1, 2, 3, 4, 5].map((score) => <button key={score} onClick={() => setRating(score)} className={score <= rating ? 'is-selected' : ''}>{score}</button>)}
                </div>
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} className="feedback-input" placeholder={tr('feedbackPlaceholder')} />
                <div className="feedback-actions">
                  <button onClick={handleFeedback} disabled={!rating} className="primary-button small">{tr('feedbackSubmit')}</button>
                  {feedbackStatus ? <span>{feedbackStatus}</span> : null}
                </div>
              </Panel>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`paper-panel ${className}`}>{children}</div>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="result-block"><h3>{title}</h3>{children}</section>;
}

function StepRow({ index, step }: { index: number; step: BoothStep }) {
  return (
    <div className="step-row">
      <div className="step-number">{index}</div>
      <div><p className="step-material">{step.material}</p><p className="step-instruction">{step.instruction}</p></div>
      <div className="step-meta">{step.percentage}% · {step.distance}</div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return <p className="detail-line"><span>{label}</span>{value || '-'}</p>;
}

function NotesSection({ title, items }: { title: string; items: NoteItem[] }) {
  return (
    <div className="notes-section">
      <p className="notes-title">{title}</p>
      {items.map((item) => <div key={`${title}-${item.name}`} className="note-card"><strong>{item.name}</strong><span>{item.percentage}%</span></div>)}
    </div>
  );
}
