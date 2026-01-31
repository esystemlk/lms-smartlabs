"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff } from "lucide-react";
import { clsx } from "clsx";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export function VoiceNavigator() {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window.webkitSpeechRecognition || window.SpeechRecognition)) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onstart = () => setIsListening(true);
      recognitionInstance.onend = () => setIsListening(false);
      
      recognitionInstance.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript.toLowerCase();
        setTranscript(transcriptText);
        handleCommand(transcriptText);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const handleCommand = (command: string) => {
    console.log("Voice command received:", command);
    
    if (command.includes("dashboard") || command.includes("home")) {
      router.push("/dashboard");
    } else if (command.includes("course") || command.includes("classes")) {
      router.push("/courses");
    } else if (command.includes("setting")) {
      router.push("/settings");
    } else if (command.includes("profile")) {
      router.push("/profile");
    } else if (command.includes("log out") || command.includes("sign out")) {
      // For logout we might want to confirm or just trigger the click on logout button if accessible, 
      // but for now let's just redirect to login which isn't quite right without clearing auth state.
      // So let's skip logout for safety or handle it via a custom event if needed.
      // Better to just navigate for now.
    } else if (command.includes("admin") || command.includes("lms")) {
        router.push("/lms");
    }
    
    // Clear transcript after a delay
    setTimeout(() => setTranscript(""), 2000);
  };

  const toggleListening = () => {
    if (!isSupported) {
        alert("Voice navigation is not supported in this browser.");
        return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  if (!isSupported) return null;

  return (
    <div className="relative flex items-center">
        {transcript && (
            <div className="absolute right-full mr-4 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap animate-in fade-in slide-in-from-right-4">
                "{transcript}"
            </div>
        )}
      <button
        onClick={toggleListening}
        className={clsx(
          "p-2 rounded-full transition-all duration-300 relative",
          isListening 
            ? "bg-red-100 text-red-600 animate-pulse ring-2 ring-red-400 ring-opacity-50" 
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        )}
        title="Voice Navigation"
      >
        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        {isListening && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
        )}
      </button>
    </div>
  );
}
