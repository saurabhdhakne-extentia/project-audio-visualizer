export interface AudioState {
  isRecording: boolean;
  audioData: number[];
  hasPermission: boolean | null;
}
