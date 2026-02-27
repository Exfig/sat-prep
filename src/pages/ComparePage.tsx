import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, X, ArrowRight, ShieldCheck, HelpCircle, CheckCircle2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const ComparePage: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.scrollTo(0, 0);

        const ctx = gsap.context(() => {
            // Setup Navbar Morphing
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

            // Engineer the Hero (Halo Effect)
            gsap.from('.hero-elem', {
                y: 50,
                opacity: 0,
                duration: 1.2,
                stagger: 0.1,
                ease: 'power3.out',
                delay: 0.2
            });

            // Comparison Matrix Rows (Cognitive Fluency + Peak-End Reveal)
            gsap.from('.matrix-row', {
                y: 20,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.matrix-container',
                    start: 'top 80%'
                }
            });

            // Value Cards Stagger
            gsap.from('.value-card', {
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.value-cards-container',
                    start: 'top 80%'
                }
            });

        }, containerRef);
        return () => ctx.revert();
    }, []);

    const matrixFeatures = [
        { name: 'Spaced Repetition (SM-2)', us: true, tutor: false, apps: false, books: false },
        { name: 'Live Deep-Dive Feedback', us: true, tutor: true, apps: 'partial', books: false },
        { name: 'Boss Fights & XP', us: true, tutor: false, apps: false, books: false },
        { name: 'Daily Progress Streaks', us: true, tutor: false, apps: true, books: false },
        { name: 'True Adaptive Mock Tests', us: true, tutor: 'partial', apps: true, books: false },
        { name: 'Built-in Desmos Calculator', us: true, tutor: false, apps: true, books: false },
        { name: 'Unlimited Lifetime Access', us: true, tutor: false, apps: false, books: true },
        { name: 'Cost', us: '$49', tutor: '~$100/hr', apps: '~$30/mo', books: '~$25' }
    ];

    return (
        <div ref={containerRef} className="bg-brand-ivory min-h-screen text-brand-slate antialiased overflow-hidden selection:bg-brand-champagne/20 selection:text-brand-obsidian">
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-center pointer-events-none">
                <div className="nav-wrapper pointer-events-auto flex items-center justify-between transition-all duration-500 rounded-full px-6 py-3 w-full max-w-5xl border border-transparent">
                    <div className="flex items-center gap-3 text-brand-ivory nav-text-color transition-colors duration-500">
                        <span className="font-heading font-extrabold text-xl tracking-tight">Caliber.</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 font-sans font-medium text-sm text-brand-ivory nav-text-color transition-colors duration-500">
                        <Link to="/" className="link-lift">Home</Link>
                        <a href="#matrix" className="link-lift">Compare</a>
                        <a href="#faq" className="link-lift">FAQ</a>
                        <Link to="/login" className="link-lift opacity-80 hover:opacity-100">Login</Link>
                    </div>
                    <div className="pointer-events-auto">
                        <Link to="/signup" className="btn-magnetic bg-brand-champagne text-brand-ivory font-sans font-bold text-sm px-5 py-2.5 rounded-full inline-flex items-center">
                            <span>Get Started</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <header className="relative w-full min-h-[90vh] bg-brand-obsidian flex items-center justify-center pt-32 pb-20 overflow-hidden">
                <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30 mix-blend-overlay scale-105"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600607688066-890987f18a86?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-brand-obsidian via-brand-obsidian/90 to-brand-ivory" />

                <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center">
                    <p className="hero-elem font-mono text-brand-champagne tracking-widest uppercase text-sm font-bold mb-6 flex items-center justify-center gap-3">
                        <span className="w-12 h-px bg-brand-champagne/30" />
                        The Definitive Choice
                        <span className="w-12 h-px bg-brand-champagne/30" />
                    </p>
                    <h1 className="hero-elem font-drama italic text-6xl md:text-8xl text-brand-slate leading-[0.9] tracking-tight mb-8">
                        You only test once. <br />
                        <span className="text-brand-obsidian not-italic font-heading font-black">Prepare correctly.</span>
                    </h1>
                    <p className="hero-elem font-sans text-xl text-brand-obsidian/80 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        Every week without a plan is a week your student isn't improving. Compare Caliber against traditional methods and see why smart parents refuse to pay by the hour.
                    </p>
                    <div className="hero-elem">
                        <a href="#matrix" className="btn-magnetic bg-brand-slate text-brand-ivory text-lg font-sans font-bold px-8 py-4 rounded-full inline-block shadow-xl group border border-brand-slate/20">
                            View Comparison
                            <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>
            </header>

            <section id="matrix" className="py-24 px-6 relative z-20">
                <div className="max-w-6xl mx-auto">
                    <div className="matrix-container bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-brand-slate/5">
                        <div className="grid grid-cols-5 gap-4 pb-6 border-b border-brand-slate/10 text-sm md:text-base">
                            <div className="col-span-2 font-heading font-bold text-gray-400 uppercase tracking-wider pl-4">Features</div>
                            <div className="text-center font-heading font-black text-brand-obsidian text-xl">Caliber</div>
                            <div className="text-center font-heading font-bold text-brand-slate/40 pt-1">Human Tutors</div>
                            <div className="text-center font-heading font-bold text-brand-slate/40 pt-1">Generic Apps</div>
                        </div>

                        <div className="divide-y divide-brand-slate/5">
                            {matrixFeatures.map((feat, i) => (
                                <div key={i} className="matrix-row grid grid-cols-5 gap-4 py-5 hover:bg-brand-ivory/30 transition-colors rounded-xl px-4 items-center group">
                                    <div className="col-span-2 font-sans font-medium text-brand-slate group-hover:text-brand-obsidian transition-colors">
                                        {feat.name}
                                    </div>

                                    {/* Caliber Column */}
                                    <div className="flex justify-center items-center">
                                        {feat.us === true ? (
                                            <div className="w-8 h-8 rounded-full bg-brand-obsidian/10 flex items-center justify-center">
                                                <Check className="text-brand-obsidian w-5 h-5 stroke-[3]" />
                                            </div>
                                        ) : (
                                            <span className="font-mono font-bold text-lg text-brand-obsidian">{feat.us}</span>
                                        )}
                                    </div>

                                    {/* Tutors Column */}
                                    <div className="flex justify-center items-center opacity-40">
                                        {feat.tutor === true ? <Check className="w-5 h-5" /> :
                                            feat.tutor === false ? <X className="w-5 h-5" /> :
                                                feat.tutor === 'partial' ? <span className="text-xl leading-none">-</span> :
                                                    <span className="font-mono text-sm">{feat.tutor}</span>}
                                    </div>

                                    {/* Apps Column */}
                                    <div className="flex justify-center items-center opacity-40">
                                        {feat.apps === true ? <Check className="w-5 h-5" /> :
                                            feat.apps === false ? <X className="w-5 h-5" /> :
                                                feat.apps === 'partial' ? <span className="text-xl leading-none">-</span> :
                                                    <span className="font-mono text-sm">{feat.apps}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 text-center">
                            <p className="font-drama italic text-3xl text-brand-slate/80">Only one combines learning science and gamification for under $50.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 px-6">
                <div className="value-cards-container max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
                    <div className="value-card clay-card p-10 rounded-[2.5rem] bg-brand-ivory/80 border border-brand-slate/5 hover:-translate-y-2 transition-transform duration-500">
                        <h3 className="font-heading font-bold text-2xl mb-4 text-brand-slate">They'll Actually Remember</h3>
                        <p className="font-sans text-brand-slate/70 leading-relaxed mb-6">
                            The spaced repetition system (the same science behind medical school flashcards) schedules reviews right before your child would forget.
                        </p>
                        <div className="font-mono text-xs text-brand-champagne font-bold uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-champagne animate-pulse" />
                            SM-2 Algorithm Active
                        </div>
                    </div>

                    <div className="value-card clay-card p-10 rounded-[2.5rem] bg-brand-slate border border-brand-slate/5 text-brand-ivory hover:-translate-y-2 transition-transform duration-500">
                        <h3 className="font-heading font-bold text-2xl mb-4">They'll Want To Study</h3>
                        <p className="font-sans text-brand-ivory/60 leading-relaxed mb-6">
                            My daughter tried Khan Academy and quit. Why is this different? Boss Fights, XP levels, 38+ badges, and quests turn SAT prep into something that doesn't feel like homework.
                        </p>
                        <div className="font-mono text-xs text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Gamification Layer
                        </div>
                    </div>

                    <div className="value-card clay-card p-10 rounded-[2.5rem] bg-brand-ivory/80 border border-brand-slate/5 hover:-translate-y-2 transition-transform duration-500">
                        <h3 className="font-heading font-bold text-2xl mb-4 text-brand-slate">Real Mock Tests</h3>
                        <p className="font-sans text-brand-slate/70 leading-relaxed mb-6">
                            Full adaptive mocks simulate the real SAT — 98 questions, 134 minutes, dynamic difficulty, scoring 400–1600. Every detail identical to the real digital SAT.
                        </p>
                        <div className="font-mono text-xs text-brand-obsidian font-bold uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            No Surprises
                        </div>
                    </div>
                </div>
            </section>

            <section id="faq" className="py-32 px-6 bg-white relative">
                <div className="max-w-3xl mx-auto">
                    <h2 className="font-heading font-black text-4xl mb-12 text-center">Plain English FAQ</h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "Is it a subscription? Will I get charged again?",
                                a: "No. One-time payment ($49). No subscription, no recurring charges, no expiration date. You pay once, your child has access forever."
                            },
                            {
                                q: "Are these real SAT questions?",
                                a: "Yes. Every question in Caliber is a real question that appeared on an actual SAT test in the last 3 years."
                            },
                            {
                                q: "Does it work on phones?",
                                a: "Yes. Caliber works on any device with a modern browser — phone, tablet, laptop. Progress syncs automatically via the cloud."
                            },
                            {
                                q: "Why is it only $49? Is it actually good?",
                                a: "Caliber is software — no tutors to pay, no classrooms to rent. We pass that savings to you while providing superior learning science."
                            }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-brand-ivory/30 hover:bg-brand-ivory/70 transition-colors cursor-pointer group border border-brand-slate/5">
                                <div className="flex justify-between items-center mb-3">
                                    <h5 className="font-heading font-bold text-xl pr-8 text-brand-slate">{item.q}</h5>
                                    <HelpCircle className="text-brand-slate/20 group-hover:text-brand-champagne transition-colors flex-shrink-0" size={24} />
                                </div>
                                <p className="font-sans text-brand-slate/60 leading-relaxed text-lg">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-32 px-6 bg-brand-ivory">
                <div className="max-w-5xl mx-auto">
                    <div className="rounded-[4rem] bg-[#0A0E0C] text-brand-ivory p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-obsidian/20 rounded-full blur-[100px] -mr-48 -mt-48" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-champagne/10 rounded-full blur-[100px] -ml-48 -mb-48" />

                        <div className="relative z-10">
                            <h2 className="font-drama italic text-5xl md:text-7xl mb-6">Stop Agonizing. Start Preparing.</h2>
                            <p className="font-sans text-xl text-brand-ivory/60 max-w-2xl mx-auto mb-12">
                                Join the digital instrument re-defining SAT prep. Less than the cost of test registration itself.
                            </p>

                            <div className="flex flex-col items-center gap-6">
                                <Link to="/signup" className="btn-magnetic bg-brand-champagne text-brand-ivory font-sans font-bold text-xl px-12 py-5 rounded-full inline-block shadow-xl shadow-brand-champagne/20">
                                    Secure Lifetime Access — $49
                                </Link>
                                <p className="font-mono text-xs text-brand-ivory/40 uppercase tracking-widest">
                                    No subscriptions. No tricks.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-12 px-6 border-t border-brand-slate/10 bg-brand-ivory font-sans">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <span className="font-heading font-extrabold text-2xl tracking-tight text-brand-slate">Caliber.</span>
                    </div>
                    <div className="flex gap-10 text-sm font-medium text-brand-slate/50">
                        <a href="#" className="link-lift hover:text-brand-slate">Methodology</a>
                        <a href="#" className="link-lift hover:text-brand-slate">Privacy</a>
                        <a href="#" className="link-lift hover:text-brand-slate">Terms</a>
                        <a href="mailto:support@topscore.school" className="link-lift hover:text-brand-slate">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ComparePage;
