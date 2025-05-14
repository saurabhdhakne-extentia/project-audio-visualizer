import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioState } from '../types';

const INITIAL_AUDIO_STATE: AudioState = {
  isRecording: false,
  audioData: Array(32).fill(0), // Reduced to match visualizer bars
  hasPermission: null,
};

export const useAudioRecorder = () => {
  const [audioState, setAudioState] = useState<AudioState>(INITIAL_AUDIO_STATE);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const checkMicrophonePermission = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMicrophone = devices.some(device => device.kind === 'audioinput');
      
      if (!hasMicrophone) {
        setAudioState(prev => ({ ...prev, hasPermission: false }));
        return false;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setAudioState(prev => ({ ...prev, hasPermission: true }));
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      setAudioState(prev => ({ ...prev, hasPermission: false }));
      return false;
    }
  }, []);
  
  const startRecording = useCallback(async () => {
    try {
      if (!audioState.hasPermission) {
        const hasPermission = await checkMicrophonePermission();
        if (!hasPermission) return;
      }
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioContext = audioContextRef.current;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64; // Reduced for fewer data points
      const bufferLength = analyser.frequencyBinCount;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyserRef.current = analyser;
      
      setAudioState(prev => ({ ...prev, isRecording: true }));
      
      const visualize = () => {
        if (!analyser) return;
        
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        const normalizedData = Array.from(dataArray)
          .slice(0, 32) // Match number of bars
          .map(value => value / 255);
        
        setAudioState(prev => ({ ...prev, audioData: normalizedData }));
        
        animationFrameRef.current = requestAnimationFrame(visualize);
      };
      
      visualize();
    } catch (error) {
      console.error('Error starting recording:', error);
      setAudioState(prev => ({ ...prev, isRecording: false, hasPermission: false }));
    }
  }, [audioState.hasPermission, checkMicrophonePermission]);
  
  const stopRecording = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    setAudioState(prev => ({
      ...prev,
      isRecording: false,
      audioData: Array(32).fill(0),
    }));
  }, []);
  
  const toggleRecording = useCallback(() => {
    if (audioState.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [audioState.isRecording, startRecording, stopRecording]);
  
  useEffect(() => {
    checkMicrophonePermission();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [checkMicrophonePermission]);
  
  return {
    ...audioState,
    toggleRecording,
  };
};