"use client";
import { useState } from "react";
import { improveNotes } from "@/lib/api";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function NotesPage() {
    const [rawNotes, setRawNotes] = useState("");
    const [improvedNotes, setImprovedNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleImprove = async () => {
        if (!rawNotes.trim()) return;
        setLoading(true);
        setError("");

        try {
            const data = await improveNotes(rawNotes);
            setImprovedNotes(data.improved_notes);
        } catch (err: any) {
            setError(err.message || "Failed to improve notes");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", height: "100%" }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <h1 style={headingStyle}>AI Notes Improver</h1>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>
                        Paste your rough notes below. Our AI tutor will instantly fix grammar, structure them, and inject missing core concepts for your exams.
                    </p>
                </div>

                {/* Editor Area */}
                <div style={{ display: "flex", gap: "24px", flexGrow: 1, overflow: "hidden" }}>

                    {/* Input Panel */}
                    <div style={{ ...panelStyle, flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={panelHeaderStyle}>
                            <h2 style={{ margin: 0, fontSize: 18, color: "#fff" }}>Your Draft Notes</h2>
                        </div>
                        <textarea
                            value={rawNotes}
                            onChange={(e) => setRawNotes(e.target.value)}
                            placeholder="Type or paste your unstructured notes here...\n\ne.g., 'machine learning is when comps learn from data without explicit programing. supervised is labeled dat. unsurpervised is no labels...'"
                            style={textAreaStyle}
                        />
                        <div style={{ padding: "16px 24px", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <button
                                onClick={handleImprove}
                                disabled={loading || !rawNotes.trim()}
                                style={buttonStyle(loading || !rawNotes.trim())}
                            >
                                {loading ? "Analyzing & Improving..." : "✨ Make Exam-Ready"}
                            </button>
                            {error && <p style={{ color: "#ef4444", marginTop: 12, margin: 0, fontSize: 14 }}>{error}</p>}
                        </div>
                    </div>

                    {/* Output Panel */}
                    <div style={{ ...panelStyle, flex: 1, display: "flex", flexDirection: "column", background: "rgba(20,15,35,0.8)" }}>
                        <div style={panelHeaderStyle}>
                            <h2 style={{ margin: 0, fontSize: 18, color: "#fff" }}>AI Master Notes</h2>
                            {improvedNotes && !loading && (
                                <button
                                    onClick={() => navigator.clipboard.writeText(improvedNotes)}
                                    style={{
                                        background: "transparent", border: "1px solid rgba(255,255,255,0.2)",
                                        color: "#fff", padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13
                                    }}
                                >
                                    Copy
                                </button>
                            )}
                        </div>
                        <div style={{
                            flexGrow: 1, padding: "24px", overflowY: "auto",
                            color: "rgba(255,255,255,0.85)", lineHeight: 1.7, fontSize: 15
                        }} className="custom-scrollbar markdown-preview">
                            {loading ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
                                    <div style={spinnerStyle} />
                                    <p style={{ color: "rgba(255,255,255,0.6)" }}>Expanding concepts and structuring...</p>
                                </div>
                            ) : improvedNotes ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {improvedNotes}
                                </ReactMarkdown>
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.3)" }}>
                                    <p>Your improved notes will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                
                @keyframes spin { 100% { transform: rotate(360deg); } }
                
                .markdown-preview h1 { font-size: 1.5em; font-weight: 700; color: #fff; margin-bottom: 0.5em; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
                .markdown-preview h2 { font-size: 1.3em; font-weight: 600; color: #e2e8f0; margin-top: 1.5em; margin-bottom: 0.5em; }
                .markdown-preview h3 { font-size: 1.1em; font-weight: 600; color: #cbd5e1; margin-top: 1.2em; margin-bottom: 0.5em; }
                .markdown-preview p { margin-bottom: 1em; }
                .markdown-preview ul, .markdown-preview ol { padding-left: 1.5em; margin-bottom: 1em; }
                .markdown-preview li { margin-bottom: 0.25em; }
                .markdown-preview strong { color: #fff; font-weight: 600; }
                .markdown-preview code { background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
                .markdown-preview pre { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; overflow-x: auto; margin-bottom: 1em; }
                .markdown-preview pre code { background: transparent; padding: 0; }
                .markdown-preview blockquote { border-left: 4px solid #8b5cf6; padding-left: 16px; margin-left: 0; color: #cbd5e1; font-style: italic; }
            `}} />
        </div>
    );
}

/* ── Styles ── */
const pageStyle: React.CSSProperties = {
    height: "calc(100vh - 70px)", // Assuming navbar height
    background: "#05010a",
    padding: "40px",
    fontFamily: "'Inter', sans-serif",
    boxSizing: "border-box"
};

const headingStyle: React.CSSProperties = {
    fontSize: "clamp(28px, 4vw, 42px)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #fff 20%, #a5b4fc 80%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 8px",
    letterSpacing: -0.5,
};

const panelStyle: React.CSSProperties = {
    background: "rgba(20,15,35,0.4)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
    overflow: "hidden"
};

const panelHeaderStyle: React.CSSProperties = {
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(0,0,0,0.2)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
};

const textAreaStyle: React.CSSProperties = {
    flexGrow: 1,
    background: "transparent",
    border: "none",
    padding: "24px",
    color: "#fff",
    fontSize: 16,
    lineHeight: 1.6,
    outline: "none",
    resize: "none"
};

const buttonStyle = (disabled: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "16px",
    borderRadius: 12,
    border: "none",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
    cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
    boxShadow: disabled ? "none" : "0 8px 24px rgba(99,102,241,0.4)",
    transition: "all 0.3s",
    opacity: disabled ? 0.6 : 1
});

const spinnerStyle: React.CSSProperties = {
    width: 40, height: 40, borderRadius: "50%",
    border: "3px solid rgba(139, 92, 246, 0.2)",
    borderTopColor: "#8b5cf6",
    animation: "spin 1s linear infinite",
};
