import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronDown, Play, RotateCcw, ExternalLink, FileText } from 'lucide-react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { HierarchyNode } from '../types';

interface VideoModalProps {
  node: HierarchyNode | null;
  onClose: () => void;
  onNext: () => void;
  onMoreDetail: () => void;
  hasNext: boolean;
  hasDetail: boolean;
}

const VideoModal: React.FC<VideoModalProps> = ({
  node,
  onClose,
  onNext,
  onMoreDetail,
  hasNext,
  hasDetail,
}) => {
  const [isEnded, setIsEnded] = useState(false);
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    if (node) {
      setIsEnded(false);
    }
  }, [node]);

  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    setPlayer(event.target);
  };

  const onPlayerEnd: YouTubeProps['onEnd'] = () => {
    setIsEnded(true);
  };

  const handleReplay = () => {
    if (player) {
      player.seekTo(0);
      player.playVideo();
      setIsEnded(false);
    }
  };

  const citations = useMemo(() => {
    if (!node?.citations) return [];
    
    // Format: Köhler (2026){https://url}; von Staden (2026) {https://url}
    return node.citations.split(';').map(cite => {
      const match = cite.match(/(.*?)\{(.*?)\}/);
      if (match) {
        return {
          text: match[1].trim(),
          url: match[2].trim()
        };
      }
      return null;
    }).filter(Boolean);
  }, [node?.citations]);

  if (!node) return null;

  // Extract YouTube ID from URL or use as ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const videoId = getYouTubeId(node.videoUrl);

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-10"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-6xl max-h-[95vh] flex flex-col bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-10 py-6 bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-20">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[9px] font-bold uppercase tracking-[0.2em] rounded-full border border-indigo-500/20">
                  Chapter {node.id}
                </span>
              </div>
              <h2 className="serif text-white text-3xl font-light italic tracking-tight truncate max-w-[300px] md:max-w-xl">
                {node.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all hover:rotate-90 border border-white/10"
            >
              <X size={20} />
            </button>
          </div>

          {/* Video Player Container */}
          <div className="relative flex-1 min-h-0 bg-black overflow-hidden flex items-center justify-center">
            <div className="w-full h-full aspect-video max-h-[65vh]">
              <YouTube
                videoId={videoId}
                opts={opts}
                onReady={onPlayerReady}
                onEnd={onPlayerEnd}
                className="w-full h-full"
              />
            </div>

            {/* End of Video Overlay */}
            <AnimatePresence>
              {isEnded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md z-10"
                >
                  <div className="p-12 bg-slate-900 rounded-[3rem] border border-white/10 text-center max-w-md shadow-2xl">
                    <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-600/40">
                      <Play size={36} className="text-white ml-1.5" />
                    </div>
                    <h3 className="serif text-3xl font-light italic text-white mb-3">Chapter Concluded</h3>
                    <p className="text-slate-400 text-base mb-10 leading-relaxed">The exploration of this section is complete. Would you like to proceed or revisit the details?</p>
                    <button
                      onClick={handleReplay}
                      className="flex items-center justify-center gap-3 w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10"
                    >
                      <RotateCcw size={20} />
                      Revisit Chapter
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Full Text Link Section */}
          {node.fullTextUrl && (
            <div className="px-10 py-4 bg-slate-900/60 border-t border-white/5">
              <a 
                href={node.fullTextUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors group"
              >
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                  <FileText size={16} />
                </div>
                <span className="serif italic text-lg">Read Full Chapter Text</span>
                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          )}

          {/* Citations Section */}
          {citations && citations.length > 0 && (
            <div className="px-10 py-5 bg-slate-900/40 border-t border-white/5">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">References:</span>
                {citations.map((cite: any, i: number) => (
                  <a 
                    key={i}
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="serif italic text-base text-indigo-400 hover:text-indigo-300 flex items-center gap-2 transition-colors group"
                  >
                    {cite.text}
                    <ExternalLink size={10} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls (Always Visible) */}
          <div className="px-10 py-10 bg-slate-900/95 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-8 border-t border-white/10 z-20">
            <div className="flex flex-col md:flex-row items-center gap-5 w-full md:w-auto">
              {hasDetail && (
                <button
                  onClick={onMoreDetail}
                  className="group flex items-center justify-center gap-5 px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-bold transition-all hover:scale-[1.02] shadow-2xl shadow-indigo-600/30 w-full md:w-auto text-xl"
                >
                  <ChevronDown size={28} className="group-hover:translate-y-1 transition-transform" />
                  <span className="serif italic">Deeper Inquiry</span>
                </button>
              )}
              {hasNext && (
                <button
                  onClick={onNext}
                  className="group flex items-center justify-center gap-5 px-12 py-6 bg-white hover:bg-slate-100 text-slate-900 rounded-[2rem] font-bold transition-all hover:scale-[1.02] shadow-2xl shadow-white/5 w-full md:w-auto text-xl"
                >
                  <span className="serif italic">Next Chapter</span>
                  <ChevronRight size={28} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="px-8 py-4 text-slate-500 hover:text-white font-bold transition-colors text-xs uppercase tracking-[0.2em]"
            >
              Return to Overview
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoModal;
