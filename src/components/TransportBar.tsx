import { Play, Pause, Square, Mic, Upload } from 'lucide-react';

interface Props {
  isPlaying: boolean;
  hasSource: boolean;
  sourceType: 'file' | 'mic' | null;
  fileName: string;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onFileSelect: (file: File) => void;
  onMicToggle: () => void;
}

const TransportBar = ({ isPlaying, hasSource, sourceType, fileName, onPlay, onPause, onStop, onFileSelect, onMicToggle }: Props) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl surface-elevated border border-border/50">
      {/* Transport controls */}
      <div className="flex items-center gap-1">
        {isPlaying ? (
          <button onClick={onPause} className="p-2.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors">
            <Pause className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={onPlay} disabled={!hasSource} className="p-2.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <Play className="w-5 h-5" />
          </button>
        )}
        <button onClick={onStop} disabled={!hasSource} className="p-2.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground disabled:opacity-30">
          <Square className="w-4 h-4" />
        </button>
      </div>

      {/* Source info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate font-mono">
          {sourceType === 'mic' ? '🎙 Microphone Input' : fileName || 'No audio loaded'}
        </p>
      </div>

      {/* Source select */}
      <div className="flex items-center gap-1">
        <label className="p-2.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground cursor-pointer">
          <Upload className="w-4 h-4" />
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
          />
        </label>
        <button
          onClick={onMicToggle}
          className={`p-2.5 rounded-lg transition-colors ${sourceType === 'mic' ? 'bg-destructive/20 text-destructive' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'}`}
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TransportBar;
