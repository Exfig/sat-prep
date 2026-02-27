import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MousePointer2, Activity, Play, CheckCircle2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// -------------------------------------------------------------
// Component: Diagnostic Shuffler (Value Prop 1: Price)
// -------------------------------------------------------------
const DiagnosticShuffler = () => {
  const [cards, setCards] = useState([
    { id: 1, label: "$49 once, forever." },
    { id: 2, label: "No subscriptions." },
    { id: 3, label: "No recurring charges." }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCards(prev => {
        const newArr = [...prev];
        const last = newArr.pop();
        if (last) newArr.unshift(last);
        return newArr;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="clay-card rounded-[2rem] p-8 h-80 flex flex-col justify-between border border-brand-slate/5 bg-brand-ivory/80 relative overflow-hidden">
      <div className="z-10 relative">
        <h3 className="font-heading font-bold text-2xl text-brand-slate mb-2">Eliminate Objection</h3>
        <p className="text-brand-slate/70 text-sm font-sans mb-6">Less than the SAT registration fee itself.</p>
      </div>

      <div className="relative h-32 w-full flex justify-center items-end pb-4 perspective-1000 z-10">
        {cards.map((card, idx) => {
          const isTop = idx === 0;
          const isMid = idx === 1;

          return (
            <div
              key={card.id}
              className={`absolute w-full max-w-[200px] h-16 rounded-2xl flex items-center justify-center font-mono text-sm font-bold shadow-sm transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isTop ? 'bg-brand-obsidian text-brand-ivory z-30 translate-y-0 scale-100 opacity-100' :
                isMid ? 'bg-white text-brand-slate z-20 -translate-y-4 scale-95 opacity-80 border border-brand-slate/10' :
                  'bg-white/50 text-brand-slate/50 z-10 -translate-y-8 scale-90 opacity-40 border border-brand-slate/5'
                }`}
            >
              {card.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Component: Telemetry Typewriter (Value Prop 2: Teen Will Use It)
// -------------------------------------------------------------
const TelemetryTypewriter = () => {
  const fullText = "Boss fights, XP, streaks, and quests turn SAT prep into something that competes with a phone.";
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 80%",
        onEnter: () => setIsTyping(true),
        once: true
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!isTyping) return;
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [isTyping]);

  return (
    <div ref={containerRef} className="clay-card rounded-[2rem] p-8 h-80 flex flex-col justify-between border border-brand-slate/5 bg-brand-ivory/80 relative overflow-hidden">
      <div className="z-10 relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-brand-champagne animate-pulse" />
          <span className="font-mono text-xs font-bold text-brand-champagne uppercase tracking-widest">Live Feed</span>
        </div>
        <h3 className="font-heading font-bold text-2xl text-brand-slate mb-2">They Will Actually Use It</h3>
        <p className="text-brand-slate/70 text-sm font-sans mb-6">Competes with scrolling, instead of losing to it.</p>
      </div>

      <div className="bg-brand-slate text-brand-ivory p-5 rounded-2xl font-mono text-xs sm:text-sm h-32 flex items-start z-10 shadow-inner leading-relaxed">
        <p>
          <span className="opacity-50 text-brand-champagne mr-2">&gt;</span>
          {text}
          <span className="inline-block w-2 h-4 bg-brand-champagne ml-1 animate-pulse align-middle" />
        </p>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Component: Cursor Protocol Scheduler (Value Prop 3: Learning Science)
// -------------------------------------------------------------
const CursorProtocolScheduler = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1, defaults: { ease: 'power2.inOut' } });

      // Start cursor off-screen
      tl.set(cursorRef.current, { x: 50, y: 150, opacity: 0 });

      // Move to cell
      tl.to(cursorRef.current, { x: 30, y: 20, opacity: 1, duration: 1 })
        // Click
        .to(cursorRef.current, { scale: 0.8, duration: 0.1 })
        .to(cellRef.current, { backgroundColor: 'var(--color-brand-champagne)', color: 'white', duration: 0.1 }, "<")
        .to(cursorRef.current, { scale: 1, duration: 0.1 })
        // Move to button
        .to(cursorRef.current, { x: 120, y: 80, duration: 0.8 }, "+=0.2")
        // Click
        .to(cursorRef.current, { scale: 0.8, duration: 0.1 })
        .to(btnRef.current, { scale: 0.95, duration: 0.1 }, "<")
        .to(cursorRef.current, { scale: 1, duration: 0.1 })
        .to(btnRef.current, { scale: 1, duration: 0.1 }, "<")
        // Fade out
        .to(cursorRef.current, { opacity: 0, duration: 0.3, delay: 0.5 })
        // Reset cell
        .set(cellRef.current, { backgroundColor: 'transparent', color: 'var(--color-brand-obsidian)' });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="clay-card rounded-[2rem] p-8 h-80 flex flex-col justify-between border border-brand-slate/5 bg-brand-ivory/80 relative overflow-hidden">
      <div className="z-10 relative">
        <h3 className="font-heading font-bold text-2xl text-brand-slate mb-2">Real Learning Science</h3>
        <p className="text-brand-slate/70 text-sm font-sans mb-6">Spaced repetition (SM-2) & calibrating confidence.</p>
      </div>

      <div className="relative bg-white p-4 rounded-2xl border border-brand-slate/5 shadow-sm z-10">
        <div className="flex justify-between mb-4">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div
              key={i}
              ref={i === 3 ? cellRef : null}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-colors ${i === 2 ? 'bg-brand-obsidian/10 text-brand-obsidian' : 'text-brand-slate/40'}`}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <div className="h-2 w-16 bg-brand-slate/10 rounded" />
          <div ref={btnRef} className="bg-brand-obsidian text-brand-ivory text-[10px] font-bold px-3 py-1.5 rounded-full inline-block">
            Save
          </div>
        </div>

        {/* Animated Cursor */}
        <div ref={cursorRef} className="absolute top-0 left-0 pointer-events-none z-50">
          <MousePointer2 className="text-brand-slate fill-white w-6 h-6 -ml-1 -mt-1" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Main Landing Page
// -------------------------------------------------------------
const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      // Navbar Transition
      ScrollTrigger.create({
        start: 'top -50',
        end: 99999,
        toggleClass: {
          className: 'bg-brand-ivory/60 backdrop-blur-xl border-brand-slate/10 shadow-sm text-brand-obsidian',
          targets: '.nav-wrapper'
        }
      });
      ScrollTrigger.create({
        start: 'top -50',
        end: 99999,
        toggleClass: {
          className: 'text-brand-obsidian border-brand-obsidian/10',
          targets: '.nav-text-color'
        }
      });

      // Hero animations
      gsap.from('.hero-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.2
      });

      // Philosophy contrast reveal
      const philLines = gsap.utils.toArray('.phil-line');
      philLines.forEach((line: any) => {
        gsap.from(line, {
          y: 30,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: line,
            start: 'top 80%',
          }
        });
      });

      // Protocol Sticky Stacking
      const cards = gsap.utils.toArray('.protocol-card-inner');
      cards.forEach((card: any, i) => {
        if (i < cards.length - 1) {
          gsap.to(card, {
            scale: 0.9,
            opacity: 0.5,
            filter: 'blur(20px)',
            scrollTrigger: {
              trigger: cards[i + 1] as gsap.DOMTarget,
              start: 'top bottom',
              end: 'top top',
              scrub: true,
            }
          });
        }
      });

    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="bg-brand-ivory min-h-screen text-brand-slate antialiased overflow-hidden selection:bg-brand-champagne/20 selection:text-brand-obsidian">

      {/* ---------------- Navbar The Floating Island ---------------- */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-center pointer-events-none">
        <div className="nav-wrapper pointer-events-auto flex items-center justify-between transition-all duration-500 rounded-full px-6 py-3 w-full max-w-5xl border border-transparent">
          <div className="flex items-center gap-3 nav-text-color text-brand-ivory transition-colors duration-500">
            <span className="font-heading font-extrabold text-xl tracking-tight">Caliber.</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-sans font-medium text-sm nav-text-color text-brand-ivory transition-colors duration-500">
            <a href="#features" className="link-lift">Features</a>
            <a href="#philosophy" className="link-lift">Philosophy</a>
            <a href="#protocol" className="link-lift">Protocol</a>
            <Link to="/login" className="link-lift opacity-80 hover:opacity-100">Login</Link>
          </div>
          <div className="pointer-events-auto">
            <Link to="/signup" className="btn-magnetic bg-brand-champagne text-brand-ivory font-sans font-bold text-sm px-5 py-2.5 rounded-full inline-flex items-center">
              <span>Get Started</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ---------------- Hero Section The Opening Shot ---------------- */}
      <header className="relative w-full min-h-[100dvh] bg-brand-obsidian flex items-center overflow-hidden">
        {/* Dark marble/luxury interior background image */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-60 mix-blend-luminosity scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600607688066-890987f18a86?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')" }}
        />
        {/* Primary-to-black gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D10] via-brand-obsidian/80 to-transparent" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-8 md:px-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 pt-28 pb-16">
          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="hero-text font-heading font-bold text-2xl md:text-3xl text-brand-champagne tracking-tight mb-4 uppercase">
              World-class prep meets
            </h1>
            <h2 className="hero-text font-drama italic text-6xl md:text-7xl lg:text-[7rem] text-brand-ivory leading-[0.85] tracking-tight mb-12">
              Precision.
            </h2>
            <div className="hero-text flex flex-col sm:flex-row gap-6 items-center justify-center lg:justify-start">
              <Link to="/signup" className="btn-magnetic bg-brand-champagne text-brand-ivory text-lg font-sans font-bold px-8 py-4 rounded-full w-full sm:w-auto text-center border border-brand-champagne/50 shadow-2xl">
                Get Started
              </Link>
              <div className="flex items-center gap-3 text-brand-ivory/80 font-sans text-sm">
                <Play className="fill-brand-ivory/80 w-4 h-4" />
                <span>See the difference in 2 minutes</span>
              </div>
            </div>
          </div>

          {/* Right: Diced Image Grid */}
          <div className="hero-text flex-1 w-full max-w-md mx-auto lg:mx-0 lg:max-w-none">
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              {[
                { src: `${import.meta.env.BASE_URL}screenshots/caliber-xp.png`, alt: 'Practice question with XP rewards', warp: 'diced-br' },
                { src: `${import.meta.env.BASE_URL}screenshots/caliber-light-strategy.png`, alt: 'Reading passage question', warp: 'diced-bl' },
                { src: `${import.meta.env.BASE_URL}screenshots/Caliber-screen-3.png`, alt: 'SAT Strategy Guide', warp: 'diced-tr' },
                { src: `${import.meta.env.BASE_URL}screenshots/Caliber-screen-1.png`, alt: 'Progress dashboard with badges', warp: 'diced-tl' },
              ].map((shot, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-2xl ring-1 ring-white/10">
                  <img
                    src={shot.src}
                    alt={shot.alt}
                    className={`absolute inset-0 w-full h-full object-cover diced-image ${shot.warp}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ---------------- Features Interactive Functional Artifacts ---------------- */}
      <section id="features" className="py-32 px-6 bg-brand-ivory relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            <DiagnosticShuffler />
            <TelemetryTypewriter />
            <CursorProtocolScheduler />
          </div>
        </div>
      </section>

      {/* ---------------- Philosophy The Manifesto ---------------- */}
      <section id="philosophy" className="py-40 px-6 bg-brand-slate text-brand-ivory relative overflow-hidden philosophy-section">
        {/* Parallax organic texture */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-[0.10] mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600607688066-890987f18a86?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}
        />

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
          <p className="phil-line font-sans font-medium text-brand-ivory/50 text-xl md:text-2xl mb-8 tracking-wide">
            Most SAT prep focuses on: <span className="text-brand-ivory/80 line-through">answering 10,000 questions.</span>
          </p>
          <h2 className="phil-line font-drama italic text-5xl md:text-7xl leading-tight">
            We focus on: <span className="text-brand-champagne not-italic font-heading font-black underline decoration-4 underline-offset-[12px]">precision learning</span> that competes with a phone.
          </h2>
        </div>
      </section>

      {/* ---------------- Protocol Sticky Stacking Archive ---------------- */}
      <section id="protocol" className="bg-brand-obsidian text-brand-ivory pb-32 relative protocol-container">

        {/* Card 1 */}
        <div className="h-screen sticky top-0 flex items-center justify-center p-6">
          <div className="protocol-card-inner w-full max-w-4xl h-[70vh] bg-[#1C1C24] rounded-[3rem] border border-brand-ivory/10 p-12 flex flex-col justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10">
              <Activity className="w-96 h-96" strokeWidth={0.5} />
            </div>
            <div className="relative z-10 max-w-xl">
              <span className="font-mono text-brand-champagne text-lg font-bold block mb-4">01</span>
              <h3 className="font-heading font-bold text-5xl mb-6">Diagnostic Intelligence</h3>
              <p className="font-sans text-xl text-brand-ivory/70 leading-relaxed">
                The platform rapidly identifies exactly what you don't know, isolating the highest-leverage concepts holding your score back.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="h-screen sticky top-0 flex items-center justify-center p-6">
          <div className="protocol-card-inner w-full max-w-4xl h-[70vh] bg-[#15151A] rounded-[3rem] border border-brand-ivory/10 p-12 flex flex-col justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-10 flex flex-wrap w-64 gap-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-12 h-12 border border-brand-ivory/50 rounded-sm" />
              ))}
            </div>
            <div className="relative z-10 max-w-xl">
              <span className="font-mono text-brand-champagne text-lg font-bold block mb-4">02</span>
              <h3 className="font-heading font-bold text-5xl mb-6">Atomic Execution</h3>
              <p className="font-sans text-xl text-brand-ivory/70 leading-relaxed">
                Concepts are broken down into 5-minute interactive missions. Engage in micro-learning that fits perfectly between sports and homework.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="h-screen sticky top-0 flex items-center justify-center p-6">
          <div className="protocol-card-inner w-full max-w-4xl h-[70vh] bg-[#0A0D10] rounded-[3rem] border border-brand-ivory/20 p-12 flex flex-col justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 animate-pulse">
              <CheckCircle2 className="w-96 h-96" strokeWidth={0.5} />
            </div>
            <div className="relative z-10 max-w-xl">
              <span className="font-mono text-brand-champagne text-lg font-bold block mb-4">03</span>
              <h3 className="font-heading font-bold text-5xl mb-6">Endless Mastery</h3>
              <p className="font-sans text-xl text-brand-ivory/70 leading-relaxed">
                Powered by SM-2 spaced repetition, algorithms ensure long-term retention of weaknesses until they become second automated nature.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Membership / Pricing Get Started ---------------- */}
      <section className="py-32 px-6 bg-brand-ivory relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-[3rem] bg-brand-slate text-brand-ivory p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <h2 className="font-drama italic text-6xl md:text-7xl mb-6">Secure Your Advantage.</h2>
              <p className="font-sans text-lg text-brand-ivory/60 max-w-xl mx-auto mb-10">
                Join the digital instrument re-defining SAT prep. One lifetime price. No recurring charges.
              </p>

              <div className="flex flex-col items-center gap-6">
                <div className="bg-brand-obsidian/30 border border-brand-obsidian/50 px-6 py-2 rounded-full font-mono text-brand-champagne text-xl">
                  $49
                </div>
                <Link to="/signup" className="btn-magnetic bg-brand-champagne text-brand-ivory font-sans font-bold text-xl px-12 py-5 rounded-full inline-block">
                  Begin Protocol
                </Link>
                <div className="flex items-center gap-2 text-brand-ivory/40 font-mono text-xs uppercase tracking-widest mt-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-champagne animate-pulse" />
                  Slots Available
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="bg-[#0A0D10] text-brand-ivory rounded-t-[4rem] px-8 pt-20 pb-10 relative z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div>
            <span className="font-heading font-extrabold text-3xl tracking-tight block mb-2">Caliber.</span>
            <span className="font-sans text-brand-ivory/50 text-sm">World-class prep meets precision.</span>
          </div>
          <div className="flex flex-wrap gap-8 font-sans text-sm font-medium text-brand-ivory/60">
            <a href="#" className="link-lift hover:text-brand-champagne transition-colors">Methodology</a>
            <a href="#" className="link-lift hover:text-brand-champagne transition-colors">Privacy</a>
            <a href="#" className="link-lift hover:text-brand-champagne transition-colors">Terms</a>
            <a href="#" className="link-lift hover:text-brand-champagne transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3 bg-[#111815] px-4 py-2 rounded-full border border-brand-ivory/10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="font-mono text-xs uppercase tracking-wider text-brand-ivory/80">System Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
