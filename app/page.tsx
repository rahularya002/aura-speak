"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bolt,
  Code2,
  Film,
  Languages,
  Mic,
  Network,
  Terminal,
  Brain,
} from "lucide-react";
import { motion } from "framer-motion";

const sectionReveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.22 },
};

export default function LandingPage() {
  return (
    <>
      <div className="min-h-screen bg-stitch-background text-on-background selection:bg-primary-fixed selection:text-on-primary-fixed">
        {/*  TopNavBar Shared Component  */}
        <header className="z-50 sticky top-6 px-4">
          <nav className="bg-white/70 backdrop-blur-3xl rounded-full flex justify-between items-center max-w-5xl mx-auto px-6 py-3 w-full shadow-[0_8px_32px_0_rgba(45,51,53,0.06)] font-headline tracking-tight font-semibold">
            <div className="text-xl font-bold tracking-tighter text-slate-900">ENB Avatars</div>
            <Link
              href="/overview"
              className="bg-stitch-primary text-on-primary px-6 py-2 rounded-full text-sm font-bold scale-95 active:scale-90 transition-transform"
            >
              Get Started
            </Link>
          </nav>
        </header>
        <main>
          {/*  Hero Section  */}
          <motion.section
            className="relative pt-24 pb-32 px-6 overflow-hidden"
            {...sectionReveal}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                className="z-10"
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55 }}
              >
                <span className="inline-block py-1 px-4 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold tracking-widest uppercase mb-6">Next Gen Avatars</span>
                <h1 className="text-6xl md:text-7xl font-headline font-extrabold tracking-tighter leading-[1.1] text-on-background mb-8">
                  The Studio for <span className="text-stitch-primary italic">Digital Presence.</span>
                </h1>
                <p className="text-lg text-on-surface-variant max-w-lg mb-10 leading-relaxed">
                  Design, deploy, and converse with high-fidelity AI avatars that understand your brand&apos;s unique knowledge base. Experience zero-latency human interaction.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="px-8 py-4 bg-stitch-primary text-on-primary rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-stitch-primary/20 transition-all">Launch Studio</button>
                  <button className="px-8 py-4 bg-surface-container-high text-on-surface rounded-xl font-bold text-lg hover:bg-surface-container-highest transition-colors">Book Demo</button>
                </div>
              </motion.div>
              {/*  High-Fidelity UI Preview  */}
              <motion.div
                className="relative group"
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: 0.08 }}
              >
                <div className="absolute -inset-4 bg-primary-container/20 rounded-[2rem] blur-3xl -z-10"></div>
                <div className="bg-surface-container-lowest rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-white/50 aspect-[4/3] flex flex-col">
                  {/*  UI Header  */}
                  <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-error"></div>
                      <div className="w-3 h-3 rounded-full bg-secondary-container"></div>
                      <div className="w-3 h-3 rounded-full bg-tertiary-container"></div>
                    </div>
                    <div className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">Live Interaction: Studio Mode</div>
                  </div>
                  {/*  UI Main  */}
                  <div className="flex-1 grid grid-cols-5 gap-0">
                    {/*  Sidebar Chat  */}
                    <div className="col-span-2 bg-surface-container-low p-6 flex flex-col gap-4">
                      <div className="bg-surface-container-lowest p-3 rounded-xl rounded-bl-none shadow-sm text-sm">Hello! How can I help you with the Enterprise integration today?</div>
                      <div className="bg-stitch-primary/10 p-3 rounded-xl rounded-br-none text-sm self-end">Explain the real-time latency optimization for 4K video.</div>
                      <div className="bg-surface-container-lowest p-3 rounded-xl rounded-bl-none shadow-sm text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-stitch-primary rounded-full animate-pulse"></span>
                        <span>Typing...</span>
                      </div>
                      <div className="mt-auto pt-4">
                        <div className="bg-surface-container-highest rounded-lg px-4 py-2 text-xs text-on-surface-variant flex justify-between">
                          <span>Latency: 140ms</span>
                          <span>Bitrate: 8.4 Mbps</span>
                        </div>
                      </div>
                    </div>
                    {/*  Avatar Viewport  */}
                    <div className="col-span-3 relative">
                      <img className="w-full h-full object-cover" data-alt="ultra realistic 3D human avatar face with soft studio lighting and neutral background for professional AI interaction" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmndUhv7meShr-6YkVTsyZEO_mxrL2ILGM955d0VlGd2QTQiqo-FrkmKdc84Zewe4VlLq9zX8ES9qBOyc6R5A9dAnVbQMP8u45YSu1Z1C4u1t2n2FAZW_LYZbohj3srTRoKJ1PV52TLeb23rvv8jtDAx9zmw5GqYXP164qPH8AsqzgAzlkZCPcOgae73J-Uk3pRd27pcMUreqFReOsiJpp5p9cJNUrKy75oLiArWzE4SyV2nmjueY2R1qCoB7B69wM97mKCq6Mp9U" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                        <div className="bg-white/80 backdrop-blur-xl p-2 rounded-lg flex items-center gap-2 shadow-lg">
                          <Mic className="h-4 w-4 text-stitch-primary" />
                          <div className="w-24 h-1 bg-surface-container-high rounded-full overflow-hidden">
                            <div className="w-1/2 h-full bg-stitch-primary"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.section>
          {/*  Feature Bento Grid  */}
          <motion.section
            className="py-24 bg-surface"
            {...sectionReveal}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-7xl mx-auto px-6">
              <div className="mb-16 max-w-2xl">
                <h2 className="text-4xl font-headline font-bold mb-4 tracking-tight">Engineered for the Avatars.</h2>
                <p className="text-on-surface-variant">A suite of tools designed to bridge the gap between artificial logic and human empathy.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-full md:h-[600px]">
                {/*  Large Card: Smart Knowledge  */}
                <motion.div
                  className="md:col-span-2 md:row-span-2 bg-surface-container-low rounded-3xl p-8 flex flex-col justify-between group hover:bg-surface-container transition-colors duration-500"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45 }}
                  whileHover={{ y: -6 }}
                >
                  <div>
                    <div className="w-12 h-12 bg-primary-container rounded-2xl flex items-center justify-center mb-6">
                      <Brain className="h-5 w-5 text-on-primary-container" />
                    </div>
                    <h3 className="text-2xl font-headline font-bold mb-4">Smart Knowledge-Based AI</h3>
                    <p className="text-on-surface-variant leading-relaxed">Upload documents, sync wikis, or scrape URLs. Your avatar becomes an expert on your specific domain in seconds.</p>
                  </div>
                  <div className="mt-8 bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        className="w-2 h-2 rounded-full bg-green-500"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider opacity-60">Knowledge Sources Synchronized</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-stitch-primary/30"
                          initial={{ width: "0%" }}
                          whileInView={{ width: "88%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                      <div className="h-1.5 w-3/4 bg-surface-container-high rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-stitch-primary/25"
                          initial={{ width: "0%" }}
                          whileInView={{ width: "62%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.1, delay: 0.1 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
                {/*  Medium Card: Real-Time Avatar  */}
                <motion.div
                  className="md:col-span-2 bg-secondary-container rounded-3xl p-8 flex flex-col justify-between hover:bg-secondary-fixed transition-colors overflow-hidden relative"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: 0.05 }}
                  whileHover={{ y: -6 }}
                >
                  <motion.div
                    className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-white/20"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 3.2, repeat: Infinity }}
                  />
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-headline font-bold text-on-secondary-container">Real-Time Talking Avatar</h3>
                      <Film className="h-5 w-5 text-on-secondary-container" />
                    </div>
                    <p className="text-on-secondary-container/80 mt-2 text-sm">Industry leading lip-sync technology with sub-200ms latency.</p>
                  </div>
                  <div className="flex gap-2 mt-4 overflow-hidden relative z-10">
                    <div className="px-4 py-1.5 bg-on-secondary/10 rounded-full text-xs font-semibold text-on-secondary-container">High Def 4K</div>
                    <div className="px-4 py-1.5 bg-on-secondary/10 rounded-full text-xs font-semibold text-on-secondary-container">Emotional Nuance</div>
                  </div>
                </motion.div>
                {/*  Small Card: BYOM  */}
                <motion.div
                  className="bg-tertiary-container rounded-3xl p-6 flex flex-col justify-between hover:bg-tertiary-fixed transition-colors"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                  whileHover={{ y: -6 }}
                >
                  <Terminal className="h-8 w-8 text-on-tertiary-container" />
                  <div className="mb-2 rounded-lg bg-on-tertiary-container/10 px-2 py-1 text-[11px] font-mono text-on-tertiary-container/75">
                    llama3 serve_
                  </div>
                  <h3 className="text-lg font-headline font-bold text-on-tertiary-container">Bring Your Own Model</h3>
                </motion.div>
                {/*  Small Card: Easy Embedding  */}
                <motion.div
                  className="bg-surface-container-highest rounded-3xl p-6 flex flex-col justify-between hover:bg-surface-container transition-colors"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: 0.15 }}
                  whileHover={{ y: -6 }}
                >
                  <Code2 className="h-8 w-8 text-on-surface-variant" />
                  <div className="mb-2 space-y-1">
                    <motion.div
                      className="h-1.5 w-16 rounded-full bg-on-surface-variant/30"
                      animate={{ width: ["4rem", "5.2rem", "4rem"] }}
                      transition={{ duration: 2.2, repeat: Infinity }}
                    />
                    <div className="h-1.5 w-10 rounded-full bg-on-surface-variant/20" />
                  </div>
                  <h3 className="text-lg font-headline font-bold">Easy Embedding</h3>
                </motion.div>
              </div>
            </div>
          </motion.section>
          {/*  How It Works  */}
          <motion.section
            className="py-24 bg-surface-container-lowest"
            {...sectionReveal}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-20">
                <h2 className="text-4xl font-headline font-extrabold mb-4">From Blueprint to Presence.</h2>
                <p className="text-on-surface-variant max-w-xl mx-auto">Three steps to deploying a world-class AI experience across your platform.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-12">
                <div className="relative">
                  <div className="text-[120px] font-headline font-black text-surface-container-high absolute -top-16 -left-4 -z-10 opacity-50 select-none">01</div>
                  <h4 className="text-xl font-bold mb-4">Design the Persona</h4>
                  <p className="text-on-surface-variant leading-relaxed">Choose from our gallery of high-fidelity models or upload a custom character. Fine-tune voice attributes and personality traits.</p>
                </div>
                <div className="relative">
                  <div className="text-[120px] font-headline font-black text-surface-container-high absolute -top-16 -left-4 -z-10 opacity-50 select-none">02</div>
                  <h4 className="text-xl font-bold mb-4">Ingest Knowledge</h4>
                  <p className="text-on-surface-variant leading-relaxed">Connect your APIs, documentation, or databases. Our RAG engine processes information to ensure accurate, context-aware responses.</p>
                </div>
                <div className="relative">
                  <div className="text-[120px] font-headline font-black text-surface-container-high absolute -top-16 -left-4 -z-10 opacity-50 select-none">03</div>
                  <h4 className="text-xl font-bold mb-4">Deploy Anywhere</h4>
                  <p className="text-on-surface-variant leading-relaxed">Use our SDK to embed the avatar into your web, mobile, or VR application. Scale to millions of simultaneous sessions effortlessly.</p>
                </div>
              </div>
            </div>
          </motion.section>
          {/*  Product Experience (Split Layout)  */}
          <motion.section
            className="py-24 bg-surface-container-low overflow-hidden"
            {...sectionReveal}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-24 items-center">
                <div className="relative h-[500px] bg-surface-container-lowest rounded-3xl overflow-hidden shadow-xl">
                  <img className="w-full h-full object-cover" data-alt="Modern analytics dashboard showing AI performance metrics, user engagement charts, and latency graphs with a clean minimalist UI" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnvYwK8ovGE-nAu2Eh279o30bKuN6RRkbzVxCFhShH99Y-04ObNwr0mkxlu0yi0D53oqcjiBRk5dFThYtI3TUpELdaDO_AmHm7XH2naZktUK8sW_f2U_lQFMy24FhmujUsbwUGW5ntB6zUe7887mmLuatAwGhCvq3XNerLuSIG-DZ4huOGtXDOqcls4GNl5OAmgHzMDuu8MUOgysHHsfE52_2jluQ9vuoLgiiVyP_vlSrWtexJ3SkuCKMbJxGQylQNLDz7bsgZsEM" />
                  <div className="absolute inset-0 bg-stitch-primary/10 flex items-center justify-center">
                    <div className="p-8 bg-white/90 backdrop-blur-xl rounded-2xl max-w-xs shadow-2xl">
                      <h5 className="font-bold mb-2">Enterprise Ready</h5>
                      <p className="text-sm text-on-surface-variant">Real-time performance metrics and conversation logs managed in one sleek dashboard.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-4xl font-headline font-bold mb-8">Multi-Assistant Support for Global Teams.</h2>
                  <div className="space-y-8">
                    <div className="flex gap-6">
                      <div className="w-12 h-12 flex-shrink-0 bg-primary-fixed rounded-xl flex items-center justify-center">
                        <Languages className="h-5 w-5 text-on-primary-fixed" />
                      </div>
                      <div>
                        <h5 className="font-bold mb-1">Global Scale</h5>
                        <p className="text-on-surface-variant text-sm">Deploy avatars that speak 40+ languages natively with local dialect support.</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="w-12 h-12 flex-shrink-0 bg-secondary-fixed rounded-xl flex items-center justify-center">
                        <Bolt className="h-5 w-5 text-on-secondary-fixed" />
                      </div>
                      <div>
                        <h5 className="font-bold mb-1">Real-Time Streaming</h5>
                        <p className="text-on-surface-variant text-sm">Our proprietary streaming protocol ensures zero stuttering and consistent frame rates.</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="w-12 h-12 flex-shrink-0 bg-tertiary-fixed rounded-xl flex items-center justify-center">
                        <Network className="h-5 w-5 text-on-tertiary-fixed" />
                      </div>
                      <div>
                        <h5 className="font-bold mb-1">Ecosystem Sync</h5>
                        <p className="text-on-surface-variant text-sm">Connect with Slack, Salesforce, and Zendesk to keep your entire stack updated.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
          {/*  Use Cases  */}
          <motion.section
            className="py-24 bg-surface"
            {...sectionReveal}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex justify-between items-end mb-16">
                <div>
                  <h2 className="text-4xl font-headline font-bold">Limitless Presence.</h2>
                  <p className="text-on-surface-variant mt-2">Where ENB Avatars makes a difference.</p>
                </div>
                <div className="hidden md:flex gap-4">
                  <button className="p-3 bg-surface-container-high rounded-full hover:bg-surface-container-highest transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <button className="p-3 bg-stitch-primary text-on-primary rounded-full hover:shadow-lg transition-all">
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="group cursor-pointer">
                  <div className="rounded-3xl overflow-hidden aspect-video mb-6 relative">
                    <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Customer support office with modern tech, soft lighting, professional and calm atmosphere" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAU5w8urRWf-KSt9UIXb4n_R2IuK0gBBIVy4dE-xxS7ABgY6egLqGEj4d_nzzRd1QpTYO9uiomTcra3izY9J4lW3qRolO4NWExbUI6P6jqulWGR1kAVMwCh3K5-r5fLtMalijHHRGqqOkFXqjs9I_cQb9Hrw5kMXemWztdQrkyPd-iT6WWsN35h2od2c_bRzJfXycOLW680X8lYL9PzfkFzsot0DrbhZzX33oFkaWVuEFZ0Se4z0AqHfXp3mffq9vCKlCrO0jh7zdI" />
                    <div className="absolute inset-0 bg-on-background/10"></div>
                  </div>
                  <h4 className="text-xl font-bold mb-2">Customer Experience</h4>
                  <p className="text-sm text-on-surface-variant">24/7 human-like support that handles complex queries with brand-accurate empathy.</p>
                </div>
                <div className="group cursor-pointer">
                  <div className="rounded-3xl overflow-hidden aspect-video mb-6 relative">
                    <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Digital classroom setting with students and advanced technological screens for immersive learning" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzwW2GJj-Ba8q0OVTdsKo6xmoD5i7a0sexln7nXL3gB9H3pYu1G2ygr9cNfkEGcgAGvqQUBgC-HbfBS78QWUMg-SbEtT4ZWg_jkkY9mHS_W_NA7CSEmkqx6FAIKQEltS7OpYYcPe9I30DfO3P9o_XwKJM_rLxU3ZqeXTaPtox11TUnfJMv9sVvBhx_CzBtpzpyRurPZaXE7q_0CloQdonNRHhWCn3GMlZb61y_hhGp3j21IxlsnjlxjOVUjuMXlMP06moI888EbyM" />
                    <div className="absolute inset-0 bg-on-background/10"></div>
                  </div>
                  <h4 className="text-xl font-bold mb-2">Immersive Learning</h4>
                  <p className="text-sm text-on-surface-variant">Interactive AI tutors that provide personalized education experiences at scale.</p>
                </div>
                <div className="group cursor-pointer">
                  <div className="rounded-3xl overflow-hidden aspect-video mb-6 relative">
                    <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Virtual luxury concierge service representation with high-end digital interface and sleek design" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCprtBCDSepawAxR6kCJtT1NwPuKPu5R2xmsJ6DYandyAYKhOqnUskeXLw4dme6gQi9PTynGStf22rJel4qmFiWeAmyPL0bdZF23fUUZWANkjptYDFmJpCTrBuNhFyMWRZXSxSUrG0R-Ovs4a2KO8b-KEiN0-MYc6nVWIdf8acp0VGMmMeeLs6x4etaUHvuz8Gn9Bo4fCRHw2_usyBAcC6zeC78xN9fM9a0UwQlSdNLTSLHQ8Dk7hPlEoNex6rNeN9LySh3K4kDanA" />
                    <div className="absolute inset-0 bg-on-background/10"></div>
                  </div>
                  <h4 className="text-xl font-bold mb-2">Sales &amp; Concierge</h4>
                  <p className="text-sm text-on-surface-variant">Luxury retail assistants that guide customers through complex product catalogs.</p>
                </div>
              </div>
            </div>
          </motion.section>
          {/*  Why This Product (Comparison)  */}
          <motion.section
            className="py-24 bg-surface-container-lowest"
            {...sectionReveal}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-4xl mx-auto px-6">
              <div className="bg-surface-container-low rounded-[2rem] p-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/20 blur-[100px] -z-10"></div>
                <h2 className="text-3xl font-headline font-bold mb-12 text-center">Beyond Standard AI.</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 pb-6 border-b border-outline-variant/10">
                    <div className="text-sm font-bold uppercase tracking-widest opacity-40">Feature</div>
                    <div className="text-sm font-bold uppercase tracking-widest text-stitch-primary text-center">ENB Avatars</div>
                  </div>
                  <div className="grid grid-cols-2 py-2 items-center">
                    <div className="font-medium text-on-surface">Response Latency</div>
                    <div className="text-center font-bold text-stitch-primary">&lt; 200ms</div>
                  </div>
                  <div className="grid grid-cols-2 py-2 items-center">
                    <div className="font-medium text-on-surface">Visual Fidelity</div>
                    <div className="text-center font-bold text-stitch-primary">4K HDR</div>
                  </div>
                  <div className="grid grid-cols-2 py-2 items-center">
                    <div className="font-medium text-on-surface">Knowledge Retrieval</div>
                    <div className="text-center font-bold text-stitch-primary">Dynamic RAG</div>
                  </div>
                  <div className="grid grid-cols-2 py-2 items-center">
                    <div className="font-medium text-on-surface">Emotion Synthesis</div>
                    <div className="text-center font-bold text-stitch-primary">Included</div>
                  </div>
                  <div className="grid grid-cols-2 py-2 items-center">
                    <div className="font-medium text-on-surface">Language Support</div>
                    <div className="text-center font-bold text-stitch-primary">40+ Core</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
          {/*  CTA Section  */}
          <motion.section
            className="py-32 px-6"
            {...sectionReveal}
            transition={{ duration: 0.55 }}
          >
            <div className="max-w-5xl mx-auto bg-stitch-primary rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>
              <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-on-primary mb-6 relative z-10">Ready to build your <span className="italic font-normal">digital double?</span></h2>
              <p className="text-on-primary/80 text-lg mb-12 max-w-xl mx-auto relative z-10">Join teams redefining human connection with ENB Avatars.</p>
              <div className="flex flex-col md:flex-row gap-4 justify-center relative z-10">
                <Link href="/chat" className="px-10 py-4 bg-on-primary text-stitch-primary rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl">Get Started Free</Link>
                <button className="px-10 py-4 bg-transparent border-2 border-on-primary/20 text-on-primary rounded-xl font-bold text-lg hover:bg-on-primary/10 transition-colors">Contact Sales</button>
              </div>
            </div>
          </motion.section>
        </main>
        {/*  Footer Shared Component  */}
        <footer className="bg-slate-50 py-12 px-8 font-body text-sm tracking-wide">
          <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-7xl mx-auto gap-6">
            <div className="font-headline font-bold text-slate-900 text-lg">ENB Avatars</div>
            <div className="flex flex-wrap justify-center gap-8 text-slate-600">
              <a className="hover:text-slate-900 underline-offset-4 hover:underline transition-opacity opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
              <a className="hover:text-slate-900 underline-offset-4 hover:underline transition-opacity opacity-80 hover:opacity-100" href="#">Terms of Service</a>
              <a className="hover:text-slate-900 underline-offset-4 hover:underline transition-opacity opacity-80 hover:opacity-100" href="#">Contact</a>
              <a className="hover:text-slate-900 underline-offset-4 hover:underline transition-opacity opacity-80 hover:opacity-100" href="#">Status</a>
            </div>
            <div className="text-slate-600 font-medium">
              © 2026 ENB Avatars. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
