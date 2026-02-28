"use client";
import { useEffect, useState, useRef } from "react";
import { generateQuiz, submitQuizAttempt } from "@/lib/api";

interface Question {
    question: string;
    options: string[];
    correct_answer: string;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

const ACCENT_COLORS = [
    { from: "#6366f1", to: "#8b5cf6", shadow: "rgba(99,102,241,0.35)" },
    { from: "#3b82f6", to: "#06b6d4", shadow: "rgba(59,130,246,0.35)" },
    { from: "#ec4899", to: "#f43f5e", shadow: "rgba(236,72,153,0.35)" },
    { from: "#10b981", to: "#14b8a6", shadow: "rgba(16,185,129,0.35)" },
    { from: "#f59e0b", to: "#f97316", shadow: "rgba(245,158,11,0.35)" },
    { from: "#8b5cf6", to: "#ec4899", shadow: "rgba(139,92,246,0.35)" },
    { from: "#06b6d4", to: "#3b82f6", shadow: "rgba(6,182,212,0.35)" },
];

export default function QuizPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

    const [difficulty, setDifficulty] = useState("medium");
    const [isExamMode, setIsExamMode] = useState(false);
    const [isAdaptive, setIsAdaptive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
    const [started, setStarted] = useState(false);

    // Timer effect
    useEffect(() => {
        if (started && isExamMode && !submitted && !loading && !error) {
            if (timeLeft <= 0) {
                setSubmitted(true);
                return;
            }
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [started, isExamMode, submitted, loading, error, timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const startQuiz = async (retryStrategy = false) => {
        const docId = localStorage.getItem("documentId");
        if (!docId) {
            setError("No document found. Please upload a file first.");
            return;
        }

        setStarted(true);
        setLoading(true);
        if (!retryStrategy) setError(""); // Only clear error if it's the first try

        try {
            const data = await generateQuiz(docId, difficulty, isAdaptive);
            setQuestions(data);
            setError(""); // Clean up any lingering polling messages
        } catch (err: any) {
            const msg = err.message || "Failed to generate quiz.";
            if (msg.includes("still generating")) {
                setError("⏳ Document is still being processed by the AI... Auto-retrying in 5 seconds.");
                // Wait 5 seconds and poll again
                setTimeout(() => {
                    startQuiz(true);
                }, 5000);
            } else {
                setError(msg);
                setLoading(false); // Only kill loading on fatal errors
            }
        } finally {
            // We only stop the loading spinner if we successfully got questions, or hit a fatal error.
            // If we are polling, we keep it spinning.
        }
    };

    // Explicitly watch for questions to stop loading
    useEffect(() => {
        if (questions.length > 0) {
            setLoading(false);
        }
    }, [questions]);

    const handleSelect = (qIndex: number, option: string) => {
        if (submitted) return;
        setSelectedAnswers((prev) => ({ ...prev, [qIndex]: option }));
    };

    useEffect(() => {
        if (submitted && started) {
            const currentScore = questions.filter((q, i) => selectedAnswers[i] === q.correct_answer).length;
            const currentPercentage = Math.round((currentScore / questions.length) * 100);

            const wrongQs: Record<string, string> = {};
            questions.forEach((q, i) => {
                if (selectedAnswers[i] !== q.correct_answer) {
                    wrongQs[`q_${i}`] = JSON.stringify({
                        question: q.question,
                        your_answer: selectedAnswers[i] || "None",
                        correct_answer: q.correct_answer
                    });
                }
            });

            const docId = localStorage.getItem("documentId");
            if (docId) {
                submitQuizAttempt({
                    document_id: docId,
                    difficulty: difficulty,
                    score: currentScore,
                    total_questions: questions.length,
                    percentage: currentPercentage,
                    time_taken_seconds: (30 * 60) - timeLeft,
                    wrong_answers: Object.keys(wrongQs).length > 0 ? wrongQs : null
                }).catch(err => console.error("Failed to record quiz", err));
            }
        }
    }, [submitted]);

    const score = questions.filter((q, i) => selectedAnswers[i] === q.correct_answer).length;
    const answered = Object.keys(selectedAnswers).length;
    const percentage = submitted ? Math.round((score / questions.length) * 100) : 0;

    /* ── Starter screen ── */
    if (!started && !loading && !error) {
        return (
            <div style={pageStyle}>
                <QuizGalaxy />
                <div style={{ maxWidth: 640, margin: "100px auto", textAlign: "center", position: "relative", zIndex: 10, ...glassPanel, padding: "50px 40px" }}>
                    <h1 style={{ ...headingStyle, fontSize: 36 }}>Ready to test your knowledge?</h1>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, marginBottom: 40 }}>Select a difficulty level to generate a custom-tailored quiz from your document.</p>

                    <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 40, flexWrap: "wrap" }}>
                        {[
                            { id: "easy", label: "Easy", desc: "Basic recall & definitions" },
                            { id: "medium", label: "Medium", desc: "Standard application" },
                            { id: "hard", label: "Hard", desc: "Complex synthesis & analysis" }
                        ].map((level) => (
                            <button key={level.id} onClick={() => setDifficulty(level.id)}
                                style={{
                                    padding: "16px 24px", borderRadius: 16,
                                    background: difficulty === level.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${difficulty === level.id ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                                    color: "#fff",
                                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                                    cursor: "pointer", transition: "all 0.2s",
                                    boxShadow: difficulty === level.id ? "0 8px 24px rgba(99,102,241,0.2)" : "none",
                                    flex: "1 1 calc(33.333% - 16px)", minWidth: 140
                                }}>
                                <span style={{ fontSize: 18, fontWeight: 700, textTransform: "capitalize", color: difficulty === level.id ? "#818cf8" : "#fff" }}>
                                    {level.label}
                                </span>
                                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                                    {level.desc}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Exam Mode Toggle */}
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 32, marginBottom: 40, flexWrap: "wrap" }}>

                        {/* Exam Toggle */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                width: 50, height: 26, background: isExamMode ? "#8b5cf6" : "rgba(255,255,255,0.1)",
                                borderRadius: 99, cursor: "pointer", position: "relative", transition: "all 0.3s"
                            }} onClick={() => setIsExamMode(!isExamMode)}>
                                <div style={{
                                    width: 20, height: 20, background: "#fff", borderRadius: "50%",
                                    position: "absolute", top: 3, left: isExamMode ? 27 : 3, transition: "all 0.3s",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                                }} />
                            </div>
                            <div style={{ textAlign: "left" }}>
                                <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>⏱️ Exam Mode</div>
                                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>30-min timer • Auto-submit</div>
                            </div>
                        </div>

                        {/* Adaptive Toggle */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                width: 50, height: 26, background: isAdaptive ? "#10b981" : "rgba(255,255,255,0.1)",
                                borderRadius: 99, cursor: "pointer", position: "relative", transition: "all 0.3s",
                                boxShadow: isAdaptive ? "0 0 15px rgba(16, 185, 129, 0.4)" : "none"
                            }} onClick={() => setIsAdaptive(!isAdaptive)}>
                                <div style={{
                                    width: 20, height: 20, background: "#fff", borderRadius: "50%",
                                    position: "absolute", top: 3, left: isAdaptive ? 27 : 3, transition: "all 0.3s",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                                }} />
                            </div>
                            <div style={{ textAlign: "left" }}>
                                <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>🧠 Adaptive AI</div>
                                <div style={{ color: "rgba(16,185,129,0.8)", fontSize: 12 }}>Target past weak areas</div>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => startQuiz(false)} style={{ ...submitBtn, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", padding: "16px 64px" }}>
                        Generate Quiz ✨
                    </button>
                </div>
            </div>
        );
    }

    /* ── Loading ── */
    if (loading) {
        return (
            <div style={pageStyle}>
                <QuizGalaxy />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, paddingTop: 120, position: "relative", zIndex: 10 }}>
                    <div style={spinnerStyle} />
                    <div style={{ background: "rgba(0,0,0,0.6)", padding: "24px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", maxWidth: "500px" }}>
                        <p style={{ color: error ? "#fbbf24" : "#fff", fontSize: 18, fontWeight: 600, letterSpacing: 0.5, lineHeight: "1.6", textAlign: "center", margin: 0 }}>
                            {error || "Generating your quiz with AI…"}
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
                <QuizGalaxy />
                <div style={{ ...glassPanel, maxWidth: 480, margin: "80px auto", textAlign: "center", padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                    <p style={{ color: "#f87171", fontSize: 16 }}>{error}</p>
                </div>
            </div>
        );
    }

    /* ── Results screen ── */
    if (submitted) {
        const grade = percentage >= 80 ? "🏆" : percentage >= 60 ? "🎯" : percentage >= 40 ? "📚" : "💪";
        const msg = percentage >= 80 ? "Outstanding!" : percentage >= 60 ? "Good job!" : percentage >= 40 ? "Keep studying" : "Don't give up!";
        const gradColor = percentage >= 80 ? { from: "#10b981", to: "#14b8a6" } :
            percentage >= 60 ? { from: "#6366f1", to: "#8b5cf6" } :
                percentage >= 40 ? { from: "#f59e0b", to: "#f97316" } :
                    { from: "#f43f5e", to: "#ec4899" };
        return (
            <div style={pageStyle}>
                <QuizGalaxy />
                <div style={{ maxWidth: 680, margin: "0 auto", position: "relative", zIndex: 10 }}>
                    {/* Score card */}
                    <div style={{ ...glassPanel, textAlign: "center", padding: "56px 40px", marginBottom: 32 }}>
                        <div style={{ fontSize: 72, marginBottom: 16 }}>{grade}</div>
                        <h2 style={{ ...headingStyle, fontSize: 36, marginBottom: 8 }}>{msg}</h2>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, marginBottom: 32 }}>
                            You answered <strong style={{ color: "#fff" }}>{score}</strong> out of <strong style={{ color: "#fff" }}>{questions.length}</strong> correctly
                        </p>
                        {/* Circular score */}
                        <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 32px" }}>
                            <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
                                <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
                                <circle cx="70" cy="70" r="58" fill="none"
                                    stroke="url(#scoreGrad)" strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 58}`}
                                    strokeDashoffset={`${2 * Math.PI * 58 * (1 - percentage / 100)}`}
                                    style={{ transition: "stroke-dashoffset 1s ease" }}
                                />
                                <defs>
                                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor={gradColor.from} />
                                        <stop offset="100%" stopColor={gradColor.to} />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>{percentage}%</span>
                            </div>
                        </div>
                        <button onClick={() => {
                            setSubmitted(false);
                            setSelectedAnswers({});
                            setStarted(false);
                            setTimeLeft(30 * 60);
                        }}
                            style={{ ...submitBtn, background: `linear-gradient(135deg, ${gradColor.from}, ${gradColor.to})` }}>
                            Return to Setup
                        </button>
                    </div>

                    {/* Review answers */}
                    <h3 style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, letterSpacing: 3, textTransform: "uppercase", marginBottom: 20, paddingLeft: 4 }}>
                        Review Answers
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {questions.map((q, idx) => {
                            const c = ACCENT_COLORS[idx % ACCENT_COLORS.length];
                            const isCorrect = selectedAnswers[idx] === q.correct_answer;
                            return (
                                <div key={idx} style={{ ...glassPanel, padding: 24, borderColor: isCorrect ? "#10b98144" : "#f43f5e44" }}>
                                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
                                        <span style={{
                                            minWidth: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                            background: isCorrect ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)",
                                            color: isCorrect ? "#34d399" : "#fb7185", fontSize: 16, fontWeight: 700,
                                        }}>{isCorrect ? "✓" : "✗"}</span>
                                        <p style={{ color: "#fff", fontSize: 15, fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                                            {idx + 1}. {q.question}
                                        </p>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                        {q.options.map((opt, oi) => {
                                            const isSelected = selectedAnswers[idx] === opt;
                                            const isRight = opt === q.correct_answer;
                                            return (
                                                <div key={oi} style={{
                                                    padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 500,
                                                    background: isRight ? "rgba(16,185,129,0.15)" : isSelected && !isRight ? "rgba(244,63,94,0.15)" : "rgba(255,255,255,0.04)",
                                                    border: `1px solid ${isRight ? "#10b98155" : isSelected && !isRight ? "#f43f5e55" : "rgba(255,255,255,0.07)"}`,
                                                    color: isRight ? "#34d399" : isSelected && !isRight ? "#fb7185" : "rgba(255,255,255,0.5)",
                                                    display: "flex", gap: 8, alignItems: "center",
                                                }}>
                                                    <span style={{ fontWeight: 700, opacity: 0.7, minWidth: 18 }}>{OPTION_LABELS[oi]}.</span>
                                                    {opt}
                                                    {isRight && <span style={{ marginLeft: "auto" }}>✓</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    /* ── Quiz ── */
    return (
        <div style={pageStyle}>
            <QuizGalaxy />
            <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 10 }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 40, position: "relative" }}>
                    {isExamMode && (
                        <div style={{
                            position: "absolute", right: 0, top: 0, background: timeLeft < 300 ? "rgba(239, 68, 68, 0.2)" : "rgba(139, 92, 246, 0.2)",
                            border: `1px solid ${timeLeft < 300 ? "#ef4444" : "#8b5cf6"}`, padding: "8px 16px", borderRadius: 12,
                            color: timeLeft < 300 ? "#fca5a5" : "#ddd6fe", fontWeight: 700, display: "flex", alignItems: "center", gap: 8,
                            animation: timeLeft < 60 ? "pulse 1s infinite" : "none"
                        }}>
                            ⏱️ {formatTime(timeLeft)}
                        </div>
                    )}
                    <h1 style={headingStyle}>Knowledge Check</h1>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
                        <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
                            {questions.length} questions
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                        <span style={{
                            color: difficulty === 'hard' ? '#f43f5e' : difficulty === 'easy' ? '#10b981' : '#f59e0b',
                            fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1
                        }}>
                            {difficulty}
                        </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: 300, margin: "0 auto 8px", background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 6 }}>
                        <div style={{
                            height: "100%", borderRadius: 99,
                            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                            width: `${(answered / questions.length) * 100}%`,
                            transition: "width 0.35s ease",
                        }} />
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, letterSpacing: 1 }}>
                        {answered} / {questions.length} answered
                    </p>
                </div>

                {/* Questions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {questions.map((q, idx) => {
                        const c = ACCENT_COLORS[idx % ACCENT_COLORS.length];
                        return (
                            <div key={idx} style={{ ...glassPanel, padding: 28 }}>
                                {/* Q number badge + question */}
                                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
                                    <div style={{
                                        minWidth: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                                        background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                                        fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0,
                                        boxShadow: `0 4px 14px ${c.shadow}`,
                                    }}>{idx + 1}</div>
                                    <p style={{ color: "#fff", fontSize: 16, fontWeight: 600, margin: 0, lineHeight: 1.55 }}>{q.question}</p>
                                </div>

                                {/* Options */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    {q.options.map((opt, oi) => {
                                        const isSelected = selectedAnswers[idx] === opt;
                                        const btnKey = `${idx}-${oi}`;
                                        const isHovered = hoveredBtn === btnKey;
                                        return (
                                            <button key={oi}
                                                onClick={() => handleSelect(idx, opt)}
                                                onMouseEnter={() => setHoveredBtn(btnKey)}
                                                onMouseLeave={() => setHoveredBtn(null)}
                                                style={{
                                                    padding: "12px 16px", borderRadius: 12, border: "1px solid",
                                                    cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 500,
                                                    transition: "all 0.2s ease",
                                                    background: isSelected
                                                        ? `linear-gradient(135deg, ${c.from}33, ${c.to}44)`
                                                        : isHovered ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                                                    borderColor: isSelected ? `${c.from}88` : isHovered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
                                                    color: isSelected ? "#fff" : "rgba(255,255,255,0.65)",
                                                    boxShadow: isSelected ? `0 4px 20px ${c.shadow}` : "none",
                                                    display: "flex", gap: 10, alignItems: "center",
                                                }}>
                                                <span style={{
                                                    minWidth: 26, height: 26, borderRadius: 8, display: "flex",
                                                    alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                                                    background: isSelected ? `linear-gradient(135deg, ${c.from}, ${c.to})` : "rgba(255,255,255,0.08)",
                                                    color: "#fff", flexShrink: 0,
                                                }}>{OPTION_LABELS[oi]}</span>
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Submit */}
                <div style={{ marginTop: 32, textAlign: "center" }}>
                    <button
                        onClick={() => setSubmitted(true)}
                        disabled={answered < questions.length}
                        style={{
                            ...submitBtn,
                            background: answered === questions.length
                                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                : "rgba(255,255,255,0.08)",
                            color: answered === questions.length ? "#fff" : "rgba(255,255,255,0.3)",
                            cursor: answered === questions.length ? "pointer" : "not-allowed",
                            boxShadow: answered === questions.length ? "0 8px 32px rgba(99,102,241,0.4)" : "none",
                        }}>
                        {answered < questions.length
                            ? `Answer ${questions.length - answered} more question${questions.length - answered !== 1 ? "s" : ""}`
                            : "Submit Quiz →"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Background orbs ── */
function QuizGalaxy() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width; canvas.height = height;

        const particles: any[] = [];
        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 2 + 0.5,
                vy: -(Math.random() * 1.5 + 0.5),
                c: ["#6366f1", "#8b5cf6", "#ec4899", "#10b981"][Math.floor(Math.random() * 4)]
            });
        }

        let animationFrameId: number;
        const render = () => {
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.y += p.vy;
                if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = p.c;
                ctx.globalAlpha = 0.6;
                ctx.fill();
                ctx.globalAlpha = 1;
            });
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        const handleResize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
        window.addEventListener("resize", handleResize);
        return () => { window.removeEventListener("resize", handleResize); cancelAnimationFrame(animationFrameId); };
    }, []);
    return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }} />;
}

/* ── Styles ── */
const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "#080312",
    padding: "60px 24px 100px",
    position: "relative",
    fontFamily: "'Inter', sans-serif",
};

const glassPanel: React.CSSProperties = {
    background: "rgba(20,15,35,0.4)",
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 24,
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
};

const headingStyle: React.CSSProperties = {
    fontSize: "clamp(24px, 4vw, 44px)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.5))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 8px",
    letterSpacing: -0.5,
};

const spinnerStyle: React.CSSProperties = {
    width: 48, height: 48, borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.1)",
    borderTopColor: "#818cf8",
    animation: "spin 0.8s linear infinite",
};

const submitBtn: React.CSSProperties = {
    padding: "16px 48px", borderRadius: 99, border: "none",
    fontSize: 16, fontWeight: 700, letterSpacing: 0.5,
    transition: "all 0.3s ease",
};

// Global styles for pulse
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }
    `;
    document.head.appendChild(style);
}
