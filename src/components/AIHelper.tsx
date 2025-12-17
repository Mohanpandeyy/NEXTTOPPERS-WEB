import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, ImagePlus, Loader2, Minimize2, Maximize2, Sparkles, Trash2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

interface AIHelperProps {
  lectureContext?: string;
  onClose: () => void;
}

const STORAGE_KEY = 'ai_chat_history';

// Simple markdown-like code block renderer
const renderContent = (content: string) => {
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const lines = part.slice(3, -3).split('\n');
      const language = lines[0]?.trim() || '';
      const code = lines.slice(language ? 1 : 0).join('\n').trim();
      
      return (
        <div key={index} className="my-2 rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
          {language && (
            <div className="px-3 py-1 bg-slate-800 text-xs text-slate-400 border-b border-slate-700">
              {language}
            </div>
          )}
          <pre className="p-3 overflow-x-auto">
            <code className="text-sm text-green-400 font-mono whitespace-pre-wrap">{code}</code>
          </pre>
        </div>
      );
    }
    
    // Handle inline code
    const inlineParts = part.split(/(`[^`]+`)/g);
    return (
      <span key={index}>
        {inlineParts.map((inlinePart, i) => {
          if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
            return (
              <code key={i} className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-xs">
                {inlinePart.slice(1, -1)}
              </code>
            );
          }
          return <span key={i}>{inlinePart}</span>;
        })}
      </span>
    );
  });
};

export default function AIHelper({ lectureContext, onClose }: AIHelperProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
    
    return [{
      role: 'assistant',
      content: lectureContext 
        ? `Hi! I'm your AI study helper. I see you're learning about "${lectureContext}". Feel free to ask me anything about this topic or upload an image of a problem you need help with!`
        : "Hi! I'm your AI study helper. I know everything about this platform - ask me about courses, lectures, schedules, or upload an image of a problem!"
    }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save to localStorage when messages change
  useEffect(() => {
    if (messages.length > 1) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {
        console.error('Failed to save chat history:', e);
      }
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([{
      role: 'assistant',
      content: "Chat history cleared! How can I help you today?"
    }]);
    setShowHistory(false);
  };

  const sendMessage = async () => {
    if ((!input.trim() && !imageFile) || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim() || (imageFile ? 'Please analyze this image' : ''),
      imageUrl: imagePreview || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let uploadedImageUrl: string | undefined;
    if (imageFile) {
      try {
        const fileName = `ai-helper/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('media').upload(fileName, imageFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);
          uploadedImageUrl = publicUrl;
        }
      } catch (err) {
        console.error('Image upload failed:', err);
      }
      removeImage();
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          imageUrl: uploadedImageUrl
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div 
      className={cn(
        "fixed z-50 bg-background border border-border rounded-2xl shadow-2xl flex flex-col transition-all duration-300",
        isExpanded 
          ? "inset-4 md:inset-8" 
          : "bottom-4 right-4 w-[360px] h-[480px] md:w-[400px] md:h-[550px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Study Helper</h3>
            <p className="text-xs text-muted-foreground">Your personal assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setShowHistory(!showHistory)}
            title="Chat History"
          >
            <History className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* History menu */}
      {showHistory && (
        <div className="p-3 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Chat History</span>
            <Button variant="ghost" size="sm" onClick={clearHistory} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {messages.length - 1} messages saved locally
          </p>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2",
                msg.role === 'user' ? "flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                msg.role === 'user' ? "bg-primary" : "bg-gradient-to-br from-purple-500 to-indigo-600"
              )}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                  : "bg-secondary rounded-tl-sm"
              )}>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Uploaded" className="max-w-full rounded-lg mb-2" />
                )}
                <div className="text-sm whitespace-pre-wrap">{renderContent(msg.content)}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-3 py-2 border-t">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-14 rounded-lg" />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex-shrink-0 h-10 w-10"
          >
            <ImagePlus className="w-4 h-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={isLoading}
            className="flex-1 h-10"
          />
          <Button onClick={sendMessage} disabled={isLoading || (!input.trim() && !imageFile)} size="icon" className="h-10 w-10">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
