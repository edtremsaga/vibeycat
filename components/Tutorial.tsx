import React, { useState } from 'react';
import { TutorialStep } from '../types';

interface TutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TutorialStep[] = [
    {
      id: 1,
      title: 'Welcome to Vibey Cat vs Eagley!',
      description: 'You control two cats: PJ (brown) and Pluto (orange). Your goal is to help PJ catch Eagley while keeping Pluto safe!',
      completed: false,
    },
    {
      id: 2,
      title: 'Control Pluto',
      description: 'Use the ARROW KEYS (← ↓ ↑ →) to move Pluto. Try moving around now!',
      completed: false,
    },
    {
      id: 3,
      title: 'Control PJ',
      description: 'Move your MOUSE to control PJ. PJ will automatically follow your cursor. Try it!',
      completed: false,
    },
    {
      id: 4,
      title: 'Avoid Eagley',
      description: 'Eagley (🦅) will try to catch Pluto. If Eagley catches Pluto 3 times, you lose! Keep moving to avoid capture.',
      completed: false,
    },
    {
      id: 5,
      title: 'Catch Eagley',
      description: 'Move PJ close to Eagley to catch it! You need 6 catches to win. Try catching Eagley now!',
      completed: false,
    },
    {
      id: 6,
      title: 'Power-Ups',
      description: 'Collect power-ups that appear on the field:\n🚀 Speed - Move faster\n🛡️ Shield - Protection from Eagley\n❄️ Freeze - Slow Eagley\n✨ Teleport - Instantly move\n👻 Invisibility - Hide from Eagley\n⭐ Double Score - Next catch counts double',
      completed: false,
    },
    {
      id: 7,
      title: 'Lightning Ability',
      description: 'Press the L KEY to stun Eagley for 2 seconds. This has a 10-second cooldown. Use it strategically!',
      completed: false,
    },
    {
      id: 8,
      title: 'Combos',
      description: 'Catch Eagley multiple times quickly to build combos! Higher combos give you bonus points and multipliers.',
      completed: false,
    },
    {
      id: 9,
      title: 'Ready to Play!',
      description: 'Press SPACE to start/reset, P to pause. Good luck!',
      completed: false,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-extrabold text-pink-600">Tutorial</h2>
          <button
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Skip Tutorial
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-bold text-gray-800">{currentStepData.title}</h3>
            <span className="text-sm text-gray-500">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {currentStepData.description}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-pink-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-6 py-2 rounded-lg font-bold transition ${
              currentStep === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600 transition"
          >
            {currentStep === steps.length - 1 ? 'Start Playing!' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;

