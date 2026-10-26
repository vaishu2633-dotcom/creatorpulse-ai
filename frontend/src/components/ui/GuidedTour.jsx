import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Check, X, Compass, BarChart3, PenTool } from 'lucide-react';
import Button from './Button';

const TOUR_STEPS = [
  {
    title: 'Welcome to CreatorPulse AI! 👋',
    desc: 'Your friendly copilot for YouTube, Instagram, X, and LinkedIn. We help you create with confidence instead of guessing.',
    icon: Sparkles,
    color: 'text-brand-500 bg-brand-50 dark:bg-brand-950/50',
  },
  {
    title: 'Pillar 1: Discover Trends & Insights 📈',
    desc: 'Explore breakout topic velocity before saturation, track your audience sentiment, and see what questions viewers are asking.',
    icon: Compass,
    color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/50',
  },
  {
    title: 'Pillar 2: Predict Your Hit Chance 🎯',
    desc: 'Test drafted hooks and titles. We calculate your statistical hit probability against your usual rate, with realistic confidence bounds.',
    icon: BarChart3,
    color: 'text-coral-500 bg-coral-50 dark:bg-coral-950/50',
  },
  {
    title: 'Pillar 3: Content Studio & Rankings ✍️',
    desc: 'Craft platform-native scripts, carousels, and threads in English, Hindi, or Marathi. Run the Best Ideas Tournament to pick winning angles.',
    icon: PenTool,
    color: 'text-lavender-500 bg-lavender-50 dark:bg-lavender-950/50',
  },
];

export default function GuidedTour({ forceOpen = false, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    try {
      let hasSeen = false;
      if (typeof window !== 'undefined' && window.localStorage) {
        hasSeen = window.localStorage.getItem('creatorpulse_tour_seen');
      }
      if (!hasSeen || forceOpen) {
        setIsOpen(true);
        setCurrentStep(0);
      }
    } catch (e) {
      console.warn('localStorage read error in GuidedTour:', e);
      if (forceOpen) setIsOpen(true);
    }
  }, [forceOpen]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('creatorpulse_tour_seen', 'true');
      }
    } catch (e) {
      console.warn('localStorage write error in GuidedTour:', e);
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step?.icon || Sparkles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-black/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-white dark:bg-[#171D2B] rounded-2xl shadow-soft-lg border border-[#E8E6DF] dark:border-[#232B3E] p-6 text-left overflow-hidden"
      >
        {/* Close / Skip button */}
        <button
          onClick={handleComplete}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition"
          aria-label="Skip guided tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center space-x-1.5 mb-5">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-8 bg-[#5B5BD6]'
                  : i < currentStep
                  ? 'w-3 bg-emerald-400'
                  : 'w-3 bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Icon & Content */}
        <div className="space-y-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step?.color || ''}`}>
            <StepIcon className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#1F2430] dark:text-white">
              {step?.title}
            </h3>
            <p className="text-sm text-[#5B6475] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
              {step?.desc}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-[#EFECE6] dark:border-[#232B3E]">
          <button
            onClick={handleComplete}
            className="text-xs font-semibold text-[#5B6475] dark:text-[#94A3B8] hover:text-[#1F2430] dark:hover:text-white transition"
          >
            Skip tour
          </button>

          <Button variant="primary" size="sm" onClick={handleNext}>
            {currentStep === TOUR_STEPS.length - 1 ? (
              <span className="flex items-center space-x-1">
                <span>Start creating!</span>
                <Check className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="flex items-center space-x-1">
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
