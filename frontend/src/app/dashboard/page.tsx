"use client";
import { useEffect, useState } from "react";
import { getAnalytics } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await getAnalytics();
                // Reverse the recent attempts so the chart goes chronologically left to right
                if (res.recent_attempts && Array.isArray(res.recent_attempts)) {
                    res.recent_attempts.reverse();
                }
                setData(res);
            } catch (err: any) {
                setError(err.message || "Failed to load analytics");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 120 }}>
                    <div style={spinnerStyle} />
                    <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 20 }}>Loading your progress data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={pageStyle}>
                <div style={{ ...glassPanel, maxWidth: 400, margin: "100px auto", padding: 40, textAlign: "center", color: "#f87171" }}>
                    ⚠️ {error}
                </div>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        if (!seconds) return "0m";
        const m = Math.floor(seconds / 60);
        return `${m}m`;
    };

    const hasAttempts = data?.recent_attempts?.length > 0;

    return (
        <div style={pageStyle}>
            {/* Header */}
            <div style={{ maxWidth: 1000, margin: "0 auto 40px" }}>
                <h1 style={headingStyle}>Your Learning Progress</h1>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>Track your automated quiz statistics and focus on areas for improvement.</p>
            </div>

            <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 40 }}>
                {/* Stats Cards */}
                <div style={{ ...glassPanel, padding: 32, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Total Quizzes Taken</div>
                    <div style={{ fontSize: 48, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{data?.stats?.total_quizzes || 0}</div>
                </div>

                <div style={{ ...glassPanel, padding: 32, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Average Score</div>
                    <div style={{ fontSize: 48, fontWeight: 800, color: "#34d399", lineHeight: 1 }}>{data?.stats?.average_score || 0}%</div>
                </div>

                <div style={{ ...glassPanel, padding: 32, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Total Assessment Time</div>
                    <div style={{ fontSize: 48, fontWeight: 800, color: "#818cf8", lineHeight: 1 }}>{formatTime(data?.stats?.total_study_time)}</div>
                </div>
            </div>

            {hasAttempts ? (
                <div style={{ maxWidth: 1000, margin: "0 auto" }}>
                    <div style={{ ...glassPanel, padding: 40 }}>
                        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 600, marginBottom: 32 }}>Recent Performance Trend</h2>

                        <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.recent_attempts} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="created_at"
                                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        stroke="rgba(255,255,255,0.2)"
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.2)"
                                        tickLine={false}
                                        domain={[0, 100]}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1e1b4b", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12, color: "#fff" }}
                                        labelFormatter={(val) => new Date(val).toLocaleString()}
                                        formatter={(val: number) => [`${val}%`, "Score"]}
                                    />
                                    <Area type="monotone" dataKey="percentage" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center", ...glassPanel, padding: 60 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                    <h3 style={{ color: "#fff", fontSize: 24, marginBottom: 8 }}>No data yet</h3>
                    <p style={{ color: "rgba(255,255,255,0.5)" }}>Upload a document and take an exam to see your learning trends.</p>
                </div>
            )}
        </div>
    );
}

/* ── Styles ── */
const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#080312",
    padding: "60px 24px 100px",
    fontFamily: "'Inter', sans-serif",
};

const glassPanel: React.CSSProperties = {
    background: "rgba(20,15,35,0.4)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 24,
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
};

const headingStyle: React.CSSProperties = {
    fontSize: "clamp(32px, 5vw, 48px)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.5))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 16px",
    letterSpacing: -1,
};

const spinnerStyle: React.CSSProperties = {
    width: 48, height: 48, borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.1)",
    borderTopColor: "#818cf8",
    animation: "spin 0.8s linear infinite",
};
