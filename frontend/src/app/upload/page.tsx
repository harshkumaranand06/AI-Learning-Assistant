"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadYouTube, uploadPDF } from "@/lib/api";

export default function UploadPage() {
    const [url, setUrl] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleYouTubeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        setLoading(true);
        setError("");
        try {
            const res = await uploadYouTube(url);
            localStorage.setItem("documentId", res.document_id);
            router.push("/flashcards");
        } catch (err: any) {
            setError(err.message || "Failed to process YouTube video");
        } finally {
            setLoading(false);
        }
    };

    const handlePDFSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setLoading(true);
        setError("");
        try {
            const res = await uploadPDF(file);
            localStorage.setItem("documentId", res.document_id);
            router.push("/flashcards");
        } catch (err: any) {
            setError(err.message || "Failed to process PDF");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={pageStyle}>
            <BgOrbs />
            <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 10 }}>

                <div style={{ textAlign: "center", marginBottom: 60 }}>
                    <h1 style={headingStyle}>Upload Source Material</h1>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, marginTop: 12 }}>
                        Provide a YouTube link or a PDF document to generate AI insights.
                    </p>
                </div>

                {error && (
                    <div style={{ ...glassCard, borderColor: "rgba(244,63,94,0.3)", padding: 20, marginBottom: 40, textAlign: "center", color: "#fb7185" }}>
                        {error}
                    </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32 }}>

                    {/* YouTube Upload */}
                    <div style={glassCard}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                            <div style={{ ...iconWrapper, background: "rgba(239,68,68,0.15)", color: "#f87171", boxShadow: "0 0 30px rgba(239,68,68,0.2)" }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#080312" /></svg>
                            </div>
                            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: 0 }}>YouTube URL</h2>
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 32, lineHeight: 1.5 }}>Paste a link to any YouTube video with closed captions to extract the transcript.</p>

                        <form onSubmit={handleYouTubeSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: "auto" }}>
                            <input
                                type="url"
                                placeholder="https://youtube.com/watch?v=..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                                style={inputStyle}
                                disabled={loading}
                            />
                            <button disabled={loading} suppressHydrationWarning style={{ ...submitBtn, background: "linear-gradient(135deg, #ef4444, #b91c1c)", boxShadow: loading ? "none" : "0 8px 30px rgba(239,68,68,0.4)" }}>
                                {loading ? <div style={spinnerStyle} /> : "Extract YouTube"}
                            </button>
                        </form>
                    </div>

                    {/* PDF Upload */}
                    <div style={glassCard}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                            <div style={{ ...iconWrapper, background: "rgba(59,130,246,0.15)", color: "#60a5fa", boxShadow: "0 0 30px rgba(59,130,246,0.2)" }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                            </div>
                            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: 0 }}>PDF Document</h2>
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 32, lineHeight: 1.5 }}>Upload your class notes, syllabus, or reading material for parsing.</p>

                        <form onSubmit={handlePDFSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: "auto" }}>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                required
                                style={{ ...inputStyle, padding: "12px", cursor: "pointer" }}
                                disabled={loading}
                            />
                            <button disabled={loading} suppressHydrationWarning style={{ ...submitBtn, background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: loading ? "none" : "0 8px 30px rgba(59,130,246,0.4)" }}>
                                {loading ? <div style={spinnerStyle} /> : "Extract PDF"}
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}

function BgOrbs() {
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
            {[
                { size: 700, top: "-10%", left: "-15%", color: "rgba(239,68,68,0.12)" }, // Red
                { size: 600, bottom: "-20%", right: "-10%", color: "rgba(59,130,246,0.12)" }, // Blue
                { size: 500, top: "30%", left: "50%", color: "rgba(139,92,246,0.1)" }, // Violet
            ].map((o, i) => (
                <div key={i} style={{
                    position: "absolute", borderRadius: "50%",
                    width: o.size, height: o.size,
                    background: `radial-gradient(circle, ${o.color}, transparent 70%)`,
                    top: (o as any).top, left: (o as any).left,
                    bottom: (o as any).bottom, right: (o as any).right,
                    filter: "blur(60px)",
                    animation: `uplOrb${i} ${10 + i * 2}s ease-in-out infinite alternate`,
                }} />
            ))}
            <style>{`
        @keyframes uplOrb0 { from{transform:translate(0,0)} to{transform:translate(30px,40px)} }
        @keyframes uplOrb1 { from{transform:translate(0,0)} to{transform:translate(-30px,20px)} }
        @keyframes uplOrb2 { from{transform:translate(0,0)} to{transform:translate(20px,-30px)} }
      `}</style>
        </div>
    );
}

/* ── Styles ── */
const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#080312",
    padding: "80px 24px",
    position: "relative",
    fontFamily: "'Inter', sans-serif",
};

const headingStyle: React.CSSProperties = {
    fontSize: "clamp(32px, 5vw, 56px)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.5))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: 0,
    letterSpacing: -1,
};

const glassCard: React.CSSProperties = {
    background: "rgba(20,15,35,0.4)",
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 32,
    padding: 40,
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
    display: "flex", flexDirection: "column",
};

const iconWrapper: React.CSSProperties = {
    width: 64, height: 64, borderRadius: 20,
    display: "flex", alignItems: "center", justifyContent: "center",
};

const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16, padding: "16px 20px", color: "#fff", fontSize: 15,
    outline: "none", transition: "all 0.3s", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.2)",
};

const submitBtn: React.CSSProperties = {
    width: "100%", padding: "18px", borderRadius: 16, border: "none",
    color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: 0.5,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.3s ease",
};

const spinnerStyle: React.CSSProperties = {
    width: 24, height: 24, borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.2)",
    borderTopColor: "#fff",
    animation: "spin 0.8s linear infinite",
};
