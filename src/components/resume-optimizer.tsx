
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import { getOptimizedResume } from '@/app/actions';
import { resumeOptimizerSchema } from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Resume = {
    id: string;
    name: string;
    content: string;
};

type FormData = z.infer<typeof resumeOptimizerSchema>;

export function ResumeOptimizer() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [optimizedResume, setOptimizedResume] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormData>({
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
                     const firstResumeContent = parsedResumes[0]?.content ?? '';
                     form.setValue('resumeContent', firstResumeContent);
                }
            }
        } catch (e) {
            console.error("Failed to load resumes from local storage.", e);
            toast({ title: "Error", description: "Could not load your saved resumes.", variant: "destructive" });
        }
    }, [toast, form]);

    async function onSubmit(values: FormData) {
        setIsLoading(true);
        setOptimizedResume('');
        try {
            const result = await getOptimizedResume(values);
            setOptimizedResume(result.optimizedResume);
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.message || "Failed to optimize resume. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleDownloadPdf = () => {
        if (!optimizedResume) return;

        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const lines = doc.splitTextToSize(optimizedResume, 180);
            const pageHeight = doc.internal.pageSize.height;

            let y = 15;
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10);

            for (let i = 0; i < lines.length; i++) {
                if (y > pageHeight - 15) {
                    doc.addPage();
                    y = 15;
                }
                doc.text(lines[i], 15, y);
                y += 5;
            }

            doc.save('Optimized-Resume.pdf');
            toast({
                title: "Downloaded",
                description: "Your optimized resume has been downloaded.",
            });
        } catch(e) {
            console.error("PDF generation failed", e);
            toast({
                title: "PDF Error",
                description: "Could not generate PDF.",
                variant: "destructive"
            });
        }
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <FileText className="w-6 h-6 text-accent" />
                    Resume Optimizer
                </CardTitle>
                <CardDescription>
                    Tailor your resume for a specific job description using AI. Select a saved resume and paste the job description below.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="resumeContent"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Select Resume</FormLabel>
                                    <Select
                                        onValueChange={(value) => field.onChange(value)}
                                        defaultValue={field.value}
                                        disabled={resumes.length === 0}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a saved resume..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {resumes.map(r => <SelectItem key={r.id} value={r.content}>{r.name}</SelectItem>)}
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
                                    <FormLabel>Job Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Paste the job description here..."
                                            className="min-h-[150px] resize-y"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Optimizing...
                                </>
                            ) : (
                                'Optimize Resume'
                            )}
                        </Button>
                    </form>
                </Form>

                {(isLoading || optimizedResume) && (
                    <div className="mt-8">
                        <h3 className="mb-4 text-lg font-semibold">Optimized Resume</h3>
                        <Card className="relative min-h-[300px]">
                            <CardContent className="p-4">
                                {isLoading ? (
                                    <div className="space-y-4 p-4">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-5 w-full" />
                                        <Skeleton className="h-5 w-full" />
                                        <Skeleton className="h-5 w-1/2" />
                                    </div>
                                ) : (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap"
                                    >
                                        {optimizedResume}
                                    </ReactMarkdown>
                                )}
                            </CardContent>
                            <CardFooter className="absolute bottom-0 right-0 p-4">
                                {optimizedResume && !isLoading && (
                                    <Button onClick={handleDownloadPdf}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download as PDF
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
