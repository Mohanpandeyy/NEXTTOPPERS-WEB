import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Calendar, Clock, Users, Radio, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import VideoPlayer from '@/components/VideoPlayer';
import { cn } from '@/lib/utils';

// Format time in IST
const formatTimeIST = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
    hour12: true
  });
};

const formatDateIST = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata'
  });
};

export default function TodayLive() {
  const { user, isLoading: authLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentLive, setCurrentLive] = useState<any>(null);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch today's live classes
  const { data: liveClasses = [], isLoading } = useQuery({
    queryKey: ['today-live'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('live_classes')
        .select('*, batches(name, thumbnail_url)')
        .gte('scheduled_time', today.toISOString())
        .lt('scheduled_time', tomorrow.toISOString())
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update countdowns every second
  useEffect(() => {
    const updateCountdowns = () => {
      const now = new Date().getTime();
      const newCountdowns: Record<string, string> = {};
      
      liveClasses.forEach((liveClass: any) => {
        if (liveClass.status !== 'live' && liveClass.status !== 'ended') {
          const scheduled = new Date(liveClass.scheduled_time).getTime();
          const diff = scheduled - now;
          
          if (diff <= 0) {
            newCountdowns[liveClass.id] = 'Starting soon...';
          } else {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            if (hours > 0) {
              newCountdowns[liveClass.id] = `${hours}h ${minutes}m ${seconds}s`;
            } else if (minutes > 0) {
              newCountdowns[liveClass.id] = `${minutes}m ${seconds}s`;
            } else {
              newCountdowns[liveClass.id] = `${seconds}s`;
            }
          }
        }
      });
      
      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [liveClasses]);

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['user-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleWatchLive = (liveClass: any) => {
    if (liveClass.status === 'live') {
      setCurrentLive(liveClass);
      setShowPlayer(true);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Radio className="w-8 h-8 text-red-500 animate-pulse" />
              Today Live
            </h1>
            <p className="text-muted-foreground">
              {liveClasses.length > 0 
                ? `${liveClasses.length} live class${liveClasses.length > 1 ? 'es' : ''} scheduled today`
                : 'No live classes scheduled for today'}
            </p>
          </div>
          <Link to="/notifications">
            <Button variant="outline" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : liveClasses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">📺</div>
            <h2 className="text-2xl font-bold mb-4">No Live Classes Today</h2>
            <p className="text-muted-foreground mb-6">
              Check back later or browse recorded lectures
            </p>
            <Link to="/batches">
              <Button>Browse Batches</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {liveClasses.map((liveClass: any, i: number) => {
              const isLive = liveClass.status === 'live';
              const isEnded = liveClass.status === 'ended';
              const countdown = countdowns[liveClass.id];
              
              return (
                <Card 
                  key={liveClass.id}
                  className={cn(
                    "overflow-hidden transition-all animate-fade-in",
                    isLive && "border-red-500 shadow-lg shadow-red-500/20"
                  )}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Thumbnail with countdown overlay */}
                      <div className="relative md:w-72 aspect-video md:aspect-auto flex-shrink-0">
                        <img
                          src={liveClass.thumbnail_url || liveClass.batches?.thumbnail_url || '/placeholder.svg'}
                          alt={liveClass.title}
                          className="w-full h-full object-cover"
                        />
                        {isLive && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-red-500 text-white animate-pulse flex items-center gap-1">
                              <Radio className="w-3 h-3" />
                              LIVE
                            </Badge>
                          </div>
                        )}
                        {isEnded && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="secondary">Ended</Badge>
                          </div>
                        )}
                        {/* Countdown overlay */}
                        {!isLive && !isEnded && countdown && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-white/70 text-sm mb-1">Starts in</div>
                              <div className="text-white text-2xl font-bold font-mono">
                                {countdown}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">{liveClass.batches?.name}</Badge>
                          {liveClass.subject && <Badge variant="secondary">{liveClass.subject}</Badge>}
                        </div>

                        <h3 className="text-xl font-bold mb-2">{liveClass.title}</h3>
                        {liveClass.description && (
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{liveClass.description}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                          {liveClass.teacher_name && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {liveClass.teacher_name}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTimeIST(liveClass.scheduled_time)} IST
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDateIST(liveClass.scheduled_time)}
                          </div>
                        </div>

                        {isLive ? (
                          <Button onClick={() => handleWatchLive(liveClass)} className="gap-2">
                            <Play className="w-4 h-4" />
                            Watch Now
                          </Button>
                        ) : isEnded ? (
                          <Button variant="outline" disabled>
                            Stream Ended
                          </Button>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Button variant="outline" disabled className="font-mono">
                              <Clock className="w-4 h-4 mr-2" />
                              {countdown}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {showPlayer && currentLive && (
        <VideoPlayer
          videoUrl={currentLive.live_url}
          title={currentLive.title}
          isLive={true}
          onClose={() => {
            setShowPlayer(false);
            setCurrentLive(null);
          }}
        />
      )}
    </div>
  );
}
