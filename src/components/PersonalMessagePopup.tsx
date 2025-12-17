import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, MessageSquare, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  is_read: boolean;
  is_admin_message: boolean;
  created_at: string;
}

export default function PersonalMessagePopup() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        fetchMessages(data.user.id);
        
        // Subscribe to realtime updates
        const channel = supabase
          .channel('personal-messages')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'personal_messages',
              filter: `to_user_id=eq.${data.user.id}`,
            },
            () => fetchMessages(data.user.id)
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    };
    checkUser();
  }, []);

  const fetchMessages = async (uid: string) => {
    const { data, error } = await supabase
      .from('personal_messages')
      .select('*')
      .or(`to_user_id.eq.${uid},from_user_id.eq.${uid}`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
      const unread = data.filter(m => m.to_user_id === uid && !m.is_read).length;
      setUnreadCount(unread);
    }
  };

  const markAsRead = async () => {
    if (!userId) return;
    await supabase
      .from('personal_messages')
      .update({ is_read: true })
      .eq('to_user_id', userId)
      .eq('is_read', false);
    
    setUnreadCount(0);
  };

  const handleOpen = () => {
    setIsOpen(true);
    markAsRead();
  };

  const handleReply = async () => {
    if (!replyText.trim() || !userId) return;

    setIsSending(true);
    try {
      // Find admin to reply to (last admin message sender)
      const adminMessage = [...messages].reverse().find(m => m.is_admin_message && m.to_user_id === userId);
      if (!adminMessage) {
        toast({ title: 'Error', description: 'No admin message to reply to', variant: 'destructive' });
        return;
      }

      const { error } = await supabase.from('personal_messages').insert({
        from_user_id: userId,
        to_user_id: adminMessage.from_user_id,
        message: replyText.trim(),
        is_admin_message: false,
      });

      if (error) throw error;

      toast({ title: 'Sent', description: 'Reply sent successfully' });
      setReplyText('');
      fetchMessages(userId);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to send reply', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  if (!userId || messages.length === 0) return null;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-50 p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <MessageSquare className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Message Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 right-4 z-50 w-[350px] max-h-[500px] bg-background rounded-2xl shadow-2xl border overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-semibold">Messages</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="h-[300px] p-4">
              <div className="space-y-3">
                {messages.map((msg, idx) => {
                  const isFromAdmin = msg.is_admin_message && msg.to_user_id === userId;
                  const isMyReply = !msg.is_admin_message && msg.from_user_id === userId;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex ${isFromAdmin ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 ${
                          isFromAdmin
                            ? 'bg-muted rounded-bl-none'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-none'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {isFromAdmin ? (
                            <Badge variant="secondary" className="text-xs">Admin</Badge>
                          ) : (
                            <Badge className="text-xs bg-white/20">You</Badge>
                          )}
                        </div>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isFromAdmin ? 'text-muted-foreground' : 'text-white/70'}`}>
                          {new Date(msg.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Reply Input */}
            <div className="p-4 border-t bg-muted/30">
              <div className="flex gap-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  className="resize-none"
                />
                <Button
                  onClick={handleReply}
                  disabled={!replyText.trim() || isSending}
                  size="icon"
                  className="self-end"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
