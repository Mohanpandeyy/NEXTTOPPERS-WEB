import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, PictureInPicture, Settings, Radio, Rewind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onClose: () => void;
  isLive?: boolean;
}

// Helper to detect video type from URL
const getVideoType = (url: string): 'youtube' | 'vimeo' | 'direct' => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  return 'direct';
};

// Extract YouTube video ID
const getYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Extract Vimeo video ID
const getVimeoId = (url: string): string | null => {
  const regExp = /vimeo\.com\/(?:.*\/)?(\d+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function VideoPlayer({ videoUrl, title, onClose, isLive = false }: VideoPlayerProps) {
  const videoType = getVideoType(videoUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPiP, setIsPiP] = useState(false);
  
  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    videoRef.current.volume = value[0];
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Go to live (for YouTube/Vimeo - reload iframe to sync)
  const goToLive = () => {
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = currentSrc;
      }, 100);
    }
  };

  // Listen for PiP exit
  useEffect(() => {
    const handlePiPExit = () => setIsPiP(false);
    videoRef.current?.addEventListener('leavepictureinpicture', handlePiPExit);
    return () => videoRef.current?.removeEventListener('leavepictureinpicture', handlePiPExit);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          skip(-10);
          break;
        case 'ArrowRight':
          skip(10);
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'p':
          if (videoType === 'direct') togglePiP();
          break;
        case 'Escape':
          if (!isFullscreen) onClose();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, isFullscreen]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold truncate pr-4">{title}</h2>
          {isLive && (
            <span className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">
              <Radio className="w-3 h-3" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLive && videoType !== 'direct' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToLive}
              className="text-white hover:bg-white/20 text-xs"
            >
              <Rewind className="w-4 h-4 mr-1" />
              Go Live
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Video Container */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center relative"
        onMouseMove={() => setShowControls(true)}
        onClick={() => videoType === 'direct' && handlePlayPause()}
      >
        {videoType === 'youtube' && (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}?autoplay=1&rel=0&modestbranding=1&playsinline=1${isLive ? '&live=1' : ''}`}
            className="w-full h-full"
            style={{ width: '100vw', height: '100vh', maxHeight: 'calc(100vh - 80px)' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title="Video Player"
          />
        )}

        {videoType === 'vimeo' && (
          <iframe
            ref={iframeRef}
            src={`https://player.vimeo.com/video/${getVimeoId(videoUrl)}?autoplay=1${isLive ? '&live=1' : ''}`}
            className="w-full h-full"
            style={{ width: '100vw', height: '100vh', maxHeight: 'calc(100vh - 80px)' }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}

        {videoType === 'direct' && (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              style={{ maxHeight: 'calc(100vh - 80px)' }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Play/Pause overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
              </div>
            )}

            {/* Controls */}
            <div 
              className={cn(
                "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity",
                showControls ? "opacity-100" : "opacity-0"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress bar */}
              <div className="mb-4">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/70 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1 md:gap-2">
                  <Button variant="ghost" size="icon" onClick={() => skip(-10)} className="text-white hover:bg-white/20 w-8 h-8 md:w-10 md:h-10">
                    <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handlePlayPause} className="text-white hover:bg-white/20 w-10 h-10 md:w-12 md:h-12">
                    {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6" /> : <Play className="w-5 h-5 md:w-6 md:h-6" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => skip(10)} className="text-white hover:bg-white/20 w-8 h-8 md:w-10 md:h-10">
                    <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                  
                  <div className="hidden md:flex items-center gap-2 ml-2">
                    <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-20"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                  {/* Settings dropdown with all options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 w-8 h-8 md:w-10 md:h-10">
                        <Settings className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-black/90 border-white/20 min-w-[180px]">
                      <DropdownMenuLabel className="text-white/70 text-xs">Playback Speed</DropdownMenuLabel>
                      {SPEED_OPTIONS.map((speed) => (
                        <DropdownMenuItem
                          key={speed}
                          onClick={() => changeSpeed(speed)}
                          className={cn(
                            "text-white hover:bg-white/20 cursor-pointer",
                            playbackSpeed === speed && "bg-primary/50"
                          )}
                        >
                          {speed}x {playbackSpeed === speed && '✓'}
                        </DropdownMenuItem>
                      ))}
                      
                      <DropdownMenuSeparator className="bg-white/20" />
                      
                      {document.pictureInPictureEnabled && (
                        <DropdownMenuItem
                          onClick={togglePiP}
                          className="text-white hover:bg-white/20 cursor-pointer"
                        >
                          <PictureInPicture className="w-4 h-4 mr-2" />
                          Picture in Picture {isPiP && '✓'}
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem
                        onClick={toggleMute}
                        className="text-white hover:bg-white/20 cursor-pointer md:hidden"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                        {isMuted ? 'Unmute' : 'Mute'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20 w-8 h-8 md:w-10 md:h-10">
                    {isFullscreen ? <Minimize className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize className="w-4 h-4 md:w-5 md:h-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
