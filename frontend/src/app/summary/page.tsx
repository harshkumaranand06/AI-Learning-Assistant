"use client";
import { useEffect, useState, useRef } from "react";
import { generateAll } from "@/lib/api";

export default function SummaryPage() {
    const [summary, setSummary] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchSummary = async () => {
            const docId = localStorage.getItem("documentId");
            if (!docId) {
                setError("No document found. Please upload a file first.");
                setLoading(false);
                return;
            }
            try {
                const data = await generateAll(docId);
                setSummary(data.summary || "No summary available.");
            } catch (err: any) {
                setError(err.message || "Failed to fetch summary.");
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) {
        return (
            <div style={pageStyle}>
                <GalaxyBackground />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 120, position: "relative", zIndex: 10 }}>
                    <div style={spinnerStyle} />
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, letterSpacing: 1 }}>
                        Analyzing and summarizing your document with AI...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={pageStyle}>
                <GalaxyBackground />
                <div style={{ ...glassCard, maxWidth: 480, margin: "80px auto", textAlign: "center", padding: 40, position: "relative", zIndex: 10 }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                    <p style={{ color: "#f87171", fontSize: 16 }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            <GalaxyBackground />
            <div style={{ position: "relative", zIndex: 10, maxWidth: 800, margin: "0 auto" }}>
                <h1 style={headingStyle}>Summary</h1>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, marginBottom: 40, textAlign: "center" }}>
                    The core concepts taught in this topic.
                </p>

                <div style={{
                    ...glassCard,
                    padding: "40px",
                    color: "rgba(255,255,255,0.9)",
                    fontSize: 16,
                    lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                }}>
                    {summary}
                </div>
            </div>
        </div>
    );
}

function GalaxyBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        let angle = 0;
        const stars: any[] = [];
        for (let i = 0; i < 300; i++) {
            stars.push({
                x: (Math.random() - 0.5) * 3000,
                y: (Math.random() - 0.5) * 3000,
                r: Math.random() * 1.5,
                c: ["#8b5cf6", "#3b82f6", "#f43f5e", "#ffffff"][Math.floor(Math.random() * 4)]
            });
        }

        let animationFrameId: number;
        const render = () => {
            ctx.fillStyle = "rgba(8, 3, 18, 0.1)";
            ctx.fillRect(0, 0, width, height);

            ctx.save();
            ctx.translate(width / 2, height / 2);
            ctx.rotate(angle);

            stars.forEach(s => {
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = s.c;
                ctx.globalAlpha = 0.8;
                ctx.fill();
            });
            ctx.restore();

            angle += 0.0003;
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);
    return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }} />;
}

/* ── Styles ── */
const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#080312",
    padding: "60px 24px 80px",
    position: "relative",
    fontFamily: "'Inter', sans-serif",
};

const glassCard: React.CSSProperties = {
    background: "rgba(20,15,35,0.4)",
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 24,
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
};

const headingStyle: React.CSSProperties = {
    fontSize: "clamp(32px, 5vw, 56px)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.5))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 16px",
    letterSpacing: -1,
    textAlign: "center"
};

const spinnerStyle: React.CSSProperties = {
    width: 48, height: 48, borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.1)",
    borderTopColor: "#818cf8",
    animation: "spin 0.8s linear infinite",
};
