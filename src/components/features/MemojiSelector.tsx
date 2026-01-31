"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { RefreshCcw, Check } from "lucide-react";

interface MemojiSelectorProps {
  onSelect: (url: string) => void;
  isOpen: boolean;
  onClose: () => void;
  currentImage?: string;
}

export function MemojiSelector({ onSelect, isOpen, onClose, currentImage }: MemojiSelectorProps) {
  const [seed, setSeed] = useState(Math.random().toString(36).substring(7));
  const [style, setStyle] = useState<"adventurer" | "avataaars" | "notionists">("avataaars");
  
  // Generate a grid of options based on current seed
  const generateOptions = () => {
    return Array.from({ length: 9 }).map((_, i) => {
      // Create a deterministic seed for each option based on the main seed
      const optionSeed = `${seed}-${i}`;
      return `https://api.dicebear.com/7.x/${style}/svg?seed=${optionSeed}`;
    });
  };

  const [options, setOptions] = useState<string[]>(generateOptions());
  const [selected, setSelected] = useState<string | null>(null);

  const handleRefresh = () => {
    const newSeed = Math.random().toString(36).substring(7);
    setSeed(newSeed);
    // Logic to regenerate options will happen in useEffect if we depended on seed, 
    // but here we can just call it directly
    const newOptions = Array.from({ length: 9 }).map((_, i) => 
      `https://api.dicebear.com/7.x/${style}/svg?seed=${newSeed}-${i}`
    );
    setOptions(newOptions);
  };

  const handleStyleChange = (newStyle: "adventurer" | "avataaars" | "notionists") => {
    setStyle(newStyle);
    const newOptions = Array.from({ length: 9 }).map((_, i) => 
      `https://api.dicebear.com/7.x/${newStyle}/svg?seed=${seed}-${i}`
    );
    setOptions(newOptions);
  };

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-card p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-bold leading-6 text-gray-900 dark:text-white flex justify-between items-center mb-4"
                >
                  <span>Build Your Avatar</span>
                  <div className="flex gap-2">
                    {(["avataaars", "adventurer", "notionists"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStyleChange(s)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          style === s 
                            ? "bg-brand-blue text-white border-brand-blue" 
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </Dialog.Title>

                <div className="mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    {options.map((url, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setSelected(url)}
                        className={`
                          relative aspect-square rounded-xl cursor-pointer transition-all hover:scale-105 border-2 overflow-hidden bg-gray-50
                          ${selected === url ? "border-brand-blue ring-2 ring-brand-blue ring-offset-2" : "border-transparent hover:border-gray-200"}
                        `}
                      >
                        <Image 
                          src={url} 
                          alt="Avatar option" 
                          fill 
                          className="object-cover p-2"
                        />
                        {selected === url && (
                          <div className="absolute top-2 right-2 bg-brand-blue text-white rounded-full p-1">
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <Button variant="ghost" onClick={handleRefresh} className="gap-2">
                    <RefreshCcw size={16} />
                    Shuffle
                  </Button>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selected}>
                      Use Avatar
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
