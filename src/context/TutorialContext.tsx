"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export type TutorialStep = {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
};

type TutorialContextType = {
  isTutorialOpen: boolean;
  currentStepIndex: number;
  steps: TutorialStep[];
  startTutorial: (steps: TutorialStep[]) => void;
  closeTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
};

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const { userData } = useAuth();

  const startTutorial = (newSteps: TutorialStep[]) => {
    setSteps(newSteps);
    setCurrentStepIndex(0);
    setIsTutorialOpen(true);
  };

  const closeTutorial = () => {
    setIsTutorialOpen(false);
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      closeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  return (
    <TutorialContext.Provider 
      value={{ 
        isTutorialOpen, 
        currentStepIndex, 
        steps, 
        startTutorial, 
        closeTutorial, 
        nextStep, 
        prevStep 
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
};
