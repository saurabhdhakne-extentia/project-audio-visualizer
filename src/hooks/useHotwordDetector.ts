import { Dispatch, SetStateAction, useEffect, useRef } from 'react';

export const useHotwordDetector = (
  hotword: string,
  onHotwordDetected: () => void,
  isActive: boolean,
  setTranscripts: Dispatch<SetStateAction<string[]>>
) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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
          setTranscripts((prev) => [...prev, transcript]);
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
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
            console.log("🔁 Restarting recognition...");
          } catch (err) {
            console.warn("Start failed after onend:", err);
          }
          restartTimeoutRef.current = null;
        }, 500);
      }
    };

    recognitionRef.current = recognition;

    if (isActive && !isListeningRef.current) {
      recognition.start();
      isListeningRef.current = true;
      console.log("🎤 Listening for hotword...");
    }

    return () => {
      recognition.stop();
      isListeningRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [hotword, onHotwordDetected, setTranscripts]);

  useEffect(() => {
    // Start/stop recognition when `isActive` changes
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isActive && !isListeningRef.current) {
      try {
        recognition.start();
        isListeningRef.current = true;
        console.log("▶️ Resuming hotword detection...");
      } catch (err) {
        console.warn("Start error:", err);
      }
    } else if (!isActive && isListeningRef.current) {
      recognition.stop();
      isListeningRef.current = false;
      console.log("⏸️ Paused hotword detection.");
    }
  }, [isActive]);
};
