/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Tribune
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link href="/intake">
                Start Your Case <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900">
            Your landlord had 30 days to return your deposit.
          </h1>

          <p className="text-xl text-slate-600 mb-4 max-w-2xl mx-auto">
            Strategic negotiation powered by behavioral economics and Connecticut law.
          </p>

          <p className="text-base text-slate-500 mb-10 max-w-2xl mx-auto">
            Our system analyzes your case through game-theoretic principles, then executes a multi-stage
            escalation strategy optimized for maximum recovery. No lawyers. No guesswork.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="text-base px-8">
              <Link href="/intake">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>10% contingency fee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>No recovery, no fee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Connecticut only</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
            Intelligent Escalation
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900">1. Strategic Analysis</h3>
              <p className="text-slate-600 text-sm">
                Our system evaluates your case against Connecticut § 47a-21, calculates statutory damages,
                and models optimal negotiation paths based on landlord response patterns.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900">2. Graduated Pressure</h3>
              <p className="text-slate-600 text-sm">
                We deploy a sequence of demand letters with escalating legal language and shrinking deadlines,
                engineered to maximize settlement probability while preserving your legal options.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900">3. Data-Driven Recovery</h3>
              <p className="text-slate-600 text-sm">
                Most landlords settle when confronted with precise statutory citations and calculated damages.
                You receive payment directly. You pay us 10% of what we recover.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Science */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-slate-900">
            The Science of Negotiation
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Our approach combines behavioral economics, game theory, and legal precedent to create
            an asymmetric advantage in your favor.
          </p>

          <div className="space-y-4">
            <div className="border border-slate-200 bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-slate-900">
                Game-Theoretic Escalation
              </h3>
              <p className="text-slate-600">
                Each letter in our sequence represents a rational move in a sequential game. We exploit
                asymmetric information—you know your resolve to pursue the case; your landlord doesn't.
                By credibly signaling willingness to escalate, we shift the Nash equilibrium in your favor.
              </p>
            </div>

            <div className="border border-slate-200 bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-slate-900">
                Statutory Precision
              </h3>
              <p className="text-slate-600">
                Connecticut law grants tenants double damages plus costs for deposit violations. Our system
                calculates exact liability figures and cites controlling statutes with precision. Most landlords
                settle when faced with quantified legal exposure.
              </p>
            </div>

            <div className="border border-slate-200 bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-slate-900">
                Cost-Benefit Optimization
              </h3>
              <p className="text-slate-600">
                Hiring an attorney for a $1,500 deposit doesn't make economic sense. Our system automates
                the strategic work while you retain full control—reviewing and signing all correspondence yourself.
                10% of recovery, only if we win.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-slate-900">
            Common Questions
          </h2>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="what-is" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                What is Tribune?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Tribune is a strategic document preparation service for Connecticut tenants. We help you prepare
                legally sound demand letters based on CT § 47a-21 using game-theoretic negotiation principles.
                We are not a law firm and do not provide legal advice.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="how-it-works" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                How does the system work?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                You submit your case details. Our system analyzes the facts against Connecticut law, calculates
                damages, and generates a sequence of demand letters with escalating urgency. You review, sign,
                and send each letter. We track deadlines and prepare next steps based on landlord responses.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cost" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                How much does it cost?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                10% of what we recover. If your landlord returns $1,500, you pay $150. If we don't recover anything,
                you owe nothing. No upfront fees, no hidden costs.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="timeline" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                How long does this take?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Most cases resolve in 2-4 weeks. We prepare your first demand letter within 2-3 business days.
                Each subsequent letter has a shorter deadline, applying increasing pressure. You'll know exactly
                where your case stands at all times.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="lawyer" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                Is Tribune a law firm?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                No. Tribune provides legal information and document preparation services. We are not a law firm
                and do not provide legal advice. You review and sign all correspondence yourself. If your case
                requires an attorney, we can help you find one.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="eligible" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                Am I eligible?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                If you're a residential tenant in Connecticut who moved out and your landlord withheld part or
                all of your security deposit without proper justification, you likely qualify. Start your intake
                to find out.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="success" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                What's your success rate?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Most landlords settle when presented with precise statutory citations and calculated damages.
                We're transparent about case strength during intake. If your case isn't strong, we'll tell you upfront.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center border border-slate-200 bg-white rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">
            Ready to recover your deposit?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Submit your case in 5 minutes. We'll analyze it and prepare your first demand letter.
          </p>
          <Button asChild size="lg" className="text-base px-8">
            <Link href="/intake">
              Start Your Case Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-slate-500">
          <p className="mb-2">
            Connecticut residential tenants only • 10% contingency • No recovery, no fee
          </p>
          <p className="text-xs">
            Tribune provides legal information and document preparation services. We are not a law firm
            and do not provide legal advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
