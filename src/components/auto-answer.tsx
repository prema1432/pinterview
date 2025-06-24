
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { getStreamingAnswer, getSpokenAnswer } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot, User, Sparkles, ClipboardPaste, Send, Loader2, Mic, Volume2, Trash2, Info } from 'lucide-react';
import type { CopilotInput, Resume } from '@/lib/schemas';
import { readStreamableValue } from 'ai/rsc';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type Message = {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    audioUrl?: string;
};

export function AutoAnswer() {
    const [question, setQuestion] = useState('');
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
    const [autoListen, setAutoListen] = useState(false);

    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const manualStopRef = useRef(false);
    const listenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [isManageResumesOpen, setIsManageResumesOpen] = useState(false);
    const [newResumeName, setNewResumeName] = useState('');
    const [newResumeContent, setNewResumeContent] = useState('');

    useEffect(() => {
        try {
            const storedResumes = localStorage.getItem('interviewace-resumes');
            if (storedResumes) {
                const parsedResumes: Resume[] = JSON.parse(storedResumes);
                setResumes(parsedResumes);
                if (parsedResumes.length > 0) {
                    const lastSelectedId = localStorage.getItem('interviewace-selected-resume-id');
                    const resumeExists = parsedResumes.some(r => r.id === lastSelectedId);
                    setSelectedResumeId(resumeExists ? lastSelectedId : parsedResumes[0].id);
                }
            }
        } catch (e) {
            console.error("Failed to load resumes from local storage.", e);
            toast({ title: "Error", description: "Could not load your saved resumes.", variant: "destructive" });
        }
    }, [toast]);

    useEffect(() => {
        try {
            localStorage.setItem('interviewace-resumes', JSON.stringify(resumes));
            if (selectedResumeId) {
                localStorage.setItem('interviewace-selected-resume-id', selectedResumeId);
            } else if (resumes.length === 0) {
                localStorage.removeItem('interviewace-selected-resume-id');
            }
        } catch (e) {
            console.error("Failed to save resumes to local storage.", e);
        }
    }, [resumes, selectedResumeId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const stopListening = useCallback(() => {
        if (listenTimeoutRef.current) {
            clearTimeout(listenTimeoutRef.current);
            listenTimeoutRef.current = null;
        }
        if (recognitionRef.current && isListening) {
            manualStopRef.current = true;
            recognitionRef.current.stop();
        }
    }, [isListening]);
    
    const handleSubmit = useCallback(async (e?: React.FormEvent<HTMLFormElement>, questionOverride?: string) => {
        e?.preventDefault();
        stopListening();

        const questionToSubmit = (questionOverride ?? question).trim();
        if (!questionToSubmit || isLoading) {
            return;
        }

        setIsLoading(true);
        const userMessage: Message = { id: Date.now(), role: 'user', content: questionToSubmit };
        
        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        
        const history = currentMessages.map(msg => ({ role: msg.role, content: msg.content }));
        
        const selectedResume = resumes.find(r => r.id === selectedResumeId);
        const resumeContent = selectedResume?.content ?? '';

        try {
            const { output, error } = await getStreamingAnswer({ question: questionToSubmit, resume: resumeContent, history });
            setQuestion('');

            if (error) {
                throw new Error(error);
            }

            const assistantMessage: Message = { id: Date.now() + 1, role: 'assistant', content: '' };
            setMessages(prev => [...prev, assistantMessage]);

            let finalAnswer = '';
            for await (const chunk of readStreamableValue(output)) {
                finalAnswer += chunk;
                setMessages(currentMessages => currentMessages.map(msg => 
                    msg.id === assistantMessage.id ? { ...msg, content: finalAnswer } : msg
                ));
            }

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.message || "Failed to generate an answer.",
                variant: "destructive",
            });
            setMessages(currentMessages => currentMessages.filter(msg => msg.id !== userMessage.id));
        } finally {
            setIsLoading(false);
        }
    }, [question, isLoading, messages, resumes, selectedResumeId, stopListening, toast]);
    
    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            manualStopRef.current = false;
            setIsListening(true);
            recognitionRef.current.start();
        }
    }, [isListening]);


    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; // Keep listening
            recognitionRef.current.interimResults = true; // Get results as they come
            recognitionRef.current.lang = 'en-US';
            
            let finalTranscript = '';

            recognitionRef.current.onresult = (event: any) => {
                if (listenTimeoutRef.current) {
                    clearTimeout(listenTimeoutRef.current);
                }
                
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                setQuestion(finalTranscript + interimTranscript);
                
                // Set a timeout to submit if the user pauses for 3 seconds
                listenTimeoutRef.current = setTimeout(() => {
                    const currentTranscript = (finalTranscript + interimTranscript).trim();
                    if (currentTranscript) {
                        recognitionRef.current.stop();
                        handleSubmit(undefined, currentTranscript);
                    }
                }, 3000);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error !== 'no-speech' && event.error !== 'aborted') {
                    toast({
                        title: "Voice Error",
                        description: `Speech recognition error: ${event.error}`,
                        variant: "destructive",
                    });
                }
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                finalTranscript = '';
                if (autoListen && !manualStopRef.current && !isLoading) {
                    startListening();
                }
            };
        }
    }, [autoListen, handleSubmit, isLoading, startListening, toast]);
    
    useEffect(() => {
        if (autoListen) {
            startListening();
        } else {
            stopListening();
        }
    }, [autoListen, startListening, stopListening]);


    const handleListenToggle = () => {
        if (isListening) {
            stopListening();
            if (autoListen) {
                setAutoListen(false);
            }
        } else {
            startListening();
        }
    };

    const handlePlayAudio = useCallback(async (messageId: number, text: string) => {
        if (isSpeaking === messageId) {
            audioRef.current?.pause();
            audioRef.current!.currentTime = 0;
            setIsSpeaking(null);
            return;
        }

        setIsSpeaking(messageId);
        try {
            const existingMessage = messages.find(m => m.id === messageId);
            let audioUrl = existingMessage?.audioUrl;

            if (!audioUrl) {
                const response = await getSpokenAnswer(text);
                if (response.media) {
                    audioUrl = response.media;
                    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, audioUrl } : m));
                } else {
                    throw new Error("No audio data received.");
                }
            }

            if (audioRef.current) {
                audioRef.current.src = audioUrl;
                audioRef.current.play();
                audioRef.current.onended = () => setIsSpeaking(null);
            }
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Playback Error",
                description: "Failed to generate or play audio.",
                variant: "destructive",
            });
            setIsSpeaking(null);
        }
    }, [isSpeaking, messages, toast]);

    const handleAddResume = () => {
        if (!newResumeName.trim() || !newResumeContent.trim()) {
            toast({ title: "Missing Information", description: "Please provide a name and content for the resume.", variant: "destructive" });
            return;
        }
        const newResume: Resume = {
            id: `resume-${Date.now()}`,
            name: newResumeName.trim(),
            content: newResumeContent.trim(),
        };
        const updatedResumes = [...resumes, newResume];
        setResumes(updatedResumes);
        setSelectedResumeId(newResume.id);
        setNewResumeName('');
        setNewResumeContent('');
        toast({ title: "Success", description: `Resume "${newResume.name}" added.` });
    };

    const handleDeleteResume = (idToDelete: string) => {
        setResumes(currentResumes => {
            const updatedResumes = currentResumes.filter(r => r.id !== idToDelete);
            if (selectedResumeId === idToDelete) {
                setSelectedResumeId(updatedResumes.length > 0 ? updatedResumes[0].id : null);
            }
            return updatedResumes;
        });
        toast({ title: "Success", description: "Resume deleted." });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
            <Card className="md:col-span-1 shadow-lg flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2 font-headline">
                        <div className="flex items-center gap-2">
                            <ClipboardPaste className="w-6 h-6 text-accent" />
                            Your Resumes
                        </div>
                        <Dialog open={isManageResumesOpen} onOpenChange={setIsManageResumesOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    Manage
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Manage Resumes</DialogTitle>
                                    <DialogDescription>
                                        Add a resume by pasting its content from your PDF file. To edit a resume, please delete it and add it again with the updated content.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <h4 className="text-sm font-medium">Add New Resume</h4>
                                    <div className="space-y-2">
                                        <Input placeholder="Resume Name (e.g., SWE Resume)" value={newResumeName} onChange={e => setNewResumeName(e.target.value)} />
                                        <Textarea placeholder="Paste resume content here..." value={newResumeContent} onChange={e => setNewResumeContent(e.target.value)} rows={5} />
                                        <Button onClick={handleAddResume} className="w-full">Add Resume</Button>
                                    </div>
                                    <hr />
                                    <h4 className="text-sm font-medium">Existing Resumes</h4>
                                    <ScrollArea className="h-[150px]">
                                        <div className="space-y-2 pr-4">
                                            {resumes.length > 0 ? resumes.map(r => (
                                                <div key={r.id} className="flex items-center justify-between p-2 border rounded-md">
                                                    <span className="text-sm">{r.name}</span>
                                                    <Button variant="ghost" size="icon" className="hover:bg-destructive/10" onClick={() => handleDeleteResume(r.id)}>
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            )) : <p className="text-sm text-muted-foreground text-center pt-4">No resumes saved.</p>}
                                        </div>
                                    </ScrollArea>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsManageResumesOpen(false)}>Close</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardTitle>
                    <CardDescription>
                        Select a resume for tailored answers. Use the "Manage" button to add a new resume by pasting its content.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col pt-2">
                    {resumes.length > 0 ? (
                        <div className="flex flex-col gap-4 flex-grow">
                            <Select value={selectedResumeId ?? ''} onValueChange={setSelectedResumeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a resume..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {resumes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Textarea
                                placeholder="Select a resume to see its content..."
                                className="w-full h-full resize-none flex-grow min-h-[200px]"
                                value={resumes.find(r => r.id === selectedResumeId)?.content ?? ''}
                                readOnly
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4 border-2 border-dashed rounded-lg bg-muted/50">
                            <p>No resumes stored yet.</p>
                            <p className="text-sm">Click the "Manage" button to add your first one.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Card className="md:col-span-2 shadow-lg flex flex-col h-full max-h-[85vh]">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Sparkles className="w-6 h-6 text-accent" />
                    Conversation Copilot
                </CardTitle>
                <CardDescription>
                    The AI remembers the conversation. Type or use the mic to record a question.
                </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col min-h-0">
                <Alert variant="default" className="text-left mb-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>How Voice Capture Works</AlertTitle>
                    <AlertDescription>
                        The app uses your browser&apos;s built-in speech recognition to listen through your microphone. It does not connect directly to Google Meet, Zoom, or Teams. For best results, use the &quot;Auto-Listen&quot; mode to automatically capture and respond to questions.
                    </AlertDescription>
                </Alert>
                <ScrollArea className="flex-grow mb-4">
                    <div className="space-y-6 pr-4">
                    {messages.map((message, index) => (
                        <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className="mt-1 flex-shrink-0">
                                {message.role === 'assistant' ? <Bot className="w-6 h-6 text-accent" /> : <User className="w-6 h-6" />}
                            </div>
                            <div className={`p-3 rounded-lg max-w-xl text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {isLoading && message.role === 'assistant' && !message.content ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Thinking...</span>
                                    </div>
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: message.content.replace(/```(python|)\n/g, '<pre><code class="language-python">').replace(/```/g, '</code></pre>') || '' }}/>
                                 )}
                                {isLoading && message.role === 'assistant' && index === messages.length - 1 && message.content ? <span className="inline-block w-2 h-4 ml-1 translate-y-1 bg-foreground animate-pulse" /> : null}
                            </div>
                            {message.role === 'assistant' && message.content && (
                                <Button size="icon" variant="ghost" className="flex-shrink-0" onClick={() => handlePlayAudio(message.id, message.content)} disabled={isSpeaking !== null && isSpeaking !== message.id}>
                                    <Volume2 className={`w-4 h-4 ${isSpeaking === message.id ? 'text-accent' : ''}`} />
                                </Button>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <Switch id="auto-listen-mode" checked={autoListen} onCheckedChange={setAutoListen} />
                        <Label htmlFor="auto-listen-mode">Auto-Listen Mode</Label>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t pt-4">
                    <Textarea
                    placeholder={isListening ? "Listening for the next question..." : "Type a question or enable Auto-Listen mode..."}
                    className="min-h-[40px] resize-none"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    disabled={autoListen}
                    />
                    <Button type="button" size="icon" variant={isListening ? "destructive" : "outline"} onClick={handleListenToggle} disabled={isLoading}>
                        <Mic className="w-4 h-4"/>
                        <span className="sr-only">{isListening ? "Stop Listening" : "Record Question"}</span>
                    </Button>
                    <Button type="submit" size="icon" disabled={!question.trim() || isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4"/>}
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
                </CardContent>
            </Card>
            <audio ref={audioRef} className="hidden" />
        </div>
    );
}
