import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  ArrowLeft, PanelLeftClose, PanelLeftOpen, Palette, Columns, BarChart3,
  Download, Sparkles, TrendingUp, ChevronDown, ChevronUp, FileDown, Plug, X
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Color themes
const COLOR_THEMES = {
  purple: {
    name: 'Purple Nebula',
    colors: ['#6c5ce7', '#a29bfe', '#fd79a8', '#e84393', '#00cec9', '#55efc4'],
    bg: '#1a1a2e',
    kpiBg: 'linear-gradient(135deg, rgba(108,92,231,0.15), rgba(162,155,254,0.05))',
  },
  ocean: {
    name: 'Ocean Depths',
    colors: ['#0984e3', '#74b9ff', '#00cec9', '#55efc4', '#6c5ce7', '#a29bfe'],
    bg: '#0a1628',
    kpiBg: 'linear-gradient(135deg, rgba(9,132,227,0.15), rgba(116,185,255,0.05))',
  },
  sunset: {
    name: 'Sunset Glow',
    colors: ['#e17055', '#fab1a0', '#fdcb6e', '#ffeaa7', '#fd79a8', '#e84393'],
    bg: '#1a1215',
    kpiBg: 'linear-gradient(135deg, rgba(225,112,85,0.15), rgba(253,203,110,0.05))',
  },
};

const CHART_OPTIONS_SINGLE = [
  { value: 'bar', label: 'Bar' },
  { value: 'pie', label: 'Pie' },
  { value: 'area', label: 'Area' },
  { value: 'line', label: 'Line' },
];
const CHART_OPTIONS_MULTI = [
  { value: 'bar', label: 'Grouped Bar' },
  { value: 'line', label: 'Multi-Line' },
  { value: 'area', label: 'Stacked Area' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'radar', label: 'Radar' },
];

export default function DashboardView() {
  const navigate = useNavigate();
  const { cleanData, columns, chartConfigs, setChartConfigs, dashboardSettings, setDashboardSettings, tableName, currentSessionId, setCurrentSessionId } = useData();
  const { updateSession, saveSession } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('chart'); // chart, layout
  const [selectedChartIdx, setSelectedChartIdx] = useState(null);
  const [insights, setInsights] = useState({});
  const [insightLoading, setInsightLoading] = useState({});
  const [expandedInsight, setExpandedInsight] = useState({});
  const dashRef = useRef(null);

  const theme = COLOR_THEMES[dashboardSettings.colorTheme] || COLOR_THEMES.purple;

  // One-time guard: only redirect if user manually navigated here without data
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!cleanData || cleanData.length === 0 || chartConfigs.length === 0) {
        navigate('/customize');
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save chartConfigs to session history whenever they change
  const chartConfigsSaveRef = useRef(false);
  useEffect(() => {
    if (chartConfigs.length > 0 && cleanData) {
      // Debounce to avoid saving on every rapid change
      const timer = setTimeout(async () => {
        try {
          const resolvedName = tableName || 'Custom Dashboard';
          const configs = chartConfigs.map(c => ({
            columns: c.columns,
            chartType: c.chartType,
            chartLabel: c.chartLabel,
            id: c.id,
          }));

          if (currentSessionId) {
            await updateSession(currentSessionId, {
              chartConfigs: configs,
              dashboardSettings,
              dashboardType: 'custom',
              tableName: resolvedName,
              table: resolvedName,
              database: resolvedName,
              rowCount: cleanData.length,
              cleanRows: cleanData.length,
              updatedAt: new Date().toISOString(),
            });
          } else {
            const sid = await saveSession({
              database: resolvedName,
              table: resolvedName,
              tableName: resolvedName,
              fileName: resolvedName,
              originalRows: cleanData.length,
              cleanRows: cleanData.length,
              rowCount: cleanData.length,
              trashRows: 0,
              columns: columns || [],
              cleanData: cleanData.slice(0, 300),
              chartConfigs: configs,
              dashboardSettings,
              dashboardType: 'custom',
              createdAt: new Date().toISOString(),
            });
            if (sid) {
              setCurrentSessionId(sid);
            }
          }
        } catch (e) {
          console.warn('Failed to save chart configs to session:', e);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [chartConfigs, dashboardSettings, currentSessionId, cleanData, columns, tableName, updateSession, saveSession, setCurrentSessionId]);

  // Aggregate data for a chart config
  const getChartData = useCallback((config) => {
    if (!cleanData || cleanData.length === 0) return [];

    const cols = config.columns;
    
    // Helper: check if a column is numeric
    const isNumericCol = (col) => {
      const sample = cleanData.slice(0, 20);
      const numericCount = sample.filter(r => r[col] !== null && r[col] !== undefined && !isNaN(parseFloat(r[col]))).length;
      return numericCount > sample.length * 0.7;
    };

    if (cols.length === 1) {
      // Single column - count occurrences, sorted by count descending
      const col = cols[0];
      const counts = {};
      cleanData.forEach(row => {
        let val = row[col];
        if (val === null || val === undefined || val === '') val = 'N/A';
        const key = val.toString().trim();
        counts[key] = (counts[key] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([name, value]) => ({ name, value }));
    } else if (cols.length === 2) {
      const xCol = cols[0];
      const yCol = cols[1];
      const xIsNumeric = isNumericCol(xCol);
      const yIsNumeric = isNumericCol(yCol);

      if (!xIsNumeric && yIsNumeric) {
        // Categorical X + Numeric Y → Group by X, SUM Y values per group, sort by Y desc
        const grouped = {};
        const groupCount = {};
        cleanData.forEach(row => {
          let x = row[xCol];
          if (x === null || x === undefined || x === '') x = 'N/A';
          const key = x.toString().trim();
          const val = parseFloat(row[yCol]) || 0;
          if (!grouped[key]) { grouped[key] = 0; groupCount[key] = 0; }
          grouped[key] += val;
          groupCount[key] += 1;
        });
        return Object.entries(grouped)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 30)
          .map(([name, total]) => ({ name, [yCol]: Math.round(total * 100) / 100 }));
      } else if (xIsNumeric && yIsNumeric) {
        // Two numeric columns → scatter/line data (show individual points sorted by X)
        return cleanData
          .map(row => ({
            name: parseFloat(row[xCol]) || 0,
            [xCol]: parseFloat(row[xCol]) || 0,
            [yCol]: parseFloat(row[yCol]) || 0,
          }))
          .sort((a, b) => a.name - b.name)
          .slice(0, 200);
      } else {
        // Categorical X + Categorical Y → cross-count
        const grouped = {};
        cleanData.forEach(row => {
          let x = row[xCol];
          if (x === null || x === undefined || x === '') x = 'N/A';
          const key = x.toString().trim();
          if (!grouped[key]) grouped[key] = { name: key };
          const yVal = (row[yCol] || 'N/A').toString().trim();
          grouped[key][yVal] = (grouped[key][yVal] || 0) + 1;
        });
        return Object.values(grouped).slice(0, 30);
      }
    } else {
      // 3+ columns — first as X axis, rest as series (summed per X category)
      const xCol = cols[0];
      const xIsNumeric = isNumericCol(xCol);
      const grouped = {};
      cleanData.forEach(row => {
        let x = row[xCol];
        if (x === null || x === undefined || x === '') x = 'N/A';
        const key = xIsNumeric ? (parseFloat(x) || 0) : x.toString().trim();
        if (!grouped[key]) grouped[key] = { name: key };
        cols.slice(1).forEach(c => {
          const val = parseFloat(row[c]) || 0;
          grouped[key][c] = (grouped[key][c] || 0) + val;
        });
      });
      const result = Object.values(grouped);
      // Sort: by X if numeric, by total of Y values if categorical
      if (xIsNumeric) {
        result.sort((a, b) => a.name - b.name);
      } else {
        result.sort((a, b) => {
          const totalA = cols.slice(1).reduce((sum, c) => sum + (a[c] || 0), 0);
          const totalB = cols.slice(1).reduce((sum, c) => sum + (b[c] || 0), 0);
          return totalB - totalA;
        });
      }
      return result.slice(0, 30);
    }
  }, [cleanData]);

  // KPIs
  const getKPIs = useCallback(() => {
    if (!cleanData || cleanData.length === 0) return [];
    const numCols = columns.filter(c => cleanData.some(r => !isNaN(parseFloat(r[c]))));
    const kpis = [];

    kpis.push({ label: 'Total Records', value: cleanData.length.toLocaleString(), change: '+100%' });

    if (numCols.length > 0) {
      const col = numCols[0];
      const vals = cleanData.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
      const sum = vals.reduce((a, b) => a + b, 0);
      kpis.push({ label: `Total ${col}`, value: sum.toLocaleString(undefined, { maximumFractionDigits: 1 }), change: '' });
      const avg = sum / vals.length;
      kpis.push({ label: `Avg ${col}`, value: avg.toLocaleString(undefined, { maximumFractionDigits: 2 }), change: '' });
    } else {
      const uniqueVals = new Set(cleanData.map(r => r[columns[0]])).size;
      kpis.push({ label: `Unique ${columns[0]}`, value: uniqueVals.toLocaleString(), change: '' });
      kpis.push({ label: 'Columns', value: columns.length.toString(), change: '' });
    }

    return kpis;
  }, [cleanData, columns]);

  // Get AI insight for a chart
  const getInsight = async (idx) => {
    const config = chartConfigs[idx];
    const data = getChartData(config);
    if (!data.length) return;

    setInsightLoading(prev => ({ ...prev, [idx]: true }));

    try {
      const res = await fetch('/api/gemini/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartType: config.chartType, columns: config.columns, data: data.slice(0, 30) }),
      });
      const result = await res.json();
      setInsights(prev => ({ ...prev, [idx]: result.insight || result.message || 'No insight available.' }));
    } catch {
      // Fallback: local insight
      const maxItem = data.reduce((max, item) => item.value > (max.value || 0) ? item : max, data[0]);
      setInsights(prev => ({
        ...prev,
        [idx]: `📊 The highest value is "${maxItem.name}" with ${maxItem.value?.toLocaleString() || 'N/A'}. This represents the dominant category in this visualization.`
      }));
    }
    setInsightLoading(prev => ({ ...prev, [idx]: false }));
  };

  // Change chart type for a specific chart
  const changeChartType = (idx, newType) => {
    setChartConfigs(prev => prev.map((c, i) => i === idx ? { ...c, chartType: newType, chartLabel: newType } : c));
  };

  // Delete a chart from the dashboard
  const deleteChart = (idx) => {
    setChartConfigs(prev => prev.filter((_, i) => i !== idx));
    // Clean up insights for this chart and re-index
    setInsights(prev => {
      const newInsights = {};
      Object.keys(prev).forEach(key => {
        const k = parseInt(key);
        if (k < idx) newInsights[k] = prev[key];
        else if (k > idx) newInsights[k - 1] = prev[key];
      });
      return newInsights;
    });
    setSelectedChartIdx(null);
  };

  // Render a chart
  const renderChart = (config, idx) => {
    const data = getChartData(config);
    if (!data.length) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No data</p>;

    const colors = theme.colors;

    switch (config.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#9e9eb8', fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#9e9eb8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(108,92,231,0.3)', borderRadius: '10px', color: '#f0f0f5' }} />
              {config.columns.length === 1 ? (
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Bar>
              ) : (
                config.columns.slice(1).map((col, i) => (
                  <Bar key={col} dataKey={col} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                ))
              )}
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#9e9eb8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9e9eb8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(108,92,231,0.3)', borderRadius: '10px', color: '#f0f0f5' }} />
              {config.columns.length === 1 ? (
                <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} dot={{ fill: colors[0] }} />
              ) : (
                config.columns.slice(1).map((col, i) => (
                  <Line key={col} type="monotone" dataKey={col} stroke={colors[i % colors.length]} strokeWidth={2} />
                ))
              )}
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.slice(0, 8)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {data.slice(0, 8).map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(108,92,231,0.3)', borderRadius: '10px', color: '#f0f0f5' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#9e9eb8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9e9eb8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(108,92,231,0.3)', borderRadius: '10px', color: '#f0f0f5' }} />
              {config.columns.length === 1 ? (
                <Area type="monotone" dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} />
              ) : (
                config.columns.slice(1).map((col, i) => (
                  <Area key={col} type="monotone" dataKey={col} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.2} stackId="1" />
                ))
              )}
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        if (config.columns.length < 2) return <p style={{ color: 'var(--text-muted)' }}>Need 2+ columns for scatter</p>;
        return (
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#9e9eb8', fontSize: 11 }} name={config.columns[0]} />
              <YAxis dataKey={config.columns[1]} tick={{ fill: '#9e9eb8', fontSize: 11 }} name={config.columns[1]} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(108,92,231,0.3)', borderRadius: '10px', color: '#f0f0f5' }} />
              <Scatter data={data} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={data.slice(0, 8)}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="name" tick={{ fill: '#9e9eb8', fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fill: '#9e9eb8', fontSize: 10 }} />
              {config.columns.length === 1 ? (
                <Radar dataKey="value" stroke={colors[0]} fill={colors[0]} fillOpacity={0.3} />
              ) : (
                config.columns.slice(1).map((col, i) => (
                  <Radar key={col} dataKey={col} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.2} />
                ))
              )}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );
      default:
        return <p style={{ color: 'var(--text-muted)' }}>Unknown chart type</p>;
    }
  };

  // Export to PDF — single page, sized to fit all content
  const exportPDF = async () => {
    if (!dashRef.current) return;
    const canvas = await html2canvas(dashRef.current, {
      backgroundColor: '#0a0a0f',
      scale: 2,
      useCORS: true,
      scrollY: -window.scrollY,
      windowHeight: dashRef.current.scrollHeight,
      height: dashRef.current.scrollHeight,
    });
    const imgData = canvas.toDataURL('image/png');

    // Use landscape A4 width, but calculate height from actual content
    const pdfWidth = 297; // A4 landscape width in mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Create a single custom-sized page that fits everything
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'l' : 'p',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${tableName || 'dashboard'}_export.pdf`);
  };

  if (!cleanData || chartConfigs.length === 0) return null;

  const kpis = getKPIs();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '280px' : '0px',
        minWidth: sidebarOpen ? '280px' : '0px',
        background: 'var(--bg-secondary)',
        borderRight: sidebarOpen ? '1px solid var(--border-color)' : 'none',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>Dashboard Controls</h3>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['chart', 'layout'].map(tab => (
              <button
                key={tab}
                className={`chip ${sidebarTab === tab ? 'active' : ''}`}
                onClick={() => setSidebarTab(tab)}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
              >
                {tab === 'chart' ? <BarChart3 size={13} /> : <Palette size={13} />}
                {tab === 'chart' ? 'Chart Type' : 'Layout'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {sidebarTab === 'chart' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Click a chart below, then choose a new type:</p>
              {chartConfigs.map((cfg, idx) => (
                <div key={idx}>
                  <button
                    className={`chip ${selectedChartIdx === idx ? 'active' : ''}`}
                    onClick={() => setSelectedChartIdx(selectedChartIdx === idx ? null : idx)}
                    style={{ width: '100%', justifyContent: 'space-between', marginBottom: '6px' }}
                  >
                    <span>Chart {idx + 1}: {cfg.chartLabel || cfg.chartType}</span>
                    {selectedChartIdx === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {selectedChartIdx === idx && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '8px' }}>
                      {(cfg.columns.length === 1 ? CHART_OPTIONS_SINGLE : CHART_OPTIONS_MULTI).map(opt => (
                        <button
                          key={opt.value}
                          className={`chip ${cfg.chartType === opt.value ? 'active' : ''}`}
                          onClick={() => changeChartType(idx, opt.value)}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {sidebarTab === 'layout' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Color Theme */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '10px', color: 'var(--text-secondary)' }}>Color Theme</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(COLOR_THEMES).map(([key, t]) => (
                    <button
                      key={key}
                      className={`chip ${dashboardSettings.colorTheme === key ? 'active' : ''}`}
                      onClick={() => setDashboardSettings(prev => ({ ...prev, colorTheme: key }))}
                      style={{ justifyContent: 'flex-start', gap: '10px' }}
                    >
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {t.colors.slice(0, 4).map((c, i) => (
                          <div key={i} style={{ width: '14px', height: '14px', borderRadius: '50%', background: c }} />
                        ))}
                      </div>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Columns */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '10px', color: 'var(--text-secondary)' }}>Grid Columns</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[2, 3, 4].map(n => (
                    <button
                      key={n}
                      className={`chip ${dashboardSettings.gridCols === n ? 'active' : ''}`}
                      onClick={() => setDashboardSettings(prev => ({ ...prev, gridCols: n }))}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      {n} cols
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Dashboard */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-secondary" style={{ padding: '8px' }}>
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <button onClick={() => navigate('/customize')} className="btn-secondary" style={{ padding: '8px 14px' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              <span className="gradient-text">{tableName || 'Data'}</span> Dashboard
            </h2>
          </div>
          <button onClick={() => navigate('/connect')} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
            <Plug size={14} /> Connection Setup
          </button>
          <button onClick={exportPDF} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }} id="export-pdf-btn">
            <FileDown size={16} /> Export PDF
          </button>
        </div>

        {/* Dashboard Content */}
        <div ref={dashRef} style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {kpis.map((kpi, i) => (
              <div key={i} className="kpi-card" style={{ background: theme.kpiBg }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '6px', fontWeight: '500' }}>{kpi.label}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: theme.colors[0] }}>
                  {kpi.value}
                </div>
                {kpi.change && <div style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '4px' }}>{kpi.change}</div>}
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${dashboardSettings.gridCols}, 1fr)`, gap: '20px' }}>
            {chartConfigs.map((config, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '20px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                    {config.chartLabel || config.chartType} — {config.columns.join(', ')}
                  </h3>
                  <button
                    onClick={() => deleteChart(idx)}
                    title="Remove chart"
                    style={{
                      background: 'rgba(225, 112, 85, 0.1)',
                      border: '1px solid rgba(225, 112, 85, 0.25)',
                      borderRadius: '8px',
                      color: '#e17055',
                      cursor: 'pointer',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(225, 112, 85, 0.25)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(225, 112, 85, 0.1)'; }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {renderChart(config, idx)}

                {/* AI Insight */}
                <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  {!insights[idx] && !insightLoading[idx] && (
                    <button
                      className="chip"
                      onClick={() => getInsight(idx)}
                      style={{ fontSize: '0.75rem' }}
                    >
                      <Sparkles size={12} /> Get AI Insight
                    </button>
                  )}
                  {insightLoading[idx] && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> Generating insight...
                    </div>
                  )}
                  {insights[idx] && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.5' }}>
                      <Sparkles size={14} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      {insights[idx]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
