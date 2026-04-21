"use client";
import React, { useState } from "react";
import dynamic from 'next/dynamic';

const Tree = dynamic(() => import('react-d3-tree'), { ssr: false });

const transformTreeData = (node: any): any => {
  if (!node) return null;
  
  const attrs: Record<string, string> = {};
  if (node.attributes?.id) attrs.id = node.attributes.id;
  if (node.attributes?.class) attrs.class = node.attributes.class;
  
  return {
    name: node.tag || "unknown",
    attributes: attrs,
    children: node.children ? node.children.map(transformTreeData) : [],
  };
};

const renderCustomNodeElement = ({ nodeDatum, toggleNode }: any) => (
  <g>
    <circle r="15" fill="#4D44E3" onClick={toggleNode} style={{ cursor: "pointer" }} />
    <text fill="#e2e2e9" strokeWidth="1" x="20" dy="5" fontSize="14" style={{ userSelect: 'none' }}>
      {nodeDatum.name}
    </text>
    {nodeDatum.attributes?.id && (
      <text fill="#8E8E93" x="20" dy="20" fontSize="10" style={{ userSelect: 'none' }}>
        #{nodeDatum.attributes.id}
      </text>
    )}
  </g>
);

export default function Home() {
  const [inputType, setInputType] = useState<"url" | "html">("url");
  const [algorithm, setAlgorithm] = useState<"bfs" | "dfs">("bfs");
  const [isAlgoDropdownOpen, setIsAlgoDropdownOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [html, setHtml] = useState("");
  const [cssSelector, setCssSelector] = useState("");
  const [maxResults, setMaxResults] = useState(50);

  // STATE PLACEHOLDER: Untuk menerima data JSON
  const [metrics, setMetrics] = useState({
    maxDepth: 0,
    searchTime: 0,
    visitedNodes: 0,
  });
  
  const [traversalLog, setTraversalLog] = useState<{tag: string, level: number, status: string, time?: number}[]>([]);
  const [treeNodes, setTreeNodes] = useState([]); // Array kosong untuk nodes pohon
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulasi tombol start ditekan
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
    setTraversalLog([]);
    setTreeNodes([]);
    setMetrics({ maxDepth: 0, searchTime: 0, visitedNodes: 0 });

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
      
      setMetrics({
        maxDepth: data.maxDepth || 0,
        searchTime: data.executionMs || 0,
        visitedNodes: data.nodesVisited || 0,
      });
      
      if (data.traversalLog) {
        setTraversalLog(data.traversalLog.map((log: any) => ({
          tag: log.tag || log.nodeId || "unknown",
          level: 0,
          status: log.matched ? "Matched" : "Visited",
        })));
      }
      
      if (data.domTree) {
        setTreeNodes([data.domTree as never]);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
      alert("Failed to reach server");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col font-body">
      {/* TopNavBar */}
      <div className="z-50 hidden md:flex justify-between items-center w-full px-8 py-3 bg-surface-container-lowest border-b border-outline-variant/15 shadow-sm">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-bold font-headline tracking-tighter text-on-surface">DOM Explorer</span>
        </div>
        <div className="flex gap-6 items-center">
          <button className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
            Export Tree {/* Nanti ini bakal dipasang event handler buat export data pohon ke bentuk apapun yang bisa (diimplement kalau librarynya ada) */}
          </button>
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

          {/* Start Button */} {/* ini masih placeholder, nanti bakal dipasang event handler buat mulai traversal dan fetch data ke backend */}
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
          </div>

          {/* Visualization Canvas */}
          <div className="flex-1 relative overflow-hidden mx-6 mb-6 rounded-2xl outline-1 outline-outline-variant/15 bg-grid-dots shadow-sm">
            <div className="absolute top-4 right-4 bg-surface/80 backdrop-blur-xl p-1 rounded-xl shadow-sm outline-1 outline-outline-variant/15 flex gap-1 z-20">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">zoom_in</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">zoom_out</span>
              </button>
            </div>

            {/* Area Kosong untuk Placeholder Tree */} {/* Nanti ini bakal jadi area untuk visualisasi pohon DOM, sementara masih pake placeholder dan blom ada library visualisasinya*/}
            <div className={`absolute inset-0 ${treeNodes.length === 0 ? "flex items-center justify-center overflow-auto text-on-surface-variant opacity-50" : ""}`}>
              {treeNodes.length === 0 ? (
                <div className="text-sm flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-4xl">account_tree</span>
                  <p>Menunggu eksekusi algoritma...</p>
                </div>
              ) : (
                <div className="w-full h-full">
                  <Tree 
                    data={transformTreeData(treeNodes[0])} 
                    orientation="vertical"
                    pathFunc="step"
                    translate={{ x: 300, y: 50 }}
                    nodeSize={{ x: 150, y: 80 }}
                    renderCustomNodeElement={renderCustomNodeElement}
                  />
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Side Panel: Log / Details */}
        <aside className="w-72 shrink-0 bg-surface h-full flex flex-col border-l border-outline-variant/15">
          <div className="p-6 pb-2 border-b border-outline-variant/15 flex items-center justify-between bg-surface z-10">
            <h3 className="font-headline font-semibold text-lg text-on-surface">Traversal Log</h3>
            <span className="bg-surface-container-highest text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded text-on-surface-variant">Live</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide bg-surface">
            {/* Placeholder Log List */} {/* Nanti ini bakal diisi sama log aktivitas traversal yang dikirim dari backend real-time, sementara masih pake data statis buat simulasi */}
            {traversalLog.length === 0 ? (
              <div className="text-xs text-on-surface-variant text-center mt-10">Belum ada aktivitas.</div>
            ) : (
              traversalLog.map((log, index) => (
                <div key={index} className="bg-surface-container-low rounded-lg p-3 flex items-start gap-3">
                  <span className="material-symbols-outlined text-outline text-[18px] mt-0.5">check_circle</span>
                  <div>
                    <div className="text-sm font-medium text-on-surface flex items-center gap-2">
                      <span className="font-mono text-xs bg-surface-container-lowest px-1.5 py-0.5 rounded outline-1 outline-outline-variant/15">{log.tag}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">{log.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Node Details Placeholder */} {/* Ini gatau bakal diimplement atau engga, gimana nanti soalnya terlihat ribet tapi keren*/}
          <div className="h-48 border-t border-outline-variant/15 bg-surface-container-low p-4 flex flex-col">
            <h4 className="text-[11px] uppercase tracking-[0.05em] font-semibold text-on-surface-variant mb-3">Node Details</h4>
            <div className="bg-surface-container-lowest rounded-xl p-3  outline-1 outline-outline-variant/15 flex-1 overflow-auto text-xs font-mono text-on-surface leading-relaxed text-opacity-50 flex items-center justify-center">
              Pilih node untuk melihat detail
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}