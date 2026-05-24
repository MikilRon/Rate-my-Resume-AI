import { useState } from "react";
import { Toaster, toast } from "sonner";
import {
  Sparkles, FileText, Briefcase, Loader2, CheckCircle2, AlertTriangle,
  Target, Zap, TrendingUp, Wand2, ShieldCheck, ArrowRight,
} from "lucide-react";

type Analysis = {
  overall: number;
  ats: number;
  skillMatch: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  improvedBullets: { before: string; after: string }[];
};

const TOKEN_RE = /[a-zA-Z][a-zA-Z+#.\-]{2,}/g;
const STOP = new Set([
  "the","and","for","with","you","your","our","that","this","from","are","but",
  "have","has","will","not","into","they","their","over","also","more","than",
  "such","any","all","its","etc","per","via","across","using","use","used",
  "able","ability","including","include","work","working","team","teams",
  "experience","experienced","year","years","role","roles","job","jobs",
]);

function tokenize(t: string) {
  return new Set(
    (t.toLowerCase().match(TOKEN_RE) || []).filter((w) => !STOP.has(w))
  );
}

function demoAnalyze(resume: string, jd: string): Analysis {
  const r = tokenize(resume);
  const j = tokenize(jd);
  const overlap = [...j].filter((w) => r.has(w));
  const missing = [...j].filter((w) => !r.has(w)).slice(0, 10);

  const skillMatch = j.size ? Math.round((overlap.length / j.size) * 100) : 72;
  const length = resume.split(/\s+/).filter(Boolean).length;
  const hasMetrics = /\d+%|\$\d|\d{2,}/.test(resume);
  const hasBullets = /[•\-\*]/.test(resume);
  const ats =
    50 +
    (hasBullets ? 12 : 0) +
    (hasMetrics ? 15 : 0) +
    Math.min(15, Math.round(length / 40)) +
    (resume.toLowerCase().includes("experience") ? 5 : 0);
  const overall = Math.min(
    98,
    Math.round(skillMatch * 0.5 + Math.min(95, ats) * 0.5)
  );

  const strengths = [
    hasMetrics
      ? "Strong use of quantifiable achievements with concrete metrics"
      : "Clear, professional tone throughout the resume",
    hasBullets
      ? "Well-structured bullet points improve scannability"
      : "Concise paragraphs communicate experience effectively",
    overlap.length > 5
      ? `Strong keyword alignment with the role (${overlap.length} matches)`
      : "Relevant background for the target position",
    "Action-oriented language signals ownership and impact",
  ];

  const weaknesses = [
    !hasMetrics && "Lacks quantified results — add %s, $ amounts, and counts",
    !hasBullets && "Dense formatting — switch to bullet points for ATS parsers",
    length < 200 && "Resume feels short — expand on impact and outcomes",
    length > 800 && "Resume runs long — tighten to one page where possible",
    missing.length > 4 && "Missing several keywords from the job description",
  ].filter(Boolean) as string[];

  const improvedBullets = [
    {
      before: "Responsible for managing a team of developers.",
      after:
        "Led a cross-functional team of 6 engineers, shipping 12 features per quarter and cutting cycle time by 38%.",
    },
    {
      before: "Worked on improving website performance.",
      after:
        "Improved Lighthouse performance score from 62 → 96 by code-splitting, image optimization, and edge caching — reducing LCP by 1.8s.",
    },
    {
      before: "Helped with customer support tickets.",
      after:
        "Resolved 400+ customer tickets/month with a 97% CSAT, authoring 25 help-center articles that deflected ~30% of inbound volume.",
    },
  ];

  return {
    overall,
    ats: Math.min(98, ats),
    skillMatch,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.length ? weaknesses.slice(0, 4) : ["No critical issues detected — polish wording for impact."],
    missingKeywords: missing,
    improvedBullets,
  };
}

export default function App() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const analyze = async () => {
    if (resume.trim().length < 40) {
      toast.error("Paste a longer resume to get a meaningful analysis.");
      return;
    }
    if (jd.trim().length < 20) {
      toast.error("Paste the job description to score skill match.");
      return;
    }
    setLoading(true);
    setAnalysis(null);
    await new Promise((r) => setTimeout(r, 1600));
    setAnalysis(demoAnalyze(resume, jd));
    setLoading(false);
    setTimeout(
      () => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }),
      80
    );
  };

  return (
    <div className="min-h-screen text-foreground">
      <Toaster theme="dark" position="top-center" richColors />

      {/* NAV */}
      <header className="sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="glass rounded-2xl px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary glow flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-lg">
                  Ratemyresume<span className="text-gradient">AI</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-border bg-white/5 text-muted-foreground">
                  Beta
                </span>
              </div>
            </div>
            <a
              href="#analyzer"
              className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
            >
              Try the demo <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-10 text-center">
        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs text-muted-foreground mb-6 animate-float">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          Demo Mode — AI analysis temporarily unavailable
        </div>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
          Land more interviews with a <br className="hidden sm:block" />
          <span className="text-gradient">resume the ATS loves</span>.
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-muted-foreground text-base sm:text-lg">
          Paste your resume and a job description. Get an instant score,
          keyword gap analysis, and rewritten bullets — all in seconds.
        </p>
      </section>

      {/* ANALYZER */}
      <section id="analyzer" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid md:grid-cols-2 gap-5">
          <Field
            icon={<FileText className="w-4 h-4" />}
            label="Your Resume"
            hint={`${resume.split(/\s+/).filter(Boolean).length} words`}
            value={resume}
            onChange={setResume}
            placeholder="Paste your full resume text here…"
          />
          <Field
            icon={<Briefcase className="w-4 h-4" />}
            label="Job Description"
            hint={`${jd.split(/\s+/).filter(Boolean).length} words`}
            value={jd}
            onChange={setJd}
            placeholder="Paste the job description you're targeting…"
          />
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={analyze}
            disabled={loading}
            className="group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-medium glow transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" /> Analyze Resume
              </>
            )}
          </button>
          <button
            onClick={() => {
              setResume(SAMPLE_RESUME);
              setJd(SAMPLE_JD);
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Try with a sample
          </button>
        </div>

        {loading && (
          <div className="mt-10 glass-strong rounded-3xl p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center animate-pulse">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <p className="mt-4 text-muted-foreground">
              Scanning for keywords, structure, ATS compatibility…
            </p>
            <div className="mt-5 max-w-md mx-auto h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full w-1/2 bg-gradient-primary animate-[shimmer_1.5s_linear_infinite]" />
            </div>
          </div>
        )}

        {analysis && <Results a={analysis} />}
      </section>

      <footer className="border-t border-border/60 mt-10">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 justify-between">
          <span>© {new Date().getFullYear()} RatemyresumeAI — University portfolio project.</span>
          <span>Built with React + Vite.</span>
        </div>
      </footer>
    </div>
  );
}

function Field({
  icon, label, hint, value, onChange, placeholder,
}: {
  icon: React.ReactNode; label: string; hint: string;
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="glass-strong rounded-2xl p-5 transition hover:border-white/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-accent">
            {icon}
          </span>
          {label}
        </div>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={12}
        className="w-full resize-none bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground/60 focus:outline-none"
      />
    </div>
  );
}

function Results({ a }: { a: Analysis }) {
  return (
    <div id="results" className="mt-12 space-y-6 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-3 gap-5">
        <ScoreCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Overall Score"
          value={a.overall}
          tone="primary"
        />
        <ScoreCard
          icon={<ShieldCheck className="w-4 h-4" />}
          label="ATS Compatibility"
          value={a.ats}
          tone="accent"
        />
        <ScoreCard
          icon={<Target className="w-4 h-4" />}
          label="Skill Match"
          value={a.skillMatch}
          tone="secondary"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Panel title="Strengths" icon={<CheckCircle2 className="w-4 h-4 text-success" />}>
          <ul className="space-y-3">
            {a.strengths.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Weaknesses" icon={<AlertTriangle className="w-4 h-4 text-warning" />}>
          <ul className="space-y-3">
            {a.weaknesses.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Missing Keywords" icon={<Zap className="w-4 h-4 text-accent" />}>
        {a.missingKeywords.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Great — no critical keywords missing from the job description.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {a.missingKeywords.map((k) => (
              <span
                key={k}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-border text-foreground/90"
              >
                {k}
              </span>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Improved Bullet Points" icon={<Wand2 className="w-4 h-4 text-primary" />}>
        <div className="space-y-4">
          {a.improvedBullets.map((b, i) => (
            <div key={i} className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl p-4 bg-white/[0.03] border border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Before</div>
                <p className="text-sm text-muted-foreground">{b.before}</p>
              </div>
              <div className="rounded-xl p-4 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/15">
                <div className="text-[10px] uppercase tracking-wider text-accent mb-1">After</div>
                <p className="text-sm">{b.after}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ScoreCard({
  icon, label, value, tone,
}: {
  icon: React.ReactNode; label: string; value: number;
  tone: "primary" | "accent" | "secondary";
}) {
  const ring =
    tone === "primary"
      ? "from-[oklch(0.72_0.18_295)] to-[oklch(0.7_0.16_220)]"
      : tone === "accent"
      ? "from-[oklch(0.75_0.18_180)] to-[oklch(0.7_0.16_220)]"
      : "from-[oklch(0.7_0.16_220)] to-[oklch(0.75_0.18_180)]";
  return (
    <div className="glass-strong rounded-2xl p-6 flex items-center gap-5">
      <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${ring} p-[2px]`}>
        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
          <span className="text-2xl font-semibold">{value}</span>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
          {icon} {label}
        </div>
        <div className="mt-1 text-sm text-foreground/80">
          {value >= 85 ? "Excellent" : value >= 70 ? "Solid" : value >= 55 ? "Needs work" : "Low"}
        </div>
        <div className="mt-2 h-1.5 w-40 max-w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${ring} transition-all duration-700`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Panel({
  title, icon, children,
}: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass-strong rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
          {icon}
        </span>
        <h3 className="font-medium">{title}</h3>
      </div>
      {children}
    </div>
  );
}

const SAMPLE_RESUME = `Jane Doe — Software Engineer

Experience
- Built a React dashboard used by 12,000 monthly users, improving task completion by 24%.
- Migrated REST endpoints to GraphQL, cutting average payload size by 38%.
- Led a team of 3 engineers to deliver a Stripe billing integration on time.

Skills
JavaScript, TypeScript, React, Node.js, PostgreSQL, REST, Git, CI/CD.

Education
B.S. Computer Science, State University, 2023.`;

const SAMPLE_JD = `We're hiring a Frontend Engineer with strong TypeScript and React skills.
You'll build accessible, performant interfaces, collaborate with designers,
and ship features using Next.js, Tailwind CSS, and GraphQL. Experience with
testing (Vitest, Playwright), CI/CD, and design systems is a big plus.`;
