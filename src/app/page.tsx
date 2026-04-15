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
import { CheckCircle2, ArrowRight, FileText, Clock, DollarSign } from "lucide-react";

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

          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Connecticut law is clear. We'll help you recover what you're owed—without lawyers, without hassle.
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
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900">1. Submit Your Case</h3>
              <p className="text-slate-600 text-sm">
                Tell us about your situation. We review CT § 47a-21 and calculate what you're owed under state law.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900">2. We Escalate Strategically</h3>
              <p className="text-slate-600 text-sm">
                We prepare demand letters citing Connecticut law, with escalating urgency. You review and sign. We handle delivery.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900">3. Get Paid</h3>
              <p className="text-slate-600 text-sm">
                Most landlords settle. You receive payment directly. You pay Tribune 10% of what we recovered.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Tribune */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-slate-900">
            Why Tribune?
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Hiring a lawyer for a $1,500 deposit doesn't make sense. Tribune uses intelligent automation to make the process affordable.
          </p>

          <div className="space-y-4">
            <div className="border border-slate-200 bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-slate-900">
                Backed by Connecticut Law
              </h3>
              <p className="text-slate-600">
                CT § 47a-21 requires landlords to return deposits within 30 days or provide an itemized list of deductions.
                If they don't, they may owe you double your deposit plus costs. We cite the statute, calculate damages, and demand compliance.
              </p>
            </div>

            <div className="border border-slate-200 bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-slate-900">
                Human-Reviewed Strategy
              </h3>
              <p className="text-slate-600">
                Our system drafts demand letters using proven legal templates. Every letter is reviewed by our team
                before you see it. You control when and how it's sent.
              </p>
            </div>

            <div className="border border-slate-200 bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-slate-900">
                10% Contingency. That's It.
              </h3>
              <p className="text-slate-600">
                You pay 10% of what we recover, and only if we win. If your landlord returns $1,000, you pay $100.
                If we recover nothing, you owe nothing.
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
                Tribune is a document preparation service for Connecticut tenants. We help you prepare legally
                sound demand letters based on CT § 47a-21. We are not a law firm and do not provide legal advice.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cost" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                How much does it cost?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                10% of what we recover. If your landlord returns $1,500, you pay $150. If we don't recover anything,
                you owe nothing. There are no upfront fees or hidden costs.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="how-long" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                How long does this take?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Most cases resolve in 2-4 weeks. We submit your intake, prepare your first demand letter within
                2-3 business days, and track deadlines. You'll know exactly where your case stands at all times.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="lawyer" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                Is Tribune a law firm?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                No. Tribune provides legal information and document preparation services. We are not a law firm
                and do not provide legal advice. You review and sign all correspondence yourself. If you need
                a lawyer, we can help you find one.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="eligible" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                Am I eligible?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                If you're a residential tenant in Connecticut, moved out of your rental, and your landlord
                withheld part or all of your security deposit without proper justification, you likely qualify.
                Start your intake to find out.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="success" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                What's your success rate?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Most landlords respond to our demand letters and settle rather than face court. We're transparent
                about the strength of your case during intake. If your case isn't strong, we'll tell you upfront.
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
            It takes 5 minutes to submit your case. We'll review it and prepare your first demand letter.
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
