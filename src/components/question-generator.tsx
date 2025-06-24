
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import { getPracticeQuestions } from '@/app/actions';
import { questionsSchema } from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Building, Lightbulb } from 'lucide-react';

export function QuestionGenerator() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof questionsSchema>>({
    resolver: zodResolver(questionsSchema),
    defaultValues: {
      role: '',
      company: '',
    },
  });

  async function onSubmit(values: z.infer<typeof questionsSchema>) {
    setIsLoading(true);
    setQuestions([]);
    try {
      const result = await getPracticeQuestions(values);
      setQuestions(result.questions);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Lightbulb className="w-6 h-6 text-accent" />
          Question Generator
        </CardTitle>
        <CardDescription>
          Prepare for your interview by generating practice questions for a specific role and company.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> Role</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Building className="w-4 h-4" /> Company (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Google" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Generating...' : 'Generate Questions'}
            </Button>
          </form>
        </Form>
        
        {(isLoading || questions.length > 0) && (
          <div className="mt-6">
            <h3 className="mb-4 text-lg font-semibold">Generated Questions</h3>
            <ScrollArea className="h-72 w-full rounded-md border">
              <div className="p-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {questions.map((q, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-accent font-bold">{i + 1}.</span>
                        <p className="flex-1">{q}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
