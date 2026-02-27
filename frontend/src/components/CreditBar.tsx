"use client";
import { useState, useEffect } from "react";
import { getUserCredits } from "@/lib/api";

export default function CreditBar() {
    const [credits, setCredits] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCredits() {
            try {
                const data = await getUserCredits();
                setCredits(data.credits);
            } catch (err: any) {
                console.error("Failed to fetch credits:", err);
                setError("Failed to load credits");
            }
        }
        fetchCredits();
    }, []);

    if (credits === null && !error) return null; // Loading state (hide it to prevent flash)

    const MAX_CREDITS = 100;
    const percentage = credits !== null ? Math.min(Math.max((credits / MAX_CREDITS) * 100, 0), 100) : 0;

    let barColor = "#22c55e"; // Default Green (61-100)
    if (credits !== null) {
        if (credits <= 30) {
            barColor = "#ef4444"; // Red (0-30)
        } else if (credits <= 60) {
            barColor = "#eab308"; // Yellow (31-60)
        }
    }

    return (
        <div style={{
            width: "100%",
            background: "rgba(0, 0, 0, 0.4)",
            position: "relative",
            zIndex: 51,
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)"
        }}>
            {/* Progress Bar Background */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: `${percentage}%`,
                backgroundColor: barColor,
                transition: "width 0.5s ease-out, background-color 0.5s ease"
            }} />

            {/* Content Container (Ensures text stays on top) */}
            <div style={{
                position: "relative",
                zIndex: 10,
                color: "white",
                fontSize: "0.85rem",
                fontWeight: 600,
                textAlign: "center",
                padding: "6px 16px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                textShadow: "0px 1px 3px rgba(0,0,0,0.5)"
            }}>
                <span>⚡</span>
                {error ? (
                    <span>{error}</span>
                ) : (
                    <span>
                        You have <strong style={{ fontSize: "0.9rem" }}>{credits}</strong> generation credits remaining
                    </span>
                )}
            </div>
        </div>
    );
}
