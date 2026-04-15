/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Shield, Zap, Scale, CheckCircle2, ArrowRight, FileText } from "lucide-react";

export default function LandingPage() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Shield className="h-7 w-7 text-blue-600" />
              <Zap className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Tribune
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Sign in
            </Link>
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">
              <Link href="/intake">
                Start Your Case <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-24 px-4">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold">Intelligent Legal Negotiation Engine</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            Your landlord had<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">
              30 days.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto font-medium">
            We strategically negotiate your security deposit recovery using Connecticut law.
          </p>

          <p className="text-lg text-blue-200 mb-10 max-w-2xl mx-auto">
            Powered by legal strategy algorithms + human review. <strong className="text-white">We handle everything.</strong> You pay 10% only if we win.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Button
              asChild
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-6 font-bold shadow-2xl hover:shadow-blue-500/50 transition-all"
            >
              <Link href="/intake">
                Start Your Case Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 text-lg px-8 py-6 font-bold"
            >
              <Link href="#power">See Our Power</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span>10% contingency fee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span>No recovery, no fee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span>Average recovery: 4-8 weeks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Not a Law Firm - Prominent Disclaimer as Feature */}
      <section className="py-12 px-4 bg-slate-900 text-white border-y-4 border-yellow-400">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Scale className="h-6 w-6 text-yellow-400" />
            <h3 className="text-2xl font-bold">Legal Information Service — Not a Law Firm</h3>
          </div>
          <p className="text-lg text-slate-300 mb-4">
            Tribune is a <strong className="text-white">document preparation and negotiation strategy service</strong>.
            We provide legal information and draft correspondence based on Connecticut statute. You sign all letters as the sender.
          </p>
          <p className="text-slate-400">
            <strong className="text-white">This means:</strong> No lawyer fees. No hourly billing. No court appearances (unless you choose small claims).
            Just intelligent, aggressive negotiation grounded in CT § 47a-21. For 90% of cases, this is all you need.
          </p>
        </div>
      </section>

      {/* The Power - What Makes Tribune Aggressive */}
      <section id="power" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Intelligent. Aggressive. <span className="text-blue-600">Legal.</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              We don't just "help you write a letter." We deploy strategic escalation backed by Connecticut law to maximize your recovery.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <PowerCard
              icon={<Zap className="h-8 w-8" />}
              title="AI-Powered Strategy"
              description="Our system analyzes your case against CT § 47a-21 requirements, calculates double-damage eligibility, identifies weak landlord arguments, and generates strategic correspondence with escalating pressure."
              color="blue"
            />
            <PowerCard
              icon={<Shield className="h-8 w-8" />}
              title="Human-Reviewed Precision"
              description="Every letter is reviewed before mailing. We verify statute citations, deadline calculations, and damage math. Your landlord receives professionally drafted, legally grounded demands—not generic templates."
              color="slate"
            />
            <PowerCard
              icon={<FileText className="h-8 w-8" />}
              title="Escalating Pressure Campaign"
              description="Letter 1: Formal statutory demand. Letter 2: Stronger language + consequence warnings. Letter 3: Final notice before small claims. Each phase increases pressure while staying 100% legal."
              color="orange"
            />
            <PowerCard
              icon={<Scale className="h-8 w-8" />}
              title="Full Recovery Focus"
              description="We push for maximum statutory recovery—deposit + double damages + interest. We counter invalid deductions, challenge vague claims, and don't settle for partial amounts unless legally justified."
              color="green"
            />
          </div>
        </div>
      </section>

      {/* How It Works - Simplified */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-4 text-slate-900">You Do Nothing. We Do Everything.</h2>
          <p className="text-center text-slate-600 mb-16 text-lg max-w-2xl mx-auto">
            Submit your case once. We handle drafting, strategy, mailing, negotiation, and escalation. You just wait for your money.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: 1,
                title: "You: 10 minutes",
                desc: "Tell us about your lease and deposit. Upload documents. Click submit."
              },
              {
                num: 2,
                title: "Tribune: 2-6 weeks",
                desc: "We draft demands, mail certified letters, negotiate responses, escalate pressure, counter landlord claims."
              },
              {
                num: 3,
                title: "You: Get paid",
                desc: "Landlord pays you directly. You owe us 10% of recovery. Case closed."
              }
            ].map((step) => (
              <div
                key={step.num}
                className="relative"
                onMouseEnter={() => setHoveredStep(step.num)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <div className={`
                  border-2 rounded-xl p-8 transition-all duration-300 bg-white
                  ${hoveredStep === step.num ? 'border-blue-600 shadow-xl scale-105' : 'border-slate-200 shadow-md'}
                `}>
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 transition-all
                    ${hoveredStep === step.num ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}
                  `}>
                    {step.num}
                  </div>
                  <h3 className="text-xl font-bold text-center mb-3 text-slate-900">{step.title}</h3>
                  <p className="text-slate-600 text-center leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connecticut Law - Simplified, Power-Focused */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-4 text-slate-900">The Law Is On Your Side</h2>
          <p className="text-center text-slate-600 mb-12 text-lg">
            Connecticut General Statutes § 47a-21 gives tenants powerful rights. We weaponize them.
          </p>

          <div className="space-y-4">
            <LawCard
              title="30-Day Absolute Deadline"
              content="Your landlord had 30 days to return your deposit or provide itemized deductions. Miss that deadline? They may forfeit the right to deduct anything. We cite this hard."
            />
            <LawCard
              title="Double Damages for Violations"
              content="Willful violations = 2x the withheld amount, plus your legal fees. We calculate this in Letter 1 and demand it aggressively."
            />
            <LawCard
              title="Itemization Requirements"
              content="Deductions must be specific, documented, and reasonable. 'Cleaning' without receipts? 'Normal wear and tear' charged as damage? We challenge every weak claim."
            />
          </div>
        </div>
      </section>

      {/* FAQ - Condensed */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-12 text-slate-900">Common Questions</h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="cost" className="bg-white border rounded-lg px-6">
              <AccordionTrigger className="text-left font-bold hover:no-underline">
                What does this cost?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pt-2">
                <strong>10% contingency.</strong> You pay 10% of what we recover, and only if we win.
                You also cover small hard costs at cost (certified mail ~$8, court filing if needed ~$95).
                If we recover nothing, you owe nothing.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="do" className="bg-white border rounded-lg px-6">
              <AccordionTrigger className="text-left font-bold hover:no-underline">
                What exactly do you do?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pt-2">
                We draft statutory demand letters, calculate damages, mail them certified, analyze landlord responses,
                counter their arguments, escalate with stronger letters, and guide you through small claims if needed.
                <strong> You literally do nothing but wait.</strong>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="time" className="bg-white border rounded-lg px-6">
              <AccordionTrigger className="text-left font-bold hover:no-underline">
                How long does this take?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pt-2">
                Most landlords settle in 2-4 weeks after Letter 1. Full escalation (3 letters) takes 4-8 weeks.
                If they still refuse, small claims adds 2-4 months, but that's rare.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="not-lawyer" className="bg-white border rounded-lg px-6">
              <AccordionTrigger className="text-left font-bold hover:no-underline">
                Why not just hire a lawyer?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pt-2">
                Lawyers charge $200-400/hour. For a $1,500 deposit case, that's not viable. Tribune gives you
                <strong> professionally drafted, legally grounded correspondence for 10% of recovery</strong>—no hourly billing,
                no retainer. For 90% of deposit disputes, this is sufficient.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="deductions" className="bg-white border rounded-lg px-6">
              <AccordionTrigger className="text-left font-bold hover:no-underline">
                What if my landlord made deductions?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pt-2">
                We analyze whether the deductions are valid under CT law. If they're vague, excessive, or undocumented,
                we challenge them hard. Even if some deductions are legitimate, we push for full recovery of the wrongfully withheld portion.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to fight back?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Start your case in 10 minutes. We'll handle the rest. You pay nothing unless we win.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-blue-700 hover:bg-blue-50 text-xl px-10 py-7 font-black shadow-2xl hover:shadow-white/30 transition-all"
          >
            <Link href="/intake">
              Start Your Case Free <ArrowRight className="ml-3 h-6 w-6" />
            </Link>
          </Button>
          <p className="text-sm text-blue-200 mt-6">
            Connecticut residential tenants only • 10% contingency • No recovery, no fee
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-slate-900 text-slate-400">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">Tribune</span>
          </div>
          <p className="text-sm max-w-2xl mx-auto mb-6 leading-relaxed">
            <strong className="text-slate-300">Legal Disclaimer:</strong> Tribune is a legal information and document preparation service.
            We are not a law firm and do not provide legal advice. All correspondence is prepared by Tribune and signed by you.
            Results vary by case. For specific legal questions, consult a licensed Connecticut attorney.
          </p>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Tribune. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function PowerCard({
  icon,
  title,
  description,
  color
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600 border-blue-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    orange: "bg-orange-100 text-orange-600 border-orange-200",
    green: "bg-green-100 text-green-600 border-green-200",
  };

  return (
    <div className="group hover:scale-105 transition-all duration-300">
      <div className="bg-white border-2 border-slate-100 rounded-xl p-8 h-full hover:border-blue-200 hover:shadow-xl transition-all">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 ${colorMap[color]} border-2 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function LawCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="group border-l-4 border-blue-600 bg-blue-50/50 hover:bg-blue-50 p-6 rounded-r-lg transition-all hover:shadow-md">
      <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
        {title}
      </h3>
      <p className="text-slate-700 leading-relaxed">{content}</p>
    </div>
  );
}
