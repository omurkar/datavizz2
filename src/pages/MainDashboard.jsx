import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import {
  Database, History, LogOut, BarChart3, Sparkles, ArrowRight,
  Zap, FileDown, Sun, Moon, Upload, Clock, TrendingUp,
  Activity, Layers, ChevronRight, Table2, RefreshCw, CheckCircle2,
} from 'lucide-react';

// ── Mini Sparkline (pure SVG) ──────────────────────────────────
function Sparkline({ data = [], color = '#7c3aed', width = 80, height = 32 }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      <polyline
        points={`0,${height} ${pts.join(' ')} ${width},${height}`}
        fill={color}
        fillOpacity="0.1"
        stroke="none"
      />
    </svg>
  );
}

// ── Greeting by time-of-day ────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── KPI Metric Card ────────────────────────────────────────────
function MetricCard({ icon, label, value, sub, gradient, delay, sparkData }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="kpi-card fade-in-up"
      style={{ animationDelay: `${delay}ms`, display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: gradient, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'white', flexShrink: 0,
        }}>
          {icon}
        </div>
        {sparkData && <Sparkline data={sparkData} color="#a78bfa" />}
      </div>
      <div>
        <div className={visible ? 'count-up' : ''} style={{ fontSize: '1.7rem', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '500', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      </div>
      {sub && <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <TrendingUp size={13} /> {sub}
      </div>}
    </div>
  );
}

// ── Recent Session Row ─────────────────────────────────────────
function SessionRow({ session, onClick }) {
  const date = new Date(session.createdAt);
  const timeAgo = formatTimeAgo(date);
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
        transition: 'all 0.2s ease', border: '1px solid transparent',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
        background: 'var(--accent-gradient-soft)', border: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)',
      }}>
        <Table2 size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {session.tableName || session.table || session.fileName || session.database || 'Untitled Dataset'}
        </div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={11} /> {timeAgo}
          {(session.rowCount || session.cleanRows || session.originalRows) ? (
            <><span>·</span> {(session.rowCount || session.cleanRows || session.originalRows).toLocaleString()} rows</>
          ) : null}
        </div>
      </div>
      <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </div>
  );
}

function formatTimeAgo(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Quick Action Button ────────────────────────────────────────
function QuickAction({ icon, label, desc, onClick, gradient, delay }) {
  return (
    <div
      className="glass-card fade-in-up"
      onClick={onClick}
      style={{
        padding: '24px 22px', cursor: 'pointer',
        transition: 'all 0.25s ease', animationDelay: `${delay}ms`,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{
        width: '48px', height: '48px', background: gradient,
        borderRadius: '13px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginBottom: '14px', color: 'white',
        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '5px' }}>{label}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '14px' }}>{desc}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-secondary)', fontWeight: '600', fontSize: '0.82rem' }}>
        Open <ArrowRight size={14} />
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function MainDashboard() {
  const { user, logout, getSessions } = useAuth();
  const { resetAll } = useData();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activityData] = useState(() => Array.from({ length: 12 }, () => Math.floor(Math.random() * 40 + 5)));

  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Analyst';

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const s = await getSessions();
      setSessions(s);
    } catch {}
    setSessionsLoading(false);
  }, [getSessions]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleLogout = async () => {
    resetAll();
    await logout();
    navigate('/');
  };

  const totalRows = sessions.reduce((acc, s) => acc + (s.rowCount || s.cleanRows || s.originalRows || 0), 0);
  const chartsBuilt = sessions.reduce((acc, s) => acc + (s.chartConfigs?.length || s.charts?.length || (s.autoDashboard?.charts?.length) || 0), 0);

  const metrics = [
    {
      icon: <Activity size={20} />,
      label: 'Analysis Sessions',
      value: sessions.length,
      sub: sessions.length > 0 ? `Last ${formatTimeAgo(new Date(sessions[0]?.createdAt || Date.now()))}` : 'No sessions yet',
      gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
      delay: 100,
      sparkData: activityData,
    },
    {
      icon: <Table2 size={20} />,
      label: 'Total Rows Analyzed',
      value: totalRows > 1000 ? `${(totalRows / 1000).toFixed(1)}K` : totalRows.toString(),
      sub: 'Across all sessions',
      gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
      delay: 180,
    },
    {
      icon: <BarChart3 size={20} />,
      label: 'Charts Generated',
      value: chartsBuilt.toString(),
      sub: chartsBuilt > 0 ? 'Dashboards built' : 'Start visualizing',
      gradient: 'linear-gradient(135deg, #059669, #10b981)',
      delay: 260,
    },
    {
      icon: <Zap size={20} />,
      label: 'AI Insights',
      value: sessions.filter(s => s.geminiValidation).length.toString(),
      sub: 'Gemini-validated',
      gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
      delay: 340,
    },
  ];

  const quickActions = [
    {
      icon: <Database size={24} />,
      label: 'Connect Database',
      desc: 'Link MySQL or MS SQL and run automated EDA instantly',
      onClick: () => navigate('/connect'),
      gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      delay: 420,
    },
    {
      icon: <Upload size={24} />,
      label: 'Upload Excel / CSV',
      desc: 'Drag-and-drop a spreadsheet for automated analysis',
      onClick: () => navigate('/connect'),
      gradient: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
      delay: 500,
    },
    {
      icon: <Sparkles size={24} />,
      label: 'Auto-Visualize',
      desc: 'One-click: clean, profile, and generate a full dashboard instantly',
      onClick: () => navigate('/auto-dashboard'),
      gradient: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
      delay: 560,
    },
    {
      icon: <History size={24} />,
      label: 'Analysis History',
      desc: 'Browse previous sessions and re-export dashboards',
      onClick: () => navigate('/history'),
      gradient: 'linear-gradient(135deg, #059669, #10b981)',
      delay: 640,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── Top Bar ── */}
      <div className="fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', background: 'var(--accent-gradient)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={20} color="white" />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.3px' }}>
            <span className="gradient-text">DataViz</span> Pro
          </span>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: '9px', padding: '8px 12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
            id="dash-theme-toggle"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            {isDark ? 'Light' : 'Dark'}
          </button>

          {/* Refresh sessions */}
          <button
            onClick={loadSessions}
            className="btn-ghost"
            style={{ padding: '8px' }}
            title="Refresh"
          >
            <RefreshCw size={16} className={sessionsLoading ? 'animate-spin' : ''} />
          </button>

          {/* User avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '6px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--accent-primary)' }} />
            ) : (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: '700' }}>
                {firstName[0].toUpperCase()}
              </div>
            )}
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: '500' }}>
              {user?.displayName || user?.email?.split('@')[0]}
            </span>
          </div>

          {/* Logout */}
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }} id="logout-btn">
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>

      {/* ── Welcome Banner ── */}
      <div className="fade-in-up" style={{ marginBottom: '36px', animationDelay: '60ms' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500', marginBottom: '4px', letterSpacing: '0.02em' }}>
              {getGreeting()},
            </p>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1 }}>
              <span className="gradient-text">{firstName}</span> 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
              Your data analytics workspace — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {sessions.length > 0 && (
            <div className="badge badge-success" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              <CheckCircle2 size={13} /> {sessions.length} sessions active
            </div>
          )}
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '36px' }}>
        {metrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </div>

      {/* ── Main content grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

        {/* Quick Actions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={16} style={{ color: 'var(--accent-secondary)' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Quick Actions</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {quickActions.map((a, i) => <QuickAction key={i} {...a} />)}
          </div>

          {/* Platform stats strip */}
          <div className="fade-in-up glass-card" style={{ padding: '20px 24px', marginTop: '24px', animationDelay: '640ms' }}>
            <div style={{ display: 'flex', gap: '0', justifyContent: 'space-around' }}>
              {[
                { icon: <Zap size={18} />, label: 'AI Engine', value: 'Gemini 2.0' },
                { icon: <Layers size={18} />, label: 'Chart Types', value: '8+ Types' },
                { icon: <FileDown size={18} />, label: 'Export', value: 'PDF & CSV' },
                { icon: <Database size={18} />, label: 'Sources', value: 'DB + Excel' },
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '0 12px', borderRight: i < 3 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <div style={{ color: 'var(--accent-primary)', display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '2px' }}>{stat.value}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Sessions Panel */}
        <div className="fade-in-up glass-card" style={{ padding: '0', animationDelay: '380ms', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={15} style={{ color: 'var(--accent-secondary)' }} />
              <h2 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Recent Datasets</h2>
            </div>
            <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => navigate('/history')}>
              View all <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ padding: '8px' }}>
            {sessionsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                <div className="spinner" style={{ width: '28px', height: '28px' }} />
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{
                  width: '52px', height: '52px', margin: '0 auto 14px',
                  background: 'var(--accent-gradient-soft)', borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-secondary)',
                }}>
                  <Database size={24} />
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
                  No datasets yet.<br />Connect a database or upload a file.
                </p>
                <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '8px 16px' }} onClick={() => navigate('/connect')}>
                  Get Started <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              sessions.slice(0, 6).map((s, i) => (
                <SessionRow key={s.id || i} session={s} onClick={() => navigate('/history')} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
