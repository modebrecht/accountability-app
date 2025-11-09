import type { TaskCompletion } from '../types/task'

type DailyCount = {
  date: string
  count: number
}

export type CompletionInsightsProps = {
  loading: boolean
  error: string | null
  streak: { current: number; best: number }
  last7Count: number
  last30Count: number
  dailySeries: DailyCount[]
  entries: TaskCompletion[]
}

export function CompletionInsights({
  loading,
  error,
  streak,
  last7Count,
  last30Count,
  dailySeries,
  entries
}: CompletionInsightsProps) {
  const maxCount = Math.max(...dailySeries.map((item) => item.count), 1)
  const recentEntries = entries.slice(0, 5)

  return (
    <section className="completion-insights">
      <div className="insights-header">
        <div>
          <p className="eyebrow">Completion insights</p>
          <h3>Your consistency snapshot</h3>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading completion history…</p> : null}

      <div className="insight-grid">
        <InsightCard label="Current streak" value={`${streak.current} day${streak.current === 1 ? '' : 's'}`} />
        <InsightCard label="Best streak" value={`${streak.best} day${streak.best === 1 ? '' : 's'}`} />
        <InsightCard label="Last 7 days" value={`${last7Count} completion${last7Count === 1 ? '' : 's'}`} />
        <InsightCard label="Last 30 days" value={`${last30Count} completion${last30Count === 1 ? '' : 's'}`} />
      </div>

      <div className="insight-chart">
        <p className="eyebrow">Daily completions · last {dailySeries.length} days</p>
        <div className="bar-chart" role="presentation">
          {dailySeries.map((day) => (
            <div key={day.date} className="bar">
              <div className="bar-fill" style={{ height: `${(day.count / maxCount) * 100 || 0}%` }} />
              <span className="bar-label">{formatDayLabel(day.date)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="insight-log">
        <p className="eyebrow">Recent completions</p>
        {!recentEntries.length ? (
          <p className="muted">No completion history yet.</p>
        ) : (
          <ul>
            {recentEntries.map((entry) => (
              <li key={entry.id}>
                <p className="task-title">{entry.tasks?.title ?? 'Untitled task'}</p>
                <p className="muted">{new Date(entry.completed_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

type InsightCardProps = {
  label: string
  value: string
}

function InsightCard({ label, value }: InsightCardProps) {
  return (
    <article className="insight-card">
      <p className="eyebrow">{label}</p>
      <p className="value">{value}</p>
    </article>
  )
}

function formatDayLabel(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`)
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}
