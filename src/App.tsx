import React from 'react';
import AudioVisualizer from './components/AudioVisualizer';
import MicrophoneButton from './components/MicrophoneButton';
import InfoPanel from './components/InfoPanel';
import { useAudioRecorder } from './hooks/useAudioRecorder';

function App() {
  const { isRecording, audioData, hasPermission, toggleRecording } = useAudioRecorder();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6">
      <main className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8">
        <h1 className="text-3xl font-semibold text-gray-800 mb-2">
          Audio Visualizer
        </h1>
        
        <div className="flex justify-center items-center w-full">
          <AudioVisualizer 
            audioData={audioData} 
            isRecording={isRecording} 
          />
        </div>
        
        <MicrophoneButton 
          isRecording={isRecording} 
          onToggleRecording={toggleRecording} 
          hasPermission={hasPermission}
        />
        
        <InfoPanel isRecording={isRecording} />
      </main>
      
      <footer className="mt-12 text-sm text-gray-400">
        © {new Date().getFullYear()} Audio Visualizer
      </footer>
    </div>
  );
}

export default App;