import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart3, MessageCircle, Zap, FlaskConical } from "lucide-react";
import logoLight from "@/assets/product-pal-logo-light.png";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Desired Outcomes",
    body: "Define the specific business metrics and customer results that matter most to your strategy.",
  },
  {
    icon: MessageCircle,
    title: "Opportunities",
    body: "Map user needs, pain points and desires that represent the best path to your outcomes.",
  },
  {
    icon: Zap,
    title: "AI Idea Engine",
    body: "Generate high-potential solution ideas linked directly to your mapped opportunities using AI.",
  },
  {
    icon: FlaskConical,
    title: "Rapid Tests",
    body: "Validate assumptions quickly with structured experiments to ensure you build the right thing.",
  },
];

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-landing-bg text-landing-fg font-body selection:bg-landing-accent/30">
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <img
          src={logoLight}
          alt="Product Pal"
          width={1152}
          height={576}
          className="h-9 w-auto"
        />
        <Button
          variant="ghost"
          onClick={() => navigate("/auth")}
          className="text-landing-fg/80 hover:text-landing-fg hover:bg-landing-surface font-medium"
        >
          Sign in
        </Button>
      </header>

      <section className="flex flex-col items-center justify-center pt-20 pb-24 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-landing-surface border border-landing-accent/20 text-landing-accent text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-landing-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-landing-accent" />
          </span>
          Now with AI solution synthesis
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
          Master the art of
          <br />
          <span className="text-landing-accent">product discovery.</span>
        </h1>

        <p className="text-lg md:text-xl text-landing-fg/70 max-w-2xl mb-10 leading-relaxed">
          Align your team around high-impact opportunities. Product Pal helps you bridge the gap
          between business outcomes and validated experiments.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button
            onClick={() => navigate("/auth")}
            className="h-auto px-8 py-4 bg-landing-accent hover:bg-landing-accent/90 text-landing-bg font-semibold rounded-lg transition-all hover:-translate-y-0.5 shadow-lg shadow-landing-accent/20"
          >
            Start discovery free
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="h-auto px-8 py-4 bg-landing-surface hover:bg-landing-surface/80 hover:text-landing-fg border border-landing-accent/20 text-landing-fg font-semibold rounded-lg transition-all"
          >
            Sign in
          </Button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="p-8 rounded-2xl bg-landing-surface border border-landing-accent/10 hover:border-landing-accent/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-landing-accent/10 flex items-center justify-center mb-6">
                <Icon className="w-6 h-6 text-landing-accent" strokeWidth={2} />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">{title}</h3>
              <p className="text-landing-fg/60 leading-relaxed text-sm">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-landing-accent/10">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <img
            src={logoLight}
            alt="Product Pal"
            loading="lazy"
            width={1152}
            height={576}
            className="h-7 w-auto opacity-80"
          />
          <p className="text-sm text-landing-fg/50">
            © {new Date().getFullYear()} Product Pal. Built for product discovery.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
