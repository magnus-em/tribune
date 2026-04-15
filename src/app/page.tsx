/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Shield, FileText, Target, Scale } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">Tribune</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              Sign in
            </Link>
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/intake">Start Your Case</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            Connecticut Residential Tenants
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900">
            Your landlord had 30 days.
            <br />
            <span className="text-blue-600">We&apos;ll get your deposit back.</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Connecticut law (CT § 47a-21) requires landlords to return your security deposit within 30 days —
            or pay you <strong className="text-slate-900">double damages</strong>. Tribune handles everything:
            we draft, negotiate, and escalate on your behalf. You pay nothing unless we recover your money.
          </p>
          <div className="flex gap-4 justify-center mb-8">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
              <Link href="/intake">Start Your Case Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-slate-300 text-slate-700 text-lg px-8">
              <Link href="#how-it-works">How It Works</Link>
            </Button>
          </div>
          <p className="text-sm text-slate-500">
            10% contingency fee • No recovery, no fee • Typical cases resolve in 4-8 weeks
          </p>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 px-4 bg-white border-y">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <ValueProp
              icon={<Shield className="h-6 w-6" />}
              title="We Handle Everything"
              description="From drafting to negotiation to escalation — you don&apos;t lift a finger."
            />
            <ValueProp
              icon={<FileText className="h-6 w-6" />}
              title="Strategic Correspondence"
              description="Professionally drafted letters citing CT statute, with calculated escalation."
            />
            <ValueProp
              icon={<Target className="h-6 w-6" />}
              title="Aggressive Negotiation"
              description="We push hard for full recovery plus double damages when applicable."
            />
            <ValueProp
              icon={<Scale className="h-6 w-6" />}
              title="Legal Precision"
              description="Every letter is grounded in Connecticut tenant protection law."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">How Tribune Works</h2>
          <p className="text-center text-slate-600 mb-16 max-w-2xl mx-auto">
            We handle the entire process from start to finish. You stay informed, we do the work.
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            <Step
              number={1}
              title="You Submit Your Case"
              description="Tell us about your lease, move-out date, deposit amount, and what your landlord did (or didn&apos;t do). Upload your lease and any correspondence. Takes 10 minutes."
            />
            <Step
              number={2}
              title="We Strategize & Execute"
              description="Tribune drafts a formal demand letter citing CT § 47a-21, calculates double damages if applicable, and mails it certified. If your landlord doesn't respond, we escalate with progressively stronger follow-ups."
            />
            <Step
              number={3}
              title="You Get Paid"
              description="Most landlords settle within 2-4 weeks. When they pay you directly, you owe us 10% of what we recovered. If they don&apos;t pay, we guide you through small claims court filing."
            />
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-slate-900">What Tribune Handles For You</h2>
          <p className="text-center text-slate-600 mb-12">
            You sit back. We take care of the rest.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <ServiceCard
              title="Professional Demand Letters"
              items={[
                "CT § 47a-21 citations and deadline references",
                "Double-damages calculations when landlord is liable",
                "Itemized breakdown of what you're owed",
                "Certified mail with tracking",
              ]}
            />
            <ServiceCard
              title="Strategic Escalation"
              items={[
                "Letter 1: Formal demand with 10-day deadline",
                "Letter 2: Follow-up with stronger language and legal consequences",
                "Letter 3: Final notice before court filing",
                "Small claims guidance if needed",
              ]}
            />
            <ServiceCard
              title="Intelligent Negotiation"
              items={[
                "Review landlord's responses and identify weak arguments",
                "Counter invalid deductions with statutory requirements",
                "Push for full recovery, not partial settlements",
                "Advise you on whether to accept offers or escalate",
              ]}
            />
            <ServiceCard
              title="Full Documentation"
              items={[
                "Timeline tracking: 30-day deadline, response dates, next steps",
                "Document storage: lease, correspondence, photos",
                "Email updates when landlord responds or action is needed",
                "Case dashboard shows exactly where you stand",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Your Rights */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Your Rights Under Connecticut Law</h2>
          <div className="space-y-6">
            <div className="bg-white border-l-4 border-blue-600 p-6 rounded-r-lg shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 mb-2">30-Day Deadline (CT § 47a-21(d))</h3>
              <p className="text-slate-600">
                Your landlord <strong>must</strong> return your full deposit within 30 days of the end of your tenancy,
                or provide an itemized list of deductions with proof. No exceptions. If they miss this deadline,
                they may forfeit the right to make any deductions.
              </p>
            </div>
            <div className="bg-white border-l-4 border-blue-600 p-6 rounded-r-lg shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 mb-2">Double Damages for Willful Violations</h3>
              <p className="text-slate-600">
                If your landlord <strong>willfully</strong> withholds your deposit without valid cause, you may be entitled to
                <strong className="text-slate-900"> twice the amount wrongfully withheld</strong>, plus attorney fees and court costs.
                Tribune calculates and demands this in our letters.
              </p>
            </div>
            <div className="bg-white border-l-4 border-blue-600 p-6 rounded-r-lg shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 mb-2">Itemized Deductions Required</h3>
              <p className="text-slate-600">
                Any deductions must be documented in writing with specific costs. Vague claims like "cleaning" or
                "repairs" without receipts or details are <strong>not valid</strong>. Normal wear and tear cannot be deducted.
              </p>
            </div>
            <div className="bg-white border-l-4 border-blue-600 p-6 rounded-r-lg shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 mb-2">Interest on Your Deposit</h3>
              <p className="text-slate-600">
                Landlords are required to pay interest on security deposits held for more than one year.
                If they didn&apos;t, that's another violation we'll include in our demand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-900">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="cost">
              <AccordionTrigger className="text-left">What does Tribune cost?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Tribune works on a <strong>10% contingency</strong>. You pay 10% of the amount we recover —
                <strong> only if we successfully get your deposit back</strong>. If we don&apos;t recover anything,
                you owe nothing. You'll also cover small hard costs (certified mailing, court filing fees if you
                choose to escalate), which we charge at cost with no markup.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="what-tribune-does">
              <AccordionTrigger className="text-left">What exactly does Tribune do for me?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                We handle everything: drafting professional demand letters citing Connecticut statute,
                calculating damages, mailing them certified, negotiating with your landlord, responding to
                their arguments, and escalating if they don&apos;t cooperate. You upload your documents, and we
                take it from there. You'll get email updates and can track progress in your dashboard,
                but you don&apos;t need to write anything or call anyone.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="time">
              <AccordionTrigger className="text-left">How long does the process take?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Most landlords respond within 2-4 weeks of receiving the first demand letter. The entire
                process typically takes 4-8 weeks, depending on how quickly your landlord cooperates. If they
                don&apos;t respond or refuse to pay, we escalate with additional letters and guide you through
                small claims court if you choose to file.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="deductions">
              <AccordionTrigger className="text-left">
                What if my landlord made deductions from my deposit?
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Landlords can only deduct for actual damages beyond normal wear and tear, and they must
                provide a detailed, itemized list with receipts. If they didn&apos;t provide documentation,
                or if the deductions are vague or excessive, you likely have a strong case. Tribune will
                review their claims, counter with statutory requirements, and push for full recovery.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="lawyer">
              <AccordionTrigger className="text-left">Is Tribune a law firm? Do I need a lawyer?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Tribune is <strong>not a law firm</strong> and does not provide legal advice. We are a
                document preparation and negotiation service. You sign all letters as the sender
                (pro se), and we prepare them for you. For the vast majority of security deposit disputes,
                this approach is sufficient and landlords respond. If your case requires courtroom
                representation or involves unusual complexity, we'll let you know.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="states">
              <AccordionTrigger className="text-left">Do you handle cases outside Connecticut?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Currently, Tribune only handles <strong>residential</strong> security deposit disputes in
                Connecticut (with initial focus on New Haven). We plan to expand to other states in the future.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="payment">
              <AccordionTrigger className="text-left">How does payment work after recovery?</AccordionTrigger>
              <AccordionContent className="text-slate-600">
                Your landlord pays you directly — settlement money never flows through Tribune. Once you&apos;ve
                received your deposit, you owe us 10% of the recovered amount. We&apos;ll send you an invoice.
                If you don&apos;t pay, the debt enters collections (we independently verify recovery with your
                landlord, so non-payment isn't an option).
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-slate-900">Ready to get your deposit back?</h2>
          <p className="text-xl text-slate-600 mb-8">
            Start your case in 10 minutes. We handle the rest. You pay nothing unless we recover your money.
          </p>
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
            <Link href="/intake">Start Your Case Free</Link>
          </Button>
          <p className="text-sm text-slate-500 mt-4">
            10% contingency • No upfront cost • Connecticut residential tenants only
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-bold text-slate-900">Tribune</span>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto mb-4">
            Tribune is a legal information and document preparation service. We are not a law firm and do not
            provide legal advice. All correspondence is signed by you and sent on your behalf. For questions
            about your specific legal situation, consult a licensed attorney.
          </p>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Tribune. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function ValueProp({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-600 mb-3">
        {icon}
      </div>
      <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  );
}

function ServiceCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
      <h3 className="font-bold text-lg text-slate-900 mb-4">{title}</h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm text-slate-600">
            <span className="text-blue-600 font-bold">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
