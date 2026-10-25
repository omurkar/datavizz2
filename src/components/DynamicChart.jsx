import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Sparkles, Info, Code2, MessageSquare, Lightbulb, Filter } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import NLGInsight from './NLGInsight';

// ── Palette ──────────────────────────────────────────────────
const PALETTE = [
  '#7c3aed', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316',
];

// ── Tooltip ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '0.8rem',
      color: 'var(--text)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    }}>
      {label && <p style={{ color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || PALETTE[i], margin: '2px 0' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </p>
      ))}
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
        Tip: Click to cross-filter · Shift+Click to annotate
      </div>
    </div>
  );
}

// ── Scatter Tooltip ──────────────────────────────────────────
function ScatterTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text)',
    }}>
      <p>x: <strong>{d?.x}</strong></p>
      <p>y: <strong>{d?.y}</strong></p>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
        Tip: Click to filter · Shift+Click to annotate
      </div>
    </div>
  );
}

// ── PIE label ────────────────────────────────────────────────
function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={600} style={{ pointerEvents: 'none' }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ── Axis tick formatter ───────────────────────────────────────
const shortTick = (v) => {
  if (typeof v === 'number') {
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
    return v;
  }
  const s = String(v);
  return s.length > 10 ? s.slice(0, 9) + '…' : s;
};

// ── MAIN COMPONENT ───────────────────────────────────────────
export default function DynamicChart({
  config,
  height = 240,
  onViewCode,
  onAnnotate,
  showInsightDefault = true,
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [showInsight, setShowInsight] = useState(showInsightDefault);

  const filterContext = useFilters();
  const filters = filterContext?.filters || {};
  const applyFilter = filterContext?.applyFilter;
  const clearFilter = filterContext?.clearFilter;

  if (!config) return null;
  const { id: chartId, type, title, data = [], xAxis, yAxis } = config;

  const filterDim = xAxis || 'name';
  const activeValue = filters[filterDim];
  const hasActiveFilter = activeValue !== undefined;

  const handleItemClick = (entry, event) => {
    if (event?.shiftKey && onAnnotate) {
      onAnnotate({ chartId, xValue: entry?.name || entry?.x || '', yValue: entry?.value || entry?.y || '' });
      return;
    }
    if (applyFilter && filterDim) {
      const val = entry?.name !== undefined ? entry.name : entry?.x;
      if (val !== undefined) applyFilter(filterDim, val);
    }
  };

  const axisStyle = {
    tick: { fill: 'var(--text-muted)', fontSize: 11 },
    axisLine: { stroke: 'var(--border)' },
    tickLine: false,
  };

  const gridStyle = { stroke: 'var(--border)', strokeOpacity: 0.5, strokeDasharray: '3 3' };

  const withContainer = (chart) => (
    <ResponsiveContainer width="100%" height={height}>
      {chart}
    </ResponsiveContainer>
  );

  // ── Render by type ───────────────────────────────────────────
  let chartEl = null;
  const defaultMargin = { top: 12, right: 20, bottom: 24, left: 16 };

  if (type === 'line') {
    chartEl = withContainer(
      <LineChart
        data={data}
        margin={defaultMargin}
        onClick={(e) => {
          if (e && e.activePayload && e.activePayload[0]) {
            handleItemClick(e.activePayload[0].payload, e);
          }
        }}
      >
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="name" {...axisStyle} tickFormatter={shortTick} tickMargin={8} />
        <YAxis {...axisStyle} tickFormatter={shortTick} width={48} tickMargin={8} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone" dataKey="value" stroke={PALETTE[0]}
          strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: '#7c3aed' }}
        />
      </LineChart>
    );
  } else if (type === 'area') {
    chartEl = withContainer(
      <AreaChart
        data={data}
        margin={defaultMargin}
        onClick={(e) => {
          if (e && e.activePayload && e.activePayload[0]) {
            handleItemClick(e.activePayload[0].payload, e);
          }
        }}
      >
        <defs>
          <linearGradient id={`areaGrad-${chartId || 'default'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={PALETTE[0]} stopOpacity={0.35} />
            <stop offset="95%" stopColor={PALETTE[0]} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="name" {...axisStyle} tickFormatter={shortTick} tickMargin={8} />
        <YAxis {...axisStyle} tickFormatter={shortTick} width={48} tickMargin={8} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone" dataKey="value" stroke={PALETTE[0]} strokeWidth={2.5}
          fill={`url(#areaGrad-${chartId || 'default'})`} dot={false}
        />
      </AreaChart>
    );
  } else if (type === 'bar') {
    chartEl = withContainer(
      <BarChart
        data={data}
        margin={defaultMargin}
        barSize={Math.min(32, Math.floor(600 / Math.max(data.length, 1)))}
      >
        <CartesianGrid {...gridStyle} vertical={false} />
        <XAxis dataKey="name" {...axisStyle} tickFormatter={shortTick} tickMargin={8} />
        <YAxis {...axisStyle} tickFormatter={shortTick} width={48} tickMargin={8} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} cursor="pointer">
          {data.map((entry, i) => {
            const isSelected = hasActiveFilter && String(activeValue) === String(entry.name);
            const isDimmed = hasActiveFilter && !isSelected;
            return (
              <Cell
                key={i}
                fill={PALETTE[i % PALETTE.length]}
                opacity={isDimmed ? 0.3 : 1}
                stroke={isSelected ? '#ffffff' : 'none'}
                strokeWidth={isSelected ? 2 : 0}
                onClick={(e) => handleItemClick(entry, e)}
              />
            );
          })}
        </Bar>
      </BarChart>
    );
  } else if (type === 'scatter') {
    chartEl = withContainer(
      <ScatterChart
        margin={defaultMargin}
        onClick={(e) => {
          if (e && e.activePayload && e.activePayload[0]) {
            handleItemClick(e.activePayload[0].payload, e);
          }
        }}
      >
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="x" name={xAxis} {...axisStyle} tickFormatter={shortTick} tickMargin={8} />
        <YAxis dataKey="y" name={yAxis} {...axisStyle} tickFormatter={shortTick} width={48} tickMargin={8} />
        <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={data} fill={PALETTE[1]} opacity={0.8} cursor="pointer" />
      </ScatterChart>
    );
  } else if (type === 'pie') {
    chartEl = withContainer(
      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={Math.min(height * 0.38, 105)}
          innerRadius={Math.min(height * 0.18, 48)}
          paddingAngle={2}
          labelLine={false}
          label={renderPieLabel}
        >
          {data.map((entry, i) => {
            const isSelected = hasActiveFilter && String(activeValue) === String(entry.name);
            const isDimmed = hasActiveFilter && !isSelected;
            return (
              <Cell
                key={i}
                fill={PALETTE[i % PALETTE.length]}
                opacity={isDimmed ? 0.3 : 1}
                stroke={isSelected ? '#ffffff' : 'none'}
                strokeWidth={isSelected ? 2 : 0}
                onClick={(e) => handleItemClick(entry, e)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(v) => <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{v}</span>}
          iconSize={10}
          wrapperStyle={{ paddingTop: 8 }}
        />
      </PieChart>
    );
  } else {
    // Fallback to bar for unknown types
    chartEl = withContainer(
      <BarChart data={data} margin={defaultMargin}>
        <CartesianGrid {...gridStyle} />
        <XAxis dataKey="name" {...axisStyle} tickMargin={8} />
        <YAxis {...axisStyle} width={48} tickMargin={8} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" fill={PALETTE[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chart header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
              color: PALETTE[0], textTransform: 'uppercase', opacity: 0.9,
            }}>
              {type}
            </span>
            {hasActiveFilter && (
              <button
                onClick={() => clearFilter && clearFilter(filterDim)}
                style={{
                  fontSize: '0.65rem', fontWeight: 600, color: '#7c3aed',
                  background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
                  borderRadius: 12, padding: '1px 7px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}
                title="Click to remove cross-filter"
              >
                <Filter size={9} /> {String(activeValue)} ×
              </button>
            )}
          </div>
          <h3 style={{
            margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)',
            lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {title}
          </h3>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {/* Toggle NLG insight */}
          <button
            onClick={() => setShowInsight(v => !v)}
            style={{
              background: showInsight ? 'rgba(124,58,237,0.15)' : 'none',
              border: 'none', cursor: 'pointer',
              color: showInsight ? '#7c3aed' : 'var(--text-muted)',
              padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center',
            }}
            title={showInsight ? 'Hide automated insight' : 'Show automated insight'}
          >
            <Lightbulb size={13} />
          </button>

          {/* View SQL / Python Code */}
          {onViewCode && (
            <button
              onClick={() => onViewCode(config)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center',
              }}
              title="View SQL & Python Code"
            >
              <Code2 size={13} />
            </button>
          )}

          {/* Add annotation */}
          {onAnnotate && (
            <button
              onClick={() => onAnnotate({ chartId, xValue: xAxis || 'Data', yValue: '' })}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center',
              }}
              title="Add Annotation"
            >
              <MessageSquare size={13} />
            </button>
          )}

          {/* Column metadata */}
          {(xAxis || yAxis) && (
            <button
              onClick={() => setShowInfo(v => !v)}
              style={{
                background: showInfo ? 'var(--surface-alt)' : 'none',
                border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center',
              }}
              title="Column details"
            >
              <Info size={13} />
            </button>
          )}
        </div>
      </div>

      {showInfo && (
        <div style={{
          background: 'var(--surface-alt)', borderRadius: 8, padding: '5px 8px',
          marginBottom: 8, fontSize: '0.72rem', color: 'var(--text-muted)',
          display: 'flex', gap: 10,
        }}>
          {xAxis && <span>X: <strong style={{ color: 'var(--text)' }}>{xAxis}</strong></span>}
          {yAxis && <span>Y: <strong style={{ color: 'var(--text)' }}>{yAxis}</strong></span>}
          <span>{data.length} pts</span>
        </div>
      )}

      {/* Chart container */}
      <div style={{ flex: 1, minHeight: height }}>
        {data.length === 0 ? (
          <div style={{
            height, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: '0.85rem',
          }}>
            No data available
          </div>
        ) : chartEl}
      </div>

      {/* Optional NLG insight at bottom */}
      {showInsight && (
        <NLGInsight chartConfig={config} compact={true} />
      )}
    </div>
  );
}
