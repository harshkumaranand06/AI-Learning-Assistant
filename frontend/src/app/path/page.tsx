"use client";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";

export default function PathPage() {
    const [goal, setGoal] = useState("");
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Once generated or loaded:
    const [pathData, setPathData] = useState<any>(null);
    const [pathId, setPathId] = useState<string | null>(null);

    // Try to load existing path from localstorage on mount
    useEffect(() => {
        const existingPath = localStorage.getItem("currentLearningPathId");
        if (existingPath) {
            fetchPath(existingPath);
        }
    }, []);

    const fetchPath = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/path/${id}`);
            if (!res.ok) throw new Error("Path not found");
            const data = await res.json();
            setPathData(data.roadmap);
            setPathId(id);
            setGoal(data.goal);
        } catch (err: any) {
            console.error(err);
            localStorage.removeItem("currentLearningPathId");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (retryStrategy = false) => {
        if (!goal.trim()) {
            setError("Please enter what you want to learn.");
            return;
        }

        setLoading(true);
        if (!retryStrategy) setError("");

        try {
            const res = await fetch(`${API_BASE_URL}/api/path/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal, days })
            });

            if (!res.ok) {
                const errText = await res.text();
                try {
                    const errJson = JSON.parse(errText);
                    throw new Error(errJson.detail || errText);
                } catch (e) {
                    throw new Error(errText);
                }
            }

            const data = await res.json();
            setPathId(data.path_id);
            setPathData(data.data.roadmap);
            localStorage.setItem("currentLearningPathId", data.path_id);
            setError("");
            setLoading(false);

        } catch (err: any) {
            const msg = err.message || "Failed to generate learning path";
            if (msg.includes("still generating")) {
                setError("⏳ Document is still being processed by the AI... Auto-retrying in 5 seconds.");
                setTimeout(() => handleGenerate(true), 5000);
            } else {
                setError(msg);
                setLoading(false);
            }
        }
    };

    const toggleComplete = async (dayInt: number, currentStatus: boolean) => {
        if (!pathId) return;

        // Optimistic UI update
        setPathData((prev: any) => {
            const newDays = prev.days.map((d: any) =>
                d.day === dayInt ? { ...d, completed: !currentStatus } : d
            );
            return { ...prev, days: newDays };
        });

        try {
            await fetch(`${API_BASE_URL}/api/path/${pathId}/complete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ day: dayInt, completed: !currentStatus })
            });
        } catch (err) {
            console.error("Failed to update status", err);
            // Revert optimistic update gracefully if needed...
        }
    };

    const startNew = () => {
        setPathData(null);
        setPathId(null);
        setGoal("");
        localStorage.removeItem("currentLearningPathId");
    };

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                    <div style={{ display: "inline-block", background: "rgba(16,185,129,0.1)", padding: "8px 16px", borderRadius: 99, color: "#10b981", fontSize: 13, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>
                        AI STUDY COACH
                    </div>
                    <h1 style={headingStyle}>Personalized Learning Path</h1>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, marginTop: 16 }}>
                        Tell us what you want to master, and our AI will build a daily roadmap to get you there.
                    </p>
                </div>

                {error && (
                    <div style={{ padding: 16, background: "rgba(239,68,68,0.1)", color: "#ef4444", borderRadius: 12, marginBottom: 24, textAlign: "center", border: "1px solid rgba(239,68,68,0.3)" }}>
                        {error}
                    </div>
                )}

                {/* Setup State */}
                {!pathData && !loading && (
                    <div style={{ ...glassPanel, padding: 40, textAlign: "center" }}>
                        <div style={{ marginBottom: 32 }}>
                            <label style={{ display: "block", color: "rgba(255,255,255,0.8)", marginBottom: 12, fontSize: 14, fontWeight: 600 }}>What is your goal?</label>
                            <input
                                type="text"
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder="e.g., Master Machine Learning, Learn Rust, Pass Biology 101"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ marginBottom: 48 }}>
                            <label style={{ display: "block", color: "rgba(255,255,255,0.8)", marginBottom: 12, fontSize: 14, fontWeight: 600 }}>How many days do you have?</label>
                            <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                                {[7, 14, 30, 60].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setDays(val)}
                                        style={{
                                            ...durationBtnStyle,
                                            background: days === val ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(255,255,255,0.05)",
                                            borderColor: days === val ? "transparent" : "rgba(255,255,255,0.1)",
                                            color: days === val ? "#fff" : "rgba(255,255,255,0.7)"
                                        }}>
                                        {val} Days
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={() => handleGenerate(false)} style={{ ...actionBtnStyle, background: "linear-gradient(135deg, #10b981, #059669)" }}>
                            Generate My Roadmap ✨
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div style={{ ...glassPanel, padding: 60, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
                        <div style={spinnerStyle} />
                        <div style={{ background: "rgba(0,0,0,0.6)", padding: "24px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", maxWidth: "500px" }}>
                            <h3 style={{ color: error ? "#fbbf24" : "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 8px 0" }}>
                                {error ? "Processing..." : "Architecting your curriculum..."}
                            </h3>
                            <p style={{ color: error ? "#fbbf24" : "rgba(255,255,255,0.7)", fontSize: 16, fontWeight: 500, lineHeight: "1.5", margin: 0 }}>
                                {error || "Our AI coach is breaking down exactly what you need to study each day."}
                            </p>
                        </div>
                    </div>
                )}

                {/* Roadmap Display State */}
                {pathData && !loading && (
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, padding: "0 16px" }}>
                            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 700 }}>{goal}</h2>
                            <button onClick={startNew} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14, textDecoration: "underline" }}>
                                Start New Path
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ marginBottom: 40 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 8 }}>
                                <span>Progress</span>
                                <span>{Math.round((pathData.days.filter((d: any) => d.completed).length / pathData.days.length) * 100)}%</span>
                            </div>
                            <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
                                <div style={{
                                    height: "100%", background: "linear-gradient(90deg, #10b981, #34d399)",
                                    width: `${(pathData.days.filter((d: any) => d.completed).length / pathData.days.length) * 100}%`,
                                    transition: "width 0.4s ease"
                                }} />
                            </div>
                        </div>

                        {/* Interactive Timeline */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {pathData.days.map((d: any, idx: number) => (
                                <div key={idx} style={{
                                    ...glassPanel, padding: 24, display: "flex", gap: 24, alignItems: "flex-start",
                                    borderLeft: `4px solid ${d.completed ? "#10b981" : "rgba(255,255,255,0.1)"}`,
                                    opacity: d.completed ? 0.7 : 1, transition: "all 0.3s"
                                }}>
                                    {/* Date Column */}
                                    <div style={{ width: 60, flexShrink: 0, textAlign: "center" }}>
                                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>Day</div>
                                        <div style={{ color: d.completed ? "#10b981" : "#fff", fontSize: 28, fontWeight: 800 }}>{d.day}</div>
                                    </div>

                                    {/* Content Column */}
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ color: d.completed ? "rgba(255,255,255,0.6)" : "#fff", fontSize: 18, fontWeight: 600, margin: "0 0 8px 0" }}>
                                            {d.topic}
                                        </h3>
                                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                                            {d.description}
                                        </p>
                                    </div>

                                    {/* Action Column */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "10px 0" }}>
                                        <button
                                            onClick={() => toggleComplete(d.day, d.completed)}
                                            style={{
                                                width: 32, height: 32, borderRadius: "50%",
                                                background: d.completed ? "#10b981" : "rgba(255,255,255,0.05)",
                                                border: `2px solid ${d.completed ? "#10b981" : "rgba(255,255,255,0.2)"}`,
                                                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                                cursor: "pointer", transition: "all 0.2s"
                                            }}>
                                            {d.completed && "✓"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
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
    background: "rgba(20,15,35,0.6)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
};

const headingStyle: React.CSSProperties = {
    fontSize: "clamp(36px, 5vw, 56px)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #fff 30%, #a7f3d0)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 16px",
    letterSpacing: -1,
};

const inputStyle: React.CSSProperties = {
    width: "100%", maxWidth: 500, padding: "16px 24px",
    background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16, color: "#fff", fontSize: 16,
    outline: "none", transition: "border-color 0.2s",
    boxShadow: "inset 0 2px 10px rgba(0,0,0,0.2)"
};

const durationBtnStyle: React.CSSProperties = {
    padding: "12px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
    fontWeight: 600, cursor: "pointer", transition: "all 0.2s", fontSize: 15
};

const actionBtnStyle: React.CSSProperties = {
    padding: "20px 48px", borderRadius: 16, border: "none",
    color: "#fff", fontSize: 16, fontWeight: 700,
    cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 10px 30px rgba(16,185,129,0.3)"
};

const spinnerStyle: React.CSSProperties = {
    width: 60, height: 60, borderRadius: "50%",
    border: "4px solid rgba(255,255,255,0.1)",
    borderTopColor: "#10b981",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto"
};
