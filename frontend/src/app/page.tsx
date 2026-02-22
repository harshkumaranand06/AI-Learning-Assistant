"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  return (
    <div style={pageStyle}>
      <BackgroundStars />
      <BgOrbs />

      {/* HERO SECTION */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "12vh", paddingBottom: "60px", textAlign: "center", position: "relative", zIndex: 10 }}>

        <div className="animate-fade-in-up" style={{ maxWidth: 800, marginBottom: 40, animationDelay: "0ms" }}>
          <div style={{ display: "inline-block", padding: "8px 24px", borderRadius: 99, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#c084fc", fontWeight: 700, fontSize: 14, marginBottom: 24, letterSpacing: 1, textTransform: "uppercase" }}>
            The Future of Education
          </div>
          <h1 style={{ ...headingStyle, fontSize: "clamp(48px, 8vw, 84px)", marginBottom: 24, lineHeight: 1.1 }}>
            Supercharge Your <br />
            <span style={{
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>Learning</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(18px, 2vw, 22px)", lineHeight: 1.6, maxWidth: 650, margin: "0 auto" }}>
            Upload any PDF document or YouTube URL to instantly generate flashcards, interactive quizzes, and tap into AI-powered RAG chat for your study material.
          </p>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <Link href="/upload" className="primary-btn pulse-glow" style={{ ...primaryBtn, marginBottom: 60 }}>
            Start Learning Free
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="animate-fade-in-up" style={{ width: "100%", maxWidth: 1100, animationDelay: "300ms", marginTop: 20 }}>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 32, width: "100%"
          }}>
            {/* Card 1 */}
            <div className="glass-card float-anim" style={{ ...glassCard, animationDuration: "6s" }}>
              <div style={{ ...iconWrapper, background: "rgba(99,102,241,0.15)", color: "#818cf8", boxShadow: "0 0 30px rgba(99,102,241,0.2)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
              </div>
              <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Smart Flashcards</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>Our AI engine deeply analyzes your uploads to automatically extract core concepts and definitions into perfect bite-sized flashcards with a sleek 3D flip animation for rapid memorization.</p>
            </div>

            {/* Card 2 */}
            <div className="glass-card float-anim" style={{ ...glassCard, animationDuration: "7s", animationDelay: "200ms" }}>
              <div style={{ ...iconWrapper, background: "rgba(236,72,153,0.15)", color: "#f472b6", boxShadow: "0 0 30px rgba(236,72,153,0.2)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </div>
              <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Interactive Quizzes</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>Test your mastery with AI-generated multiple-choice questions. We instantly grade your answers and provide detailed breakdown tracking so you know exactly what subjects to study next.</p>
            </div>

            {/* Card 3 */}
            <div className="glass-card float-anim" style={{ ...glassCard, animationDuration: "5s", animationDelay: "400ms" }}>
              <div style={{ ...iconWrapper, background: "rgba(16,185,129,0.15)", color: "#34d399", boxShadow: "0 0 30px rgba(16,185,129,0.2)" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>RAG Chat AI</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>Don't just read—converse with your materials. Using state-of-the-art Retrieval-Augmented Generation, you can chat with your documents and ask our neural network to explain anything.</p>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS SECTION */}
      <div style={{ position: "relative", zIndex: 10, padding: "80px 24px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, color: "#fff", marginBottom: 60, letterSpacing: -1 }}>How the Magic Works</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32, textAlign: "left" }}>
          {/* Step 1 */}
          <div className="glass-card" style={{ ...glassCard, alignItems: "flex-start", padding: 40 }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: "rgba(255,255,255,0.1)", marginBottom: 16, lineHeight: 1 }}>01</div>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Upload Data</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>Give us any messy PDF document, lecture slides, or just paste a YouTube video link. We extract the raw text and transcripts in seconds.</p>
          </div>
          {/* Step 2 */}
          <div className="glass-card" style={{ ...glassCard, alignItems: "flex-start", padding: 40 }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: "rgba(255,255,255,0.1)", marginBottom: 16, lineHeight: 1 }}>02</div>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 16 }}>AI Analysis</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>Our ultra-fast LLM reads through your uploaded data, understands the context, identifies key entities, and structures the knowledge graph.</p>
          </div>
          {/* Step 3 */}
          <div className="glass-card" style={{ ...glassCard, alignItems: "flex-start", padding: 40 }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: "rgba(255,255,255,0.1)", marginBottom: 16, lineHeight: 1 }}>03</div>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Learn & Master</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>Instantly get a personalized study suite. Flip through flashcards, take graded quizzes, and chat with the AI tutor to clarify doubts natively.</p>
          </div>
        </div>
      </div>

      {/* USE CASES SECTION */}
      <div style={{ position: "relative", zIndex: 10, padding: "80px 24px", maxWidth: 1100, margin: "0 auto 80px" }}>
        <div style={{ ...glassCard, padding: "64px 40px", flexDirection: "row", flexWrap: "wrap", gap: 48, alignItems: "center", justifyContent: "space-between", background: "rgba(20,15,35,0.6)" }}>
          <div style={{ flex: "1 1 400px", textAlign: "left" }}>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 40px)", fontWeight: 800, color: "#fff", marginBottom: 24, letterSpacing: -1 }}>Built for Every Learner</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, lineHeight: 1.6, marginBottom: 24 }}>
              Whether you are cramming for a final exam, trying to understand a complex 2-hour podcast, or onboarding into a new corporate role, our AI Assistant adapts to your content.
            </p>
            <ul style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              <li style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "#4ade80", borderRadius: "50%", width: 8, height: 8 }} />
                <strong>University Students</strong> summarizing lecture slides
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "#60a5fa", borderRadius: "50%", width: 8, height: 8 }} />
                <strong>Professionals</strong> parsing dense technical documentation
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: "#f472b6", borderRadius: "50%", width: 8, height: 8 }} />
                <strong>Lifelong Learners</strong> pulling insights from YouTube talks
              </li>
            </ul>
          </div>
          <div style={{ flex: "1 1 300px", display: "flex", justifyContent: "center" }}>
            <div style={{
              position: "relative", width: 250, height: 250, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)",
              boxShadow: "0 0 100px rgba(99,102,241,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.05)"
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="url(#blueGrad)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6M2 12h20" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "40px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>© 2026 AI Learning Assistant. Supercharge your brain.</p>
      </footer>

      <style>{`
        /* Fade In Up */
        .animate-fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(30px);
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Continuous Floating */
        .float-anim {
          animation-name: floatElement;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }
        @keyframes floatElement {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-15px); }
        }

        /* Glass Card Hover Interaction */
        .glass-card {
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                      box-shadow 0.4s ease, 
                      border-color 0.4s ease !important;
        }
        .glass-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 30px 100px rgba(99,102,241,0.25) !important;
          border-color: rgba(255,255,255,0.15) !important;
          z-index: 20;
        }

        /* Primary Button Animations */
        .primary-btn {
          position: relative;
          overflow: hidden;
        }
        .primary-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
          transform: skewX(-20deg);
          animation: shine 4s infinite;
        }
        @keyframes shine {
          0%, 60% { left: -100%; }
          100% { left: 200%; }
        }
        .primary-btn:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 15px 50px rgba(168,85,247,0.6) !important;
        }
        .pulse-glow {
          animation: btnPulse 3s infinite alternate;
        }
        @keyframes btnPulse {
          0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
          100% { box-shadow: 0 0 0 15px rgba(99,102,241,0); }
        }

        /* Wormhole Animations */
        @keyframes spinHole {
          to { transform: rotate(360deg); }
        }
        @keyframes pulseHole {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes warpSwirl {
          40% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(0.9); }
        }
      `}</style>
    </div>
  );
}

function BackgroundStars() {
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

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetSpeed = 2;
    let speed = 2;
    let mouseTimeout: any;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Speed up stars when moving mouse anywhere
      targetSpeed = 15;

      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        targetSpeed = 2; // Slow down when mouse stops
      }, 150);
    };

    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);

    class Star {
      x: number;
      y: number;
      z: number;
      pz: number;

      constructor() {
        const radius = Math.max(width, height);
        this.x = (Math.random() - 0.5) * radius * 3;
        this.y = (Math.random() - 0.5) * radius * 3;
        this.z = Math.random() * width;
        this.pz = this.z;
      }

      update() {
        this.z -= speed;
        if (this.z < 1) {
          this.z = width;
          const radius = Math.max(width, height);
          this.x = (Math.random() - 0.5) * radius * 3;
          this.y = (Math.random() - 0.5) * radius * 3;
          this.pz = this.z;
        }
      }

      show() {
        if (!ctx) return;

        const sx = (this.x / this.z) * width + mouseX;
        const sy = (this.y / this.z) * height + mouseY;

        const px = (this.x / this.pz) * width + mouseX;
        const py = (this.y / this.pz) * height + mouseY;

        this.pz = this.z;

        const r = Math.max(0.1, (1 - this.z / width) * 2);

        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, 1 - this.z / width)})`;
        ctx.lineWidth = r;
        ctx.stroke();
      }
    }

    const stars: Star[] = Array.from({ length: 600 }, () => new Star());

    let animationFrameId: number;
    const draw = () => {
      speed += (targetSpeed - speed) * 0.05;
      ctx.clearRect(0, 0, width, height);

      stars.forEach((star) => {
        star.update();
        star.show();
      });

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1, pointerEvents: 'none' }}
    />
  );
}

function BgOrbs() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {[
        { size: 800, top: "-20%", left: "-10%", color: "rgba(99,102,241,0.15)" },
        { size: 600, bottom: "-20%", right: "-10%", color: "rgba(236,72,153,0.12)" },
        { size: 500, top: "20%", left: "40%", color: "rgba(139,92,246,0.1)" },
      ].map((o, i) => (
        <div key={i} style={{
          position: "absolute", borderRadius: "50%",
          width: o.size, height: o.size,
          background: `radial-gradient(circle, ${o.color}, transparent 70%)`,
          top: (o as any).top, left: (o as any).left,
          bottom: (o as any).bottom, right: (o as any).right,
          filter: "blur(60px)",
          animation: `homeOrb${i} ${12 + i * 3}s ease-in-out infinite alternate`,
        }} />
      ))}
      <style>{`
        @keyframes homeOrb0 { from{transform:translate(0,0)} to{transform:translate(60px,50px)} }
        @keyframes homeOrb1 { from{transform:translate(0,0)} to{transform:translate(-70px,40px)} }
        @keyframes homeOrb2 { from{transform:translate(0,0)} to{transform:translate(50px,-60px)} }
      `}</style>
    </div>
  );
}

/* ── Styles ── */
const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#080312",
  position: "relative",
  overflow: "hidden",
  fontFamily: "'Inter', sans-serif"
};

const headingStyle: React.CSSProperties = {
  fontWeight: 800,
  letterSpacing: -2,
  color: "#fff",
};

const primaryBtn: React.CSSProperties = {
  padding: "20px 48px", borderRadius: 99,
  background: "linear-gradient(135deg, #6366f1, #a855f7)",
  color: "#fff", fontSize: 18, fontWeight: 800,
  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 12,
  boxShadow: "0 10px 40px rgba(99,102,241,0.5)",
  transition: "all 0.3s ease",
  position: "relative",
  zIndex: 20, // Ensure button stays interactive over cursor glow
};

const glassCard: React.CSSProperties = {
  background: "rgba(20,15,35,0.4)",
  backdropFilter: "blur(30px)",
  WebkitBackdropFilter: "blur(30px)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 32,
  padding: "48px 32px",
  boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
  display: "flex", flexDirection: "column", alignItems: "center",
  position: "relative",
  zIndex: 10,
};

const iconWrapper: React.CSSProperties = {
  width: 80, height: 80, borderRadius: 24,
  display: "flex", alignItems: "center", justifyContent: "center",
  marginBottom: 24,
};
