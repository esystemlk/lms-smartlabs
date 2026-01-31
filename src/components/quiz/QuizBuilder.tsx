"use client";

import { useState } from "react";
import { Question, Quiz } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, CheckCircle, Save } from "lucide-react";
import { quizService } from "@/services/quizService";

interface QuizBuilderProps {
  courseId: string;
  onSuccess: () => void;
  initialData?: Quiz;
}

export function QuizBuilder({ courseId, onSuccess, initialData }: QuizBuilderProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [duration, setDuration] = useState(initialData?.durationMinutes || 30);
  const [passingScore, setPassingScore] = useState(initialData?.passingScore || 70);
  const [questions, setQuestions] = useState<Question[]>(initialData?.questions || []);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: 0, // Index of correct option
      points: 10
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    if (updated[qIndex].options) {
      const newOptions = [...updated[qIndex].options!];
      newOptions[oIndex] = value;
      updated[qIndex].options = newOptions;
      setQuestions(updated);
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title) return alert("Please enter a quiz title");
    if (questions.length === 0) return alert("Please add at least one question");

    try {
      setSaving(true);
      const quizData = {
        title,
        description,
        courseId,
        questions,
        durationMinutes: duration,
        passingScore,
        published: true // Auto-publish for now
      };

      if (initialData?.id) {
        await quizService.updateQuiz(initialData.id, quizData);
      } else {
        await quizService.createQuiz(quizData);
      }
      
      onSuccess();
    } catch (error) {
      console.error("Failed to save quiz:", error);
      alert("Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Input label="Quiz Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Module 1 Final Exam" />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea 
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Duration (mins)" 
              type="number" 
              value={duration} 
              onChange={(e) => setDuration(Number(e.target.value))} 
            />
            <Input 
              label="Pass Score (%)" 
              type="number" 
              value={passingScore} 
              onChange={(e) => setPassingScore(Number(e.target.value))} 
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Questions ({questions.length})</h3>
          <Button variant="outline" onClick={addQuestion} className="text-sm">
            <Plus size={16} className="mr-2" /> Add Question
          </Button>
        </div>

        {questions.map((q, qIndex) => (
          <div key={q.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 relative group">
            <button 
              onClick={() => removeQuestion(qIndex)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={18} />
            </button>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Question {qIndex + 1}</label>
              <input 
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-brand-blue bg-white"
                value={q.text}
                onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                placeholder="Enter question text..."
              />
            </div>

            {q.type === "multiple-choice" && (
              <div className="space-y-3 pl-4 border-l-2 border-brand-blue/20">
                {q.options?.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name={`correct-${q.id}`}
                      checked={q.correctAnswer === oIndex}
                      onChange={() => updateQuestion(qIndex, "correctAnswer", oIndex)}
                      className="w-4 h-4 text-brand-blue"
                    />
                    <input 
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
                      value={opt}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? "Saving..." : "Save Quiz"}
        </Button>
      </div>
    </div>
  );
}
