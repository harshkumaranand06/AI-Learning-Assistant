"use client";
import { useEffect, useState, useRef } from "react";
import { generateFlashcards } from "@/lib/api";

interface Flashcard {
    question: string;
    answer: string;
}

const CARD_COLORS = [
    { from: "#6366f1", to: "#8b5cf6" },   // indigo → violet
    { from: "#3b82f6", to: "#06b6d4" },   // blue → cyan
    { from: "#ec4899", to: "#f43f5e" },   // pink → rose
    { from: "#10b981", to: "#14b8a6" },   // emerald → teal
    { from: "#f59e0b", to: "#f97316" },   // amber → orange
    { from: "#8b5cf6", to: "#ec4899" },   // violet → pink
];

function Particle({ style }: { style: React.CSSProperties }) {
    return <div style={style} />;
}

export default function FlashcardsPage() {
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [flipped, setFlipped] = useState<Record<number, boolean>>({});
    const [current, setCurrent] = useState(0);
    const [mode, setMode] = useState<"grid" | "focus">("grid");
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchCards = async (retryStrategy = false) => {
            const docId = localStorage.getItem("documentId");
            if (!docId) {
                setError("No document found. Please upload a file first.");
                setLoading(false);
                return;
            }
            if (!retryStrategy) setError("");
            try {
                const data = await generateFlashcards(docId);
                setCards(data);
                setError(""); // Clear lingering poll messages
            } catch (err: any) {
                const msg = err.message || "Failed to generate flashcards.";
                if (msg.includes("still generating")) {
                    setError("⏳ Document is still being processed by the AI... Auto-retrying in 5 seconds.");
                    setTimeout(() => {
                        fetchCards(true);
                    }, 5000);
                } else {
                    setError(msg);
                    setLoading(false); // Only kill loading on fatal errors
                }
            } finally {
                // If cards are successfully fetched, another useEffect will disable loading
            }
        };
        fetchCards();
    }, []);

    // Stop loading only when cards natively arrive
    useEffect(() => {
        if (cards.length > 0) {
            setLoading(false);
        }
    }, [cards]);

    const toggleFlip = (index: number) =>
        setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));

    const goNext = () => {
        setFlipped((prev) => ({ ...prev, [current]: false }));
        setTimeout(() => setCurrent((c) => (c + 1) % cards.length), 150);
    };
    const goPrev = () => {
        setFlipped((prev) => ({ ...prev, [current]: false }));
        setTimeout(() => setCurrent((c) => (c - 1 + cards.length) % cards.length), 150);
    };

    const mastered = Object.values(flipped).filter(Boolean).length;

    /* ── Loading ── */
    if (loading) {
        return (
            <div style={pageStyle}>
                <FlashcardGalaxy />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, paddingTop: 120, position: "relative", zIndex: 10 }}>
                    <div style={spinnerStyle} />
                    <div style={{ background: "rgba(0,0,0,0.6)", padding: "24px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", maxWidth: "500px" }}>
                        <p style={{ color: error ? "#fbbf24" : "#fff", fontSize: 18, fontWeight: 600, letterSpacing: 0.5, lineHeight: "1.6", textAlign: "center", margin: 0 }}>
                            {error || "Generating flashcards with AI…"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Error ── */
    if (error) {
        return (
            <div style={pageStyle}>
                <FlashcardGalaxy />
                <div style={{ ...glassCard, maxWidth: 480, margin: "80px auto", textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                    <p style={{ color: "#f87171", fontSize: 16 }}>{error}</p>
                </div>
            </div>
        );
    }

    const color = CARD_COLORS[current % CARD_COLORS.length];

    return (
        <div style={pageStyle} ref={containerRef}>
            <FlashcardGalaxy />

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 40, position: "relative", zIndex: 10 }}>
                <h1 style={headingStyle}>Study Flashcards</h1>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, marginBottom: 20 }}>
                    Click a card to flip · {cards.length} cards total
                </p>

                {/* Progress bar */}
                <div style={{ width: 280, margin: "0 auto 20px", background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 6 }}>
                    <div style={{
                        height: "100%", borderRadius: 99,
                        background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
                        width: `${(mastered / cards.length) * 100}%`,
                        transition: "width 0.4s ease",
                    }} />
                </div>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                    {mastered} / {cards.length} mastered
                </p>

                {/* Mode toggle */}
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
                    {(["grid", "focus"] as const).map((m) => (
                        <button key={m} onClick={() => setMode(m)} style={{
                            ...toggleBtn,
                            background: mode === m ? `linear-gradient(135deg, ${color.from}, ${color.to})` : "rgba(255,255,255,0.08)",
                            color: mode === m ? "#fff" : "rgba(255,255,255,0.5)",
                        }}>
                            {m === "grid" ? "⊞ Grid" : "⬛ Focus"}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── FOCUS MODE ── */}
            {mode === "focus" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, position: "relative", zIndex: 10 }}>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 2 }}>
                        {current + 1} / {cards.length}
                    </div>

                    {/* Big flip card */}
                    <div onClick={() => toggleFlip(current)}
                        style={{ width: "min(580px, 92vw)", height: 340, perspective: "1400px", cursor: "pointer" }}>
                        <div style={{
                            position: "relative", width: "100%", height: "100%",
                            transformStyle: "preserve-3d",
                            transition: "transform 0.65s cubic-bezier(0.4,0.2,0.2,1)",
                            transform: flipped[current] ? "rotateY(180deg)" : "rotateY(0deg)",
                        }}>
                            {/* Front */}
                            <FocusFace label="Question" text={cards[current]?.question} color={color} flipped={false} />
                            {/* Back */}
                            <FocusFace label="Answer" text={cards[current]?.answer} color={color} flipped={true} isBack />
                        </div>
                    </div>

                    {/* Nav buttons */}
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <button onClick={goPrev} style={navBtn}>← Prev</button>
                        <button onClick={() => toggleFlip(current)} style={{
                            ...navBtn,
                            background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                            color: "#fff", padding: "12px 28px", fontWeight: 700,
                        }}>
                            {flipped[current] ? "Hide Answer" : "Reveal Answer"}
                        </button>
                        <button onClick={goNext} style={navBtn}>Next →</button>
                    </div>
                </div>
            )}

            {/* ── GRID MODE ── */}
            {mode === "grid" && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 24,
                    position: "relative", zIndex: 10,
                }}>
                    {cards.map((card, idx) => {
                        const c = CARD_COLORS[idx % CARD_COLORS.length];
                        return (
                            <div key={idx} onClick={() => toggleFlip(idx)}
                                style={{ height: 220, perspective: "1200px", cursor: "pointer" }}>
                                <div style={{
                                    position: "relative", width: "100%", height: "100%",
                                    transformStyle: "preserve-3d",
                                    transition: "transform 0.6s cubic-bezier(0.4,0.2,0.2,1)",
                                    transform: flipped[idx] ? "rotateY(180deg)" : "rotateY(0deg)",
                                }}>
                                    {/* Front */}
                                    <GridFace label="Question" text={card.question} color={c} isBack={false} />
                                    {/* Back */}
                                    <GridFace label="Answer" text={card.answer} color={c} isBack={true} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── Sub-components ── */

function FlashcardGalaxy() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        let width = window.innerWidth; let height = window.innerHeight;
        canvas.width = width; canvas.height = height;

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
            // Create deep trail effect
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

        const handleResize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
        window.addEventListener("resize", handleResize);
        return () => { window.removeEventListener("resize", handleResize); cancelAnimationFrame(animationFrameId); };
    }, []);
    return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }} />;
}

function FocusFace({ label, text, color, flipped: _f, isBack }: {
    label: string; text: string; color: { from: string; to: string }; flipped: boolean; isBack?: boolean;
}) {
    return (
        <div style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: isBack ? "rotateY(180deg)" : undefined,
            borderRadius: 24,
            background: isBack
                ? `linear-gradient(135deg, ${color.from}22, ${color.to}33)`
                : "rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: `1px solid ${isBack ? color.from + "55" : "rgba(255,255,255,0.12)"}`,
            boxShadow: isBack
                ? `0 0 40px ${color.from}33, 0 20px 60px rgba(0,0,0,0.4)`
                : "0 20px 60px rgba(0,0,0,0.4)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: 40, gap: 16,
            textAlign: "center",
        }}>
            <span style={{
                fontSize: 11, letterSpacing: 3, fontWeight: 700, textTransform: "uppercase",
                background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                marginBottom: 8,
            }}>{label}</span>
            <p style={{ color: "#fff", fontSize: 20, fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{text}</p>
            <div style={{
                width: 48, height: 3, borderRadius: 99,
                background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
                marginTop: 8, opacity: 0.6,
            }} />
        </div>
    );
}

function GridFace({ label, text, color, isBack }: {
    label: string; text: string; color: { from: string; to: string }; isBack: boolean;
}) {
    return (
        <div style={{
            position: "absolute", inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: isBack ? "rotateY(180deg)" : undefined,
            borderRadius: 20,
            background: isBack
                ? `linear-gradient(135deg, ${color.from}22, ${color.to}33)`
                : "rgba(20,15,35,0.4)",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            border: `1px solid ${isBack ? color.from + "44" : "rgba(255,255,255,0.06)"}`,
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "24px 20px", gap: 12,
            textAlign: "center",
            transition: "box-shadow 0.3s",
        }}>
            <span style={{
                fontSize: 10, letterSpacing: 3, fontWeight: 700, textTransform: "uppercase",
                background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>{label}</span>
            <p style={{
                color: "#fff", fontSize: 14, fontWeight: 500,
                lineHeight: 1.55, margin: 0,
                display: "-webkit-box", WebkitLineClamp: 5,
                WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>{text}</p>
            <div style={{
                width: 32, height: 2, borderRadius: 99,
                background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
                opacity: 0.5,
            }} />
        </div>
    );
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
    fontSize: "clamp(28px, 5vw, 48px)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.5))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 8px",
    letterSpacing: -1,
};

const spinnerStyle: React.CSSProperties = {
    width: 48, height: 48, borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.1)",
    borderTopColor: "#818cf8",
    animation: "spin 0.8s linear infinite",
};

const toggleBtn: React.CSSProperties = {
    padding: "8px 20px", borderRadius: 99, border: "none",
    cursor: "pointer", fontSize: 13, fontWeight: 600,
    transition: "all 0.2s", letterSpacing: 0.5,
};

const navBtn: React.CSSProperties = {
    padding: "10px 22px", borderRadius: 99,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.7)", cursor: "pointer",
    fontSize: 14, fontWeight: 600, transition: "all 0.2s",
};
