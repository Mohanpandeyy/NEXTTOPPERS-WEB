import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, Clock, ChevronLeft, ChevronRight, Sparkles, Mail, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import BatchCard from '@/components/cards/BatchCard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import FeedbackFormUser from '@/components/FeedbackFormUser';
import { cn } from '@/lib/utils';

const features = [
  { icon: BookOpen, title: 'Quality Content', description: 'Well-structured courses' },
  { icon: Users, title: 'Expert Faculty', description: 'Experienced teachers' },
  { icon: Award, title: 'Proven Results', description: 'Success stories' },
  { icon: Clock, title: 'Flexible Learning', description: 'Learn at your pace' },
];

export default function Home() {
  const { appName, logoUrl } = useAppSettings();
  const { user } = useSupabaseAuth();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch banners from database
  const { data: banners = [] } = useQuery({
    queryKey: ['home-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });
  
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const { data: allBatches = [] } = useQuery({
    queryKey: ['home-all-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: featuredBatches = [] } = useQuery({
    queryKey: ['featured-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('show_on_home', true)
        .eq('visibility', 'public')
        .limit(4);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: liveClasses = [] } = useQuery({
    queryKey: ['upcoming-live'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_classes')
        .select('*')
        .in('status', ['scheduled', 'live'])
        .order('scheduled_time')
        .limit(3);
      if (error) throw error;
      return data || [];
    },
  });

  const filteredBatches = activeFilter === 'all' 
    ? allBatches 
    : allBatches.filter(b => b.status === activeFilter);

  const nextBanner = () => setCurrentBanner(prev => (prev + 1) % banners.length);
  const prevBanner = () => setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length);

  return (
    <div className="min-h-screen bg-background">
      {user && <FeedbackFormUser />}
      
      {/* Hero Banner Carousel */}
      {banners.length > 0 && (
        <section className="relative overflow-hidden">
          <div className="relative h-[280px] md:h-[380px] lg:h-[420px]">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={cn(
                  "absolute inset-0 transition-all duration-700 ease-in-out",
                  index === currentBanner ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
                )}
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-4">
                    <div className="max-w-xl">
                      <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 animate-fade-in">
                        {banner.title}
                      </h1>
                      <p className="text-base md:text-lg text-white/80 mb-5">
                        {banner.subtitle}
                      </p>
                      <Link to={banner.link_url || '/batches'}>
                        <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                          Explore Courses
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {banners.length > 1 && (
              <>
                <button
                  onClick={prevBanner}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextBanner}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBanner(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        index === currentBanner ? "bg-white w-6" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Live Classes Section */}
      {liveClasses.length > 0 && (
        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-lg border">
              <div className="bg-gradient-to-br from-cyan-500 to-teal-600 p-8 md:w-1/3 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <Radio className="w-6 h-6 text-white animate-pulse" />
                  <span className="text-white/80 text-sm font-medium">LIVE</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">LIVE CLASSES</h2>
                <p className="text-white/80 text-sm">Join interactive sessions</p>
              </div>
              <div className="bg-card p-6 md:w-2/3 flex flex-col justify-center">
                <h3 className="text-xl font-bold mb-2">Join Our Live Classes!</h3>
                <p className="text-muted-foreground mb-4">
                  Attend live interactive classes from our expert educators. Don't miss out!
                </p>
                <Link to="/today-live">
                  <Button variant="outline" className="w-fit">
                    Go to Live Page
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Struggling in Studies */}
      <section className="py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-card rounded-xl border shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Struggling in Studies?</h3>
                <p className="text-sm text-muted-foreground">Aaiye apki Samasya ka, Samadhan krte hai ✨</p>
              </div>
            </div>
            <Link to="/batches">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap">
                See How We Help
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Batches */}
      {featuredBatches.length > 0 && (
        <section className="py-10 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">⭐</span>
              <h2 className="text-xl md:text-2xl font-bold">Featured Courses</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredBatches.map((batch, i) => (
                <div key={batch.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <BatchCard batch={batch} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Courses Section */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold mb-4">All Courses</h2>
          
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['all', 'ongoing', 'upcoming', 'completed'].map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "capitalize",
                  activeFilter === filter && "bg-slate-800 text-white hover:bg-slate-700"
                )}
              >
                {filter === 'all' ? 'All Courses' : filter}
              </Button>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            We offer comprehensive courses covering all subjects with concept-based video lectures, 
            live and recorded classes, doubt-solving sessions, and regular tests. Our platform emphasizes 
            real-life examples, story-based teaching, and smart tricks to ensure deep understanding and exam readiness.
          </p>
          
          {filteredBatches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredBatches.slice(0, 8).map((batch, i) => (
                <div key={batch.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <BatchCard batch={batch} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No courses found for this filter
            </div>
          )}

          {filteredBatches.length > 8 && (
            <div className="mt-8 text-center">
              <Link to="/batches">
                <Button variant="outline" size="lg" className="group">
                  View All Courses
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Why Choose Us?</h2>
            <p className="text-muted-foreground text-sm">Everything you need to succeed</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <Card 
                key={feature.title}
                className="text-center p-5 hover:shadow-lg transition-shadow animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 md:p-12 text-center text-primary-foreground">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative">
              <h2 className="text-xl md:text-3xl font-bold mb-3">
                Ready to Start Learning?
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto text-sm">
                Join {appName} today and get access to the best learning resources
              </p>
              <Link to="/batches">
                <Button size="lg" variant="secondary" className="hover:scale-105 transition-transform">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 text-lg font-bold mb-3">
                {logoUrl ? (
                  <img src={logoUrl} alt={appName} className="w-9 h-9 rounded-xl object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
                <span>{appName}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your trusted partner for quality education.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link to="/batches" className="block text-muted-foreground hover:text-primary transition-colors">
                  All Courses
                </Link>
                <Link to="/today-live" className="block text-muted-foreground hover:text-primary transition-colors">
                  Live Classes
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-sm">Contact</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>support@{appName.toLowerCase().replace(/\s/g, '')}.com</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {appName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
