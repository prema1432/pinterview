"use client";

import { Bot, Lightbulb, MessageSquare, Monitor, FilePenLine } from "lucide-react";
import { AutoAnswer } from "./auto-answer";
import { QuestionGenerator } from "./question-generator";
import { ScreenAnalyzer } from "./screen-analyzer";
import { ResumeOptimizer } from "./resume-optimizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstallPwaButton } from "./install-pwa-button";

export default function InterviewAce() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary">
            InterviewAce
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden text-sm text-muted-foreground md:block">Your AI co-pilot for job interviews.</p>
          <InstallPwaButton />
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="copilot" className="w-full max-w-screen-xl mx-auto">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
            <TabsTrigger value="copilot">
              <MessageSquare className="mr-2" />
              Copilot
            </TabsTrigger>
            <TabsTrigger value="analyzer">
              <Monitor className="mr-2" />
              Screen Analyzer
            </TabsTrigger>
            <TabsTrigger value="generator">
              <Lightbulb className="mr-2" />
              Question Generator
            </TabsTrigger>
            <TabsTrigger value="optimizer">
              <FilePenLine className="mr-2" />
              Resume Optimizer
            </TabsTrigger>
          </TabsList>
          <TabsContent value="copilot" className="mt-6">
            <AutoAnswer />
          </TabsContent>
          <TabsContent value="analyzer" className="mt-6">
             <div className="max-w-3xl mx-auto">
                <ScreenAnalyzer />
             </div>
          </TabsContent>
          <TabsContent value="generator" className="mt-6">
            <div className="max-w-3xl mx-auto">
                <QuestionGenerator />
            </div>
          </TabsContent>
          <TabsContent value="optimizer" className="mt-6">
            <div className="max-w-3xl mx-auto">
                <ResumeOptimizer />
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <footer className="px-8 py-4 text-xs text-center border-t text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} InterviewAce. All rights reserved.</p>
      </footer>
    </div>
  );
}
