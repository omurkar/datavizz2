import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Sparkles, Download, ArrowRight, AlertTriangle, CheckCircle2, Trash2, FileSpreadsheet, Eye, Loader2, Zap } from 'lucide-react';

export default function EdaPage() {
  const navigate = useNavigate();
  const { rawData, columns, tableName, cleanData, setCleanData, trashData, setTrashData, edaSummary, setEdaSummary, geminiValidation, setGeminiValidation, dbConfig, setCurrentSessionId } = useData();
  const { saveSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('idle'); // idle, cleaning, validating, done
  const [previewTab, setPreviewTab] = useState('clean'); // clean, trash, summary
  const edaTriggeredRef = useRef(false);

  // Only redirect if user manually navigated here without data (one-time check with delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!rawData || rawData.length === 0) {
        navigate('/connect');
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [edaError, setEdaError] = useState('');

  // Auto-run EDA when page loads with data (remove manual button)
  useEffect(() => {
    if (rawData && rawData.length > 0 && step === 'idle' && !edaTriggeredRef.current && !cleanData) {
      edaTriggeredRef.current = true;
      runEda();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData]);

  const runEda = async () => {
    setLoading(true);
    setStep('cleaning');
    setEdaError('');
    try {
      // Step 1: Run EDA
      const edaRes = await fetch('/api/eda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: rawData, columns }),
      });
      const edaData = await edaRes.json();

      if (edaData.success) {
        setCleanData(edaData.cleanData);
        setTrashData(edaData.trashData);
        setEdaSummary({ ...edaData.summary, edaStats: edaData.edaStats || {} });
        setStep('validating');

        // Step 2: Gemini validation
        try {
          const gemRes = await fetch('/api/gemini/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              summary: edaData.summary,
              originalRows: rawData.length,
              cleanRows: edaData.cleanData.length,
              trashRows: edaData.trashData.length,
              columns,
              edaStats: edaData.edaStats || {},
            }),
          });
          const gemData = await gemRes.json();
          setGeminiValidation(gemData.validation || gemData.message || 'Data validation complete.');
        } catch (gemErr) {
          console.warn('Gemini validation failed, continuing:', gemErr);
          setGeminiValidation('⚠️ AI validation unavailable. Data cleaning was completed successfully.');
        }
        setStep('done');

        // Save session to history (Firestore + LocalStorage)
        try {
          const resolvedName = tableName || dbConfig.database || 'Dataset';
          const sessionId = await saveSession({
            database: dbConfig.database || resolvedName,
            table: tableName || resolvedName,
            tableName: resolvedName,
            fileName: resolvedName,
            host: dbConfig.host || 'localhost',
            originalRows: rawData.length,
            cleanRows: edaData.cleanData.length,
            rowCount: edaData.cleanData.length,
            trashRows: edaData.trashData.length,
            columns,
            cleanData: edaData.cleanData.slice(0, 300),
            summary: edaData.summary,
            edaSummary: { ...edaData.summary, edaStats: edaData.edaStats || {} },
            createdAt: new Date().toISOString(),
          });
          if (sessionId) {
            setCurrentSessionId(sessionId);
          }
        } catch (e) {
          console.warn('Failed to save session:', e);
        }

        // Save summary .docx to C:\ErrorLog\{database}\
        try {
          await fetch('/api/save-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              database: dbConfig.database,
              table: tableName,
              summary: edaData.summary,
              edaStats: edaData.edaStats || {},
            }),
          });
        } catch (saveErr) {
          console.warn('Failed to save summary doc:', saveErr);
        }
      } else {
        setStep('idle');
        edaTriggeredRef.current = false;
        setEdaError(edaData.error || 'EDA failed. Please try again.');
      }
    } catch (err) {
      console.error('EDA error:', err);
      setStep('idle');
      edaTriggeredRef.current = false;
      setEdaError('EDA failed. Make sure the Python backend is running on port 5000.');
    }
    setLoading(false);
  };

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!rawData) return null;

  return (
    <div style={{ minHeight: '100vh', padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => navigate('/connect')} className="btn-secondary" style={{ padding: '10px 16px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
            <span className="gradient-text">EDA</span> & Data Cleaning
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Table: <strong>{tableName}</strong> • {rawData.length} rows • {columns.length} columns
          </p>
        </div>
      </div>

      {/* Steps Progress */}
      <div className="glass-card fade-in-up" style={{ maxWidth: '900px', margin: '0 auto 32px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', justifyContent: 'space-between' }}>
          {[
            { label: 'Data Loaded', icon: <FileSpreadsheet size={18} />, done: true },
            { label: 'Cleaning', icon: <Trash2 size={18} />, done: step === 'validating' || step === 'done', active: step === 'cleaning' },
            { label: 'AI Validation', icon: <Sparkles size={18} />, done: step === 'done', active: step === 'validating' },
            { label: 'Complete', icon: <CheckCircle2 size={18} />, done: step === 'done' },
          ].map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: s.done ? 'var(--success)' : s.active ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: s.done || s.active ? 'white' : 'var(--text-muted)',
                  border: `2px solid ${s.done ? 'var(--success)' : s.active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  transition: 'all 0.3s ease',
                }}>
                  {s.active ? <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> : s.icon}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '500', color: s.done || s.active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.label}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: '2px', margin: '0 8px', marginBottom: '22px', background: s.done ? 'var(--success)' : 'var(--border-color)', borderRadius: '1px', transition: 'all 0.5s ease' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Action buttons / Results */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Auto-running: show loading immediately (no idle button) */}
        {(step === 'idle' || step === 'cleaning' || step === 'validating') && step !== 'done' && (
          <div className="glass-card fade-in-up" style={{ padding: '48px', textAlign: 'center' }}>
            {edaError ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: 'rgba(225, 112, 85, 0.1)', border: '1px solid rgba(225, 112, 85, 0.3)', borderRadius: '12px', marginBottom: '24px', color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'left' }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} /> {edaError}
                </div>
                <button className="btn-primary pulse-glow" onClick={() => { edaTriggeredRef.current = false; runEda(); }} style={{ padding: '16px 36px', fontSize: '1rem' }} id="run-eda-btn">
                  <Sparkles size={20} /> Retry EDA
                </button>
              </>
            ) : (
              <>
                <div className="spinner" style={{ width: '50px', height: '50px', margin: '0 auto 24px' }} />
                <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '8px' }}>
                  {step === 'cleaning' ? 'Cleaning Your Data...' : step === 'validating' ? 'Gemini AI is Validating...' : 'Starting EDA...'}
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {step === 'cleaning' ? 'Removing duplicates, handling nulls, fixing data types...' : step === 'validating' ? 'AI is reviewing the cleaning quality and data validity...' : 'Preparing to clean and analyze your data...'}
                </p>
              </>
            )}
          </div>
        )}

        {step === 'done' && (
          <>
            {/* Stats */}
            <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Original Rows', value: rawData.length, color: 'var(--text-primary)' },
                { label: 'Clean Rows', value: cleanData?.length || 0, color: 'var(--success)' },
                { label: 'Removed Rows', value: trashData?.length || 0, color: 'var(--danger)' },
                { label: 'Columns', value: columns.length, color: 'var(--accent-secondary)' },
              ].map((s, i) => (
                <div key={i} className="kpi-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: s.color }}>{s.value}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Gemini Validation */}
            <div className="glass-card fade-in-up" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Sparkles size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Gemini AI Validation</h3>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {geminiValidation}
              </div>
            </div>

            {/* Preview Tabs */}
            <div className="glass-card fade-in-up" style={{ padding: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[
                  { key: 'clean', label: 'Clean Data', icon: <CheckCircle2 size={14} /> },
                  { key: 'trash', label: 'Trash Data', icon: <Trash2 size={14} /> },
                  { key: 'summary', label: 'Summary', icon: <Eye size={14} /> },
                ].map(tab => (
                  <button
                    key={tab.key}
                    className={`chip ${previewTab === tab.key ? 'active' : ''}`}
                    onClick={() => setPreviewTab(tab.key)}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {previewTab === 'summary' && edaSummary && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7' }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontWeight: '600' }}>What was fixed:</h4>
                  <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {edaSummary.steps?.map((s, i) => <li key={i}>{s}</li>) || <li>Data cleaning completed successfully</li>}
                  </ul>
                  {edaSummary.anomalies && edaSummary.anomalies !== 'No anomalies detected.' && (
                    <>
                      <h4 style={{ color: '#e17055', marginTop: '16px', marginBottom: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={16} /> Anomalies Detected:
                      </h4>
                      <div style={{ whiteSpace: 'pre-wrap', background: 'rgba(225, 112, 85, 0.08)', border: '1px solid rgba(225, 112, 85, 0.2)', borderRadius: '10px', padding: '12px 16px' }}>{edaSummary.anomalies}</div>
                    </>
                  )}
                  {edaSummary.downsides && (
                    <>
                      <h4 style={{ color: 'var(--warning)', marginTop: '16px', marginBottom: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={16} /> Issues in Original Data:
                      </h4>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{edaSummary.downsides}</p>
                    </>
                  )}
                  {edaSummary.improvements && (
                    <>
                      <h4 style={{ color: 'var(--success)', marginTop: '16px', marginBottom: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} /> Improvements Made:
                      </h4>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{edaSummary.improvements}</p>
                    </>
                  )}
                </div>
              )}

              {(previewTab === 'clean' || previewTab === 'trash') && (
                <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto', borderRadius: '10px' }}>
                  {(() => {
                    const data = previewTab === 'clean' ? cleanData : trashData;
                    if (!data || data.length === 0) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No data</p>;
                    // Use original column order from context, not Object.keys which can reorder
                    const cols = columns && columns.length > 0 ? columns : Object.keys(data[0]);
                    return (
                      <table className="data-table">
                        <thead>
                          <tr>{cols.map(c => <th key={c}>{c}</th>)}</tr>
                        </thead>
                        <tbody>
                          {data.slice(0, 50).map((row, i) => (
                            <tr key={i}>{cols.map(c => <td key={c}>{row[c] !== null && row[c] !== undefined ? row[c].toString() : ''}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="fade-in-up" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn-secondary" onClick={() => downloadCSV(cleanData, `${tableName}_clean.csv`)} id="download-clean-btn">
                <Download size={16} /> Download Clean Data
              </button>
              <button className="btn-secondary" onClick={() => downloadCSV(trashData, `${tableName}_trash.csv`)} id="download-trash-btn">
                <Download size={16} /> Download Trash Data
              </button>
              <div style={{ flex: 1 }} />
              {/* AUTO-VISUALIZE — primary Phase 5 CTA */}
              <button
                id="auto-visualize-btn"
                onClick={() => navigate('/auto-dashboard')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '11px 22px', borderRadius: 12, border: 'none',
                  cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                  background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                  color: '#fff', boxShadow: '0 4px 18px rgba(124,58,237,0.35)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,237,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 18px rgba(124,58,237,0.35)'; }}
              >
                <Zap size={16} /> Auto-Visualize Dashboard
              </button>
              <button className="btn-secondary" onClick={() => navigate('/customize')} id="proceed-dashboard-btn">
                Custom Builder <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
