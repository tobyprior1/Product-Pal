import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDataStore } from "@/lib/pm-supabase-store";
import Index from "./pages/Index";
import Project from "./pages/Project";
import Editor from "./pages/Editor";
import Roadmap from "./pages/Roadmap";
import Work from "./pages/Work";
import Interviews from "./pages/Interviews";
import Present from "./pages/Present";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { CommandPalette } from "@/components/CommandPalette";

const queryClient = new QueryClient();

const App = () => {
  const { setUserId, loadUserData } = useDataStore();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const userId = session?.user?.id || null;
        setUserId(userId);
        
        // Load user data when logged in
        if (userId && event === 'SIGNED_IN') {
          setTimeout(() => {
            loadUserData();
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const userId = session?.user?.id || null;
      setUserId(userId);
      
      if (userId) {
        setTimeout(() => {
          loadUserData();
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUserId, loadUserData]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CommandPalette />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/work" element={<Work />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/present" element={<Present />} />
            <Route path="/auth" element={<Auth />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
