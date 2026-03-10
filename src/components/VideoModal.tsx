import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronDown, Play, RotateCcw, ExternalLink } from 'lucide-react';
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
          <div className="flex items-center justify-between px-8 py-5 bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-20">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-md border border-blue-600/30">
                  Chapter {node.id}
                </span>
              </div>
              <h2 className="text-white text-xl font-bold truncate max-w-[300px] md:max-w-md">
                {node.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all hover:rotate-90 border border-white/10"
            >
              <X size={20} />
            </button>
          </div>

          {/* Video Player Container */}
          <div className="relative flex-1 min-h-0 bg-black overflow-hidden">
            <div className="w-full h-full aspect-video max-h-[60vh] mx-auto">
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
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10"
                >
                  <div className="p-10 bg-slate-900 rounded-[2rem] border border-white/10 text-center max-w-sm shadow-2xl">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/20">
                      <Play size={32} className="text-white ml-1" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Chapter Complete</h3>
                    <p className="text-slate-400 text-sm mb-8">Ready to move to the next section or dive deeper?</p>
                    <button
                      onClick={handleReplay}
                      className="flex items-center justify-center gap-2 w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/10"
                    >
                      <RotateCcw size={20} />
                      Watch Again
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Citations Section */}
          {citations && citations.length > 0 && (
            <div className="px-8 py-4 bg-slate-900/40 border-t border-white/5">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Works Cited:</span>
                {citations.map((cite: any, i: number) => (
                  <a 
                    key={i}
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors group"
                  >
                    {cite.text}
                    <ExternalLink size={10} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls (Always Visible) */}
          <div className="px-8 py-8 bg-slate-900/95 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/10 z-20">
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              {hasDetail && (
                <button
                  onClick={onMoreDetail}
                  className="group flex items-center justify-center gap-4 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] font-black transition-all hover:scale-[1.02] shadow-xl shadow-blue-600/20 w-full md:w-auto text-lg"
                >
                  <ChevronDown size={24} className="group-hover:translate-y-1 transition-transform" />
                  More Detail
                </button>
              )}
              {hasNext && (
                <button
                  onClick={onNext}
                  className="group flex items-center justify-center gap-4 px-10 py-5 bg-white hover:bg-slate-100 text-slate-900 rounded-[1.5rem] font-black transition-all hover:scale-[1.02] shadow-xl shadow-white/10 w-full md:w-auto text-lg"
                >
                  Next Chapter
                  <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="px-8 py-4 text-slate-400 hover:text-white font-bold transition-colors text-sm uppercase tracking-widest"
            >
              Back to Map
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VideoModal;
