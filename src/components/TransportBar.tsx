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
    <div className="p-3 panel panel-hover space-y-3">
      <div className="flex items-center gap-2">
        {isPlaying ? (
          <button
            onClick={onPause}
            className="p-3 rounded-lg text-primary-foreground transition-transform hover:scale-105"
            style={{ background: 'var(--gradient-primary)', boxShadow: '0 0 22px -4px hsl(var(--primary)/0.8)' }}
            aria-label="Pause"
          >
            <Pause className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={!hasSource}
            aria-label="Play"
            className="p-3 rounded-lg text-primary-foreground transition-transform hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed"
            style={{ background: 'var(--gradient-primary)', boxShadow: hasSource ? '0 0 22px -4px hsl(var(--primary)/0.8)' : 'none' }}
          >
            <Play className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={onStop}
          disabled={!hasSource}
          aria-label="Stop"
          className="p-3 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-30"
        >
          <Square className="w-4 h-4" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <label
            className="p-3 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
            title="Load audio file"
          >
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
            title="Toggle microphone"
            className={`p-3 rounded-lg border transition-colors ${
              sourceType === 'mic'
                ? 'border-destructive/60 bg-destructive/15 text-destructive'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md bg-background/50 border border-border/50 px-2.5 py-2">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isPlaying ? 'bg-primary animate-breathe' : 'bg-muted-foreground/40'}`} />
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          {sourceType === 'mic' ? 'Microphone input' : fileName || 'No audio loaded'}
        </p>
      </div>
    </div>
  );
};

export default TransportBar;
