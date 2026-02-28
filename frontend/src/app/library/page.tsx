"use client";
import { useEffect, useState } from "react";
import { getLibraryDocuments } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LibraryPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const res = await getLibraryDocuments();
                setDocuments(res.documents || []);
            } catch (err: any) {
                setError(err.message || "Failed to load library");
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
    }, []);

    const handleSelectDocument = (docId: string, docTitle: string) => {
        localStorage.setItem("documentId", docId);
        // Optional: you could toast "Activated document X!"
        router.push("/chat");
    };

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 120 }}>
                    <div style={spinnerStyle} />
                    <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 20 }}>Loading your library...</p>
                </div>
            </div>
        );
    }

    const filteredDocs = documents.filter(doc =>
        doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.folder_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={pageStyle}>
            {/* Header */}
            <div style={{ maxWidth: 1000, margin: "0 auto 40px" }}>
                <h1 style={headingStyle}>Knowledge Library</h1>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, marginBottom: 32 }}>Manage and review all your uploaded PDFs and YouTube processing models.</p>

                <input
                    type="text"
                    placeholder="Search documents or folders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: "100%", padding: "16px 24px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(0,0,0,0.4)", color: "#fff", fontSize: 16, outline: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.3s"
                    }}
                />
            </div>

            {error ? (
                <div style={{ ...glassPanel, maxWidth: 400, margin: "100px auto", padding: 40, textAlign: "center", color: "#f87171" }}>
                    ⚠️ {error}
                </div>
            ) : filteredDocs.length > 0 ? (
                <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
                    {filteredDocs.map((doc, idx) => (
                        <div key={idx}
                            onClick={() => handleSelectDocument(doc.id, doc.title)}
                            style={{
                                ...glassPanel, padding: 24, cursor: "pointer", display: "flex", flexDirection: "column",
                                transition: "all 0.2s ease", transform: "scale(1)",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                <div style={{
                                    background: doc.source_type === 'youtube' ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.2)',
                                    color: doc.source_type === 'youtube' ? '#fca5a5' : '#7dd3fc',
                                    padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, textTransform: "uppercase"
                                }}>
                                    {doc.source_type}
                                </div>
                                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                                    {new Date(doc.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 600, margin: "0 0 8px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {doc.title || "Untitled Document"}
                            </h3>

                            <div style={{ marginTop: "auto", paddingTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <span style={{ background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 99, fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                                    📁 {doc.folder_name}
                                </span>
                                {doc.tags && doc.tags.map((tag: string, tIdx: number) => (
                                    <span key={tIdx} style={{ background: "rgba(99,102,241,0.15)", padding: "4px 10px", borderRadius: 99, fontSize: 11, color: "#818cf8", fontWeight: 500 }}>
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center", ...glassPanel, padding: 60 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                    <h3 style={{ color: "#fff", fontSize: 24, marginBottom: 8 }}>No documents found</h3>
                    <p style={{ color: "rgba(255,255,255,0.5)" }}>Upload a document to start building your library.</p>
                </div>
            )}
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
    background: "rgba(20,15,35,0.4)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 24,
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
};

const headingStyle: React.CSSProperties = {
    fontSize: "clamp(32px, 5vw, 48px)",
    fontWeight: 800,
    background: "linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.5))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 16px",
    letterSpacing: -1,
};

const spinnerStyle: React.CSSProperties = {
    width: 48, height: 48, borderRadius: "50%",
    border: "3px solid rgba(255,255,255,0.1)",
    borderTopColor: "#818cf8",
    animation: "spin 0.8s linear infinite",
};
