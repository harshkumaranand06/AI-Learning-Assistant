"use client";
import { useState, useRef, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! How can I help you understand your study material?" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const currentMessages = [...messages, userMsg];

            // MOCK STREAMING FOR UI DESIGN
            // const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
            //   method: "POST",
            //   headers: { "Content-Type": "application/json" },
            //   body: JSON.stringify({ messages: currentMessages }),
            // });

            // if (!response.ok) throw new Error("Network response was not ok");

            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

            // Mock streaming logic for UI preview
            const mockText = "Here is a detailed explanation of the concept you asked about, simulated for your new 4K UI design. Machine learning models use gradient descent to optimize parameters. This allows for rich pattern recognition. How else can I assist you today?";
            let i = 0;

            const streamTimer = setInterval(() => {
                if (i < mockText.length) {
                    const char = mockText[i];
                    setMessages((prev) => {
                        const next = [...prev];
                        next[next.length - 1].content += char;
                        return next;
                    });
                    i++;
                } else {
                    clearInterval(streamTimer);
                    setLoading(false);
                }
            }, 30);

        } catch (error) {
            console.error("Streaming error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I encountered an error while typing the response." },
            ]);
            setLoading(false);
        }
    };

    return (
        <div style={pageStyle}>
            <ChatGalaxy />

            <div style={{ maxWidth: 900, height: "85vh", margin: "0 auto", position: "relative", zIndex: 10, display: "flex", flexDirection: "column" }}>

                {/* Header */}
                <div style={{ ...glassPanel, padding: "24px 32px", marginBottom: 24, textAlign: "center", borderBottom: "none" }}>
                    <h1 style={headingStyle}>Neural Network Chat</h1>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, letterSpacing: 1 }}>
                        RAG-powered Knowledge Retrieval
                    </p>
                </div>

                {/* Chat Window */}
                <div style={{
                    ...glassPanel, flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative"
                }}>
                    {/* Messages */}
                    <div style={{ flexGrow: 1, overflowY: "auto", padding: "32px", display: "flex", flexDirection: "column", gap: 24 }} className="hide-scrollbar">
                        {messages.map((msg, idx) => {
                            const isUser = msg.role === "user";
                            return (
                                <div key={idx} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                                    <div style={{
                                        maxWidth: "75%", padding: "18px 24px", borderRadius: 24,
                                        fontSize: 15, lineHeight: 1.6, position: "relative",
                                        background: isUser
                                            ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.3))"
                                            : "rgba(255,255,255,0.03)",
                                        border: `1px solid ${isUser ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.08)"}`,
                                        color: isUser ? "#fff" : "rgba(255,255,255,0.85)",
                                        borderBottomRightRadius: isUser ? 4 : 24,
                                        borderBottomLeftRadius: !isUser ? 4 : 24,
                                        boxShadow: isUser ? "0 10px 30px rgba(99,102,241,0.15)" : "0 10px 30px rgba(0,0,0,0.2)"
                                    }}>
                                        {msg.content}
                                        {msg.role === "assistant" && loading && idx === messages.length - 1 && !msg.content && (
                                            <span style={{
                                                display: "inline-block", width: 8, height: 16, background: "rgba(255,255,255,0.5)",
                                                animation: "pulse 1s infinite", marginLeft: 8, borderRadius: 2
                                            }} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: "24px 32px", borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)" }}>
                        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 16 }}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question about your documents..."
                                disabled={loading}
                                style={{
                                    flexGrow: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 99, padding: "16px 24px", color: "#fff", fontSize: 15,
                                    outline: "none", transition: "all 0.3s", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.2)"
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                style={{
                                    padding: "0 32px", borderRadius: 99, border: "none", color: "#fff", fontWeight: 700,
                                    fontSize: 15, cursor: (!input.trim() || loading) ? "not-allowed" : "pointer",
                                    background: (!input.trim() || loading) ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                    boxShadow: (!input.trim() || loading) ? "none" : "0 8px 24px rgba(99,102,241,0.4)",
                                    transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 120
                                }}
                            >
                                {loading ? <div style={spinnerStyle} /> : "Send"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <style>{`
        .hide-scrollbar::-webkit-scrollbar { width: 6px; }
        .hide-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .hide-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .hide-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
        </div>
    );
}

/* ── Background orbs ── */
function ChatGalaxy() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        let width = window.innerWidth; let height = window.innerHeight;
        canvas.width = width; canvas.height = height;

        const nodes: any[] = [];
        for (let i = 0; i < 80; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                r: Math.random() * 2 + 1
            });
        }

        let animationFrameId: number;
        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Move nodes
            nodes.forEach(n => {
                n.x += n.vx; n.y += n.vy;
                if (n.x < 0 || n.x > width) n.vx *= -1;
                if (n.y < 0 || n.y > height) n.vy *= -1;
            });

            // Draw connections
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = `rgba(139, 92, 246, ${(1 - dist / 150) * 0.5})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }

            // Draw nodes
            nodes.forEach(n => {
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(99, 102, 241, 0.8)";
                ctx.fill();
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
    background: "#080312", // Ultra deep purple-black for 4K contrast
    padding: "40px 24px 60px",
    position: "relative",
    fontFamily: "'Inter', sans-serif",
};

const glassPanel: React.CSSProperties = {
    background: "rgba(20,15,35,0.4)", // Deep dark glass
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 24,
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
};

const headingStyle: React.CSSProperties = {
    fontSize: "clamp(24px, 4vw, 36px)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #fff 20%, #a5b4fc 80%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 4px",
    letterSpacing: -0.5,
};

const spinnerStyle: React.CSSProperties = {
    width: 20, height: 20, borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.2)",
    borderTopColor: "#fff",
    animation: "spin 0.8s linear infinite",
};
