import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold">Tribune</span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link href="/intake">Start Your Case</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Your landlord had 30 days.
            <br />
            <span className="text-muted-foreground">Get your deposit back.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connecticut law requires landlords to return your security deposit within 30 days — or
            pay you double. Tribune handles the legal correspondence. You pay nothing unless we
            recover your money.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/intake">Start Your Case</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#how-it-works">How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Step
              number={1}
              title="Tell us what happened"
              description="Answer a few questions about your lease, your landlord, and your deposit. It takes about 10 minutes."
            />
            <Step
              number={2}
              title="We draft the letters"
              description="Tribune prepares professional demand letters citing Connecticut law. You review each one before sending."
            />
            <Step
              number={3}
              title="You get your money back"
              description="Most landlords respond within two weeks. If they don't, we escalate. You only pay if we recover your deposit."
            />
          </div>
        </div>
      </section>

      {/* Your Rights */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Your Rights Under CT Law</h2>
          <div className="space-y-6 text-muted-foreground">
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold text-foreground">30-Day Deadline</h3>
              <p>
                Under Connecticut General Statutes Section 47a-21, your landlord must return your security
                deposit within 30 days of the end of your tenancy. No exceptions.
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold text-foreground">Double Damages</h3>
              <p>
                If your landlord fails to comply, you may be entitled to <strong>double the amount</strong> of
                your deposit that was wrongfully withheld.
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold text-foreground">Itemized Deductions Required</h3>
              <p>
                If your landlord makes any deductions, they must provide a written, itemized list of damages
                and their costs. Vague claims like &quot;cleaning&quot; or &quot;wear and tear&quot; without
                specifics may not hold up.
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold text-foreground">Interest Owed</h3>
              <p>
                Your landlord is also required to pay interest on your security deposit for the
                duration of your tenancy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="cost">
              <AccordionTrigger>What does Tribune cost?</AccordionTrigger>
              <AccordionContent>
                Tribune works on a contingency basis. You pay 25% of the amount recovered — only if
                we successfully help you get your deposit back. If we don&apos;t recover anything,
                you owe nothing.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="time">
              <AccordionTrigger>How long does the process take?</AccordionTrigger>
              <AccordionContent>
                Most landlords respond within 2-4 weeks of receiving the first demand letter. The
                entire process typically takes 4-8 weeks, depending on how quickly your landlord
                cooperates.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="deductions">
              <AccordionTrigger>
                What if my landlord made deductions from my deposit?
              </AccordionTrigger>
              <AccordionContent>
                Landlords can only deduct for actual damages beyond normal wear and tear, and they
                must provide an itemized list. If they didn&apos;t provide one, or if the deductions
                seem unreasonable, you may still have a strong case. Start your case and we&apos;ll
                review the specifics.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="lawyer">
              <AccordionTrigger>Do I need a lawyer?</AccordionTrigger>
              <AccordionContent>
                Tribune is not a law firm and does not provide legal advice. We help you draft
                professional demand letters citing the relevant Connecticut statutes. For most
                security deposit disputes, this is sufficient. If your case requires legal
                representation, we&apos;ll let you know.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="states">
              <AccordionTrigger>Do you handle cases outside Connecticut?</AccordionTrigger>
              <AccordionContent>
                Currently, Tribune only handles security deposit disputes in Connecticut. We plan to
                expand to other states in the future.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get your deposit back?</h2>
          <p className="text-muted-foreground mb-8">
            It takes about 10 minutes to start your case. You pay nothing unless we recover your
            money.
          </p>
          <Button asChild size="lg">
            <Link href="/intake">Start Your Case</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-5xl mx-auto text-center text-sm text-muted-foreground">
          <p>
            Tribune is not a law firm and does not provide legal advice. This service helps you
            draft correspondence based on Connecticut tenant protection statutes.
          </p>
          <p className="mt-2">
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
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
