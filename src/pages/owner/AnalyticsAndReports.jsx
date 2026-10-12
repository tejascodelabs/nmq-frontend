import React, { useState, useEffect } from 'react'
import {
    BarChart3,
    CalendarDays,
    ClipboardList,
    Clock3,
    LayoutDashboard,
} from "lucide-react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { formatDateKey, formatDisplayDate } from '../../utils/DataFormat'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
)



// Mock sample data generator
const SAMPLE_MOCK_TOKENS = [
    { id: 1, queue_type: 'General', status: 'arrived', queue_date: formatDateKey(new Date()), created_at: new Date(Date.now() - 3600000 * 2).toISOString(), called_at: new Date(Date.now() - 3600000 * 1.8).toISOString() },
    { id: 2, queue_type: 'VIP', status: 'arrived', queue_date: formatDateKey(new Date()), created_at: new Date(Date.now() - 3600000 * 3).toISOString(), called_at: new Date(Date.now() - 3600000 * 2.9).toISOString() },
    { id: 3, queue_type: 'General', status: 'not_arrived', queue_date: formatDateKey(new Date()), created_at: new Date(Date.now() - 3600000 * 1).toISOString(), called_at: null },
    { id: 4, queue_type: 'Express', status: 'cancelled', queue_date: formatDateKey(new Date()), created_at: new Date(Date.now() - 3600000 * 4).toISOString(), called_at: null },
    { id: 5, queue_type: 'General', status: 'arrived', queue_date: formatDateKey(new Date(Date.now() - 86400000)), created_at: new Date(Date.now() - 86400000 - 3600000).toISOString(), called_at: new Date(Date.now() - 86400000 - 3000000).toISOString() },
    { id: 6, queue_type: 'VIP', status: 'arrived', queue_date: formatDateKey(new Date(Date.now() - 86400000)), created_at: new Date(Date.now() - 86400000 - 7200000).toISOString(), called_at: new Date(Date.now() - 86400000 - 6600000).toISOString() },
    { id: 7, queue_type: 'Express', status: 'not_arrived', queue_date: formatDateKey(new Date(Date.now() - 86400000 * 2)), created_at: new Date(Date.now() - 86400000 * 2 - 3600000).toISOString(), called_at: null },
    { id: 8, queue_type: 'General', status: 'arrived', queue_date: formatDateKey(new Date(Date.now() - 86400000 * 2)), created_at: new Date(Date.now() - 86400000 * 2 - 5000000).toISOString(), called_at: new Date(Date.now() - 86400000 * 2 - 4200000).toISOString() }
]

// Reusable Tailwind-styled Range Selector Component
function RangeSelector({
    range,
    onRangeChange,
    customStartDate,
    customEndDate,
    onCustomStartChange,
    onCustomEndChange
}) {
    return (
        <div className="flex items-center gap-2.5 flex-wrap">
            <select
                value={range}
                onChange={(e) => onRangeChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
            >
                <option value="thisWeek">This Week</option>
                <option value="lastWeek">Last Week</option>
                <option value="last7Days">Last 7 Days</option>
                <option value="last30Days">Last 30 Days</option>
                <option value="custom">Custom Date Range</option>
            </select>

            {range === 'custom' && (
                <div className="flex items-center gap-2 flex-wrap">
                    <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => onCustomStartChange(e.target.value)}
                        className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                    <span className="text-gray-400 text-xs font-medium">to</span>
                    <input
                        type="date"
                        value={customEndDate}
                        min={customStartDate}
                        onChange={(e) => onCustomEndChange(e.target.value)}
                        className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                </div>
            )}
        </div>
    )
}

export default function AnalyticsAndReports() {
    // Independent Date Range States
    const [kpiRange, setKpiRange] = useState('thisWeek')
    const [kpiCustomStartDate, setKpiCustomStartDate] = useState(formatDateKey(new Date()))
    const [kpiCustomEndDate, setKpiCustomEndDate] = useState(formatDateKey(new Date()))

    const [dailyRange, setDailyRange] = useState('thisWeek')
    const [dailyCustomStartDate, setDailyCustomStartDate] = useState(formatDateKey(new Date()))
    const [dailyCustomEndDate, setDailyCustomEndDate] = useState(formatDateKey(new Date()))

    const [queueRange, setQueueRange] = useState('thisWeek')
    const [queueCustomStartDate, setQueueCustomStartDate] = useState(formatDateKey(new Date()))
    const [queueCustomEndDate, setQueueCustomEndDate] = useState(formatDateKey(new Date()))

    const [peakHourDate, setPeakHourDate] = useState(formatDateKey(new Date()))

    // Data States
    const [analytics, setAnalytics] = useState({
        totalTokens: 0,
        arrivedCount: 0,
        notArrivedCount: 0,
        cancelledCount: 0
    })
    const [dailyAnalytics, setDailyAnalytics] = useState([])
    const [queueAnalytics, setQueueAnalytics] = useState([])
    const [peakHourAnalytics, setPeakHourAnalytics] = useState([])

    const [initialLoading, setInitialLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [activeSections, setActiveSections] = useState(['all'])

    // Helper calculation for date ranges
    const getDateRange = (range, customStart, customEnd) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        let startDate = new Date(today)
        let endDate = new Date(today)

        switch (range) {
            case 'thisWeek': {
                const day = today.getDay()
                const mondayOffset = day === 0 ? 6 : day - 1
                startDate.setDate(today.getDate() - mondayOffset)
                break
            }
            case 'lastWeek': {
                const day = today.getDay()
                const mondayOffset = day === 0 ? 6 : day - 1
                endDate.setDate(today.getDate() - mondayOffset - 1)
                startDate = new Date(endDate)
                startDate.setDate(endDate.getDate() - 6)
                break
            }
            case 'last7Days': {
                startDate.setDate(today.getDate() - 6)
                break
            }
            case 'last30Days': {
                startDate.setDate(today.getDate() - 29)
                break
            }
            case 'custom': {
                return { startDate: customStart, endDate: customEnd }
            }
            default: {
                startDate.setDate(today.getDate() - 6)
            }
        }

        return {
            startDate: formatDateKey(startDate),
            endDate: formatDateKey(endDate)
        }
    }

    // Load sample metrics mock
    const loadMetrics = () => {
        if (!initialLoading) setRefreshing(true)

        setTimeout(() => {
            // 1. KPI Calculation
            const totalTokens = SAMPLE_MOCK_TOKENS.length
            const arrivedCount = SAMPLE_MOCK_TOKENS.filter((t) => t.status === 'arrived').length
            const notArrivedCount = SAMPLE_MOCK_TOKENS.filter((t) => t.status === 'not_arrived').length
            const cancelledCount = SAMPLE_MOCK_TOKENS.filter((t) => t.status === 'cancelled').length

            setAnalytics({ totalTokens, arrivedCount, notArrivedCount, cancelledCount })

            // 2. Daily Customer Count Calculation
            const { startDate: dailyStart, endDate: dailyEnd } = getDateRange(
                dailyRange,
                dailyCustomStartDate,
                dailyCustomEndDate
            )
            const dailyMap = {}
            const curDate = new Date(`${dailyStart}T00:00:00`)
            const stopDate = new Date(`${dailyEnd}T00:00:00`)

            while (curDate <= stopDate) {
                const dKey = formatDateKey(curDate)
                dailyMap[dKey] = { date: dKey, totalTokens: 0, arrived: 0, notArrived: 0, cancelled: 0 }
                curDate.setDate(curDate.getDate() + 1)
            }

            SAMPLE_MOCK_TOKENS.forEach((token) => {
                if (dailyMap[token.queue_date]) {
                    dailyMap[token.queue_date].totalTokens++
                    if (token.status === 'arrived') dailyMap[token.queue_date].arrived++
                    if (token.status === 'not_arrived') dailyMap[token.queue_date].notArrived++
                    if (token.status === 'cancelled') dailyMap[token.queue_date].cancelled++
                }
            })
            setDailyAnalytics(Object.values(dailyMap))

            // 3. Queue Performance
            const queueMap = {}
            SAMPLE_MOCK_TOKENS.forEach((token) => {
                const q = token.queue_type
                if (!queueMap[q]) {
                    queueMap[q] = { queue: q, totalTokens: 0, arrived: 0, notArrived: 0, cancelled: 0, waitTimes: [] }
                }
                queueMap[q].totalTokens++
                if (token.status === 'arrived') queueMap[q].arrived++
                if (token.status === 'not_arrived') queueMap[q].notArrived++
                if (token.status === 'cancelled') queueMap[q].cancelled++

                if (token.created_at && token.called_at) {
                    const waitMins = (new Date(token.called_at) - new Date(token.created_at)) / 60000
                    if (waitMins >= 0) queueMap[q].waitTimes.push(waitMins)
                }
            })

            setQueueAnalytics(
                Object.values(queueMap).map((q) => ({
                    queue: q.queue,
                    totalTokens: q.totalTokens,
                    arrived: q.arrived,
                    notArrived: q.notArrived,
                    cancelled: q.cancelled,
                    avgWait: q.waitTimes.length ? Math.round(q.waitTimes.reduce((a, b) => a + b, 0) / q.waitTimes.length) : 0
                }))
            )

            // 4. Peak Hours Calculation
            const hourlyMap = {}
            SAMPLE_MOCK_TOKENS.forEach((token) => {
                if (token.queue_date === peakHourDate && token.created_at) {
                    const hour = new Date(token.created_at).getHours()
                    hourlyMap[hour] = (hourlyMap[hour] || 0) + 1
                }
            })
            const peakHourList = Object.keys(hourlyMap)
                .map((h) => ({ hour: parseInt(h, 10), totalTokens: hourlyMap[h] }))
                .sort((a, b) => a.hour - b.hour)

            setPeakHourAnalytics(peakHourList)

            setInitialLoading(false)
            setRefreshing(false)
        }, 300)
    }

    useEffect(() => {
        loadMetrics()
    }, [
        kpiRange,
        kpiCustomStartDate,
        kpiCustomEndDate,
        dailyRange,
        dailyCustomStartDate,
        dailyCustomEndDate,
        queueRange,
        queueCustomStartDate,
        queueCustomEndDate,
        peakHourDate
    ])

    if (initialLoading) {
        return (
            <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">📊 Weekly Analytics</h1>
                </div>
                <div className="bg-white p-12 text-center rounded-xl border border-gray-200 text-gray-500 font-medium">
                    Loading analytics sample data...
                </div>
            </div>
        )
    }

    const kpiSelectedRange = getDateRange(kpiRange, kpiCustomStartDate, kpiCustomEndDate)
    const dailySelectedRange = getDateRange(dailyRange, dailyCustomStartDate, dailyCustomEndDate)
    const queueSelectedRange = getDateRange(queueRange, queueCustomStartDate, queueCustomEndDate)

    const kpiPeriodLabel = `${formatDisplayDate(kpiSelectedRange.startDate)} – ${formatDisplayDate(kpiSelectedRange.endDate)}`
    const dailyPeriodLabel = `${formatDisplayDate(dailySelectedRange.startDate)} – ${formatDisplayDate(dailySelectedRange.endDate)}`
    const queuePeriodLabel = `${formatDisplayDate(queueSelectedRange.startDate)} – ${formatDisplayDate(queueSelectedRange.endDate)}`

    const chartData = {
        labels: dailyAnalytics.map((d) =>
            new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        ),
        datasets: [
            {
                label: 'Total Tokens',
                data: dailyAnalytics.map((d) => d.totalTokens),
                backgroundColor: 'rgba(124, 58, 237, 0.8)',
                borderRadius: 6
            },
            {
                label: 'Customer Arrived',
                data: dailyAnalytics.map((d) => d.arrived),
                backgroundColor: 'rgba(22, 163, 74, 0.8)',
                borderRadius: 6
            },
            {
                label: 'Not Arrived',
                data: dailyAnalytics.map((d) => d.notArrived),
                backgroundColor: 'rgba(234, 88, 12, 0.8)',
                borderRadius: 6
            },
            {
                label: 'Cancelled',
                data: dailyAnalytics.map((d) => d.cancelled),
                backgroundColor: 'rgba(220, 38, 38, 0.8)',
                borderRadius: 6
            }
        ]
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                cornerRadius: 8
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
            x: { grid: { display: false } }
        }
    }

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-6 md:px-8 space-y-6">
            {/* PAGE HEADER */}
            <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">📊 Weekly Analytics</h1>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Track your queue performance across different time periods
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadMetrics}
                    disabled={refreshing}
                    className="self-start md:self-auto px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
                >
                    <span className={`inline-block ${refreshing ? 'animate-spin' : ''}`}>🔄</span>
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* SECTION FILTER BAR */}
            <div className="flex items-center gap-2 flex-wrap bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm">
                {[
                    { key: "all", label: "All", icon: LayoutDashboard },
                    { key: "kpi", label: "KPI Cards", icon: BarChart3 },
                    { key: "daily", label: "Daily Customer Count", icon: CalendarDays },
                    { key: "queue", label: "Queue Wise Performance", icon: ClipboardList },
                    { key: "peak", label: "Peak Hours", icon: Clock3 },
                ].map(({ key, label, icon: Icon }) => {
                    const isActive =
                        key === "all"
                            ? activeSections.includes("all")
                            : activeSections.includes(key);

                    return (
                        <button
                            key={key}
                            onClick={() => {
                                if (key === "all") {
                                    setActiveSections(["all"]);
                                    return;
                                }

                                setActiveSections((prev) => {
                                    const current = prev.filter((item) => item !== "all");

                                    if (current.includes(key)) {
                                        const updated = current.filter((item) => item !== key);

                                        return updated.length === 0 ? ["all"] : updated;
                                    }

                                    return [...current, key];
                                });
                            }}
                            className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all ${isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    );
                })}
            </div>

            {refreshing && (
                <div className="h-1 w-full bg-blue-100 overflow-hidden rounded-full">
                    <div className="w-full h-full bg-blue-600 animate-pulse"></div>
                </div>
            )}

            {/* KPI CARDS */}
            {(activeSections.includes('all') || activeSections.includes('kpi')) && (
                <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h2 className="text-base md:text-lg font-semibold text-gray-900"><BarChart3 /> KPI Cards</h2>
                            <p className="text-xs md:text-sm text-gray-500">Performance metrics for {kpiPeriodLabel}</p>
                        </div>
                        <RangeSelector
                            range={kpiRange}
                            onRangeChange={setKpiRange}
                            customStartDate={kpiCustomStartDate}
                            customEndDate={kpiCustomEndDate}
                            onCustomStartChange={setKpiCustomStartDate}
                            onCustomEndChange={setKpiCustomEndDate}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-gray-200 border-t-4 border-t-indigo-600 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition">
                            <span className="text-3xl">🎟️</span>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Tokens</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.totalTokens}</p>
                                <p className="text-xs text-gray-400">tokens generated</p>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 border-t-4 border-t-green-600 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition">
                            <span className="text-3xl">✅</span>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer Arrived</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.arrivedCount}</p>
                                <p className="text-xs text-gray-400">customers arrived</p>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 border-t-4 border-t-orange-500 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition">
                            <span className="text-3xl">🚫</span>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Not Arrived</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.notArrivedCount}</p>
                                <p className="text-xs text-gray-400">customers not arrived</p>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 border-t-4 border-t-red-600 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition">
                            <span className="text-3xl">❌</span>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cancelled</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.cancelledCount}</p>
                                <p className="text-xs text-gray-400">cancelled tokens</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DAILY CUSTOMER CHART */}
            {(activeSections.includes('all') || activeSections.includes('daily')) && (
                <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h2 className="text-base md:text-lg font-semibold text-gray-900">📈 Daily Customer Count</h2>
                            <p className="text-xs md:text-sm text-gray-500">Daily performance for {dailyPeriodLabel}</p>
                        </div>
                        <RangeSelector
                            range={dailyRange}
                            onRangeChange={setDailyRange}
                            customStartDate={dailyCustomStartDate}
                            customEndDate={dailyCustomEndDate}
                            onCustomStartChange={setDailyCustomStartDate}
                            onCustomEndChange={setDailyCustomEndDate}
                        />
                    </div>

                    <div className="h-64 md:h-80 w-full relative">
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                </div>
            )}

            {/* QUEUE-WISE PERFORMANCE */}
            {(activeSections.includes('all') || activeSections.includes('queue')) && (
                <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h2 className="text-base md:text-lg font-semibold text-gray-900">📋 Queue-wise Performance</h2>
                            <p className="text-xs md:text-sm text-gray-500 mt-1">Performance by queue for {queuePeriodLabel}</p>
                        </div>
                        <RangeSelector
                            range={queueRange}
                            onRangeChange={setQueueRange}
                            customStartDate={queueCustomStartDate}
                            customEndDate={queueCustomEndDate}
                            onCustomStartChange={setQueueCustomStartDate}
                            onCustomEndChange={setQueueCustomEndDate}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-3.5">Queue</th>
                                    <th className="px-5 py-3.5 text-center">Total Tokens</th>
                                    <th className="px-5 py-3.5 text-center">Customer Arrived</th>
                                    <th className="px-5 py-3.5 text-center">Not Arrived</th>
                                    <th className="px-5 py-3.5 text-center">Avg Wait</th>
                                    <th className="px-5 py-3.5 text-center">Cancelled</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {queueAnalytics.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-8 text-center text-gray-500">
                                            No queue data available for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    queueAnalytics.map((queue) => (
                                        <tr key={queue.queue} className="hover:bg-gray-50/80 transition">
                                            <td className="px-5 py-4 font-semibold text-gray-900">{queue.queue}</td>
                                            <td className="px-5 py-4 text-center">{queue.totalTokens}</td>
                                            <td className="px-5 py-4 text-center">{queue.arrived}</td>
                                            <td className="px-5 py-4 text-center">{queue.notArrived}</td>
                                            <td className="px-5 py-4 text-center">{queue.avgWait}m</td>
                                            <td className="px-5 py-4 text-center">{queue.cancelled}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* PEAK HOURS */}
            {(activeSections.includes('all') || activeSections.includes('peak')) && (
                <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <h2 className="text-base md:text-lg font-semibold text-gray-900">🕐 Peak Hours</h2>
                            <p className="text-xs md:text-sm text-gray-500 mt-1">Tokens created during each hour</p>
                        </div>
                        <input
                            type="date"
                            value={peakHourDate}
                            onChange={(e) => setPeakHourDate(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-3.5">Time</th>
                                    <th className="px-5 py-3.5 text-center">Tokens Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {peakHourAnalytics.length === 0 ? (
                                    <tr>
                                        <td colSpan="2" className="px-5 py-8 text-center text-gray-500">
                                            No token data available for this date.
                                        </td>
                                    </tr>
                                ) : (
                                    peakHourAnalytics.map((hour) => {
                                        const startHour = hour.hour
                                        const endHour = (hour.hour + 1) % 24
                                        const formatHour = (h) => {
                                            if (h === 0) return '12 AM'
                                            if (h === 12) return '12 PM'
                                            if (h < 12) return `${h} AM`
                                            return `${h - 12} PM`
                                        }

                                        return (
                                            <tr key={hour.hour} className="hover:bg-gray-50/80 transition">
                                                <td className="px-5 py-4 font-semibold text-gray-900">
                                                    {formatHour(startHour)} – {formatHour(endHour)}
                                                </td>
                                                <td className="px-5 py-4 text-center font-semibold text-blue-600">
                                                    {hour.totalTokens}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    )
}