/**
 * AutoDashboardPage — Phase 4 & 5: Zero-Click Auto-Visualization & 10 Advanced Features
 * 
 * Features integrated:
 *  1. Natural Language Querying (Chat-to-Chart)
 *  2. Automated Anomaly Detection
 *  3. Calculated Field Builder
 *  4. Cross-Filtering (FilterContext + Filter Bar)
 *  5. Data Transformation Lineage
 *  6. One-Click Presentation Export (PDF / PNG)
 *  7. Automated Text Insights (NLGInsight on each chart)
 *  8. Collaborative Annotations
 *  9. SQL & Python Code Export
 * 10. Threshold Alerts Manager
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFilters } from '../context/FilterContext';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import DynamicChart from '../components/DynamicChart';
import ChatToChart from '../components/ChatToChart';
import AnomalyDetector from '../components/AnomalyDetector';
import ExportPanel from '../components/ExportPanel';
import CodeViewer from '../components/CodeViewer';
import AlertsManager from '../components/AlertsManager';
import AnnotationPanel from '../components/AnnotationPanel';

import {
  BarChart3, Sparkles, Settings2, Trash2, ArrowLeft,
  Sun, Moon, LogOut, TrendingUp, Activity, Database, RefreshCw,
  GripVertical, X, CheckCircle2, Zap, Brain, MessageSquare,
  AlertTriangle, Download, Bell, Code2,
  Filter, Presentation, ChevronRight, Layers,
} from 'lucide-react';

// ── Loading step sequence ─────────────────────────────────────
const LOADING_STEPS = [
  { label: 'Cleaning Data',         icon: <RefreshCw size={18} />, color: '#7c3aed', ms: 0 },
  { label: 'Profiling Columns',     icon: <Database size={18} />,  color: '#3b82f6', ms: 900 },
  { label: 'Discovering Insights',  icon: <Brain size={18} />,     color: '#06b6d4', ms: 1800 },
  { label: 'Generating Dashboard',  icon: <Sparkles size={18} />,  color: '#10b981', ms: 2700 },
];

function LoadingSequence({ onDone }) {
  const [activeStep, setActiveStep] = useState(0);
  const [doneSteps, setDoneSteps] = useState([]);

  useEffect(() => {
    LOADING_STEPS.forEach((step, i) => {
      setTimeout(() => {
        setActiveStep(i);
        if (i > 0) setDoneSteps(prev => [...prev, i - 1]);
      }, step.ms);
    });
    setTimeout(() => {
      setDoneSteps([0, 1, 2, 3]);
      setTimeout(onDone, 300);
    }, 3600);
  }, [onDone]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: 40,
    }}>
      {/* Orbit animation */}
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid rgba(124,58,237,0.25)',
          animation: 'spin 3s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 10, borderRadius: '50%',
          border: '2px solid rgba(59,130,246,0.3)',
          animation: 'spin 2s linear infinite reverse',
        }} />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={36} color="#7c3aed" />
        </div>
      </div>

      {/* Step list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 280 }}>
        {LOADING_STEPS.map((step, i) => {
          const isDone   = doneSteps.includes(i);
          const isActive = activeStep === i && !isDone;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              opacity: i <= activeStep ? 1 : 0.3,
              transition: 'opacity 0.5s ease',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: isDone ? '#10b981' : isActive ? step.color : 'var(--surface-alt)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', transition: 'background 0.4s',
                flexShrink: 0,
                boxShadow: isActive ? `0 0 18px ${step.color}66` : 'none',
              }}>
                {isDone ? <CheckCircle2 size={18} /> : step.icon}
              </div>
              <span style={{
                color: isActive ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.95rem',
                transition: 'color 0.4s',
              }}>
                {step.label}
                {isActive && <span className="loading-dots">...</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────
function KpiCard({ kpi, index }) {
  const colors = ['#7c3aed', '#3b82f6', '#06b6d4', '#10b981'];
  const color  = colors[index % colors.length];
  return (
    <div className="glass-card" style={{
      padding: '20px 24px',
      borderLeft: `3px solid ${color}`,
      animation: `fadeSlideUp 0.5s ease ${index * 0.1}s both`,
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color, textTransform: 'uppercase',
        letterSpacing: '0.08em', marginBottom: 6 }}>
        {kpi.title}
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
        {kpi.value}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
        {kpi.trend}
      </div>
    </div>
  );
}

// ── Chart Tile (wrapper for grid) ───────────────────────────
function ChartTile({ config, editMode, onDelete, onViewCode, onAnnotate, style }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: 20,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
        ...style,
      }}
    >
      {editMode && (
        <div style={{
          position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, zIndex: 10,
        }}>
          <button
            onClick={() => onDelete(config.id)}
            style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: '#ef4444',
              display: 'flex', alignItems: 'center',
            }}
            title="Remove chart"
          >
            <X size={13} />
          </button>
          <div style={{
            background: 'var(--surface-alt)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '4px 6px', cursor: 'grab', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center',
          }}
            className="drag-handle" title="Drag to move"
          >
            <GripVertical size={13} />
          </div>
        </div>
      )}
      <DynamicChart
        config={config}
        height={230}
        onViewCode={onViewCode}
        onAnnotate={onAnnotate}
      />
    </div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────
const BACKEND_URL = 'http://localhost:5000';
const COLS = 12;

export default function AutoDashboardPage() {
  const navigate = useNavigate();
  const { logout, saveSession, updateSession } = useAuth();
  const { isDark, toggle } = useTheme();
  const {
    cleanData, columns, tableName, dataSource,
    autoDashboard, setAutoDashboard,
    autoDashboardStatus, setAutoDashboardStatus,
    autoDashboardError, setAutoDashboardError,
    editModeActive, setEditModeActive,
    currentSessionId, setCurrentSessionId,
  } = useData();

  const filterContext = useFilters();
  const filters = filterContext?.filters || {};
  const clearFilter = filterContext?.clearFilter;
  const clearAllFilters = filterContext?.clearAllFilters;
  const activeFilterCount = filterContext?.activeFilterCount || 0;

  const [showLoading, setShowLoading] = useState(false);
  const [charts, setCharts] = useState([]);
  const [kpiCards, setKpiCards] = useState([]);
  const [layout, setLayout] = useState([]);
  const [engineUsed, setEngineUsed] = useState('heuristic');
  const [metaInfo, setMetaInfo] = useState(null);
  const [containerWidth, setContainerWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth - 48 : 1200
  );

  // Advanced features modals state
  const [activeModal, setActiveModal] = useState(null); // 'chat' | 'anomaly' | 'export' | 'alerts'
  const [codeViewerChart, setCodeViewerChart] = useState(null);
  const [annotationState, setAnnotationState] = useState(null);
  const dashboardRef = useRef(null);

  // Track container width for responsive grid
  useEffect(() => {
    const handleResize = () => setContainerWidth(window.innerWidth - 48);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Fetch auto-dashboard config ───────────────────────────
  const fetchDashboard = useCallback(async (data, cols) => {
    setAutoDashboardStatus('loading');
    setShowLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auto-dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, columns: cols, use_llm: true }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Dashboard generation failed');

      setAutoDashboard(json.dashboard);
      const generatedCharts = json.dashboard.charts || [];
      const generatedKpis = json.dashboard.kpi_cards || [];
      const generatedMeta = json.dashboard.meta || null;
      setCharts(generatedCharts);
      setKpiCards(generatedKpis);
      setEngineUsed(generatedMeta?.engine || 'heuristic');
      setMetaInfo(generatedMeta);

      // Save/persist into History so the dashboard is immediately stored
      const chartConfigsList = generatedCharts.map(c => ({
        id: c.id,
        chartType: c.type,
        chartLabel: c.title,
        columns: [c.xAxis, c.yAxis].filter(Boolean),
        config: c,
      }));

      const resolvedName = tableName || 'Auto Dashboard';
      try {
        if (currentSessionId) {
          await updateSession(currentSessionId, {
            autoDashboard: json.dashboard,
            charts: generatedCharts,
            chartConfigs: chartConfigsList,
            kpiCards: generatedKpis,
            dashboardType: 'auto',
            tableName: resolvedName,
            table: resolvedName,
            database: resolvedName,
            rowCount: data.length,
            cleanRows: data.length,
            updatedAt: new Date().toISOString(),
          });
        } else {
          const sid = await saveSession({
            database: resolvedName,
            table: resolvedName,
            tableName: resolvedName,
            fileName: resolvedName,
            originalRows: data.length,
            cleanRows: data.length,
            rowCount: data.length,
            trashRows: 0,
            columns: cols || [],
            cleanData: data.slice(0, 300),
            autoDashboard: json.dashboard,
            charts: generatedCharts,
            chartConfigs: chartConfigsList,
            kpiCards: generatedKpis,
            dashboardType: 'auto',
            metaInfo: generatedMeta,
            createdAt: new Date().toISOString(),
          });
          if (sid) {
            setCurrentSessionId(sid);
          }
        }
      } catch (saveErr) {
        console.warn('Failed to save auto-dashboard to history:', saveErr);
      }

      // Build initial grid layout
      const initialLayout = (json.dashboard.charts || []).map((c, i) => ({
        i: c.id,
        x: (i % 2) * 6,
        y: Math.floor(i / 2) * 4,
        w: c.type === 'scatter' ? 6 : c.type === 'pie' ? 4 : 6,
        h: 4,
        minW: 3,
        minH: 3,
      }));
      setLayout(initialLayout);
      setAutoDashboardStatus('done');
    } catch (err) {
      setAutoDashboardError(err.message);
      setAutoDashboardStatus('error');
    }
  }, [setAutoDashboard, setAutoDashboardStatus, setAutoDashboardError, currentSessionId, saveSession, updateSession, setCurrentSessionId, tableName]);

  // Trigger on mount if data is available
  useEffect(() => {
    if (!cleanData) {
      navigate('/connect');
      return;
    }
    // If already loaded, restore from context
    if (autoDashboardStatus === 'done' && autoDashboard) {
      setCharts(autoDashboard.charts || []);
      setKpiCards(autoDashboard.kpi_cards || []);
      setEngineUsed(autoDashboard.meta?.engine || 'heuristic');
      setMetaInfo(autoDashboard.meta || null);
      const storedLayout = (autoDashboard.charts || []).map((c, i) => ({
        i: c.id, x: (i % 2) * 6, y: Math.floor(i / 2) * 4,
        w: c.type === 'scatter' ? 6 : c.type === 'pie' ? 4 : 6, h: 4, minW: 3, minH: 3,
      }));
      setLayout(storedLayout);
      return;
    }
    fetchDashboard(cleanData, columns);
  }, []); // eslint-disable-line

  const handleLoadingDone = () => setShowLoading(false);

  const handleDeleteChart = (chartId) => {
    setCharts(prev => {
      const updated = prev.filter(c => c.id !== chartId);
      if (currentSessionId) {
        updateSession(currentSessionId, {
          charts: updated,
          chartConfigs: updated.map(c => ({
            id: c.id,
            chartType: c.type,
            chartLabel: c.title,
            columns: [c.xAxis, c.yAxis].filter(Boolean),
            config: c,
          })),
        }).catch(err => console.warn('Failed to update session after chart delete:', err));
      }
      return updated;
    });
    setLayout(prev => prev.filter(l => l.i !== chartId));
  };

  const handleRefresh = () => fetchDashboard(cleanData, columns);

  const toolbarButtons = [
    { id: 'chat', label: 'Ask AI (Chat)', icon: <MessageSquare size={13} />, color: '#7c3aed', badge: 'LLM' },
    { id: 'anomaly', label: 'Anomaly Scan', icon: <Activity size={13} />, color: '#ef4444' },
    { id: 'alerts', label: 'Threshold Alerts', icon: <Bell size={13} />, color: '#f59e0b' },
    { id: 'export', label: 'Export Deck', icon: <Download size={13} />, color: '#8b5cf6' },
  ];

  // ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Top Nav (Clean navigation bar without tab buttons) */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 58,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart3 size={22} color="#7c3aed" />
          <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>DataViz Pro</span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={toggle} style={{
            background: 'var(--surface-alt)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center',
          }}>
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={logout} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 8,
            padding: '6px 12px', cursor: 'pointer', color: 'var(--text-muted)',
            fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </nav>

      <div style={{ padding: '28px 24px', maxWidth: 1400, margin: '0 auto' }}>
        {/* ── Loading Phase ── */}
        {autoDashboardStatus === 'loading' && showLoading && (
          <LoadingSequence onDone={handleLoadingDone} />
        )}

        {/* ── Error State ── */}
        {autoDashboardStatus === 'error' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '50vh', gap: 16,
          }}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <h2 style={{ margin: 0, color: 'var(--text)' }}>Dashboard Generation Failed</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 420, textAlign: 'center' }}>
              {autoDashboardError}
            </p>
            <button onClick={handleRefresh} className="btn-primary" style={{ gap: 8 }}>
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        )}

        {/* ── Dashboard Reveal ── */}
        {autoDashboardStatus === 'done' && !showLoading && (
          <>
            {/* Header row */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              marginBottom: 20, flexWrap: 'wrap', gap: 16,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Sparkles size={22} color="#7c3aed" />
                  <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                    Auto-Generated Dashboard
                  </h1>
                  <span style={{
                    background: engineUsed === 'llm' ? 'rgba(124,58,237,0.15)' : 'rgba(59,130,246,0.15)',
                    color: engineUsed === 'llm' ? '#7c3aed' : '#3b82f6',
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
                    padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase',
                  }}>
                    {engineUsed === 'llm' ? '✦ Gemini AI' : '⚙ Heuristic'}
                  </span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {metaInfo?.rows?.toLocaleString()} rows · {metaInfo?.columns?.length} columns
                  {tableName && ` · ${tableName}`}
                  {metaInfo?.cleaning_steps?.length > 0 && ` · ${metaInfo.cleaning_steps.length} auto-clean step(s)`}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={handleRefresh} style={{
                  background: 'var(--surface-alt)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '0.82rem',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <RefreshCw size={14} /> Regenerate
                </button>
                <button
                  onClick={() => setEditModeActive(v => !v)}
                  style={{
                    background: editModeActive ? 'rgba(124,58,237,0.15)' : 'var(--surface-alt)',
                    border: `1px solid ${editModeActive ? '#7c3aed' : 'var(--border)'}`,
                    borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                    color: editModeActive ? '#7c3aed' : 'var(--text-muted)',
                    fontSize: '0.82rem', fontWeight: editModeActive ? 700 : 500,
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.2s',
                  }}
                >
                  <Settings2 size={14} />
                  {editModeActive ? 'Done Editing' : 'Edit Layout'}
                </button>
              </div>
            </div>

            {/* ── Advanced Features Toolbar ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 12,
              marginBottom: 20, overflowX: 'auto',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                marginRight: 6, paddingRight: 10, borderRight: '1px solid var(--border)',
                whiteSpace: 'nowrap',
              }}>
                <Zap size={14} color="#7c3aed" /> Features
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}>
                {toolbarButtons.map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => setActiveModal(btn.id)}
                    style={{
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      borderRadius: 8, padding: '6px 12px',
                      cursor: 'pointer', color: 'var(--text)',
                      fontSize: '0.8rem', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 6,
                      whiteSpace: 'nowrap', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = btn.color;
                      e.currentTarget.style.background = `${btn.color}15`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--surface-alt)';
                    }}
                  >
                    <span style={{ color: btn.color }}>{btn.icon}</span>
                    <span>{btn.label}</span>
                    {btn.badge && (
                      <span style={{
                        background: btn.color, color: '#fff', fontSize: '0.62rem',
                        fontWeight: 700, padding: '1px 5px', borderRadius: 6,
                      }}>
                        {btn.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Active Cross-Filters Banner (Feature 4) ── */}
            {activeFilterCount > 0 && (
              <div style={{
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 12, padding: '10px 16px',
                marginBottom: 20, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Filter size={15} color="#7c3aed" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                    Active Cross-Filters ({activeFilterCount}):
                  </span>
                  {Object.entries(filters).map(([col, val]) => (
                    <span
                      key={col}
                      style={{
                        background: 'var(--surface)', border: '1px solid rgba(124,58,237,0.3)',
                        borderRadius: 16, padding: '3px 10px', fontSize: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)',
                      }}
                    >
                      <strong style={{ color: '#7c3aed' }}>{col}:</strong> {String(val)}
                      <button
                        onClick={() => clearFilter && clearFilter(col)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)', padding: 0, display: 'flex',
                        }}
                        title="Remove filter"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  onClick={clearAllFilters}
                  style={{
                    background: 'none', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '4px 10px', fontSize: '0.75rem',
                    cursor: 'pointer', color: 'var(--text-muted)',
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Edit mode banner */}
            {editModeActive && (
              <div style={{
                background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 12, padding: '12px 20px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 12,
                color: '#7c3aed', fontSize: '0.85rem',
              }}>
                <GripVertical size={16} />
                <strong>Edit Mode Active</strong> — Drag widgets to rearrange, resize from corners, or click × to remove.
              </div>
            )}

            {/* ── Capturable Dashboard Area (for Feature 6 Presentation Export) ── */}
            <div ref={dashboardRef} data-dashboard style={{ padding: '20px 24px', borderRadius: 16 }}>
              {/* ── KPI Strip ── */}
              {kpiCards.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(kpiCards.length, 4)}, 1fr)`,
                  gap: 16, marginBottom: 24,
                }}>
                  {kpiCards.map((kpi, i) => (
                    <KpiCard key={kpi.id} kpi={kpi} index={i} />
                  ))}
                </div>
              )}

              {/* ── Chart Grid ── */}
              {charts.length === 0 ? (
                <div className="glass-card" style={{
                  padding: 48, textAlign: 'center', color: 'var(--text-muted)',
                }}>
                  <BarChart3 size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                  <p>No charts were generated. Your dataset may have too few numeric or categorical columns.</p>
                  <button onClick={() => navigate('/customize')} className="btn-primary" style={{ marginTop: 16 }}>
                    Build Charts Manually
                  </button>
                </div>
              ) : editModeActive ? (
                /* ── Draggable / Resizable Edit Mode ── */
                <GridLayout
                  className="layout"
                  layout={layout}
                  cols={COLS}
                  rowHeight={72}
                  width={containerWidth}
                  onLayoutChange={setLayout}
                  draggableHandle=".drag-handle"
                  resizeHandles={['se']}
                  margin={[16, 16]}
                >
                  {charts.map(cfg => (
                    <div key={cfg.id}>
                      <ChartTile
                        config={cfg}
                        editMode
                        onDelete={handleDeleteChart}
                        onViewCode={(c) => setCodeViewerChart(c)}
                        onAnnotate={(a) => setAnnotationState(a)}
                        style={{ height: '100%' }}
                      />
                    </div>
                  ))}
                </GridLayout>
              ) : (
                /* ── Static Masonry-Style Grid ── */
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
                  gap: 20,
                }}>
                  {charts.map((cfg, i) => (
                    <div
                      key={cfg.id}
                      style={{
                        gridColumn: cfg.type === 'line' || cfg.type === 'area' ? 'span 2' : 'span 1',
                        animation: `fadeSlideUp 0.5s ease ${0.05 * i}s both`,
                      }}
                    >
                      <ChartTile
                        config={cfg}
                        editMode={false}
                        onDelete={handleDeleteChart}
                        onViewCode={(c) => setCodeViewerChart(c)}
                        onAnnotate={(a) => setAnnotationState(a)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Cleaning steps footer ── */}
            {metaInfo?.cleaning_steps?.length > 0 && (
              <div style={{
                marginTop: 32, background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                  color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>
                  <CheckCircle2 size={15} /> Auto-Cleaning Summary
                </div>
                <ul style={{ margin: 0, padding: '0 0 0 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {metaInfo.cleaning_steps.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Feature Modals ── */}
      {activeModal === 'chat' && (
        <ChatToChart onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'anomaly' && (
        <AnomalyDetector onClose={() => setActiveModal(null)} />
      )}

      {activeModal === 'alerts' && (
        <AlertsManager onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'export' && (
        <ExportPanel
          dashboardRef={dashboardRef}
          onClose={() => setActiveModal(null)}
        />
      )}
      {codeViewerChart && (
        <CodeViewer
          chartConfig={codeViewerChart}
          tableName={tableName || 'dataset'}
          onClose={() => setCodeViewerChart(null)}
        />
      )}
      {annotationState && (
        <AnnotationPanel
          chartId={annotationState.chartId}
          xValue={annotationState.xValue}
          yValue={annotationState.yValue}
          dashboardId={tableName || 'auto-dashboard'}
          onClose={() => setAnnotationState(null)}
        />
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .loading-dots {
          display: inline-block;
          animation: blink 1.2s step-start infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .react-resizable-handle {
          background: rgba(124,58,237,0.4);
          border-radius: 2px;
        }
        .react-grid-item.react-grid-placeholder {
          background: rgba(124,58,237,0.15) !important;
          border: 2px dashed #7c3aed !important;
          border-radius: 14px !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
