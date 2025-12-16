import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, Clock, Play, ChevronLeft, ChevronRight, Sparkles, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BatchCard from '@/components/cards/BatchCard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import FeedbackFormUser from '@/components/FeedbackFormUser';
import { cn } from '@/lib/utils';

// Sample banners (admin can customize later)
const banners = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&h=400&fit=crop',
    title: 'Start Your Learning Journey',
    subtitle: 'Join thousands of successful students'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&h=400&fit=crop',
    title: 'Expert Teachers',
    subtitle: 'Learn from the best educators'
  }
];

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
  
  // Auto-slide banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const { data: batches = [] } = useQuery({
    queryKey: ['public-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('sort_order')
        .limit(6);
      if (error) throw error;
      return data || [];
    },
  });

  const nextBanner = () => setCurrentBanner(prev => (prev + 1) % banners.length);
  const prevBanner = () => setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length);

  return (
    <div className="min-h-screen bg-background">
      {user && <FeedbackFormUser />}
      
      {/* Hero Banner Carousel */}
      <section className="relative overflow-hidden">
        <div className="relative h-[300px] md:h-[400px] lg:h-[450px]">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={cn(
                "absolute inset-0 transition-all duration-700 ease-in-out",
                index === currentBanner ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
              )}
            >
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-4">
                  <div className="max-w-xl">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in">
                      {banner.title}
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 mb-6">
                      {banner.subtitle}
                    </p>
                    <Link to="/batches">
                      <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Explore Courses
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Navigation arrows */}
          <button
            onClick={prevBanner}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextBanner}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          
          {/* Dots indicator */}
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
        </div>
      </section>

      {/* Help Section */}
      <section className="py-8 bg-emerald-50 dark:bg-emerald-950/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-card rounded-2xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Struggling in Studies?</h3>
                <p className="text-muted-foreground">Aaiye apki Samasya ka, Samadhan krte hai ✨</p>
              </div>
            </div>
            <Link to="/batches">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                See How We Help
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Courses */}
      {batches.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">🔥</span>
              <h2 className="text-2xl md:text-3xl font-bold">Trending Courses</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {batches.map((batch, i) => (
                <div 
                  key={batch.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <BatchCard batch={batch} />
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link to="/batches">
                <Button variant="outline" size="lg" className="group">
                  View All Courses
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Our Teachers */}
      {teachers.length > 0 && (
        <section className="py-12 md:py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Our Expert Teachers</h2>
              <p className="text-muted-foreground">Learn from the best educators</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {teachers.map((teacher, i) => (
                <Card 
                  key={teacher.id}
                  className="text-center animate-fade-in overflow-hidden group"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <CardContent className="p-4">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-muted">
                      {teacher.photo_url ? (
                        <img 
                          src={teacher.photo_url} 
                          alt={teacher.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-8 h-8 text-primary" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm truncate">{teacher.name}</h3>
                    {teacher.subject && (
                      <p className="text-xs text-muted-foreground truncate">{teacher.subject}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Why Choose Us?</h2>
            <p className="text-muted-foreground">Everything you need to succeed</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card 
                key={feature.title}
                className="text-center p-6 hover:shadow-lg transition-shadow animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-bold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 md:p-16 text-center text-primary-foreground">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
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
      <footer className="bg-card border-t border-border py-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 text-xl font-bold mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt={appName} className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
                <span>{appName}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your trusted partner for quality education and exam preparation.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link to="/batches" className="block text-muted-foreground hover:text-primary transition-colors">
                  All Courses
                </Link>
                <Link to="/today-live" className="block text-muted-foreground hover:text-primary transition-colors">
                  Live Classes
                </Link>
                <Link to="/notifications" className="block text-muted-foreground hover:text-primary transition-colors">
                  Notifications
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>support@{appName.toLowerCase().replace(/\s/g, '')}.com</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {appName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
