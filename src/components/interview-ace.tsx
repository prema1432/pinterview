
"use client";

<<<<<<< HEAD
import { useState } from "react";
import { Bot, Lightbulb, MessageSquare, Monitor, FilePenLine } from "lucide-react";
=======
import { Bot, Lightbulb, MessageSquare, Monitor, FileText } from "lucide-react";
>>>>>>> 80d1fa48581b116983731692f852547adcf46921
import { AutoAnswer } from "./auto-answer";
import { QuestionGenerator } from "./question-generator";
import { ScreenAnalyzer } from "./screen-analyzer";
import { ResumeOptimizer } from "./resume-optimizer";
import { InstallPwaButton } from "./install-pwa-button";
<<<<<<< HEAD
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";

const navItems = [
  { id: 'copilot', label: 'Copilot', icon: MessageSquare, component: <AutoAnswer /> },
  { id: 'analyzer', label: 'Screen Analyzer', icon: Monitor, component: <div className="max-w-3xl mx-auto w-full"><ScreenAnalyzer /></div> },
  { id: 'generator', label: 'Question Generator', icon: Lightbulb, component: <div className="max-w-3xl mx-auto w-full"><QuestionGenerator /></div> },
  { id: 'optimizer', label: 'Resume Optimizer', icon: FilePenLine, component: <div className="max-w-3xl mx-auto w-full"><ResumeOptimizer /></div> },
];
=======
import { ResumeOptimizer } from "./resume-optimizer";
>>>>>>> 80d1fa48581b116983731692f852547adcf46921

export default function InterviewAce() {
  const [activeView, setActiveView] = useState('copilot');

  const activeComponent = navItems.find(item => item.id === activeView)?.component;

  return (
<<<<<<< HEAD
    <SidebarProvider defaultOpen={true}>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
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
        
        <div className="flex flex-1">
          <Sidebar>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map(item => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveView(item.id)}
                      isActive={activeView === item.id}
                      tooltip={{children: item.label, side: "right", align: "center"}}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <div className="p-4 md:p-8 h-full">
              {activeComponent}
            </div>
          </SidebarInset>
        </div>

        <footer className="px-8 py-4 text-xs text-center border-t text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} InterviewAce. All rights reserved.</p>
        </footer>
      </div>
    </SidebarProvider>
=======
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
              <FileText className="mr-2" />
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
>>>>>>> 80d1fa48581b116983731692f852547adcf46921
  );
}
