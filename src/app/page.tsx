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
import {
  CheckCircle2,
  ArrowRight,
  FileText,
  Zap,
  DollarSign,
  Scale,
  ShieldAlert,
  Timer,
  Gavel,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Scale className="size-5" />
            Tribune
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              Sign in
            </Link>
            <Button size="sm" render={<Link href="/login" />}>
              Start Your Case <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900">
            Your landlord had 21 days.<br />
            <span className="text-slate-400">Time's up.</span>
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Connecticut law says your landlord must return your deposit or
            provide itemized deductions within 21 days. If they didn't, they
            owe you up to double. Tribune makes them pay.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-base px-8" render={<Link href="/login" />}>
              Start Your Case <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>10% of what we recover</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Most cases resolve in 1–4 weeks</span>
            </div>
          </div>
        </div>
      </section>

      {/* What your landlord is doing */}
      <section className="py-16 px-4 bg-white border-y border-slate-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-slate-900">
            Your landlord is running a playbook
          </h2>
          <p className="text-center text-slate-500 mb-12 max-w-xl mx-auto">
            Most landlords who withhold deposits aren't confused about the law.
            They're counting on you not knowing it.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-slate-200 rounded-lg p-6">
              <ShieldAlert className="h-6 w-6 text-red-500 mb-3" />
              <h3 className="font-semibold mb-2 text-slate-900">Fabricated deductions</h3>
              <p className="text-slate-600 text-sm">
                "Cleaning fees," "repainting," "carpet replacement" — charges for
                normal wear and tear that Connecticut law explicitly prohibits landlords
                from deducting.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-6">
              <Timer className="h-6 w-6 text-red-500 mb-3" />
              <h3 className="font-semibold mb-2 text-slate-900">Delay and silence</h3>
              <p className="text-slate-600 text-sm">
                Ignoring your calls. "The check is in the mail." Hoping you'll
                move on with your life. Every day past the 21-day deadline
                strengthens your claim — most tenants just don't realize it.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-6">
              <Gavel className="h-6 w-6 text-red-500 mb-3" />
              <h3 className="font-semibold mb-2 text-slate-900">Intimidation</h3>
              <p className="text-slate-600 text-sm">
                Vague threats about "damages" or legal action. Landlords sound
                authoritative because tenants assume they know the system better.
                Usually, they don't. They just bet you won't check.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The law */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            CT § 47a-21: The law they hope you don't read
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-xl mx-auto">
            Connecticut has one of the strongest tenant protection statutes in the
            country. Here's what it actually says.
          </p>

          <div className="space-y-4 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex gap-4">
              <span className="text-2xl font-bold text-slate-500 shrink-0">01</span>
              <div>
                <h3 className="font-semibold text-lg mb-1">21 days to return or itemize</h3>
                <p className="text-slate-300 text-sm">
                  After your tenancy ends, your landlord has exactly 21 days to either
                  return your full deposit with interest, or send you a written, itemized
                  list of damages with the remaining balance. No itemized list? The full
                  amount is owed back.
                </p>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex gap-4">
              <span className="text-2xl font-bold text-slate-500 shrink-0">02</span>
              <div>
                <h3 className="font-semibold text-lg mb-1">Double damages for non-compliance</h3>
                <p className="text-slate-300 text-sm">
                  Miss the deadline or withhold without a proper itemized statement?
                  The statute allows tenants to recover <strong className="text-white">twice the deposit
                  amount</strong>. A $1,500 deposit becomes a $3,000 claim. Courts enforce this routinely.
                </p>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex gap-4">
              <span className="text-2xl font-bold text-slate-500 shrink-0">03</span>
              <div>
                <h3 className="font-semibold text-lg mb-1">Normal wear and tear is not deductible</h3>
                <p className="text-slate-300 text-sm">
                  Faded paint, minor scuffs, carpet matting from normal use — none of these
                  are lawful deductions. Landlords who charge for routine turnover are violating
                  the statute, and that violation has a price.
                </p>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex gap-4">
              <span className="text-2xl font-bold text-slate-500 shrink-0">04</span>
              <div>
                <h3 className="font-semibold text-lg mb-1">Interest accrues from day one</h3>
                <p className="text-slate-300 text-sm">
                  Your landlord is required to hold your deposit in a Connecticut escrow
                  account and pay annual interest. No interest statement by January 31?
                  Another violation.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-5 text-center">
            <p className="text-sm text-slate-300">
              Most landlords don't know these details. When your demand letter cites
              every provision they've violated and calculates the exact penalties,
              the math speaks for itself.
            </p>
          </div>
        </div>
      </section>

      {/* How Tribune works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-slate-900">
            A system built to beat their playbook
          </h2>
          <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto">
            Tribune isn't a template generator. It's a negotiation system trained on
            the patterns of dishonest landlords — the delays, the bogus deductions, the
            silence. It adapts to what your landlord does and responds with precisely
            calibrated pressure.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900">We analyze your specific case</h3>
              <p className="text-slate-600 text-sm">
                Every case is different. We map your situation against the statute, identify
                which provisions your landlord violated, and calculate your exact exposure —
                including double damages. Your first demand is built from this analysis, not
                a form letter.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900">We adapt to their response</h3>
              <p className="text-slate-600 text-sm">
                Landlord ignores you? Sends a lowball? Claims damages they can't prove?
                We've seen each move before. The system recognizes the tactic and escalates
                accordingly — tightening deadlines, sharpening the legal language, and
                making the cost of continued non-compliance undeniable.
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-slate-900">They settle — or you file</h3>
              <p className="text-slate-600 text-sm">
                Most landlords fold. Keeping deposits is a volume play — they take from
                everyone and give back to anyone who actually pushes. Tribune makes pushing
                effortless. For the rare holdout, we walk you through small claims
                (up to $5,000 in CT) where double damages apply in full.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why they settle */}
      <section className="py-16 px-4 bg-blue-50 border-y border-blue-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-slate-900">
            Their model depends on you giving up
          </h2>
          <p className="text-center text-slate-600 mb-10 max-w-2xl mx-auto">
            Here's what most tenants don't realize: landlords who withhold deposits
            aren't prepared for a fight. They're running a numbers game — keep
            every deposit, return the ones where someone pushes back. The moment
            you signal real legal knowledge, you're in the minority they pay.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-3 text-slate-900">
                Tribune makes you credible instantly
              </h3>
              <p className="text-slate-600 text-sm">
                Your correspondence doesn't read like a frustrated tenant email. It
                reads like it was prepared by someone who knows § 47a-21 inside and out
                — because it was. Precise citations, calculated penalties, documented
                deadlines. That's the signal that changes a landlord's calculation from
                "they'll give up" to "this one knows what they're doing."
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-3 text-slate-900">
                Fighting you costs more than paying you
              </h3>
              <p className="text-slate-600 text-sm">
                Once your landlord is facing a documented double-damages claim with a
                clear paper trail heading toward small claims court, the math flips.
                Settling costs them the deposit. Fighting costs them the deposit plus
                double damages plus their time. That's why the vast majority settle
                before it ever gets to court.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10 text-slate-900">
            Questions
          </h2>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="cost" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                What does it cost?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                10% of what we recover. If your landlord returns $1,500, you pay $150. If we
                don't recover anything, you owe nothing. No upfront fees.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="timeline" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                How long does this take?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Most cases resolve in 1–4 weeks. Your first demand letter is ready within
                a few business days. Each subsequent letter has a shorter deadline.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="eligible" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                Am I eligible?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                If you're a residential tenant in Connecticut whose landlord withheld
                your security deposit or failed to provide an itemized deduction list
                within 21 days, you likely have a claim.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="lawyer" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                Is Tribune a law firm?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                No. Tribune is a legal-information and document-preparation service. You
                review and sign all correspondence. We prepare the strategy and the documents
                — you stay in control.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ignore" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                What if my landlord ignores the letters?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Every ignored deadline is documented evidence of non-compliance that strengthens
                your position. If letters don't resolve it, we guide you through filing in
                small claims court — where the statute's double-damages penalty applies in full.
                Most landlords settle before that point.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="deductions" className="border border-slate-200 rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline">
                My landlord sent a deduction list. Can I still file?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Possibly. If the deductions include normal wear and tear (repainting,
                carpet cleaning, minor scuffs), those are unlawful under CT § 47a-21.
                Submit your case and we'll evaluate whether the deductions hold up.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center border border-slate-200 bg-white rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">
            Your landlord is counting on you doing nothing.
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            5 minutes to submit. We take it from there.
          </p>
          <Button size="lg" className="text-base px-8" render={<Link href="/login" />}>
            Start Your Case <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-slate-500">
          <p className="mb-2">
            Connecticut residential tenants only · 10% contingency · No recovery, no fee
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
