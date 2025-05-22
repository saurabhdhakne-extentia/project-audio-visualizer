import { useEffect, useRef } from 'react';

export const useHotwordDetector = (
  hotword: string,
  onHotwordDetected: () => void,
  isActive: boolean
) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("SpeechRecognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim().toLowerCase();
          console.log("🎯 Final Transcript:", transcript);
          if (transcript.includes(hotword.toLowerCase())) {
            onHotwordDetected();
          }
        }
      }
    };

    recognition.onerror = (e: any) => {
      console.warn("Recognition error", e);
    };

    recognition.onend = () => {
      if (isActive && !restartTimeoutRef.current) {
        console.log("🔁 Restarting recognition...");
        restartTimeoutRef.current = setTimeout(() => {
          recognition.start();
          restartTimeoutRef.current = null;
        }, 500);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    console.log("🎤 Listening for hotword...");

    return () => {
      recognition.stop();
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
    };
  }, [hotword, isActive, onHotwordDetected]);
};
