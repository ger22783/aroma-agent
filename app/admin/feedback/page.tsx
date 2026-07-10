import { listBoothRecords, summarizeSessions } from '@/lib/records';

export const dynamic = 'force-dynamic';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function noteLine(notes?: Array<{ name: string; percentage: number }>) {
  return notes?.map((item) => `${item.name} ${item.percentage}%`).join(' / ') || '-';
}

export default async function FeedbackAdminPage() {
  const records = await listBoothRecords(500);
  const sessions = summarizeSessions(records);
  const feedback = sessions.filter((session) => session.rating);
  const averageRating = feedback.length
    ? (feedback.reduce((sum, item) => sum + (item.rating || 0), 0) / feedback.length).toFixed(1)
    : '-';

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-fuchsia-300">Perfume Booth Admin</p>
            <h1 className="mt-2 text-3xl font-semibold">用户需求、配方与反馈</h1>
            <p className="mt-2 text-sm text-slate-400">按 session 汇总最近 500 条记录，数据持续写入 Neon Postgres。</p>
          </div>
          <a
            href="/api/records?format=csv"
            className="rounded-lg bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-fuchsia-950/40 hover:bg-fuchsia-400"
          >
            下载 CSV
          </a>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="体验人数" value={String(sessions.length)} />
          <SummaryCard label="反馈数" value={String(feedback.length)} />
          <SummaryCard label="平均评分" value={averageRating} />
          <SummaryCard label="原始记录" value={String(records.length)} />
        </section>

        <section className="space-y-4">
          {sessions.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-8 text-sm text-slate-400">
              暂无记录。访客生成配方或提交评分后会出现在这里。
            </div>
          ) : sessions.map((session) => {
            const formula = session.formula;
            return (
              <article key={session.sessionId} className="rounded-lg border border-slate-800 bg-slate-900/70">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>{formatDate(session.updatedAt)}</span>
                      <span className="font-mono">{session.sessionId}</span>
                      <span>{session.mode || '-'}</span>
                    </div>
                    <h2 className="text-base font-semibold">{formula?.fragrancePositioning?.style || '未命名配方'}</h2>
                  </div>
                  <div className="rounded-full border border-fuchsia-400/30 px-3 py-1 text-sm text-fuchsia-100">
                    评分 {session.rating || '-'}
                  </div>
                </div>

                <div className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr]">
                  <section className="space-y-3">
                    <Block title="用户需求">
                      <p>{session.userInput || '-'}</p>
                    </Block>
                    <Block title="AI 回复">
                      <p className="leading-6">{session.replyText || '-'}</p>
                    </Block>
                    <Block title="用户反馈">
                      <p>{session.comment || '尚未提交反馈'}</p>
                    </Block>
                  </section>

                  <section className="space-y-3">
                    <Block title="配方定位">
                      <p><span className="text-slate-500">风格：</span>{formula?.fragrancePositioning?.style || '-'}</p>
                      <p><span className="text-slate-500">关键词：</span>{formula?.fragrancePositioning?.keywords?.join('、') || '-'}</p>
                      <p><span className="text-slate-500">场景：</span>{formula?.fragrancePositioning?.suitableScenarios?.join('、') || '-'}</p>
                    </Block>
                    <Block title="配方结构">
                      <p><span className="text-slate-500">前调：</span>{noteLine(formula?.formula?.topNotes)}</p>
                      <p><span className="text-slate-500">中调：</span>{noteLine(formula?.formula?.heartNotes)}</p>
                      <p><span className="text-slate-500">后调：</span>{noteLine(formula?.formula?.baseNotes)}</p>
                    </Block>
                    <Block title="现场步骤">
                      <div className="space-y-1">
                        {formula?.boothSteps?.length ? formula.boothSteps.map((step, idx) => (
                          <p key={`${session.sessionId}-${idx}`}>
                            {idx + 1}. {step.material} {step.percentage}% · {step.distance} · {step.instruction}
                          </p>
                        )) : <p>-</p>}
                      </div>
                    </Block>
                  </section>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</h3>
      {children}
    </div>
  );
}
