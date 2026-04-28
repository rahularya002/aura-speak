import type { Metadata } from "next";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Check,
  Clock3,
  CreditCard,
  Crown,
  Gem,
  Layers3,
  MessageSquareText,
  Rocket,
  Wallet,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, usage-based pricing for ENB Avatars.",
  alternates: {
    canonical: "/pricing",
  },
};

const creatorPlanFeatures = ["Full platform access", "Basic AI Avatar included", "100 credits included"];

const creditPacks = [
  { name: "Starter", credits: 50, price: "Rs. 940" },
  { name: "Basic", credits: 100, price: "Rs. 1,880" },
  { name: "Standard", credits: 250, price: "Rs. 4,698", save: "5% SAVE" },
  { name: "Pro", credits: 550, price: "Rs. 9,396", save: "10% SAVE", bestValue: true },
  { name: "Elite", credits: 1200, price: "Rs. 18,792", save: "12% SAVE" },
];

const avatarAddons = [
  { name: "Advanced Avatar", price: "Rs. 9,396", note: "One-time payment" },
  { name: "Custom Human Avatar", price: "Rs. 28,188 - 56,376", note: "One-time payment" },
];

const billingFlow = [
  {
    title: "Start with Creator Plan",
    description: "Unlock full platform access and launch your first avatar quickly.",
    icon: Crown,
  },
  {
    title: "Use credits as you scale",
    description: "10 credits are consumed per minute of avatar interaction.",
    icon: Wallet,
  },
  {
    title: "Top up anytime",
    description: "Choose the right credit pack and continue without interruptions.",
    icon: Rocket,
  },
];

const faqItems = [
  {
    q: "Do credits expire?",
    a: "No. Credits never expire, so you can top up whenever needed and use them at your own pace.",
  },
  {
    q: "How is usage billed?",
    a: "Usage is billed at Rs. 188 per minute. Every interaction minute consumes 10 credits from your account.",
  },
  {
    q: "Can I start with only the Creator Plan?",
    a: "Yes. The Creator Plan includes 100 credits, which lets you begin immediately without buying a separate credit pack.",
  },
  {
    q: "Are avatar add-ons one-time charges?",
    a: "Yes. Advanced Avatar and Custom Human Avatar are one-time payments.",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <section className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm sm:p-10">
          <div className="pointer-events-none absolute -right-28 -top-28 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid gap-7 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <div className="space-y-4">
              <Badge className="w-fit">Pricing</Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Simple pricing. Powerful avatars.</h1>
              <p className="max-w-2xl text-muted-foreground">
                Start with a monthly plan, then scale with minute-based usage and flexible credit packs.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild>
                  <Link href="/chat">
                    <CreditCard className="h-4 w-4" />
                    Start Building
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl border bg-background/60 p-4 backdrop-blur">
                <p className="text-sm text-muted-foreground">Creator Plan</p>
                <p className="mt-1 text-2xl font-bold">Rs. 2,725</p>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>
              <div className="rounded-xl border bg-background/60 p-4 backdrop-blur">
                <p className="text-sm text-muted-foreground">Usage Pricing</p>
                <p className="mt-1 text-2xl font-bold">Rs. 188</p>
                <p className="text-xs text-muted-foreground">per minute</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {billingFlow.map((step, index) => (
            <Card key={step.title} className="relative overflow-hidden border-dashed">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline">Step {index + 1}</Badge>
                </div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              {index < billingFlow.length - 1 ? (
                <ArrowRight className="absolute -right-2 top-8 hidden h-4 w-4 text-muted-foreground md:block" />
              ) : null}
            </Card>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="border-primary/30 shadow-sm">
            <CardHeader>
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Crown className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Core Subscription</span>
              </div>
              <CardTitle>Creator Plan</CardTitle>
              <CardDescription>Monthly platform subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="text-3xl font-bold sm:text-4xl">
                Rs. 2,725 <span className="text-base font-medium text-muted-foreground">/ month</span>
              </div>
              <ul className="space-y-3 text-sm">
                {creatorPlanFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Usage Based</span>
              </div>
              <CardTitle>Usage Pricing</CardTitle>
              <CardDescription>Pay as your avatars interact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold sm:text-4xl">
                Rs. 188 <span className="text-base font-medium text-muted-foreground">/ minute</span>
              </div>
              <p className="text-sm text-muted-foreground">10 credits are consumed per minute of avatar interaction.</p>
            </CardContent>
          </Card>
        </section>

        <section id="credit-packs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Layers3 className="h-5 w-5 text-primary" />
              Flexible Credit Packs
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {creditPacks.map((pack) => (
              <Card
                key={pack.name}
                className={
                  pack.bestValue
                    ? "relative border-primary bg-primary/4 shadow-md ring-1 ring-primary/20"
                    : "transition-transform hover:-translate-y-0.5"
                }
              >
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pack.name}</CardTitle>
                    {pack.bestValue && (
                      <Badge className="gap-1">
                        <Gem className="h-3 w-3" />
                        Best Value
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-2xl font-semibold leading-none">{pack.credits}</p>
                    <p className="text-muted-foreground">credits</p>
                  </div>
                  <p className="text-xl font-semibold">{pack.price}</p>
                  {pack.save ? <Badge variant="secondary">{pack.save}</Badge> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Avatar Add-Ons</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {avatarAddons.map((addon) => (
              <Card key={addon.name} className="overflow-hidden transition-all hover:shadow-card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">{addon.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="text-2xl font-semibold">{addon.price}</p>
                  <p className="text-muted-foreground">{addon.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Card className="bg-secondary/40">
            <CardContent className="flex items-start gap-3 p-6">
              <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Credits never expire.</p>
                <p className="text-sm text-muted-foreground">Top up anytime and upgrade your avatar whenever you need.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/40">
            <CardContent className="flex items-start gap-3 p-6">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Secure payments.</p>
                <p className="text-sm text-muted-foreground">100% safe and encrypted payment flow.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Card className="border-primary/30 bg-card">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <MessageSquareText className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">FAQ</span>
              </div>
              <CardTitle className="text-2xl">Pricing Questions</CardTitle>
              <CardDescription>Everything teams usually ask before getting started.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, idx) => (
                  <AccordionItem key={item.q} value={`faq-${idx}`}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent>{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-primary/40">
            <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
            <CardHeader className="relative">
              <Badge className="w-fit">Launch Offer</Badge>
              <CardTitle className="text-2xl">Build now, scale later</CardTitle>
              <CardDescription>
                Start with the Creator Plan and expand with minute-based usage and credit top-ups.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="rounded-xl border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">Starting monthly cost</p>
                <p className="text-3xl font-bold">Rs. 2,725</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="gap-2">
                  <Link href="/chat">
                    Start Building
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="#credit-packs">Compare packs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Ready to launch your avatar?</h3>
              <p className="text-sm text-muted-foreground">Start with the Creator Plan and scale with usage.</p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/chat">
                  <CreditCard className="h-4 w-4" />
                  Get Started
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
