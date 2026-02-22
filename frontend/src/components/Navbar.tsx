"use client";
import Link from "next/link";

export default function Navbar() {
    return (
        <nav style={{
            background: "rgba(10,5,20,0.6)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            position: "sticky",
            top: 0,
            zIndex: 50,
            padding: "16px 24px",
            width: "100%",
        }}>
            <div style={{
                maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
                <Link href="/" style={{
                    fontSize: 20, fontWeight: 800, letterSpacing: -0.5,
                    background: "linear-gradient(135deg, #fff 20%, #a5b4fc 80%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    textDecoration: "none"
                }}>
                    AI Learning Assistant
                </Link>
                <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
                    <NavLink href="/upload">Upload</NavLink>
                    <NavLink href="/flashcards">Flashcards</NavLink>
                    <NavLink href="/quiz">Quiz</NavLink>
                    <NavLink href="/chat" isButton>Chat AI</NavLink>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ href, children, isButton }: { href: string; children: React.ReactNode; isButton?: boolean }) {
    if (isButton) {
        return (
            <Link href={href} style={{
                padding: "8px 20px", borderRadius: 99,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", fontWeight: 700, fontSize: 14,
                textDecoration: "none", boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
                transition: "all 0.2s"
            }}>
                {children}
            </Link>
        );
    }

    return (
        <Link href={href} style={{
            color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600,
            textDecoration: "none", transition: "color 0.2s"
        }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
        >
            {children}
        </Link>
    );
}
