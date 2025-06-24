
"use client";

import { useState, useEffect, useRef } from 'react';
import type * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { getOptimizedResume } from '@/app/actions';
import { resumeOptimizerSchema, type Resume } from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { FilePenLine, FileText, Briefcase, Download, Loader2 } from 'lucide-react';


export function ResumeOptimizer() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedResume, setOptimizedResume] = useState<string | null>(null);
  const { toast } = useToast();
  const resultRef = useRef<HTMLDivElement>(null);


  const form = useForm<z.infer<typeof resumeOptimizerSchema>>({
    resolver: zodResolver(resumeOptimizerSchema),
    defaultValues: {
      resumeContent: '',
      jobDescription: '',
    },
  });

  useEffect(() => {
    try {
        const storedResumes = localStorage.getItem('interviewace-resumes');
        if (storedResumes) {
            const parsedResumes: Resume[] = JSON.parse(storedResumes);
            setResumes(parsedResumes);
            if (parsedResumes.length > 0) {
                const lastSelectedId = localStorage.getItem('interviewace-selected-resume-id');
                const resumeExists = parsedResumes.some(r => r.id === lastSelectedId);
                const currentSelected = resumeExists ? lastSelectedId! : parsedResumes[0].id;
                setSelectedResumeId(currentSelected);
                form.setValue('resumeContent', parsedResumes.find(r => r.id === currentSelected)?.content ?? '');
            }
        }
    } catch (e) {
        console.error("Failed to load resumes from local storage.", e);
        toast({ title: "Error", description: "Could not load your saved resumes.", variant: "destructive" });
    }
  }, [toast, form]);

  const handleSelectResume = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    const resumeContent = resumes.find(r => r.id === resumeId)?.content ?? '';
    form.setValue('resumeContent', resumeContent);
  }

  async function onSubmit(values: z.infer<typeof resumeOptimizerSchema>) {
    setIsLoading(true);
    setOptimizedResume(null);
    try {
      const result = await getOptimizedResume(values);
      setOptimizedResume(result.optimizedResume);
       toast({
        title: "Success!",
        description: "Your resume has been optimized.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to optimize resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDownloadPdf = async () => {
    const element = resultRef.current;
    if (!element) {
        toast({ title: "Error", description: "Could not find content to download.", variant: "destructive" });
        return;
    };

    toast({ title: "Generating PDF...", description: "Please wait a moment." });

    const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;

    let imgWidth = pdfWidth;
    let imgHeight = pdfWidth / ratio;
    
    // If the content is taller than one page, we need to split it
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
    }
    
    pdf.save('Optimized-Resume.pdf');
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <FilePenLine className="w-6 h-6 text-accent" />
          Resume Optimizer
        </CardTitle>
        <CardDescription>
          Tailor your resume for a specific job. Select a resume, paste the job description, and the AI will optimize it for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="resumeContent"
              render={() => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><FileText className="w-4 h-4" /> Select Your Resume</FormLabel>
                   <Select onValueChange={handleSelectResume} value={selectedResumeId}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a resume to optimize..." />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {resumes.length > 0 ? resumes.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        )) : <div className="p-4 text-sm text-muted-foreground">No resumes found. Add one in the Copilot tab.</div>}
                    </SelectContent>
                   </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> Job Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste the full job description here..." {...field} rows={8}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading || !selectedResumeId} className="w-full">
              {isLoading ? <><Loader2 className="animate-spin mr-2"/> Optimizing...</> : 'Optimize My Resume'}
            </Button>
          </form>
        </Form>
        
        {(isLoading || optimizedResume) && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Optimized Resume</h3>
                {optimizedResume && !isLoading && (
                    <Button variant="outline" onClick={handleDownloadPdf}>
                        <Download className="w-4 h-4 mr-2" />
                        Download as PDF
                    </Button>
                )}
            </div>
            <Card className="h-96 w-full">
                <CardContent className="p-0">
                  <div id="pdf-content" ref={resultRef} className="p-4 bg-white text-black">
                      {isLoading ? (
                        <div className="space-y-4 p-4">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <div className="pt-4 space-y-2">
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                          </div>
                           <div className="pt-4 space-y-2">
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: optimizedResume || '' }} />
                      )}
                  </div>
                </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
