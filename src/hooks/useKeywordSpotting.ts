import { useEffect, useRef } from "react";
import * as speechCommands from "@tensorflow-models/speech-commands";

export const useKeywordSpotting = (onHotword: () => void, active: boolean) => {
  const recognizerRef = useRef<speechCommands.SpeechCommandRecognizer | null>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (recognizerRef.current) return;

      const recognizer = speechCommands.create("BROWSER_FFT");
      await recognizer.ensureModelLoaded();
      recognizerRef.current = recognizer;
      console.log("✅ Keyword model loaded:", recognizer.wordLabels());
    };

    init();
  }, []);

  useEffect(() => {
    const recognizer = recognizerRef.current;
    if (!recognizer) return;

    if (active && !isListeningRef.current) {
      console.log("🎙️ Starting keyword listening...");
      isListeningRef.current = true;

      recognizer.listen(async (result) => {
        const scoresArray = Array.from(result.scores as Float32Array);
        const labels = recognizer.wordLabels();
        const maxIdx = scoresArray.indexOf(Math.max(...scoresArray));
        const keyword = labels[maxIdx];

        console.log("📣 Detected:", keyword, "Confidence:", scoresArray[maxIdx]);

        if (keyword === "stop" && scoresArray[maxIdx] > 0.9) {
          console.log("🎯 Hotword Detected: stop");
          onHotword();
        }
      }, {
        includeSpectrogram: false,
        probabilityThreshold: 0.85,
        overlapFactor: 0.5,
      });
    }

    if (!active && isListeningRef.current) {
      recognizer.stopListening();
      console.log("🛑 Stopped keyword listening.");
      isListeningRef.current = false;
    }

    return () => {
      if (isListeningRef.current) {
        recognizer.stopListening();
        console.log("🛑 Stopped keyword listening (unmount).");
        isListeningRef.current = false;
      }
    };
  }, [active, onHotword]);
};
