import { useState } from 'react';
import AudioVisualizer from './components/AudioVisualizer';
import MicrophoneButton from './components/MicrophoneButton';
import InfoPanel from './components/InfoPanel';
import { useAudioRecorder } from './hooks/useAudioRecorder';

function App() {
  const [transcripts, setTranscripts] = useState<string[]>([]);

  const {
    isRecording,
    audioData,
    hasPermission,
    toggleRecording,
    vadConfig,
    setVadConfig,
  } = useAudioRecorder('siri', (transcript: string) => {
    console.log('🔥 Hotword Detected in Transcript');
    setTranscripts(prev => [...prev, transcript]);
  });

  const sliderConfigs: {
    key: keyof typeof vadConfig;
    label: string;
    min: number;
    max: number;
    step: number;
  }[] = [
    { key: 'voice_start', label: '🕒 Voice Start (ms)', min: 100, max: 1000, step: 50 },
    { key: 'voice_stop', label: '🕒 Voice Stop (ms)', min: 300, max: 1500, step: 50 },
    { key: 'smoothingTimeConstant', label: '📉 Smoothing', min: 0.5, max: 0.99, step: 0.01 },
    { key: 'energy_threshold_ratio_pos', label: '📈 Energy Threshold Pos', min: 1, max: 5, step: 0.1 },
    { key: 'energy_threshold_ratio_neg', label: '📉 Energy Threshold Neg', min: 1, max: 5, step: 0.1 },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">Audio Visualizer</h1>

      <AudioVisualizer audioData={audioData} isRecording={isRecording} />

      <MicrophoneButton
        isRecording={isRecording}
        onToggleRecording={toggleRecording}
        hasPermission={hasPermission}
      />

      <InfoPanel isRecording={isRecording} />

      {transcripts.length > 0 && (
        <div className="bg-white shadow p-4 rounded mt-4 w-full max-w-xl">
          <h2 className="text-lg font-semibold mb-2">📝 Detected Hotword Transcripts</h2>
          <ul className="list-disc list-inside text-sm max-h-48 overflow-y-auto">
            {transcripts.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl mt-6">
        {sliderConfigs.map(slider => (
          <div key={slider.key}>
            <label className="font-medium mb-1 block">
              {slider.label}: {vadConfig[slider.key].toFixed(2)}
            </label>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={vadConfig[slider.key]}
              onChange={(e) =>
                setVadConfig(prev => ({
                  ...prev,
                  [slider.key]: parseFloat(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>
        ))}
      </div>

      <footer className="mt-12 text-sm text-gray-400">
        © {new Date().getFullYear()} Audio Visualizer
      </footer>
    </div>
  );
}

export default App;
