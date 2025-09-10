import React, { useState, useEffect } from 'react';
import { ChefHat } from 'lucide-react';

interface ProgressBarProps {
  text?: string;
  duration?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  text = "美味しいメニューを生成中...", 
  duration = 10000 // 10秒のデフォルト
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "家族の好みを分析中...",
    "旬の食材を確認中...",
    "栄養バランスを計算中...",
    "レシピを選定中...",
    "最終調整中..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const newProgress = prev + (100 / (duration / 100));
        
        // ステップの更新
        const stepIndex = Math.floor((newProgress / 100) * steps.length);
        if (stepIndex !== currentStep && stepIndex < steps.length) {
          setCurrentStep(stepIndex);
        }
        
        return Math.min(newProgress, 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, currentStep, steps.length]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4 animate-pulse">
            <ChefHat size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{text}</h2>
          <p className="text-gray-600">{steps[currentStep]}</p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
          </div>
        </div>

        <div className="text-center">
          <span className="text-lg font-semibold text-orange-600">
            {Math.round(progress)}%
          </span>
        </div>

        <div className="mt-6 text-center">
          <div className="flex justify-center space-x-1">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index <= currentStep ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;