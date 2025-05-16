import { useState, useEffect, useRef, useCallback } from 'react';
import vad from 'voice-activity-detection';
import { AudioState } from '../types';

const INITIAL_AUDIO_STATE: AudioState = {
  isRecording: false,
  audioData: Array(32).fill(0),
  hasPermission: null,
};

interface FullVADOptions {
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  voice_start?: number;
  voice_stop?: number;
  smoothingTimeConstant?: number;
  energy_threshold_ratio_pos?: number;
  energy_threshold_ratio_neg?: number;
}


export const useAudioRecorder = () => {
  const [audioState, setAudioState] = useState<AudioState>(INITIAL_AUDIO_STATE);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const vadControllerRef = useRef<{ destroy: () => void } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Setup MediaRecorder for audio chunk collection
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;

      const visualize = () => {
        if (!analyser) return;

        const dataArray = new Uint8Array(bufferLength);
        const draw = () => {
          analyser.getByteFrequencyData(dataArray);
          const normalizedData = Array.from(dataArray)
            .slice(0, 32)
            .map(value => value / 255);
          setAudioState(prev => ({ ...prev, audioData: normalizedData }));
          animationFrameRef.current = requestAnimationFrame(draw);
        };
        draw();
      };

      // ✅ Setup VAD with valid options
      const vadController = vad(audioContext, stream, {
        onVoiceStart: () => {
          console.log('🟢 Voice Detected');
          setAudioState(prev => ({ ...prev, isRecording: true }));
          visualize();
          mediaRecorderRef.current?.start();
          console.log('🎙️ Voice started, recording audio...');
        },
        onVoiceStop: () => {
          console.log('🔴 Silence');
          setAudioState(prev => ({ ...prev, isRecording: false }));
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }

          mediaRecorderRef.current?.stop();
          mediaRecorderRef.current!.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            console.log('🧩 Audio chunk size (bytes):', audioBlob.size);
            console.log('📡 Placeholder: sending audio chunk to backend...');
            audioChunksRef.current = [];
          };

        },
       // ✅ How long (in ms) the sound must stay above the threshold
      // before it's considered as the user "started speaking"
      voice_start: 400,

      // ✅ How long (in ms) the sound must stay below the threshold
      // before it's considered "silent" (i.e., the user stopped speaking)
      voice_stop: 1000,

      // ✅ Controls how smooth the energy curve is.
      // Higher values (closer to 1) = smoother, but slower response.
      // Lower values = more reactive, but jittery.
      smoothingTimeConstant: 0.95,

      // ✅ Multiplier of average energy needed to trigger voice start.
      // Higher = requires louder sound to trigger speech.
      // Use 3.0 to avoid false triggers from background noise.
      energy_threshold_ratio_pos: 3.5,

      // ✅ Multiplier of average energy needed to confirm silence.
      // Higher = more lenient; avoids cutting off speech too quickly.
      // Use 2.0 to ensure it doesn't stop on soft trailing speech.
      energy_threshold_ratio_neg: 2.5,
      } as any); // ✅ This disables TypeScript validation for this object

      vadControllerRef.current = vadController;

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

    if (vadControllerRef.current) {
      vadControllerRef.current.destroy(); // ✅ Correct cleanup
      vadControllerRef.current = null;
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
      stopRecording();

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [checkMicrophonePermission, stopRecording]);

  return {
    ...audioState,
    toggleRecording,
  };
};
