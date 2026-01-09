import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ArrowRight } from "lucide-react";

export default function AIQuestionsFlow({ intakeId, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const { data: intake } = useQuery({
    queryKey: ['intake', intakeId],
    queryFn: () => base44.entities.WebsiteIntake.filter({ id: intakeId }).then(i => i[0]),
    enabled: !!intakeId,
  });

  useEffect(() => {
    if (intake) {
      loadQuestions();
    }
  }, [intake]);

  const loadQuestions = async () => {
    try {
      const analysisPrompt = `You analyzed a website intake form and determined you need more information.
      
Company: ${intake.company_name}
Goals: ${intake.business_goals?.join(', ')}
Style: ${intake.style_preference}
Current Details: ${intake.goal_description || 'Minimal details provided'}

Generate exactly 5 smart clarifying questions to help build a better website. Focus on:
- Target audience specifics
- Unique selling points
- Desired user actions
- Content priorities
- Technical requirements

Return JSON array of exactly 5 questions:
{
  "questions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setQuestions(response.questions.slice(0, 5));
    } catch (error) {
      setQuestions([
        "Who is your target audience?",
        "What makes your business unique from competitors?",
        "What is the main action you want visitors to take?",
        "What type of content will you provide (photos, videos, text)?",
        "Do you need any specific features or integrations?"
      ]);
    }
  };

  const handleNext = () => {
    if (!currentAnswer.trim()) return;

    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onComplete(newAnswers);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 mb-4">
            <Sparkles className="w-4 h-4 mr-1" />
            AI Questions
          </Badge>
          <h1 className="text-3xl font-bold text-white mb-2">Just a Few More Details</h1>
          <p className="text-slate-300">Help us create the perfect website for your business</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">{questions[currentQuestionIndex]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={6}
              className="text-lg"
              autoFocus
            />
            <Button
              onClick={handleNext}
              disabled={!currentAnswer.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
            >
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 w-5 h-5" />
                  Generate Website
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {answers.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold text-white">Your Previous Answers:</h3>
            {answers.map((answer, idx) => (
              <Card key={idx} className="border border-slate-700/50 bg-slate-800/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-400 mb-1">{questions[idx]}</p>
                  <p className="text-slate-200">{answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}