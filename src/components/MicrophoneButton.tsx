import React from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { MicrophoneButtonProps } from '../types';

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ 
  isRecording, 
  onToggleRecording,
  hasPermission 
}) => {
  if (hasPermission === false) {
    return (
      <button 
        className="relative flex items-center justify-center px-6 py-4 rounded-full bg-gray-100 text-gray-500 cursor-not-allowed transition-all duration-300 shadow-sm"
        disabled
      >
        <AlertCircle className="w-5 h-5 mr-2" />
        <span className="font-medium">Microphone Access Denied</span>
      </button>
    );
  }

  return (
    <button 
      onClick={onToggleRecording}
      className={`
        relative flex items-center justify-center px-6 py-4 rounded-full 
        font-medium shadow-sm transition-all duration-300
        ${isRecording 
          ? 'bg-red-500 text-white hover:bg-red-600 shadow-md' 
          : 'bg-white text-gray-800 hover:bg-gray-50'
        }
      `}
      disabled={hasPermission === null}
    >
      {isRecording ? (
        <>
          <MicOff className="w-5 h-5 mr-2" />
          <span>Stop Recording</span>
        </>
      ) : (
        <>
          <Mic className="w-5 h-5 mr-2" />
          <span>{hasPermission === null ? 'Checking Microphone...' : 'Start Recording'}</span>
        </>
      )}
      
      {/* Ripple effect when recording */}
      {isRecording && (
        <>
          <span className="absolute inset-0 rounded-full animate-ping-slow bg-red-400 opacity-75"></span>
          <span className="absolute inset-0 rounded-full animate-ping-slower bg-red-300 opacity-50"></span>
        </>
      )}
    </button>
  );
};

export default MicrophoneButton;