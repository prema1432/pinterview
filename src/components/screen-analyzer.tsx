
"use client";

import { useState } from 'react';
import { getStreamingAnswer, getQuestionFromScreen } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Monitor, Camera, Bot, Copy, User, ShieldAlert } from 'lucide-react';
import { readStreamableValue } from 'ai/rsc';

export function ScreenAnalyzer() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ question: string; answer: string } | null>(null);
  const { toast } = useToast();

  const handleAnalyzeScreen = async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices || !('getDisplayMedia' in navigator.mediaDevices)) {
      toast({
        title: "Screen Capture Not Supported",
        description: "Your browser does not support screen capture, or you may be on an insecure (non-HTTPS) connection.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    let stream: MediaStream | null = null;
    try {
      // 1. Get the stream from the user
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "never" },
        audio: false,
      });

      // 2. Create an in-memory video element to play the stream
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      
      const photoDataUri = await new Promise<string>((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play();
          // Give it a moment to render the first frame
          setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (!context) {
              return reject(new Error("Could not create canvas context."));
            }
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
          }, 100);
        };
        video.onerror = (e) => reject(e);
      });
      
      // 3. Stop the stream as soon as the frame is captured
      stream.getTracks().forEach(track => track.stop());
      
      // 4. Analyze the captured image
      const questionResult = await getQuestionFromScreen({ photoDataUri });
      if (!questionResult.question) {
        toast({
          title: "No Question Found",
          description: "We couldn't find a question on the screen. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      setAnalysisResult({ question: questionResult.question, answer: '' });

      const { output, error } = await getStreamingAnswer({ question: questionResult.question });

      if (error) {
        throw new Error(error);
      }

      let finalAnswer = '';
      for await (const chunk of readStreamableValue(output)) {
        finalAnswer += chunk;
        setAnalysisResult(prev => prev ? { ...prev, answer: finalAnswer } : null);
      }

    } catch (error) {
      // Stop the stream if it's still active
      stream?.getTracks().forEach(track => track.stop());

      if ((error as DOMException).name === 'NotAllowedError') {
        // This is not an error, the user just canceled the dialog.
        // Silently ignore.
      } else {
        console.error("Screen analysis error:", error);
        toast({
          title: "Analysis Failed",
          description: "An error occurred while capturing the screen. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = () => {
    if (analysisResult?.answer) {
      navigator.clipboard.writeText(analysisResult.answer);
      toast({
        title: "Copied!",
        description: "Answer copied to clipboard.",
      });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Monitor className="w-6 h-6 text-accent" />
          Screen Analyzer
        </CardTitle>
        <CardDescription>
          Capture your screen to get real-time answers for questions during your video interview.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 space-y-4 text-center border-2 border-dashed rounded-lg border-muted">
            <Button onClick={handleAnalyzeScreen} disabled={isLoading} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                {isLoading ? 'Analyzing...' : 'Analyze Screen for Question'}
            </Button>
            
            {!analysisResult && !isLoading && (
                <Alert variant="destructive" className="text-left">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>CRITICAL: Share a Window, Not Your Full Screen</AlertTitle>
                  <AlertDescription>
                    To keep this app private, you <strong>MUST</strong> share a specific application window (e.g., just your Google Meet window) in your interview. <strong>DO NOT share your &quot;Entire Screen&quot;</strong>, or everyone will see this app.
                  </AlertDescription>
                </Alert>
            )}
        </div>

        {(isLoading || analysisResult) && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between p-4 bg-muted/50">
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  <User className="w-5 h-5 flex-shrink-0"/>
                  <CardTitle className="text-base">Extracted Question</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 text-sm">
                {isLoading && !analysisResult ? <Skeleton className="w-3/4 h-4" /> : <p className="break-words">{analysisResult?.question}</p>}
              </CardContent>
            </Card>

            <Card className="relative">
              <CardHeader className="flex flex-row items-center justify-between p-4 bg-accent/10">
                 <div className="flex flex-1 items-center gap-2 min-w-0">
                  <Bot className="w-5 h-5 text-accent flex-shrink-0"/>
                  <CardTitle className="text-base text-accent">AI Generated Answer</CardTitle>
                </div>
                {analysisResult && !isLoading && <Button variant="ghost" size="icon" onClick={handleCopy}><Copy className="w-4 h-4"/></Button>}
              </CardHeader>
              <CardContent className="p-4 text-sm font-body">
                {analysisResult?.answer ? (
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {analysisResult.answer}
                    {isLoading && <span className="inline-block w-2 h-4 ml-1 translate-y-1 bg-foreground animate-pulse" />}
                  </p>
                ) : isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
