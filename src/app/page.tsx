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
            Strategic negotiation backed by Connecticut law. We handle the pressure, you get results.
          </p>

          <p className="text-base text-slate-500 mb-10 max-w-2xl mx-auto">
            Our system analyzes your case, calculates exactly what you're owed, then deploys a proven
            escalation strategy designed to maximize recovery. No lawyers. No guesswork.
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
            How Tribune Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900">1. We Analyze Your Case</h3>
              <p className="text-slate-600 text-sm">
                Our system reviews your situation against Connecticut § 47a-21, calculates statutory damages,
                and builds a recovery strategy tailored to your case.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900">2. We Apply Pressure</h3>
              <p className="text-slate-600 text-sm">
                We prepare a series of demand letters with escalating urgency and shorter deadlines. Each letter
                increases the legal and financial pressure on your landlord to settle.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900">3. You Get Paid</h3>
              <p className="text-slate-600 text-sm">
                Most landlords settle when faced with precise legal citations and calculated damages. You receive
                payment directly. You pay us 10% of what we recover.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Tribune */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-slate-900">
            Why Tribune Works
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            We combine legal precision with strategic pressure to get you the best possible outcome.
          </p>

          <div className="space-y-4">
            <div className="border border-slate-200 bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-slate-900">
                Strategic Escalation
              </h3>
              <p className="text-slate-600">
                Each letter we prepare builds on the last—starting polite and professional, then increasing
                urgency with each round. We shorten deadlines and strengthen language strategically, making
                it increasingly costly for your landlord to ignore you.
              </p>
            </div>

            <div className="border border-slate-200 bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-slate-900">
                Legal Precision
              </h3>
              <p className="text-slate-600">
                Connecticut law allows tenants to recover double damages plus costs when landlords violate deposit
                laws. Our system calculates your exact entitlement and cites the specific statutes that apply.
                Most landlords settle rather than face those numbers in court.
              </p>
            </div>

            <div className="border border-slate-200 bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-slate-900">
                Affordable & Effective
              </h3>
              <p className="text-slate-600">
                Hiring a lawyer for a $1,500 deposit doesn't make financial sense. Our intelligent system handles
                the strategic work while you stay in control—you review and sign every letter. 10% of recovery,
                only if we win.
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
                legally sound demand letters based on CT § 47a-21 and execute a proven escalation strategy.
                We are not a law firm and do not provide legal advice.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="how-it-works" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                How does it work?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Submit your case details. Our system analyzes the facts, calculates damages, and generates a
                series of demand letters with escalating pressure. You review, sign, and send each letter. We
                track deadlines and prepare the next steps based on your landlord's response.
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
                Each letter has a deadline that creates urgency—typically 10 days, then 7 days, then 5 days.
                You'll know exactly where your case stands at all times.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="lawyer" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                Is Tribune a law firm?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                No. Tribune provides legal information and document preparation services. We are not a law firm
                and do not provide legal advice. You review and sign all correspondence yourself. If your case
                needs an attorney, we can help you find one.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="eligible" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                Am I eligible?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                If you're a residential tenant in Connecticut who moved out and your landlord withheld part or
                all of your security deposit without proper justification, you likely qualify. Submit your intake
                to find out.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="success" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                What's your success rate?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Most landlords settle when presented with precise legal citations and calculated damages. We're
                transparent about case strength during intake. If your case isn't strong, we'll tell you upfront.
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
