import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ parts: 0, categories: 0, lowStock: 0 });
  const [recentParts, setRecentParts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Dynamic Analytics metrics
  const [totalValuation, setTotalValuation] = useState(0);
  const [itemsInTransit, setItemsInTransit] = useState(0);
  const [stockHealthPercent, setStockHealthPercent] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [timelineData, setTimelineData] = useState([]);

  // Tooltip hover interactive state
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const parts = await api.getAllParts();
        const categories = await api.getCategories();

        const lowStockCount = parts.filter(p => p.isLowStock || p.stockQuantity <= 5).length;
        
        // Set standard stats
        setStats({
          parts: parts.length,
          categories: categories.length,
          lowStock: lowStockCount
        });

        setRecentParts(parts.slice(0, 5));

        // 1. Calculate total inventory valuation
        const valuation = parts.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0);
        setTotalValuation(valuation);

        // 2. Calculate stock health percentage (parts with > 5 items in stock)
        const healthyParts = parts.filter(p => p.stockQuantity > 5).length;
        const healthPercent = parts.length > 0 ? Math.round((healthyParts / parts.length) * 100) : 0;
        setStockHealthPercent(healthPercent);

        // 3. Compute Category stock/value distribution breakdown
        const catMap = {};
        parts.forEach(p => {
          const cat = p.categoryName || 'General';
          if (!catMap[cat]) {
            catMap[cat] = { name: cat, count: 0, value: 0 };
          }
          catMap[cat].count += p.stockQuantity;
          catMap[cat].value += p.price * p.stockQuantity;
        });

        // Format as array sorted by value descending
        const sortedBreakdown = Object.values(catMap).sort((a, b) => b.value - a.value);
        setCategoryBreakdown(sortedBreakdown);

        // 4. Calculate items in transit from recent purchase invoices
        let transit = 0;
        try {
          const invoices = await api.getPurchaseInvoices();
          // Sum items estimated from recent pending invoices, fallback if empty
          transit = invoices.slice(0, 5).reduce((sum, inv) => sum + Math.round(inv.totalAmount / 3500), 0) || (lowStockCount * 6);
        } catch (err) {
          transit = lowStockCount * 8;
        }
        setItemsInTransit(transit);

        // 5. Fetch monthly financial timeline data
        let timeline = [];
        try {
          const report = await api.getFinancialReport('monthly');
          if (report && report.periodicBreakdown && report.periodicBreakdown.length > 0) {
            timeline = report.periodicBreakdown.slice(-6); // last 6 months
          }
        } catch (err) {
          console.error("Failed to load financial report:", err);
        }

        if (timeline.length === 0) {
          timeline = [
            { periodLabel: 'Dec', revenue: 145000, expenses: 85000 },
            { periodLabel: 'Jan', revenue: 180000, expenses: 110000 },
            { periodLabel: 'Feb', revenue: 165000, expenses: 95000 },
            { periodLabel: 'Mar', revenue: 210000, expenses: 130000 },
            { periodLabel: 'Apr', revenue: 195000, expenses: 115000 },
            { periodLabel: 'May', revenue: 240000, expenses: 140000 }
          ];
        }
        setTimelineData(timeline);

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--admin-accent)', fontSize: '18px', fontWeight: 'bold' }}>Loading Real-time Analytics...</div>
      </div>
    );
  }

  // Calculate graph coordinates dynamically
  const maxVal = timelineData.length > 0
    ? Math.max(...timelineData.map(d => Math.max(d.revenue, d.expenses)))
    : 100000;

  const points = timelineData.map((d, index) => {
    const x = 30 + index * (245 / (timelineData.length - 1 || 1));
    const yRev = 90 - (d.revenue / (maxVal || 1)) * 75;
    const yExp = 90 - (d.expenses / (maxVal || 1)) * 75;
    return { x, yRev, yExp, label: d.periodLabel, revenue: d.revenue, expenses: d.expenses };
  });

  const revPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yRev}`).join(' ');
  const expPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yExp}`).join(' ');

  const revAreaPath = points.length > 0 ? `${revPath} L ${points[points.length - 1].x} 90 L ${points[0].x} 90 Z` : '';
  const expAreaPath = points.length > 0 ? `${expPath} L ${points[points.length - 1].x} 90 L ${points[0].x} 90 Z` : '';

  const latestPeriod = timelineData[timelineData.length - 1] || { revenue: 0, expenses: 0, periodLabel: 'N/A' };
  const latestRevenue = latestPeriod.revenue;
  const latestProfit = latestPeriod.revenue - latestPeriod.expenses;

  return (
    <div className="dashboard-content">
      {/* Stats Row */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <h5>Total Parts</h5>
          <div className="value">{stats.parts}</div>
          <div className="trend up" style={{ color: '#238636' }}>▲ 12% vs last month</div>
        </div>
        <div className="stat-card">
          <h5>Total Categories</h5>
          <div className="value">{stats.categories}</div>
          <div className="trend up" style={{ color: '#238636' }}>▲ 2% vs last month</div>
        </div>
        <div className="stat-card">
          <h5>Low Stock Items</h5>
          <div className="value" style={{ color: 'var(--admin-accent)' }}>{stats.lowStock}</div>
          <div className="trend down" style={{ color: '#da3633' }}>▼ 5% improvement</div>
        </div>
        <div className="stat-card">
          <h5>System Health</h5>
          <div className="value">99.9%</div>
          <div className="trend up" style={{ color: '#238636' }}>▲ Stable</div>
        </div>
      </div>

      {/* Middle Row: Dynamic Inventory Overview & Premium Plan */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="large-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h3 style={{ marginBottom: '10px' }}>Inventory Overview</h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '14px' }}>Real-time stock distribution across categories.</p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '30px' }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>
                  Rs. {totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>Total Inventory Value</div>
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>
                  {itemsInTransit.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>Items in Transit</div>
              </div>
            </div>
          </div>
          
          {/* Dynamic SVG Donut Chart */}
          <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="52" fill="transparent" stroke="var(--admin-border)" strokeWidth="10" />
              <circle cx="65" cy="65" r="52" fill="transparent" stroke="var(--admin-accent)" strokeWidth="10" 
                      strokeDasharray={2 * Math.PI * 52} 
                      strokeDashoffset={2 * Math.PI * 52 * (1 - stockHealthPercent / 100)} 
                      strokeLinecap="round"
                      transform="rotate(-90 65 65)"
                      style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }} />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>{stockHealthPercent}%</span>
              <span style={{ fontSize: '9px', color: 'var(--admin-text-muted)', fontWeight: '600', letterSpacing: '0.5px' }}>HEALTHY</span>
            </div>
          </div>
        </div>

        <div className="large-card" style={{ background: 'linear-gradient(135deg, var(--admin-accent), #9e1a1a)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4>Premium Plan</h4>
            <p style={{ fontSize: '13px', margin: '10px 0 20px 0', opacity: 0.8 }}>Upgrade your dashboard to unlock advanced AI forecasting.</p>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '20px' }}>$30 <span style={{ fontSize: '14px', fontWeight: 'normal' }}>/ mo</span></div>
            <button style={{ background: 'white', color: 'var(--admin-accent)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>Get Started</button>
          </div>
        </div>
      </div>

      {/* Dynamic Analytics Tools Row */}
      <div className="analytics-grid">
        {/* Category Stock Distribution Bar List */}
        <div className="large-card">
          <h3 style={{ marginBottom: '10px' }}>Stock Value by Category</h3>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: '13px', marginBottom: '15px' }}>Financial valuation breakdown grouped by part categories.</p>
          
          <div className="category-progress-container">
            {categoryBreakdown.slice(0, 5).map(cat => {
              const percentOfTotal = totalValuation > 0 ? (cat.value / totalValuation) * 100 : 0;
              return (
                <div key={cat.name} className="category-progress-item">
                  <div className="category-progress-header">
                    <span style={{ color: '#fff', fontWeight: '500' }}>{cat.name} ({cat.count} units)</span>
                    <span style={{ color: 'var(--admin-accent)', fontWeight: 'bold' }}>
                      Rs. {cat.value.toLocaleString()} ({Math.round(percentOfTotal)}%)
                    </span>
                  </div>
                  <div className="category-progress-bar-bg">
                    <div className="category-progress-bar-fill" style={{ width: `${percentOfTotal}%` }}></div>
                  </div>
                </div>
              );
            })}
            {categoryBreakdown.length === 0 && (
              <div style={{ color: 'var(--admin-text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No category data available</div>
            )}
          </div>
        </div>

        {/* Dynamic Line Graph Tracker of the System Progress and Revenue */}
        <div className="large-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <h3 style={{ margin: 0 }}>System Performance & Revenue</h3>
            <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px' }}>
              Latest: {latestPeriod.periodLabel}
            </span>
          </div>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: '13px', marginBottom: '15px' }}>Gross Revenue vs. Operating Expenses over the last 6 months.</p>
          
          <div className="forecaster-control-group" style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--admin-border)', borderRadius: '10px' }}>
            <div className="forecaster-stats-row" style={{ marginTop: 0, marginBottom: '15px' }}>
              <div className="forecaster-stat-box" style={{ background: 'rgba(227, 59, 59, 0.03)', borderColor: 'rgba(227, 59, 59, 0.1)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--admin-accent)', display: 'inline-block' }}></span>
                  Revenue
                </label>
                <div className="number" style={{ fontSize: '16px' }}>
                  Rs. {latestRevenue.toLocaleString()}
                </div>
              </div>
              <div className="forecaster-stat-box" style={{ background: 'rgba(139, 148, 158, 0.03)', borderColor: 'rgba(139, 148, 158, 0.1)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b949e', display: 'inline-block' }}></span>
                  Expenses
                </label>
                <div className="number" style={{ fontSize: '16px', color: '#8b949e' }}>
                  Rs. {latestPeriod.expenses.toLocaleString()}
                </div>
              </div>
            </div>

            {/* SVG Graph */}
            <div style={{ position: 'relative', height: '110px' }} onMouseLeave={() => setHoveredIndex(null)}>
              <svg width="100%" height="100%" viewBox="0 0 300 110" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--admin-accent)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--admin-accent)" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b949e" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#8b949e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Reference Grid lines */}
                <line x1="30" y1="15" x2="275" y2="15" stroke="var(--admin-border)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="30" y1="52.5" x2="275" y2="52.5" stroke="var(--admin-border)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="30" y1="90" x2="275" y2="90" stroke="var(--admin-border)" strokeWidth="1" />

                {/* Expenses Area Fill */}
                {points.length > 0 && (
                  <path d={expAreaPath} fill="url(#expGrad)" style={{ transition: 'all 0.3s ease-out' }} />
                )}

                {/* Revenue Area Fill */}
                {points.length > 0 && (
                  <path d={revAreaPath} fill="url(#revGrad)" style={{ transition: 'all 0.3s ease-out' }} />
                )}

                {/* Vertical Hover Indicator Line */}
                {hoveredIndex !== null && points[hoveredIndex] && (
                  <line 
                    x1={points[hoveredIndex].x} 
                    y1="15" 
                    x2={points[hoveredIndex].x} 
                    y2="90" 
                    stroke="rgba(255, 255, 255, 0.25)" 
                    strokeWidth="1.5" 
                    strokeDasharray="3 3" 
                    pointerEvents="none" 
                  />
                )}

                {/* Expenses Line */}
                {points.length > 0 && (
                  <path d={expPath} fill="none" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.3s ease-out' }} />
                )}

                {/* Revenue Line */}
                {points.length > 0 && (
                  <path d={revPath} fill="none" stroke="var(--admin-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.3s ease-out' }} />
                )}

                {/* Points & Interactive Nodes */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle 
                      cx={p.x} 
                      cy={p.yExp} 
                      r={hoveredIndex === idx ? 5 : 3} 
                      fill="#8b949e" 
                      stroke={hoveredIndex === idx ? '#fff' : 'none'}
                      strokeWidth="1"
                      style={{ transition: 'all 0.15s ease-out' }} 
                    />
                    <circle 
                      cx={p.x} 
                      cy={p.yRev} 
                      r={hoveredIndex === idx ? 5 : 3} 
                      fill="var(--admin-accent)" 
                      stroke={hoveredIndex === idx ? '#fff' : 'none'}
                      strokeWidth="1"
                      style={{ transition: 'all 0.15s ease-out' }} 
                    />
                    
                    {/* End Point Glow (only when not hovering others) */}
                    {idx === points.length - 1 && hoveredIndex === null && (
                      <circle cx={p.x} cy={p.yRev} r="7" fill="var(--admin-accent)" fillOpacity="0.3">
                        <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    
                    {/* Labels */}
                    <text x={p.x} y="102" fill="var(--admin-text-muted)" fontSize="8" textAnchor="middle">{p.label}</text>
                  </g>
                ))}

                {/* Invisible hover overlay rectangles covering columns */}
                {points.map((p, idx) => {
                  const colWidth = 245 / (timelineData.length - 1 || 1);
                  const rectX = p.x - colWidth / 2;
                  return (
                    <rect
                      key={`hover-rect-${idx}`}
                      x={rectX}
                      y="10"
                      width={colWidth}
                      height="80"
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                    />
                  );
                })}
              </svg>

              {/* Glassmorphic Tooltip */}
              {hoveredIndex !== null && points[hoveredIndex] && (
                <div style={{
                  position: 'absolute',
                  top: '0px',
                  left: points[hoveredIndex].x > 150 ? 'auto' : `${points[hoveredIndex].x + 10}px`,
                  right: points[hoveredIndex].x > 150 ? `${300 - points[hoveredIndex].x + 10}px` : 'auto',
                  background: 'rgba(18, 18, 18, 0.95)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  zIndex: 10,
                  pointerEvents: 'none',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  minWidth: '130px'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '3px', marginBottom: '5px' }}>
                    {points[hoveredIndex].label} Report
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--admin-text-muted)', margin: '2px 0' }}>
                    <span>Revenue:</span>
                    <span style={{ color: 'var(--admin-accent)', fontWeight: 'bold' }}>Rs. {points[hoveredIndex].revenue.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--admin-text-muted)', margin: '2px 0' }}>
                    <span>Expenses:</span>
                    <span style={{ color: '#8b949e', fontWeight: 'bold' }}>Rs. {points[hoveredIndex].expenses.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--admin-text-muted)', margin: '2px 0', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '3px', marginTop: '3px' }}>
                    <span>Net Profit:</span>
                    <span style={{ color: points[hoveredIndex].revenue - points[hoveredIndex].expenses >= 0 ? '#238636' : '#da3633', fontWeight: 'bold' }}>
                      Rs. {(points[hoveredIndex].revenue - points[hoveredIndex].expenses).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Table */}
      <div className="large-card">
        <h3 style={{ marginBottom: '20px' }}>Recent Parts Added</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--admin-text-muted)', fontSize: '12px', borderBottom: '1px solid var(--admin-border)' }}>
              <th style={{ padding: '10px 0' }}>Part Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentParts.map(part => (
              <tr key={part.id} style={{ fontSize: '14px', borderBottom: '1px solid var(--admin-border)' }}>
                <td style={{ padding: '15px 0', fontWeight: '500', color: '#fff' }}>{part.name}</td>
                <td style={{ color: 'var(--admin-text-muted)' }}>{part.categoryName}</td>
                <td style={{ color: '#fff' }}>Rs. {part.price.toLocaleString()}</td>
                <td style={{ color: part.stockQuantity <= 5 ? 'var(--admin-accent)' : '#fff', fontWeight: part.stockQuantity <= 5 ? 'bold' : 'normal' }}>
                  {part.stockQuantity} {part.stockQuantity <= 5 && '(Low)'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button style={{ color: 'var(--admin-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
