import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FileCheck2,
  MessageCircle,
  Printer,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import "./landing.css";

const features = [
  {
    icon: FileCheck2,
    title: "Fast result creation",
    text: "Enter student details, subjects and marks in a guided workflow built specifically for school result cards.",
  },
  {
    icon: BarChart3,
    title: "Automatic calculations",
    text: "Gradly calculates totals, percentages, grades and performance summaries so you spend less time on manual work.",
  },
  {
    icon: Printer,
    title: "Print-ready result cards",
    text: "Generate clean, professional result cards designed for printing, sharing and school records.",
  },
  {
    icon: ShieldCheck,
    title: "School-ready workflow",
    text: "Keep the process simple and consistent from student information to the final result card.",
  },
  {
    icon: Sparkles,
    title: "Custom result designs",
    text: "Use Gradly's result layouts and school branding tools to create result cards that look polished and official.",
  },
  {
    icon: MessageCircle,
    title: "Direct support",
    text: "Need help or want a custom solution for your school? Reach TechCraft directly on WhatsApp.",
  },
];

export default function Home() {
  return (
    <main className="gradly-landing">
      <nav className="gradly-landing__nav">
        <Link href="/" className="gradly-landing__brand" aria-label="Gradly home">
          <img src="/gradly-logo.svg" alt="Gradly logo" />
          <span>Gradly</span>
        </Link>

        <div className="gradly-landing__navlinks">
          <a href="#features">Features</a>
          <a href="https://techcraftsolution.com" target="_blank" rel="noreferrer">
            TechCraft
          </a>
        </div>

        <Link href="/dashboard" className="gradly-landing__navcta">
          Open generator <ArrowRight size={15} />
        </Link>
      </nav>

      <section className="gradly-landing__hero">
        <div className="gradly-landing__copy">
          <div className="gradly-landing__eyebrow">
            <Sparkles size={14} /> Smart student result generator
          </div>
          <h1>
            Create school results.
            <span>Beautifully simple.</span>
          </h1>
          <p>
            Gradly helps schools create accurate, professional student result cards without complicated spreadsheets or repetitive manual calculations.
          </p>

          <div className="gradly-landing__actions">
            <Link href="/dashboard" className="gradly-landing__primary">
              Open Student Result Generator <ArrowRight size={17} />
            </Link>
            <a href="#features" className="gradly-landing__secondary">
              View Features
            </a>
          </div>
          <p className="gradly-landing__microcopy">Free to open. Built for a faster school result workflow.</p>
        </div>

        <div className="gradly-landing__visual" aria-hidden="true">
          <div className="gradly-orbit gradly-orbit--one">
            <BarChart3 size={30} />
          </div>
          <div className="gradly-orbit gradly-orbit--two">
            <FileCheck2 size={25} />
          </div>
          <div className="gradly-orbit gradly-orbit--three">
            <Sparkles size={24} />
          </div>

          <div className="gradly-landing__panel">
            <div className="gradly-landing__windowbar">
              <div className="gradly-landing__dots"><span /><span /><span /></div>
              <span style={{ fontSize: 11, color: "#98a2b3", fontWeight: 800 }}>RESULT PREVIEW</span>
            </div>
            <div className="gradly-landing__result-card">
              <div className="gradly-landing__result-head">
                <div className="gradly-landing__result-logo">
                  <FileCheck2 size={22} />
                </div>
                <div className="gradly-landing__result-lines"><span /><span /></div>
              </div>
              <div className="gradly-landing__marks">
                <span /><span /><span /><span />
              </div>
              <div className="gradly-landing__score">A+ · 91%</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="gradly-landing__features-wrap">
        <div className="gradly-landing__section-head">
          <span>Everything you need</span>
          <h2>A cleaner way to create and manage student result cards.</h2>
        </div>
        <div className="gradly-landing__features">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="gradly-landing__feature">
              <div className="gradly-landing__feature-icon"><Icon size={21} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="gradly-landing__cta-wrap">
        <div className="gradly-landing__cta">
          <div>
            <h2>Ready to create your next student result?</h2>
            <p>Open Gradly and generate a polished result card in a few simple steps.</p>
          </div>
          <Link href="/dashboard" className="gradly-landing__primary">
            Start Generating <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="gradly-landing__footer">
        <span>Gradly · A TechCraft product</span>
        <div className="gradly-landing__actions" style={{ marginTop: 0 }}>
          <a href="https://wa.me/923336077281" target="_blank" rel="noreferrer">WhatsApp</a>
          <a href="https://techcraftsolution.com" target="_blank" rel="noreferrer">TechCraft</a>
        </div>
      </footer>
    </main>
  );
}
