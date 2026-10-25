/**
 * ExportPanel — Feature 6: One-Click Presentation Export
 * Exports the dashboard to PDF using html2canvas + jspdf.
 */
import React, { useState } from 'react';
import { Download, FileText, Presentation, X, Check, Loader2, Image } from 'lucide-react';

export default function ExportPanel({ onClose, dashboardRef }) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  const exportPDF = async () => {
    setExporting(true); setDone(''); setError('');
    const prevScrollX = window.scrollX;
    const prevScrollY = window.scrollY;
    try {
      // Scroll to (0,0) before snapshot to eliminate bounding box viewport clipping
      window.scrollTo(0, 0);

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const target = dashboardRef?.current || document.querySelector('[data-dashboard]') || document.body;
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0f172a',
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * {
              animation: none !important;
              transition: none !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const margin = 24; // Generous document margins
      const contentWidth = canvas.width;
      const contentHeight = canvas.height;
      const pageWidth = contentWidth + margin * 2;
      const pageHeight = contentHeight + margin * 2;
      const isLandscape = pageWidth >= pageHeight;

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [pageWidth, pageHeight],
        hotfixes: ['px_scaling'],
      });

      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      pdf.save('DataViz-Pro-Dashboard.pdf');
      setDone('PDF exported successfully!');
    } catch (e) {
      setError('Export failed: ' + e.message);
    } finally {
      window.scrollTo(prevScrollX, prevScrollY);
      setExporting(false);
    }
  };

  const exportPNG = async () => {
    setExporting(true); setDone(''); setError('');
    const prevScrollX = window.scrollX;
    const prevScrollY = window.scrollY;
    try {
      window.scrollTo(0, 0);
      const html2canvas = (await import('html2canvas')).default;
      const target = dashboardRef?.current || document.querySelector('[data-dashboard]') || document.body;
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0f172a',
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * {
              animation: none !important;
              transition: none !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        },
      });
      const link = document.createElement('a');
      link.download = 'DataViz-Pro-Dashboard.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDone('PNG exported successfully!');
    } catch (e) {
      setError('Export failed: ' + e.message);
    } finally {
      window.scrollTo(prevScrollX, prevScrollY);
      setExporting(false);
    }
  };

  const FORMATS = [
    {
      id: 'pdf',
      icon: <FileText size={24} />,
      label: 'PDF Document',
      desc: 'High-quality PDF with all charts',
      color: '#ef4444',
      onClick: exportPDF,
    },
    {
      id: 'png',
      icon: <Image size={24} />,
      label: 'PNG Image',
      desc: 'High-resolution dashboard screenshot',
      color: '#3b82f6',
      onClick: exportPNG,
    },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 520, background: 'var(--bg-card)',
        borderRadius: 20, border: '1px solid var(--border)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.08))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Download size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Export Dashboard</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>One-click presentation export</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FORMATS.map(fmt => (
            <button
              key={fmt.id}
              onClick={fmt.onClick}
              disabled={exporting}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '18px 20px', borderRadius: 14,
                background: `rgba(${fmt.color === '#ef4444' ? '239,68,68' : '59,130,246'}, 0.08)`,
                border: `1px solid ${fmt.color}30`,
                cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.2s', opacity: exporting ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!exporting) e.currentTarget.style.background = `rgba(${fmt.color === '#ef4444' ? '239,68,68' : '59,130,246'}, 0.15)`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `rgba(${fmt.color === '#ef4444' ? '239,68,68' : '59,130,246'}, 0.08)`; }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${fmt.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: fmt.color, flexShrink: 0,
              }}>
                {exporting ? <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /> : fmt.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{fmt.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{fmt.desc}</div>
              </div>
              {!exporting && (
                <Download size={16} color={fmt.color} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              )}
            </button>
          ))}

          {done && (
            <div style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 10, padding: '12px 16px', color: '#10b981',
              fontSize: '0.875rem', display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <Check size={14} /> {done}
            </div>
          )}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '12px 16px', color: '#ef4444', fontSize: '0.875rem',
            }}>⚠️ {error}</div>
          )}

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Export captures the full visible dashboard. For best results, scroll to top before exporting.
          </div>
        </div>
      </div>
    </div>
  );
}
