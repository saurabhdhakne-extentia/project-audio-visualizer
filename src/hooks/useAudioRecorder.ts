import { useState, useEffect, useRef, useCallback } from 'react';
import vad from 'voice-activity-detection';
import { AudioState } from '../types';

const INITIAL_AUDIO_STATE: AudioState = {
  isRecording: false,
  audioData: Array(32).fill(0),
  hasPermission: null,
};

export const useAudioRecorder = (hotword: string, onHotword: (t: string) => void) => {
  const [audioState, setAudioState] = useState<AudioState>(INITIAL_AUDIO_STATE);
  const [vadConfig, setVadConfig] = useState({
    voice_start: 400,
    voice_stop: 1000,
    smoothingTimeConstant: 0.95,
    energy_threshold_ratio_pos: 3.5,
    energy_threshold_ratio_neg: 2.5,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const vadControllerRef = useRef<{ destroy: () => void } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim().toLowerCase();
          console.log('🎯 Transcript:', transcript);
          if (transcript.includes(hotword.toLowerCase())) {
            onHotword(transcript);
          }
        }
      }
    };

    recognition.onerror = (e: any) => {
      console.warn("Recognition error", e);
    };

    recognitionRef.current = recognition;
    recognition.start();
    console.log("🎤 SpeechRecognition started");
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      console.log("🛑 SpeechRecognition stopped");
    }
  };

  const checkMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setAudioState(prev => ({ ...prev, hasPermission: true }));
      return true;
    } catch {
      setAudioState(prev => ({ ...prev, hasPermission: false }));
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!audioState.hasPermission) {
      const granted = await checkMicrophonePermission();
      if (!granted) return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    audioChunksRef.current = [];

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      const normalizedData = Array.from(dataArray).slice(0, 32).map(v => v / 255);
      setAudioState(prev => ({ ...prev, audioData: normalizedData }));
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    const vadController = vad(audioContext, stream, {
      onVoiceStart: () => {
        console.log("🟢 Voice Detected");
        mediaRecorder.start();
        setAudioState(prev => ({ ...prev, isRecording: true }));
        draw();
        startRecognition();
      },
      onVoiceStop: () => {
        console.log("🔴 Silence Detected");
        setAudioState(prev => ({ ...prev, isRecording: false }));
        stopRecognition();

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        mediaRecorder.stop();
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('🧩 Audio chunk size:', audioBlob.size);
          audioChunksRef.current = [];
        };
      },
      ...vadConfig,
    } as any);

    vadControllerRef.current = vadController;
  }, [audioState.hasPermission, vadConfig, checkMicrophonePermission, hotword, onHotword]);

  const stopRecording = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    if (vadControllerRef.current) vadControllerRef.current.destroy();
    stopRecognition();
    setAudioState({ ...INITIAL_AUDIO_STATE, hasPermission: true });
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
    vadConfig,
    setVadConfig,
  };
};
