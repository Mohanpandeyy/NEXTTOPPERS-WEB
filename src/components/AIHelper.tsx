import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, ImagePlus, Loader2, Minimize2, Maximize2, Sparkles } from 'lucide-react';
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

export default function AIHelper({ lectureContext, onClose }: AIHelperProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: lectureContext 
        ? `Hi! I'm your AI study helper. I see you're learning about "${lectureContext}". Feel free to ask me anything about this topic or upload an image of a problem you need help with!`
        : "Hi! I'm your AI study helper. Ask me anything about your studies, or upload an image of a problem you need help with!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Upload image if present
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
          : "bottom-4 right-4 w-[380px] h-[500px] md:w-[420px] md:h-[600px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Study Helper</h3>
            <p className="text-xs text-muted-foreground">Ask me anything!</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                msg.role === 'user' ? "flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                msg.role === 'user' ? "bg-primary" : "bg-secondary"
              )}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-md" 
                  : "bg-secondary rounded-tl-md"
              )}>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Uploaded" className="max-w-full rounded-lg mb-2" />
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-tl-md px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 py-2 border-t">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-16 rounded-lg" />
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
      <div className="p-4 border-t">
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
            className="flex-shrink-0"
          >
            <ImagePlus className="w-4 h-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isLoading || (!input.trim() && !imageFile)} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
