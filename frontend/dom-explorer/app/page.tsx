"use client";
import React, { useState, useMemo, useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const NODE_W = 130;
const NODE_H = 46;
const H_GAP = 20;
const V_GAP = 60;

function subtreeWidth(node: any): number {
  if (!node.children || node.children.length === 0) return NODE_W;
  const total = node.children.reduce((s: number, c: any) => s + subtreeWidth(c) + H_GAP, -H_GAP);
  return Math.max(NODE_W, total);
}

function placeNodes(node: any, x: number, y: number, positions: Map<string, {x: number; y: number}>) {
  const sw = subtreeWidth(node);
  positions.set(node.id, { x: x + sw / 2 - NODE_W / 2, y });
  if (!node.children) return;
  let cx = x;
  for (const child of node.children) {
    const cw = subtreeWidth(child);
    placeNodes(child, cx, y + NODE_H + V_GAP, positions);
    cx += cw + H_GAP;
  }
}

function buildRFGraph(
  root: any,
  traversedIds: Set<string>,
  matchedIds: Set<string>
): { nodes: Node[]; edges: Edge[] } {
  const positions = new Map<string, {x: number; y: number}>();
  placeNodes(root, 0, 0, positions);
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  function walk(node: any) {
    const pos = positions.get(node.id) ?? { x: 0, y: 0 };
    let status = "idle";
    if (matchedIds.has(node.id)) status = "matched";
    else if (traversedIds.has(node.id)) status = "visited";
    
    nodes.push({
      id: node.id,
      type: "domNode",
      position: pos,
      data: {
        tag: node.tag,
        attrId: node.attributes?.id,
        attrClass: node.attributes?.class,
        content: node.attributes?.content,
        status,
      },
    });
    
    if (node.children) {
      for (const child of node.children) {
        const isTraversed = traversedIds.has(node.id) && traversedIds.has(child.id);
        
        edges.push({
          id: `e-${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          animated: isTraversed,
          style: { 
            stroke: isTraversed ? "#f59e0b" : "#94a3b8",
            strokeWidth: isTraversed ? 2.5 : 1.5 
          },
        });
        walk(child);
      }
    }
  }
  walk(root);
  return { nodes, edges };
}

function buildNodeMap(root: any): Map<string, any> {
  const map = new Map<string, any>();
  function walk(n: any) { map.set(n.id, n); n.children?.forEach(walk); }
  walk(root);
  return map;
}

const STATUS_COLORS: Record<string, string> = {
  matched: "#22c55e",
  visited: "#f59e0b",
  idle: "#a9b4b9",
};

function DOMNodeComponent({ data, selected }: NodeProps) {
  const d = data as { tag: string; attrId?: string; attrClass?: string; content?: string; status: string };
  const bg = STATUS_COLORS[d.status] ?? STATUS_COLORS.idle;
  
  return (
    <div style={{
      background: bg, color: "#fff", borderRadius: 8, padding: "5px 10px",
      fontSize: 12, fontFamily: "monospace", width: NODE_W, textAlign: "center",
      boxShadow: selected ? `0 0 0 2px #fff, 0 0 0 4px ${bg}` : "0 2px 6px rgba(0,0,0,0.18)",
      transition: "box-shadow 0.15s", cursor: "pointer", userSelect: "none",
      display: "flex", flexDirection: "column", justifyContent: "center", height: "100%"
    }}>
      <Handle type="target" position={Position.Top} style={{ background: "transparent", border: "none" }} />
      
      {d.tag === "#text" ? (
        <div style={{ fontWeight: 400, fontStyle: "italic", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          &quot;{d.content}&quot;
        </div>
      ) : (
        <>
          <div style={{ fontWeight: 700 }}>&lt;{d.tag}&gt;</div>
          {d.attrId && <div style={{ fontSize: 10, opacity: 0.85 }}>#{d.attrId}</div>}
          {d.attrClass && <div style={{ fontSize: 10, opacity: 0.75 }}>.{d.attrClass.split(" ")[0]}</div>}
        </>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: "transparent", border: "none" }} />
    </div>
  );
}

const nodeTypes = { domNode: DOMNodeComponent };

export default function Home() {
  const [inputType, setInputType] = useState<"url" | "html">("url");
  const [algorithm, setAlgorithm] = useState<"bfs" | "dfs">("bfs");
  const [isAlgoDropdownOpen, setIsAlgoDropdownOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [html, setHtml] = useState("");
  const [cssSelector, setCssSelector] = useState("");
  const [maxResults, setMaxResults] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);

  // Response dari backend
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isAnimEnabled, setIsAnimEnabled] = useState(true);
  const [animSpeed, setAnimSpeed] = useState(500);

  React.useEffect(() => {
    if (!apiResponse?.traversalLog) return;

    if (!isAnimEnabled) {
      setCurrentStep(apiResponse.traversalLog.length);
      return;
    }

    if (currentStep < apiResponse.traversalLog.length) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, animSpeed); 
      
      return () => clearTimeout(timer);
    }
  }, [apiResponse, currentStep, isAnimEnabled, animSpeed]);

  const traversedIds = useMemo(() => {
    if (!apiResponse?.traversalLog) {
      return new Set<string>();
    }
    const currentLog = apiResponse.traversalLog.slice(0, currentStep);
    const traversedNodeIds = currentLog.map((step: any) => step.nodeId);

    return new Set<string>(traversedNodeIds);
  }, [apiResponse, currentStep]);

  const matchedIds = useMemo(() => {
    if (!apiResponse?.traversalLog) {
      return new Set<string>();
    }
    const currentLog = apiResponse.traversalLog.slice(0, currentStep);
    const matchedSteps = currentLog.filter((step: any) => step.matched);
    const matchedNodeIds = matchedSteps.map((step: any) => step.nodeId);

    return new Set<string>(matchedNodeIds);
  }, [apiResponse, currentStep]);

  const { rfNodes, rfEdges } = useMemo(() => {
    if (!apiResponse?.domTree) {
      return { rfNodes: [], rfEdges: [] };
    }
    const { nodes, edges } = buildRFGraph(apiResponse.domTree, traversedIds, matchedIds);

    return { rfNodes: nodes, rfEdges: edges };
  }, [apiResponse, traversedIds, matchedIds]);

  const nodeMap = useMemo(() => {
    if (!apiResponse?.domTree) {
      return new Map<string, any>();
    }

    return buildNodeMap(apiResponse.domTree);
  }, [apiResponse]);

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) : null;

  const metrics = {
    maxDepth: apiResponse?.maxDepth ?? 0,
    searchTime: apiResponse?.executionMs ?? 0,
    visitedNodes: apiResponse?.nodesVisited ?? 0,
    matchCount: apiResponse?.results?.length ?? 0
  };
  const traversalLog: any[] = apiResponse?.traversalLog ?? [];

  const handleStartTraversal = async () => {
    if (inputType === "url" && !url.trim()) {
      alert("Please enter a URL");
      return;
    }
    if (inputType === "html" && !html.trim()) {
      alert("Please enter Raw HTML");
      return;
    }

    setIsProcessing(true);
    setApiResponse(null);
    setSelectedNodeId(null);
    setCurrentStep(0);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: inputType === "url" ? url.trim() : "",
          html: inputType === "html" ? html : "",
          algorithm,
          cssSelector,
          maxResults,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(`Error: ${data.error || "Unknown error"}`);
        return;
      }
      setApiResponse(data);
    } catch (error) {
      console.error("Failed to fetch:", error);
      alert("Failed to reach server");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleDownloadLog = () => {
    if (!traversalLog.length) return;
    const blob = new Blob([JSON.stringify(traversalLog, null, 2)], { type: "application/json" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `traversal-log-${algorithm}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col font-body">
      {/* TopNavBar */}
      <div className="z-50 hidden md:flex justify-between items-center w-full px-8 py-3 bg-surface-container-lowest border-b border-outline-variant/15 shadow-sm">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-bold font-headline tracking-tighter text-on-surface">DOM Explorer</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex w-full h-full flex-1 overflow-hidden">
        {/* Left Sidebar (Control Panel) */}
        <aside className="w-80 shrink-0 bg-surface-container-low h-full flex flex-col p-6 overflow-y-auto border-r border-outline-variant/15">

          {/* Input Toggle */}
          <div className="bg-surface-container  -high rounded-xl p-1 flex mb-6 relative">
            <div 
              onClick={() => setInputType("url")}
              className={`w-1/2 text-center py-2 text-sm font-medium rounded-lg cursor-pointer transition-all ${inputType === "url" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
              URL
            </div>
            <div 
              onClick={() => setInputType("html")}
              className={`w-1/2 text-center py-2 text-sm font-medium rounded-lg cursor-pointer transition-all ${inputType === "html" ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
              Raw HTML
            </div>
          </div>

          {/* Target Input */}
          <div className="mb-6">
            <label className="block text-[11px] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-2">Target</label>
            {inputType === "url" ? (
              <input 
                className="w-full bg-surface-container-lowest border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary shadow-sm outline-1 outline-outline-variant/15 text-on-surface placeholder:text-outline transition-all" 
                placeholder="https://example.com" 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            ) : (
              <div className="w-full h-40 bg-surface-container-lowest rounded-xl outline-1 outline-outline-variant/15 shadow-sm focus-within:ring-2 focus-within:ring-primary overflow-hidden transition-all flex">
                <textarea 
                  className="custom-scrollbar w-full h-full bg-transparent border-0 px-4 py-3 text-sm text-on-surface placeholder:text-outline resize-none focus:ring-0 font-mono" 
                  placeholder={`<html>\n  <head>\n    <title>Example</title>\n  </head>\n  <body>\n    ...\n  </body>\n</html>`} 
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Algorithm Dropdown */}
          <div className="mb-6">
            <label className="block text-[11px] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-2">Algorithm</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAlgoDropdownOpen(!isAlgoDropdownOpen)}
                className="w-full flex items-center justify-between bg-surface-container-lowest border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary shadow-sm  outline-1 outline-outline-variant/15 text-on-surface transition-all"
              >
                <span>{algorithm === "bfs" ? "Breadth-First Search (BFS)" : "Depth-First Search (DFS)"}</span>
                <span className={`material-symbols-outlined text-outline transition-transform duration-200 ${isAlgoDropdownOpen ? "rotate-180" : ""}`}>
                  expand_more
                </span>
              </button>
              {isAlgoDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest rounded-xl shadow-lg outline-1 outline-outline-variant/15 overflow-hidden z-50 py-1">
                  <div
                    onClick={() => {
                      setAlgorithm("bfs");
                      setIsAlgoDropdownOpen(false);
                    }}
                    className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center justify-between ${algorithm === "bfs" ? "bg-primary-container/30 text-primary-dim font-medium" : "text-on-surface hover:bg-surface-container-high"}`}
                  >
                    Breadth-First Search (BFS)
                    {algorithm === "bfs" && <span className="material-symbols-outlined text-[18px]">check</span>}
                  </div>
                  <div
                    onClick={() => {
                      setAlgorithm("dfs");
                      setIsAlgoDropdownOpen(false);
                    }}
                    className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center justify-between ${algorithm === "dfs" ? "bg-primary-container/30 text-primary-dim font-medium" : "text-on-surface hover:bg-surface-container-high"}`}
                  >
                    Depth-First Search (DFS)
                    {algorithm === "dfs" && <span className="material-symbols-outlined text-[18px]">check</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CSS Selector */}
          <div className="mb-6">
            <label className="block text-[11px] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-2">CSS Selector (Optional)</label>
            <input 
              className="w-full bg-surface-container-lowest border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary shadow-sm outline-1 outline-outline-variant/15 text-on-surface placeholder:text-outline" 
              placeholder="e.g., .nav-item, #main" 
              type="text" 
              value={cssSelector}
              onChange={(e) => setCssSelector(e.target.value)}
            />
          </div>
          {/* Animation Settings */}
          <div className="mb-6">
            <label className="block text-[11px] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-2">Animation</label>
            <div className="flex items-center justify-between bg-surface-container-lowest rounded-xl px-4 py-3 outline-1 outline-outline-variant/15 shadow-sm">
              <span className="text-sm text-on-surface">Enable Animation</span>
              
              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isAnimEnabled} 
                  onChange={(e) => setIsAnimEnabled(e.target.checked)} 
                />
                <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-surface-container-high after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Slider Speed*/}
            {isAnimEnabled && (
              <div className="mt-3 flex items-center gap-3 px-1">
                <span className="text-[10px] uppercase font-bold text-outline">Slow</span>
                <input 
                  type="range" 
                  min="50" 
                  max="1000" 
                  step="50" 
                  value={1050 - animSpeed}
                  onChange={(e) => setAnimSpeed(1050 - Number(e.target.value))} 
                  className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary" 
                />
                <span className="text-[10px] uppercase font-bold text-outline">Fast</span>
              </div>
            )}
          </div>

          {/* Result Limit */}
          <div className="mb-8">
            <label className="block text-[11px] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-2">Result Limit</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-surface-container-lowest rounded-xl flex items-center outline-1 outline-outline-variant/15 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary">
                <span className="pl-3 text-sm text-on-surface-variant">Top</span>
                <input 
                  className="w-full bg-transparent border-0 px-2 py-3 text-sm focus:ring-0 text-on-surface text-center outline-none" 
                  type="number" 
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                />
              </div>
              <button 
                onClick={() => setMaxResults(0)}
                className="px-4 py-3 bg-surface-container-high rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container-highest transition-colors">
                All
              </button>
            </div>
          </div>

          {/* Start Button */}
          <div className="mt-auto">
            <button 
              onClick={handleStartTraversal}
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-semibold tracking-wide hover:opacity-90 transition-opacity flex justify-center items-center gap-2 shadow-[0_8px_16px_rgba(77,68,227,0.2)]">
              <span className="material-symbols-outlined">play_arrow</span>
              {isProcessing ? "Processing..." : "Start Traversal"}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-surface">
          {/* Top Metric Row */}
          <div className="flex gap-4 p-6 bg-surface z-10 shrink-0">
            {/* Metric 1 */}
            <div className="flex-1 bg-surface-container-low rounded-xl p-4 flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
              <span className="text-[11px] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-1">Max Depth</span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline font-bold text-3xl tracking-tight text-on-surface">{metrics.maxDepth}</span>
                <span className="text-sm text-outline">levels</span>
              </div>
            </div>
            {/* Metric 2 */}
            <div className="flex-1 bg-surface-container-low rounded-xl p-4 flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
              <span className="text-[11px] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-1">Search Time</span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline font-bold text-3xl tracking-tight text-on-surface">{metrics.searchTime}</span>
                <span className="text-sm text-outline">ms</span>
              </div>
            </div>
            {/* Metric 3 */}
            <div className="flex-1 bg-surface-container-low rounded-xl p-4 flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
              <span className="text-[11px] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-1">Visited Nodes</span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline font-bold text-3xl tracking-tight text-on-surface">{metrics.visitedNodes}</span>
                <span className="text-sm text-outline">nodes</span>
              </div>
            </div>
            {/* Metric 4: Matches Found */}
            <div className="flex-1 bg-surface-container-low rounded-xl p-4 flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
              <span className="text-[11px] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-1">Matches Found</span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline font-bold text-3xl tracking-tight text-on-surface">{metrics.matchCount}</span>
                <span className="text-sm text-outline">elements</span>
              </div>
            </div>
          </div>

          {/* Visualization Canvas */}
          <div className="flex-1 relative overflow-hidden mx-6 mb-6 rounded-2xl outline-1 outline-outline-variant/15 bg-grid-dots shadow-sm">
            {/* React Flow DOM Tree Visualization */}
            <div className={`absolute inset-0 ${rfNodes.length === 0 ? "flex items-center justify-center overflow-auto text-on-surface-variant opacity-50" : ""}`}>
              {rfNodes.length === 0 ? (
                <div className="text-sm flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-4xl">account_tree</span>
                  <p>Menunggu eksekusi algoritma...</p>
                </div>
              ) : (
                <div className="w-full h-full">
                  <ReactFlowProvider>
                    <ReactFlow
                      nodes={rfNodes}
                      edges={rfEdges}
                      nodeTypes={nodeTypes}
                      onNodeClick={handleNodeClick}
                      fitView
                      fitViewOptions={{ padding: 0.15 }}
                      minZoom={0.05}
                      maxZoom={2}
                      proOptions={{ hideAttribution: true }}
                    >
                      <Controls showInteractive={false} />
                      <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#a9b4b9" />
                    </ReactFlow>
                  </ReactFlowProvider>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Side Panel: Log / Details */}
        <aside className="w-72 shrink-0 bg-surface h-full flex flex-col border-l border-outline-variant/15">
          <div className="p-6 pb-2 border-b border-outline-variant/15 flex items-center justify-between bg-surface z-10">
            <h3 className="font-headline font-semibold text-lg text-on-surface">Traversal Log</h3>
            <div className="flex items-center gap-2">
              <span className="bg-surface-container-highest text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded text-on-surface-variant">{traversalLog.length} steps</span>
              <button
                onClick={handleDownloadLog}
                disabled={!traversalLog.length}
                title="Download traversal log"
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container-highest transition-colors text-on-surface-variant disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide bg-surface">
            {/* Traversal log dari backend */}
            {traversalLog.length === 0 ? (
              <div className="text-xs text-on-surface-variant text-center mt-10">Belum ada aktivitas.</div>
            ) : (
              traversalLog.map((log: any, index: number) => (
                <div
                  key={index}
                  onClick={() => setSelectedNodeId(log.nodeId)}
                  className="bg-surface-container-low rounded-lg p-3 flex items-start gap-3 cursor-pointer hover:bg-surface-container-high transition-colors"
                  style={{ outline: selectedNodeId === log.nodeId ? "2px solid #4D44E3" : undefined }}
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: log.matched ? "#22c55e" : "#f59e0b" }}
                  />
                  <div>
                    <div className="text-sm font-medium text-on-surface flex items-center gap-2">
                      <span className="font-mono text-xs bg-surface-container-lowest px-1.5 py-0.5 rounded outline-1 outline-outline-variant/15">&lt;{log.tag}&gt;</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: log.matched ? "#16a34a" : "#b45309" }}>
                      {log.matched ? "Matched" : "Visited"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Node Details */}
          <div className="h-48 border-t border-outline-variant/15 bg-surface-container-low p-4 flex flex-col">
            <h4 className="text-[11px] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-3">Node Details</h4>
            <div className="bg-surface-container-lowest rounded-xl p-3 outline-1 outline-outline-variant/15 flex-1 overflow-auto text-xs font-mono text-on-surface leading-relaxed custom-scrollbar">
              {selectedNode ? (
                <div className="space-y-1">
                  <div><span className="text-outline">tag: </span><span className="text-primary font-bold">&lt;{selectedNode.tag}&gt;</span></div>
                  <div><span className="text-outline">depth: </span><span>{selectedNode.depth}</span></div>
                  {selectedNode.attributes && Object.entries(selectedNode.attributes).map(([k, v]: [string, any]) => (
                    <div key={k}><span className="text-outline">{k}: </span><span>&quot;{v}&quot;</span></div>
                  ))}
                  <div><span className="text-outline">children: </span><span>{selectedNode.children?.length ?? 0}</span></div>
                  <div>
                    <span className="text-outline">status: </span>
                    <span style={{ color: matchedIds.has(selectedNode.id) ? "#16a34a" : traversedIds.has(selectedNode.id) ? "#b45309" : "#6b7280" }}>
                      {matchedIds.has(selectedNode.id) ? "matched" : traversedIds.has(selectedNode.id) ? "visited" : "not traversed"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-outline">Pilih node untuk melihat detail</div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}