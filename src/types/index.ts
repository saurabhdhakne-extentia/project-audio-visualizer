export interface AudioVisualizerProps {
  audioData: number[];
  isRecording: boolean;
}

export interface MicrophoneButtonProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  hasPermission: boolean | null;
}

export interface AudioState {
  isRecording: boolean;
  audioData: number[];
  hasPermission: boolean | null;
}