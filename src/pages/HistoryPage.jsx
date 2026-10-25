import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  ArrowLeft, History, Database, Download, BarChart3, Calendar,
  Rows3, Columns, X, FileText, CheckCircle2, AlertTriangle, Sparkles, ChevronRight
} from 'lucide-react';

// ─── Summary Modal ───────────────────────────────────────────────────────────
function SummaryModal({ session, onClose }) {
  if (!session) return null;
  const summary = session.edaSummary || session.summary || {};
  const edaStats = summary.edaStats || {};

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-card fade-in-up"
        style={{
          width: '100%', maxWidth: '780px', maxHeight: '85vh',
          overflowY: 'auto', padding: '36px', position: 'relative',
          borderRadius: '20px',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(225,112,85,0.1)', border: '1px solid rgba(225,112,85,0.3)',
            borderRadius: '8px', color: '#e17055', cursor: 'pointer',
            padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'rgba(108,92,231,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={24} color="var(--accent-primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>
              <span className="gradient-text">EDA Summary</span> Report
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {session.database} → {session.table}
            </p>
          </div>
        </div>

        {/* Row Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Original Rows', value: summary.originalRows ?? session.originalRows ?? '—', color: 'var(--text-primary)' },
            { label: 'Clean Rows', value: summary.cleanRows ?? session.cleanRows ?? '—', color: 'var(--success)' },
            { label: 'Removed Rows', value: summary.trashRows ?? session.trashRows ?? '—', color: 'var(--danger)' },
          ].map((s, i) => (
            <div key={i} className="kpi-card" style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: s.color }}>{s.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Cleaning Steps */}
        {summary.steps && summary.steps.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--success)" /> Cleaning Steps Performed
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {summary.steps.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 14px', background: 'rgba(0,184,148,0.06)',
                  border: '1px solid rgba(0,184,148,0.15)', borderRadius: '10px',
                  fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5',
                }}>
                  <ChevronRight size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anomalies */}
        {summary.anomalies && summary.anomalies !== 'No anomalies detected.' && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#e17055' }}>
              <AlertTriangle size={18} /> Anomalies Detected
            </h3>
            <div style={{
              whiteSpace: 'pre-wrap', background: 'rgba(225,112,85,0.07)',
              border: '1px solid rgba(225,112,85,0.2)', borderRadius: '10px',
              padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.7',
            }}>
              {summary.anomalies}
            </div>
          </div>
        )}

        {/* Data Quality Issues */}
        {summary.downsides && summary.downsides !== 'No major issues found in the original data.' && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
              <AlertTriangle size={18} /> Data Quality Issues
            </h3>
            <div style={{
              whiteSpace: 'pre-wrap', background: 'rgba(253,203,110,0.07)',
              border: '1px solid rgba(253,203,110,0.2)', borderRadius: '10px',
              padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.7',
            }}>
              {summary.downsides}
            </div>
          </div>
        )}

        {/* Improvements */}
        {summary.improvements && summary.improvements !== 'Data quality was already good.' && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
              <Sparkles size={18} /> Improvements Made
            </h3>
            <div style={{
              whiteSpace: 'pre-wrap', background: 'rgba(0,184,148,0.06)',
              border: '1px solid rgba(0,184,148,0.15)', borderRadius: '10px',
              padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.7',
            }}>
              {summary.improvements}
            </div>
          </div>
        )}

        {/* Per-Column Stats */}
        {Object.keys(edaStats).length > 0 && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Columns size={18} color="var(--accent-secondary)" /> Column Statistics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
              {Object.entries(edaStats).map(([col, stats]) => (
                <div key={col} style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                  borderRadius: '12px', padding: '14px',
                }}>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--accent-primary)' }}>{col}</div>
                  {stats.type === 'numeric' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span>Min: <strong style={{ color: 'var(--text-primary)' }}>{stats.min}</strong></span>
                      <span>Max: <strong style={{ color: 'var(--text-primary)' }}>{stats.max}</strong></span>
                      <span>Mean: <strong style={{ color: 'var(--text-primary)' }}>{stats.mean}</strong></span>
                      <span>Median: <strong style={{ color: 'var(--text-primary)' }}>{stats.median}</strong></span>
                      <span>Std Dev: <strong style={{ color: 'var(--text-primary)' }}>{stats.std}</strong></span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span>Unique Values: <strong style={{ color: 'var(--text-primary)' }}>{stats.unique}</strong></span>
                      <span>Most Common: <strong style={{ color: 'var(--text-primary)' }}>{stats.top}</strong> ({stats.topCount}×)</span>
                      {stats.categories && stats.categories.length > 0 && (
                        <div style={{ marginTop: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Categories: </span>
                          <span style={{ color: 'var(--text-primary)' }}>{stats.categories.slice(0, 8).join(', ')}{stats.categories.length > 8 ? '...' : ''}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* If no summary data at all */}
        {!summary.steps && !summary.anomalies && !summary.downsides && Object.keys(edaStats).length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <FileText size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>No summary data available for this session.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>This session was created before summary storage was enabled. Run a new analysis to capture summaries.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main HistoryPage ─────────────────────────────────────────────────────────
export default function HistoryPage() {
  const navigate = useNavigate();
  const { getSessions, user } = useAuth();
  const {
    setCleanData, setColumns, setTableName, setChartConfigs,
    setEdaSummary, setCurrentSessionId, setAutoDashboard, setAutoDashboardStatus,
  } = useData();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summarySession, setSummarySession] = useState(null); // session to show in modal

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
    setLoading(false);
  };

  const downloadCSV = (session) => {
    const data = session.cleanData;
    if (!data || data.length === 0) {
      alert('No data available for this session');
      return;
    }
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.database || session.table || 'export'}_${session.table || 'data'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDashboard = (session) => {
    if (!session.cleanData || session.cleanData.length === 0) {
      alert('No data available for this session');
      return;
    }

    // Restore data into context
    setCleanData(session.cleanData);
    setColumns(session.columns || Object.keys(session.cleanData[0] || {}));
    const name = session.tableName || session.table || session.database || 'Dataset';
    setTableName(name);

    // Restore edaSummary if available
    if (session.edaSummary) {
      setEdaSummary(session.edaSummary);
    } else if (session.summary) {
      setEdaSummary(session.summary);
    }

    // Restore session ID so updates persist to this session
    setCurrentSessionId(session.id);

    // Restore autoDashboard if it exists
    if (session.autoDashboard) {
      setAutoDashboard(session.autoDashboard);
      setAutoDashboardStatus('done');
    }

    if (session.chartConfigs && session.chartConfigs.length > 0) {
      setChartConfigs(session.chartConfigs);
    } else if (session.charts && session.charts.length > 0) {
      setChartConfigs(session.charts.map(c => ({
        id: c.id,
        chartType: c.type,
        chartLabel: c.title,
        columns: [c.xAxis, c.yAxis].filter(Boolean),
        config: c,
      })));
    } else {
      const cols = session.columns || Object.keys(session.cleanData[0] || {});
      const autoConfigs = [];
      if (cols.length >= 1) {
        autoConfigs.push({ columns: [cols[0]], chartType: 'bar', chartLabel: 'Bar Chart', id: Date.now() });
      }
      if (cols.length >= 2) {
        autoConfigs.push({ columns: [cols[0], cols[1]], chartType: 'line', chartLabel: 'Multi-Line', id: Date.now() + 1 });
      }
      if (cols.length >= 1) {
        autoConfigs.push({ columns: [cols[Math.min(2, cols.length - 1)]], chartType: 'pie', chartLabel: 'Pie Chart', id: Date.now() + 2 });
      }
      setChartConfigs(autoConfigs);
    }

    if (session.dashboardType === 'auto' || session.autoDashboard) {
      navigate('/auto-dashboard');
    } else {
      navigate('/dashboard-view');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ minHeight: '100vh', padding: '32px' }}>
      {/* Summary Modal */}
      {summarySession && (
        <SummaryModal session={summarySession} onClose={() => setSummarySession(null)} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ padding: '10px 16px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
            <span className="gradient-text">Search</span> History
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Your previous analysis sessions</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card fade-in-up" style={{ maxWidth: '500px', margin: '0 auto', padding: '60px', textAlign: 'center' }}>
          <History size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '8px' }}>No History Yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Connect a database and run an analysis to see your history here.</p>
          <button className="btn-primary" onClick={() => navigate('/connect')}>
            <Database size={16} /> Connect Database
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sessions.map((session, i) => (
            <div key={session.id || i} className="glass-card fade-in-up" style={{ padding: '24px', animationDelay: `${i * 0.1}s` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                {/* Left: Session info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(108,92,231,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Database size={20} color="var(--accent-primary)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                        {session.tableName || session.database || session.table || 'Dataset'}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        Table / Source: {session.table || session.tableName || session.database || 'Uploaded Data'}
                      </p>
                    </div>
                    {/* Badge if this session has saved charts */}
                    {((session.chartConfigs && session.chartConfigs.length > 0) || (session.charts && session.charts.length > 0)) && (
                      <span style={{
                        marginLeft: '8px', padding: '3px 10px',
                        background: 'rgba(0,184,148,0.12)', border: '1px solid rgba(0,184,148,0.25)',
                        borderRadius: '20px', fontSize: '0.72rem', fontWeight: '600', color: 'var(--success)',
                      }}>
                        {session.chartConfigs?.length || session.charts?.length} chart{(session.chartConfigs?.length || session.charts?.length) > 1 ? 's' : ''} saved
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      <Calendar size={14} /> {formatDate(session.createdAt)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      <Rows3 size={14} /> {session.originalRows || session.cleanRows || '—'} → {session.cleanRows || session.rowCount || '—'} rows
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      <Columns size={14} /> {session.columns?.length || '—'} columns
                    </div>
                  </div>
                </div>

                {/* Right: Action buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* View Summary button */}
                  <button
                    className="btn-secondary"
                    onClick={() => setSummarySession(session)}
                    style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    id={`view-summary-btn-${i}`}
                  >
                    <FileText size={14} /> View Summary
                  </button>

                  {/* Download CSV */}
                  <button
                    className="btn-secondary"
                    onClick={() => downloadCSV(session)}
                    style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                  >
                    <Download size={14} /> CSV
                  </button>

                  {/* Export Dashboard */}
                  <button
                    className="btn-primary"
                    onClick={() => exportDashboard(session)}
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    id={`export-dashboard-btn-${i}`}
                  >
                    <BarChart3 size={14} /> Export Dashboard
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
