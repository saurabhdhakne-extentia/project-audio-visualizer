import AudioVisualizer from './components/AudioVisualizer';
import MicrophoneButton from './components/MicrophoneButton';
import InfoPanel from './components/InfoPanel';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useState, useEffect } from 'react';
import { useHotwordDetector } from './hooks/useHotwordDetector';

function App() {
  const {
    isRecording,
    audioData,
    hasPermission,
    toggleRecording,
    vadConfig,
    setVadConfig
  } = useAudioRecorder();

  const [listeningForHotword, setListeningForHotword] = useState(false);
  const [listeningWithVAD, setListeningWithVAD] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);

  // Handle hotword detection → start VAD
  useHotwordDetector("hey", () => {
    console.log("🔥 Hotword detected!");
    setListeningForHotword(false);
    setListeningWithVAD(true);
    toggleRecording();
  }, listeningForHotword, setTranscripts);

  // Handle silence after VAD → resume hotword
  useEffect(() => {
    if (!isRecording && listeningWithVAD) {
      console.log("🔴 Silence Detected after Hotword");
      console.log("📡 Sending the audio to the API")
      console.log("")
      setListeningWithVAD(false);
      setListeningForHotword(true);
    }
  }, [isRecording, listeningWithVAD]);

  const handleClick = () => {
    if (!listeningForHotword && !listeningWithVAD) {
      setListeningForHotword(true);
      console.log("🎤 Hotword detection started...");
    } else {
      setListeningForHotword(false);
      setListeningWithVAD(false);
      if (isRecording) toggleRecording();
      console.log("🛑 All listening stopped");
    }
  };

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
          isRecording={listeningForHotword || listeningWithVAD}
          onToggleRecording={handleClick}
          hasPermission={hasPermission}
        />

        <InfoPanel isRecording={isRecording} />
        {transcripts.length > 0 && (
          <div className="w-full bg-white rounded shadow-md p-4 mt-4 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">📝 Transcripts</h2>
            <ul className="list-disc list-inside text-gray-800 space-y-1 text-sm max-h-48 overflow-y-auto">
              {transcripts.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}

      </main>

      <div className="w-full max-w-2xl mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
        {[
          {
            label: '🕒 Voice Start (ms)',
            key: 'voice_start',
            min: 100,
            max: 1000,
            step: 50,
            value: vadConfig.voice_start,
          },
          {
            label: '🕒 Voice Stop (ms)',
            key: 'voice_stop',
            min: 300,
            max: 1500,
            step: 50,
            value: vadConfig.voice_stop,
          },
          {
            label: '📉 Smoothing',
            key: 'smoothingTimeConstant',
            min: 0.5,
            max: 0.99,
            step: 0.01,
            value: vadConfig.smoothingTimeConstant,
          },
          {
            label: '📈 Energy Threshold Pos',
            key: 'energy_threshold_ratio_pos',
            min: 1,
            max: 5,
            step: 0.1,
            value: vadConfig.energy_threshold_ratio_pos,
          },
          {
            label: '📉 Energy Threshold Neg',
            key: 'energy_threshold_ratio_neg',
            min: 1,
            max: 5,
            step: 0.1,
            value: vadConfig.energy_threshold_ratio_neg,
          },
        ].map((slider) => (
          <div key={slider.key} className="flex flex-col">
            <label className="font-medium mb-1 w-52 inline-block">
              {slider.label}: {slider.value.toFixed(2)}
            </label>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={slider.value}
              onChange={(e) =>
                setVadConfig({
                  ...vadConfig,
                  [slider.key]: parseFloat(e.target.value),
                })
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
