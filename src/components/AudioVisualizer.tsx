import React from 'react';
import { AudioVisualizerProps } from '../types';

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioData, isRecording }) => {
  const numBars = 32;
  const barWidth = 5;
  const barGap = 1;
  const circleSize = 150;
  const padding = 20;
  const availableWidth = circleSize - (padding * 2);
  const totalBarsWidth = numBars * (barWidth + barGap) - barGap; // Subtract last gap
  const scale = Math.min(1, availableWidth / totalBarsWidth);
  const adjustedBarWidth = barWidth * scale;
  const adjustedBarGap = barGap * scale;
  const startX = (circleSize - (totalBarsWidth * scale)) / 2;
  const maxBarHeight = (circleSize - (padding * 2)) / 2;

  return (
    <div className="relative w-[150px] h-[150px] overflow-hidden">
      {/* Circle border */}
      <div 
        className="absolute inset-0 rounded-full border-2 border-emerald-500 overflow-hidden"
      />
      
      {/* Center horizontal line */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[1px] bg-emerald-500"
      />
      
      {/* Audio bars container with overflow hidden */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        {audioData.map((value, index) => {
          const barHeight = Math.min(maxBarHeight, Math.max(2, value * maxBarHeight));

          return (
            <div
              key={index}
              className="absolute top-1/2 -translate-y-1/2"
              style={{
                left: `${startX + index * (adjustedBarWidth + adjustedBarGap)}px`,
                width: `${adjustedBarWidth}px`,
                height: `${barHeight * 2}px`,
              }}
            >
              <div
                className="w-full transition-all duration-100 ease-out bg-emerald-500"
                style={{
                  height: '50%',
                  opacity: isRecording ? 1 : 0.5,
                  transform: isRecording ? 'scaleY(1)' : 'scaleY(0.2)',
                  transformOrigin: 'bottom',
                }}
              />
              <div
                className="w-full transition-all duration-100 ease-out bg-emerald-500"
                style={{
                  height: '50%',
                  opacity: isRecording ? 1 : 0.5,
                  transform: isRecording ? 'scaleY(1)' : 'scaleY(0.2)',
                  transformOrigin: 'top',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AudioVisualizer;