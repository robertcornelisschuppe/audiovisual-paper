import React, { useState, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import VideoTree from './components/VideoTree';
import VideoModal from './components/VideoModal';
import { VideoNode, HierarchyNode } from './types';
import YouTube from 'react-youtube';

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

  // Initialize with data from CSV file
  React.useEffect(() => {
    fetch('/data.csv')
      .then(response => response.text())
      .then(csvText => {
        parseCSV(csvText);
      })
      .catch(err => {
        setError(`Failed to load data.csv: ${err.message}`);
      });
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
    <div className="w-screen h-screen bg-[#fdfcfb] text-slate-900 font-sans overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Intro Video Overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 md:p-12"
          >
            <div className="max-w-5xl w-full">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-12"
              >
                <h1 className="serif text-5xl md:text-7xl font-light italic tracking-tight text-slate-900 mb-6">
                  {studyTitle}
                </h1>
                <div className="w-24 h-px bg-indigo-600 mx-auto opacity-30 mb-6" />
                <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-[0.4em]">
                  An Interactive Research Journey
                </p>
              </motion.div>
              
              <div className="relative aspect-video w-full bg-slate-100 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200">
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
                
                {/* Skip Button Overlay */}
                <div className="absolute bottom-8 right-8 z-10">
                  <button
                    onClick={() => setShowIntro(false)}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-2xl font-bold transition-all border border-white/20 hover:scale-105"
                  >
                    Skip Introduction
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="w-full h-full">
        {error && (
          <div className="fixed top-4 left-4 z-50 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 shadow-lg">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {error}
          </div>
        )}

        <div className="w-full h-full">
          {/* Visualization Area */}
          <section className="w-full h-full">
            {hierarchy ? (
              <VideoTree 
                data={hierarchy} 
                studyTitle={studyTitle}
                onNodeClick={(node) => {
                  if (node.id !== 'root') setSelectedNode(node);
                }} 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#fdfcfb]">
                <p className="serif text-2xl text-slate-300 animate-pulse">Preparing the research map...</p>
              </div>
            )}
          </section>
        </div>
      </main>

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
