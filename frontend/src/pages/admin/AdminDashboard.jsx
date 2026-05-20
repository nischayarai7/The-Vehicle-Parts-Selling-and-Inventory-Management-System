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
  const [currentPage, setCurrentPage] = useState(1);
  const [timelineData, setTimelineData] = useState([]);

  // Reset pagination to page 1 whenever breakdown changes
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryBreakdown]);

  // Graph range toggle state
  const [graphRange, setGraphRange] = useState('yearly');
  const [graphLoading, setGraphLoading] = useState(false);

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
        // Pre-populate with all categories to ensure none are missing
        categories.forEach(c => {
          catMap[c.name] = { name: c.name, count: 0, value: 0 };
        });

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

        // 4. Calculate items in transit dynamically from customer orders with active/pending shipping status
        let transit = 0;
        try {
          const orders = await api.getStaffOrders();
          const activeOrders = orders.filter(o => {
            const status = (o.status || '').toLowerCase();
            return status === 'pending' || status === 'processing' || status === 'shipped';
          });
          transit = activeOrders.reduce((sum, order) => {
            return sum + (order.itemCount || 0);
          }, 0);
        } catch (err) {
          console.error("Failed to load real-time transit metrics:", err);
          transit = 0;
        }
        setItemsInTransit(transit);

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ── Dedicated graph fetch — reruns on range toggle ──────────────────────
  const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    const fetchGraphData = async () => {
      setGraphLoading(true);
      setHoveredIndex(null);
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-indexed
      const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      let timeline = [];
      try {
        if (graphRange === 'yearly') {
          // 12 monthly buckets for this year — slice to current month
          const report = await api.getFinancialReport('yearly', `${currentYear}-01-01`);
          if (report?.periodicBreakdown?.length > 0) {
            timeline = report.periodicBreakdown
              .slice(0, currentMonth + 1)
              .map((item, idx) => ({
                periodLabel: `${MONTH_ABBR[idx]} ${currentYear}`,
                fullLabel: `${MONTH_FULL[idx]} ${currentYear}`,
                revenue: Number(item.revenue) || 0,
                expenses: Number(item.expenses) || 0,
              }));
          }
        } else if (graphRange === 'monthly') {
          // Day-by-day buckets for the current month
          const report = await api.getFinancialReport('monthly', todayStr);
          if (report?.periodicBreakdown?.length > 0) {
            const monthName = MONTH_ABBR[currentMonth];
            timeline = report.periodicBreakdown
              .filter((_, idx) => idx < today.getDate()) // only days up to today
              .map((item, idx) => {
                const dayNum = String(idx + 1).padStart(2, '0');
                return {
                  periodLabel: `${monthName} ${dayNum}`,
                  fullLabel: `${MONTH_FULL[currentMonth]} ${dayNum}, ${currentYear}`,
                  revenue: Number(item.revenue) || 0,
                  expenses: Number(item.expenses) || 0,
                };
              });
          }
        } else if (graphRange === 'daily') {
          // Hour-by-hour buckets for today (00:00 – current hour)
          const report = await api.getFinancialReport('daily', todayStr);
          if (report?.periodicBreakdown?.length > 0) {
            const currentHour = today.getHours();
            timeline = report.periodicBreakdown
              .filter((_, idx) => idx <= currentHour)
              .map((item, idx) => {
                const ampm = idx < 12 ? 'AM' : 'PM';
                const h12 = idx % 12 === 0 ? 12 : idx % 12;
                return {
                  periodLabel: `${String(h12).padStart(2, '0')}${ampm}`,
                  fullLabel: `${today.toDateString()} – ${String(idx).padStart(2, '0')}:00`,
                  revenue: Number(item.revenue) || 0,
                  expenses: Number(item.expenses) || 0,
                };
              });
          }
        }
      } catch (err) {
        console.error('Graph data fetch failed:', err);
      }

      // Fallback: show empty labelled slots so the chart still renders cleanly
      if (timeline.length === 0) {
        if (graphRange === 'yearly') {
          timeline = MONTH_ABBR.slice(0, currentMonth + 1).map((abbr, idx) => ({
            periodLabel: `${abbr} ${currentYear}`,
            fullLabel: `${MONTH_FULL[idx]} ${currentYear}`,
            revenue: 0, expenses: 0,
          }));
        } else if (graphRange === 'monthly') {
          const monthName = MONTH_ABBR[currentMonth];
          timeline = Array.from({ length: today.getDate() }, (_, i) => ({
            periodLabel: `${monthName} ${String(i + 1).padStart(2, '0')}`,
            fullLabel: `${MONTH_FULL[currentMonth]} ${String(i + 1).padStart(2, '0')}, ${currentYear}`,
            revenue: 0, expenses: 0,
          }));
        } else {
          timeline = Array.from({ length: today.getHours() + 1 }, (_, i) => {
            const ampm = i < 12 ? 'AM' : 'PM';
            const h12 = i % 12 === 0 ? 12 : i % 12;
            return {
              periodLabel: `${String(h12).padStart(2, '0')}${ampm}`,
              fullLabel: `${today.toDateString()} – ${String(i).padStart(2, '0')}:00`,
              revenue: 0, expenses: 0,
            };
          });
        }
      }

      setTimelineData(timeline);
      setGraphLoading(false);
    };

    fetchGraphData();
  }, [graphRange]);

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

  const CHART_W = 310;
  const CHART_H = 130;
  const PAD_L = 15;
  const PAD_R = 15;
  const PAD_T = 10;
  const PAD_B = 28; // room for 2-line labels
  const graphW = CHART_W - PAD_L - PAD_R;
  const graphH = CHART_H - PAD_T - PAD_B;
  const graphBottom = PAD_T + graphH; // y-baseline

  const points = timelineData.map((d, index) => {
    const x = PAD_L + index * (graphW / (timelineData.length - 1 || 1));
    const yRev = graphBottom - (d.revenue / (maxVal || 1)) * graphH;
    const yExp = graphBottom - (d.expenses / (maxVal || 1)) * graphH;
    const [abbr, yr] = (d.periodLabel || '').split(' ');
    return { x, yRev, yExp, abbr: abbr || '', yr: yr || '', fullLabel: d.fullLabel || d.periodLabel, revenue: d.revenue, expenses: d.expenses };
  });

  const revPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yRev.toFixed(1)}`).join(' ');
  const expPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yExp.toFixed(1)}`).join(' ');

  const revAreaPath = points.length > 0 ? `${revPath} L ${points[points.length-1].x.toFixed(1)} ${graphBottom} L ${points[0].x.toFixed(1)} ${graphBottom} Z` : '';
  const expAreaPath = points.length > 0 ? `${expPath} L ${points[points.length-1].x.toFixed(1)} ${graphBottom} L ${points[0].x.toFixed(1)} ${graphBottom} Z` : '';

  const latestPeriod = timelineData[timelineData.length - 1] || { revenue: 0, expenses: 0, periodLabel: 'N/A', fullLabel: 'N/A' };
  const latestRevenue = latestPeriod.revenue;
  const latestProfit = latestPeriod.revenue - latestPeriod.expenses;

  const itemsPerPage = 5;
  const totalPages = Math.ceil(categoryBreakdown.length / itemsPerPage) || 1;
  const paginatedCategories = categoryBreakdown.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

      {/* Middle Row: Dynamic Inventory Overview */}
      <div style={{ marginBottom: '20px' }}>
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
      </div>

      {/* Dynamic Analytics Tools Row */}
      <div className="analytics-grid">
        {/* Category Stock Distribution Bar List */}
        <div className="large-card">
          <h3 style={{ marginBottom: '10px' }}>Stock Value by Category</h3>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: '13px', marginBottom: '15px' }}>Financial valuation breakdown grouped by part categories.</p>
          
          <div className="category-progress-container">
            {paginatedCategories.map(cat => {
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

            {totalPages > 1 && (
              <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', borderTop: '1px solid var(--admin-border)', paddingTop: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)', fontWeight: '500' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    style={{
                      background: currentPage === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                      color: currentPage === 1 ? 'var(--admin-text-muted)' : '#fff',
                      border: '1px solid var(--admin-border)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    Prev
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    style={{
                      background: currentPage === totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                      color: currentPage === totalPages ? 'var(--admin-text-muted)' : '#fff',
                      border: '1px solid var(--admin-border)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontSize: '11px',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Line Graph Tracker of the System Progress and Revenue */}
        <div className="large-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <h3 style={{ margin: 0, fontSize: '15px' }}>System Performance &amp; Revenue</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {[['daily', 'Day'], ['monthly', 'Month'], ['yearly', 'Year']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setGraphRange(val)}
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: graphRange === val ? '700' : '500',
                    border: graphRange === val ? '1px solid var(--admin-accent)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    background: graphRange === val ? 'rgba(227,59,59,0.12)' : 'rgba(255,255,255,0.03)',
                    color: graphRange === val ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.3px',
                  }}
                >{label}</button>
              ))}
            </div>
          </div>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: '13px', marginBottom: '15px' }}>
            {graphRange === 'daily' && `Hourly Revenue vs. Expenses — Today, ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
            {graphRange === 'monthly' && `Daily Revenue vs. Expenses — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
            {graphRange === 'yearly' && `Monthly Revenue vs. Expenses — ${new Date().getFullYear()} Year to Date`}
          </p>
          
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

            {/* SVG Graph with optional loading overlay */}
            <div style={{ position: 'relative', height: `${CHART_H}px` }} onMouseLeave={() => setHoveredIndex(null)}>
              {/* Loading shimmer when re-fetching */}
              {graphLoading && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 5,
                  background: 'rgba(13,13,13,0.7)', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: 'var(--admin-accent)',
                        animation: `bounce 0.8s ${i * 0.15}s ease-in-out infinite alternate`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <svg width="100%" height="100%" viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--admin-accent)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--admin-accent)" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b949e" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#8b949e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Reference Grid lines */}
                <line x1={PAD_L} y1={PAD_T} x2={CHART_W - PAD_R} y2={PAD_T} stroke="var(--admin-border)" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1={PAD_L} y1={PAD_T + graphH * 0.5} x2={CHART_W - PAD_R} y2={PAD_T + graphH * 0.5} stroke="var(--admin-border)" strokeWidth="0.5" strokeDasharray="3 3" />
                <line x1={PAD_L} y1={graphBottom} x2={CHART_W - PAD_R} y2={graphBottom} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

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
                    y1={PAD_T}
                    x2={points[hoveredIndex].x}
                    y2={graphBottom}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                    pointerEvents="none"
                  />
                )}

                {/* Expenses Line */}
                {points.length > 0 && (
                  <path d={expPath} fill="none" stroke="#8b949e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.3s ease-out' }} />
                )}

                {/* Revenue Line */}
                {points.length > 0 && (
                  <path d={revPath} fill="none" stroke="var(--admin-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.3s ease-out' }} />
                )}

                {/* Points & Interactive Nodes + Labels */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    {/* Expense dot */}
                    <circle
                      cx={p.x} cy={p.yExp}
                      r={hoveredIndex === idx ? 4.5 : 2.5}
                      fill="#8b949e"
                      stroke={hoveredIndex === idx ? '#fff' : 'none'}
                      strokeWidth="1.2"
                      style={{ transition: 'all 0.15s ease-out' }}
                    />
                    {/* Revenue dot */}
                    <circle
                      cx={p.x} cy={p.yRev}
                      r={hoveredIndex === idx ? 4.5 : 2.5}
                      fill="var(--admin-accent)"
                      stroke={hoveredIndex === idx ? '#fff' : 'none'}
                      strokeWidth="1.2"
                      style={{ transition: 'all 0.15s ease-out' }}
                    />

                    {/* Pulsing glow on latest point when nothing is hovered */}
                    {idx === points.length - 1 && hoveredIndex === null && (
                      <circle cx={p.x} cy={p.yRev} r="7" fill="var(--admin-accent)" fillOpacity="0.3">
                        <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* 2-line axis label: abbreviated month on top, year below */}
                    <text x={p.x} y={graphBottom + 11} fill={hoveredIndex === idx ? '#fff' : 'var(--admin-text-muted)'} fontSize="7" textAnchor="middle" style={{ transition: 'fill 0.15s' }}>{p.abbr}</text>
                    <text x={p.x} y={graphBottom + 20} fill={hoveredIndex === idx ? 'rgba(255,255,255,0.55)' : 'rgba(139,148,158,0.5)'} fontSize="6" textAnchor="middle" style={{ transition: 'fill 0.15s' }}>{p.yr}</text>
                  </g>
                ))}

                {/* Invisible hover hit-areas (column slabs) */}
                {points.map((p, idx) => {
                  const colW = graphW / (timelineData.length - 1 || 1);
                  return (
                    <rect
                      key={`hit-${idx}`}
                      x={p.x - colW / 2}
                      y={PAD_T}
                      width={colW}
                      height={graphH + 10}
                      fill="transparent"
                      style={{ cursor: 'crosshair' }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                    />
                  );
                })}
              </svg>

              {/* Glassmorphic Tooltip — smart left/right flip */}
              {hoveredIndex !== null && points[hoveredIndex] && (() => {
                const hp = points[hoveredIndex];
                const flipRight = hp.x > CHART_W * 0.55;
                const netProfit = hp.revenue - hp.expenses;
                const isGain = netProfit >= 0;
                return (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: flipRight ? 'auto' : `calc(${(hp.x / CHART_W) * 100}% + 10px)`,
                    right: flipRight ? `calc(${((CHART_W - hp.x) / CHART_W) * 100}% + 10px)` : 'auto',
                    background: 'rgba(13,13,13,0.97)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderTop: `2px solid var(--admin-accent)`,
                    borderRadius: '8px',
                    padding: '9px 13px',
                    zIndex: 20,
                    pointerEvents: 'none',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                    minWidth: '148px',
                    animation: 'fadeIn 0.1s ease'
                  }}>
                    <div style={{ fontWeight: '700', fontSize: '11px', color: '#fff', marginBottom: '6px', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {hp.fullLabel}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '3px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--admin-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                        </svg>
                        Revenue
                      </span>
                      <span style={{ color: 'var(--admin-accent)', fontWeight: '700' }}>Rs. {hp.revenue.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '3px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8b949e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
                        </svg>
                        Expenses
                      </span>
                      <span style={{ color: '#8b949e', fontWeight: '700' }}>Rs. {hp.expenses.toLocaleString()}</span>
                    </div>
                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '5px', marginTop: '5px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.5)' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isGain ? '#3fb950' : '#da3633'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                        Net Profit
                      </span>
                      <span style={{ fontWeight: '800', color: isGain ? '#3fb950' : '#da3633', fontSize: '11px' }}>
                        {isGain ? '+' : ''}Rs. {netProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })()}
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
