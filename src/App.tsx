import React, { useState, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import VideoTree from './components/VideoTree';
import VideoModal from './components/VideoModal';
import { VideoNode, HierarchyNode } from './types';
import YouTube from 'react-youtube';

const DEFAULT_CSV = `id,title,parentId,videoUrl,citations
1,Introduction,,https://www.youtube.com/watch?v=aqz-KE-bpKQ,"Köhler (2026){https://www.degruyterbrill.com/document/doi/10.1515/9783112208205/html}; von Staden (2026) {https://www.degruyterbrill.com/document/doi/10.1515/9783112215753/html}"
2,Methodology,,https://www.youtube.com/watch?v=9No-FiEInLA,
3,Results,,https://www.youtube.com/watch?v=ScMzIvxBSi4,
4,Discussion,,https://www.youtube.com/watch?v=jNQXAC9IVRw,
5,Conclusion,,https://www.youtube.com/watch?v=60ItHLz5WEA,
1.1,Background,1,https://www.youtube.com/watch?v=aqz-KE-bpKQ,
1.2,Research Question,1,https://www.youtube.com/watch?v=9No-FiEInLA,
1.1.1,Literature Review,1.1,https://www.youtube.com/watch?v=ScMzIvxBSi4,
1.1.2,Gap Analysis,1.1,https://www.youtube.com/watch?v=jNQXAC9IVRw,
2.1,Data Collection,2,https://www.youtube.com/watch?v=60ItHLz5WEA,
2.2,Analysis Framework,2,https://www.youtube.com/watch?v=aqz-KE-bpKQ,`;

export default function App() {
  const [videoData, setVideoData] = useState<VideoNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [studyTitle, setStudyTitle] = useState("The Impact of AI on Modern Research");

  const introVideoId = "aqz-KE-bpKQ"; // Example intro video ID

  const parseCSV = useCallback((csvString: string) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as VideoNode[];
        if (data.length > 0 && data[0].id && data[0].title) {
          setVideoData(data);
          setError(null);
        } else {
          setError("Invalid CSV format. Please ensure headers: id, title, parentId, videoUrl");
        }
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
      }
    });
  }, []);

  // Initialize with default data
  React.useEffect(() => {
    parseCSV(DEFAULT_CSV);
  }, [parseCSV]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  const hierarchy = useMemo(() => {
    if (videoData.length === 0) return null;

    const nodeMap: { [key: string]: HierarchyNode } = {};
    const rootNodes: HierarchyNode[] = [];

    // Create all nodes first
    videoData.forEach(node => {
      nodeMap[node.id] = { ...node, children: [] };
    });

    // Build hierarchy
    videoData.forEach(node => {
      if (node.parentId && nodeMap[node.parentId]) {
        nodeMap[node.parentId].children?.push(nodeMap[node.id]);
      } else {
        rootNodes.push(nodeMap[node.id]);
      }
    });

    // Sort root nodes by ID to maintain order
    rootNodes.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    // Return a virtual root if there are multiple main chapters
    return {
      id: 'root',
      title: 'Research Overview',
      parentId: null,
      videoUrl: '',
      children: rootNodes
    } as HierarchyNode;
  }, [videoData]);

  const findNextSibling = (node: HierarchyNode) => {
    if (!hierarchy) return null;
    
    // Find parent's children
    const findParent = (current: HierarchyNode, targetId: string): HierarchyNode | null => {
      if (current.children?.some(c => c.id === targetId)) return current;
      for (const child of current.children || []) {
        const found = findParent(child, targetId);
        if (found) return found;
      }
      return null;
    };

    const parent = findParent(hierarchy, node.id);
    if (!parent || !parent.children) return null;

    const index = parent.children.findIndex(c => c.id === node.id);
    if (index !== -1 && index < parent.children.length - 1) {
      return parent.children[index + 1];
    }
    return null;
  };

  const handleNext = () => {
    if (selectedNode) {
      const next = findNextSibling(selectedNode);
      if (next) setSelectedNode(next);
    }
  };

  const handleMoreDetail = () => {
    if (selectedNode && selectedNode.children && selectedNode.children.length > 0) {
      setSelectedNode(selectedNode.children[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Intro Video Overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-4 md:p-12"
          >
            <div className="relative w-full max-w-6xl aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
              <YouTube
                videoId={introVideoId}
                opts={{
                  height: '100%',
                  width: '100%',
                  playerVars: {
                    autoplay: 1,
                    modestbranding: 1,
                    rel: 0,
                  },
                }}
                onEnd={() => setShowIntro(false)}
                className="absolute inset-0 w-full h-full"
              />
              
              {/* Skip Button */}
              <button
                onClick={() => setShowIntro(false)}
                className="absolute bottom-8 right-8 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl font-bold transition-all border border-white/20 z-10"
              >
                Skip Introduction
              </button>

              {/* Welcome Text */}
              <div className="absolute top-8 left-8 pointer-events-none z-10">
                <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 inline-block">
                  Welcome
                </span>
                <h2 className="text-white text-2xl font-bold drop-shadow-lg">
                  How Research Explorer Works
                </h2>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <FileText size={24} />
            </div>
            <input 
              type="text" 
              value={studyTitle} 
              onChange={(e) => setStudyTitle(e.target.value)}
              className="bg-transparent border-none focus:ring-0 p-0 font-black w-full md:w-[500px] outline-none"
              placeholder="Enter Study Title"
            />
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Interactive Video Visualization Tool</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl cursor-pointer hover:bg-slate-800 transition-colors text-sm font-medium">
            <Upload size={16} />
            Upload CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <button 
            onClick={() => window.open('https://gist.github.com/user/example-csv', '_blank')}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="CSV Format Info"
          >
            <Info size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* Instructions */}
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">How to Navigate</h2>
                <p className="text-slate-600 leading-relaxed max-w-2xl">
                  Explore the research by clicking on the nodes below. Main chapters are at the top level, 
                  while sub-chapters provide more detail as you go deeper. Each node represents a YouTube video summary.
                </p>
              </div>
            </div>
          </section>

          {/* Visualization Area */}
          <section className="relative h-[800px]">
            {hierarchy ? (
              <VideoTree 
                data={hierarchy} 
                studyTitle={studyTitle}
                onNodeClick={(node) => {
                  if (node.id !== 'root') setSelectedNode(node);
                }} 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white rounded-3xl border border-dashed border-slate-300">
                <p className="text-slate-400">Loading visualization...</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 py-8 px-6 text-center">
        <p className="text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} Research Explorer &bull; Built for Academic Clarity
        </p>
      </footer>

      {/* Video Modal */}
      <VideoModal
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onNext={handleNext}
        onMoreDetail={handleMoreDetail}
        hasNext={!!(selectedNode && findNextSibling(selectedNode))}
        hasDetail={!!(selectedNode && selectedNode.children && selectedNode.children.length > 0)}
      />
    </div>
  );
}
