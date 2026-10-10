import { useEffect, useMemo, useState } from 'react'
import type { WorkoutSession } from '../types'
import { EmptyState } from '../components/EmptyState'
import { fetchRemoteSessions } from '../services/sessionsService'
import { filterSessions, formatDate, getExerciseRows } from '../services/progressService'

function csvValue(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function downloadCsv(rows: ReturnType<typeof getExerciseRows>) {
  const header = ['Data', 'Treino', 'Exercício', 'Séries válidas', 'Repetições', 'Carga máxima (kg)', 'Volume (kg)']
  const body = rows.map((row) => [
    formatDate(row.session.finishedAt ?? row.session.startedAt), row.session.workoutName, row.exercise.name, row.validSets,
    row.exercise.sets.map((set) => set.reps ?? '').join(' / '), row.sessionMaxLoad ?? '', row.totalVolume,
  ])
  const content = [header, ...body].map((line) => line.map(csvValue).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `myacademy-relatorio-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function printReport(rows: ReturnType<typeof getExerciseRows>, period: string) {
  const reportWindow = window.open('', '_blank', 'width=900,height=700')
  if (!reportWindow) return
  const totalVolume = rows.reduce((sum, row) => sum + row.totalVolume, 0)
  reportWindow.document.write(`<html><head><title>Relatório My Academy</title><style>body{font-family:Arial;color:#17211d;padding:32px}h1{margin-bottom:4px}p{color:#627069}table{border-collapse:collapse;width:100%;margin-top:24px}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{color:#557f24} </style></head><body><h1>Relatório de treinos</h1><p>Período: ${period === 'all' ? 'todo o período' : `últimos ${period} dias`} · Gerado em ${new Date().toLocaleString('pt-BR')}</p><p><strong>${rows.length}</strong> registros de exercícios · <strong>${totalVolume.toLocaleString('pt-BR')} kg</strong> de volume válido</p><table><thead><tr><th>Data</th><th>Treino</th><th>Exercício</th><th>Séries</th><th>Repetições</th><th>Carga máx.</th><th>Volume</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${formatDate(row.session.finishedAt ?? row.session.startedAt)}</td><td>${row.session.workoutName}</td><td>${row.exercise.name}</td><td>${row.validSets}</td><td>${row.exercise.sets.map((set) => set.reps ?? '—').join(' / ')}</td><td>${row.sessionMaxLoad === null ? '—' : `${row.sessionMaxLoad} kg`}</td><td>${row.totalVolume.toLocaleString('pt-BR')} kg</td></tr>`).join('')}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`)
  reportWindow.document.close()
}

export function Reports({ userId }: { userId?: string }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [period, setPeriod] = useState('all')
  const [error, setError] = useState('')
  useEffect(() => {
    if (!userId) return
    fetchRemoteSessions(userId).then(setSessions).catch((loadError: Error) => {
      setError(loadError.message)
      console.error('Não foi possível carregar os relatórios.', loadError)
    })
  }, [userId])
  const filteredSessions = useMemo(() => filterSessions(sessions, period), [period, sessions])
  const rows = useMemo(() => getExerciseRows(filteredSessions), [filteredSessions])
  const totalVolume = rows.reduce((sum, row) => sum + row.totalVolume, 0)
  const maxLoad = rows.reduce<number | null>((max, row) => row.sessionMaxLoad === null ? max : max === null ? row.sessionMaxLoad : Math.max(max, row.sessionMaxLoad), null)
  const exerciseVolumes = [...new Map(rows.reduce((items, row) => items.set(row.exercise.name, (items.get(row.exercise.name) ?? 0) + row.totalVolume), new Map<string, number>()))].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const loadRows = rows.filter((row) => row.sessionMaxLoad !== null).sort((a, b) => new Date(a.session.finishedAt ?? a.session.startedAt).getTime() - new Date(b.session.finishedAt ?? b.session.startedAt).getTime())
  const chartMaxLoad = loadRows.length ? Math.max(...loadRows.map((row) => row.sessionMaxLoad as number)) : 0
  if (!sessions.length && !error) return <EmptyState title="Relatórios em breve" description="Finalize sessões para gerar relatórios com dados reais." />
  return <div className="reports-page">{error && <div className="remote-error" role="alert"><strong>Não foi possível carregar os relatórios.</strong><span>{error}</span></div>}<div className="section-heading"><div><p className="eyebrow">ANÁLISE E EXPORTAÇÃO</p><h2>Relatórios</h2><p className="section-description">Resumo dos registros reais das sessões concluídas.</p></div></div><div className="report-toolbar"><label>Período<select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">Todo o período</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="365">Último ano</option></select></label><div className="report-actions"><button className="button-primary" onClick={() => downloadCsv(rows)} disabled={!rows.length}>Exportar CSV</button><button className="button-secondary" onClick={() => printReport(rows, period)} disabled={!rows.length}>Gerar PDF</button></div></div><div className="report-metrics"><div><span>Sessões</span><strong>{filteredSessions.length}</strong></div><div><span>Registros de exercícios</span><strong>{rows.length}</strong></div><div><span>Volume total</span><strong>{totalVolume ? `${totalVolume.toLocaleString('pt-BR')} kg` : '—'}</strong></div><div><span>Maior carga registrada</span><strong>{maxLoad === null ? '—' : `${maxLoad} kg`}</strong></div></div><section className="report-panel"><div className="panel-heading"><div><p className="eyebrow">PROGRESSÃO</p><h3>Carga máxima por registro</h3></div><small>carga registrada em uma série, não estimativa de força</small></div>{loadRows.length ? <div className="progression-chart">{loadRows.map((row) => <div className="progression-point" key={`${row.session.id}-${row.exercise.exerciseId}`}><div className="progression-bar-wrap"><div className="progression-bar" style={{ height: `${Math.max(8, ((row.sessionMaxLoad as number) / chartMaxLoad) * 100)}%` }} /></div><strong>{row.sessionMaxLoad} kg</strong><small>{formatDate(row.session.finishedAt ?? row.session.startedAt)}</small></div>)}</div> : <div className="history-inline-empty">Não há cargas válidas para gerar a progressão.</div>}</section><section className="report-panel"><div className="panel-heading"><div><p className="eyebrow">VOLUME POR EXERCÍCIO</p><h3>Distribuição do período</h3></div><small>kg acumulados em séries válidas</small></div>{exerciseVolumes.length ? <div className="volume-chart">{exerciseVolumes.map(([name, volume]) => <div className="volume-row" key={name}><span>{name}</span><div><i style={{ width: `${Math.max(4, (volume / exerciseVolumes[0][1]) * 100)}%` }} /></div><strong>{volume.toLocaleString('pt-BR')} kg</strong></div>)}</div> : <div className="history-inline-empty">Não há séries com carga e repetições válidas no período.</div>}</section><section className="report-panel"><div className="panel-heading"><div><p className="eyebrow">REGISTROS</p><h3>Detalhamento exportável</h3></div></div>{rows.length ? <div className="progression-table-wrap"><table className="progression-table"><thead><tr><th>Data</th><th>Exercício</th><th>Séries</th><th>Repetições</th><th>Carga máxima</th><th>Volume</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.session.id}-${row.exercise.exerciseId}`}><td>{formatDate(row.session.finishedAt ?? row.session.startedAt)}</td><td>{row.exercise.name}</td><td>{row.validSets}</td><td>{row.exercise.sets.map((set) => set.reps ?? '—').join(', ')}</td><td>{row.sessionMaxLoad === null ? '—' : `${row.sessionMaxLoad} kg`}</td><td>{row.totalVolume ? `${row.totalVolume.toLocaleString('pt-BR')} kg` : '—'}</td></tr>)}</tbody></table></div> : <div className="history-inline-empty">Nenhum registro no período selecionado.</div>}</section></div>
}
