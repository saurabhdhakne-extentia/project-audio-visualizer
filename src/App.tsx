import React, { useState } from 'react';
import AudioVisualizer from './components/AudioVisualizer';
import MicrophoneButton from './components/MicrophoneButton';
import InfoPanel from './components/InfoPanel';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useKeywordSpotting } from './hooks/useKeywordSpotting';

function App() {

  const [keywordMode, setKeywordMode] = useState(false);

  const {
    isRecording,
    audioData,
    hasPermission,
    toggleRecording,
    vadConfig,
    setVadConfig
  } = useAudioRecorder();

  // ✅ Start recording when hotword is detected
  useKeywordSpotting(() => {
    if (!isRecording) {
      console.log("🎬 Hotword triggered: toggling recording");
      toggleRecording();
    }
  }, keywordMode);

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
      <div className="mt-6 flex items-center gap-3">
        <label className="text-gray-700 font-medium">🎙️ Voice Trigger Mode</label>
        <input
          type="checkbox"
          checked={keywordMode}
          onChange={() => setKeywordMode(prev => !prev)}
        />
        <span className="text-sm text-gray-500">
          {keywordMode ? "Listening for 'stop'" : "Manual start only"}
        </span>
      </div>

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