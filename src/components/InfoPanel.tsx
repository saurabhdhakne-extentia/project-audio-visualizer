import React from 'react';

interface InfoPanelProps {
  isRecording: boolean;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ isRecording }) => {
  return (
    <div className="max-w-md w-full text-center text-sm text-gray-500 bg-white/50 backdrop-blur-sm rounded-lg p-4 shadow-sm mt-5">
      <h2 className="text-lg font-medium text-gray-800 mb-2">
        {isRecording ? 'Recording in Progress' : 'Ready to Record'}
      </h2>
      <p>
        {isRecording 
          ? 'Your microphone is active. Speak now to see the audio visualization respond to your voice.' 
          : 'Click the microphone button to start recording and see real-time audio visualization.'}
      </p>
    </div>
  );
};

export default InfoPanel;