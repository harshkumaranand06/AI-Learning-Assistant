"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import {
    ReactFlow, Background, Controls, MiniMap,
    applyNodeChanges, applyEdgeChanges,
    NodeChange, EdgeChange, Node, Edge, Panel, ReactFlowProvider, useReactFlow,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { generateMindMap, explainTopic } from "@/lib/api";
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import { useRouter } from 'next/navigation';

// Custom Node
function MindMapNode({ data }: { data: any }) {
    return (
        <div style={{
            background: "rgba(20, 15, 35, 0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            padding: "16px 24px",
            borderRadius: "16px",
            color: "white",
            fontWeight: "600",
            fontSize: "15px",
            boxShadow: "0 8px 32px rgba(139, 92, 246, 0.15)",
            minWidth: "180px",
            maxWidth: "300px",
            textAlign: "center",
            wordWrap: "break-word",
            cursor: "pointer",
            transition: "all 0.2s ease"
        }}>
            {data.label}
        </div>
    );
}

const nodeTypes = { mindmap: MindMapNode };

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 250, height: 80 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const newNode: Node = {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: nodeWithPosition.x - 125,
                y: nodeWithPosition.y - 40,
            },
        };
        return newNode;
    });

    return { nodes: newNodes, edges };
};

function MindMapComponent() {
    const flowContainerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { fitView } = useReactFlow();

    const [documentId, setDocumentId] = useState("");
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    // Chat Panel State
    const [selectedTopic, setSelectedTopic] = useState("");
    const [explanation, setExplanation] = useState("");
    const [explaining, setExplaining] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);

    const onNodesChange = useCallback(
        (changes: NodeChange<Node>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [],
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange<Edge>[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [],
    );

    useEffect(() => {
        const docId = localStorage.getItem("documentId");
        if (docId) {
            setDocumentId(docId);
            generateMap(docId);
        }
        setInitialLoadDone(true);
    }, []);

    const generateMap = async (id: string) => {
        if (!id) return;
        setLoading(true);
        setError("");
        setNodes([]);
        setEdges([]);
        setPanelOpen(false);

        try {
            const result = await generateMindMap(id);
            const styledNodes = result.nodes.map((n: any) => ({
                ...n,
                type: 'mindmap',
                position: { x: 0, y: 0 }
            }));
            const styledEdges = result.edges.map((e: any) => ({
                ...e,
                animated: true,
                style: { stroke: '#8b5cf6', strokeWidth: 3, opacity: 0.8 }
            }));

            const layouted = getLayoutedElements(styledNodes, styledEdges, 'TB');
            setNodes(layouted.nodes);
            setEdges(layouted.edges);

            setTimeout(() => {
                fitView({ duration: 800, padding: 0.2 });
            }, 100);

        } catch (err: any) {
            setError(err.message || "Failed to generate mind map");
        } finally {
            setLoading(false);
        }
    };

    const handleNodeClick = async (event: React.MouseEvent, node: Node) => {
        const topic = (node.data as any).label;
        if (!topic) return;

        setSelectedTopic(topic);
        setPanelOpen(true);
        setExplaining(true);
        setExplanation("");

        try {
            const res = await explainTopic(documentId, topic);
            setExplanation(res.explanation);
        } catch (err: any) {
            setExplanation("Failed to load explanation: " + err.message);
        } finally {
            setExplaining(false);
        }
    };

    const exportPng = useCallback(() => {
        if (flowContainerRef.current === null) return;
        toPng(flowContainerRef.current, { backgroundColor: '#05010a' })
            .then((dataUrl) => {
                const a = document.createElement('a');
                a.setAttribute('download', 'mindmap.png');
                a.setAttribute('href', dataUrl);
                a.click();
            })
            .catch((err) => console.error(err));
    }, []);

    const exportJson = useCallback(() => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }, null, 2));
        const a = document.createElement('a');
        a.setAttribute('download', 'mindmap.json');
        a.setAttribute('href', dataStr);
        a.click();
    }, [nodes, edges]);

    const navigateToChat = () => {
        // Send them to chat page
        const message = `Please explain more about "${selectedTopic}" in the context of our document.`;
        // In a real app we might pass this via context or URL params
        sessionStorage.setItem("initialChatMessage", message);
        router.push("/chat");
    };

    if (!initialLoadDone) return null;

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 70px)', display: 'flex', position: 'relative', background: '#05010a' }}>

            {/* Main Graph Area */}
            <div ref={flowContainerRef} style={{ flex: 1, height: '100%', position: 'relative' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={handleNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    minZoom={0.1}
                    maxZoom={2}
                    className="bg-[#05010a]"
                >
                    <Background color="#333" gap={20} />
                    <Controls className="bg-gray-800 fill-white text-white border-none shadow-lg" />
                    <MiniMap
                        nodeColor="#8b5cf6"
                        maskColor="rgba(0,0,0,0.8)"
                        className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl"
                    />

                    <Panel position="top-right" className="flex gap-2 p-4">
                        <button onClick={exportPng} className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 border border-gray-600 shadow-lg">
                            ⬇️ PNG
                        </button>
                        <button onClick={exportJson} className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 border border-gray-600 shadow-lg">
                            ⬇️ JSON
                        </button>
                    </Panel>
                </ReactFlow>
            </div>

            {/* Smart Overlay / Loader */}
            {loading && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5, 1, 10, 0.85)', backdropFilter: 'blur(12px)' }}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid rgba(139, 92, 246, 0.2)', borderTopColor: '#8b5cf6', animation: 'spin 1s linear infinite', marginBottom: 24, boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)' }} />
                        <h2 style={{ fontSize: 24, fontWeight: 700, background: 'linear-gradient(135deg, #a78bfa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                            Generating AI Mind Map... ✨
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 15 }}>Analyzing semantic relationships in your document.</p>
                    </div>
                </div>
            )}

            {/* Error Overlay */}
            {!loading && error && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ background: 'rgba(200, 50, 50, 0.9)', padding: '20px 40px', borderRadius: 16, color: 'white', fontWeight: 'bold', pointerEvents: 'auto' }}>
                        {error}
                        <button onClick={() => generateMap(documentId)} className="ml-4 underline">Retry</button>
                    </div>
                </div>
            )}

            {/* Side Panel (Knowledge Expansion) */}
            <div style={{
                width: panelOpen ? 400 : 0,
                background: 'rgba(15, 10, 25, 0.95)',
                borderLeft: panelOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 50
            }}>
                {panelOpen && (
                    <div className="flex flex-col h-full p-6 text-white min-w-[400px]">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 leading-tight">
                                {selectedTopic}
                            </h3>
                            <button onClick={() => setPanelOpen(false)} className="text-gray-400 hover:text-white pb-1 px-2 rounded hover:bg-white/10 text-xl font-bold">×</button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {explaining ? (
                                <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-4">
                                    <div className="w-8 h-8 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin"></div>
                                    <p className="text-sm">Synthesizing exact context...</p>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {explanation}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10">
                            <button
                                onClick={navigateToChat}
                                disabled={explaining}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl font-semibold text-white shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02]"
                            >
                                Ask AI about this node →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Global Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes pulse { 50% { opacity: .7; } }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
            `}} />
        </div>
    );
}

export default function MindMapPage() {
    return (
        <ReactFlowProvider>
            <MindMapComponent />
        </ReactFlowProvider>
    );
}
