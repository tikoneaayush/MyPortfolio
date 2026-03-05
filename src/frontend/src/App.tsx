import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Cpu,
  ExternalLink,
  GitBranch,
  Github,
  Layers,
  Linkedin,
  Loader2,
  Mail,
  Star,
  Terminal,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CLICursor } from "./components/CLICursor";
import { ParticleAvatar } from "./components/ParticleAvatar";
import { useActor } from "./hooks/useActor";

// ─── Interactive Terminal ─────────────────────────────────────────────────────

type TerminalLineBase =
  | { type: "input"; text: string }
  | { type: "output"; text: string; color?: string };

type TerminalLine = TerminalLineBase & { id: number };

let _lineId = 0;
const mkLine = (base: TerminalLineBase): TerminalLine => ({
  ...base,
  id: ++_lineId,
});

const TERMINAL_COMMANDS: Record<
  string,
  { lines: TerminalLineBase[]; scroll?: string }
> = {
  help: {
    lines: [
      { type: "output", text: "Available commands:", color: "terminal-cyan" },
      {
        type: "output",
        text: "  ls projects       — list engineering projects",
      },
      { type: "output", text: "  cat about         — display profile info" },
      { type: "output", text: "  ./whoami          — identity dump" },
      { type: "output", text: "  skills --list     — technical skills" },
      { type: "output", text: "  contact --open    — jump to contact form" },
      { type: "output", text: "  clear             — clear terminal" },
    ],
  },
  "ls projects": {
    scroll: "projects",
    lines: [
      { type: "output", text: "total 2", color: "terminal-cyan" },
      {
        type: "output",
        text: "drwxr-xr-x  order-matching-engine/",
        color: "terminal-green",
      },
      {
        type: "output",
        text: "drwxr-xr-x  collegebook-student-mgmt/",
        color: "terminal-green",
      },
      { type: "output", text: "" },
      {
        type: "output",
        text: "→ Scrolling to projects section...",
        color: "terminal-amber",
      },
    ],
  },
  "cat about": {
    scroll: "about",
    lines: [
      { type: "output", text: "# profile.md", color: "terminal-cyan" },
      { type: "output", text: "Name    : Aayush Tikone" },
      { type: "output", text: "Role    : Systems Engineer" },
      { type: "output", text: "Focus   : C++, Multithreading, Low-Latency" },
      {
        type: "output",
        text: "CGPA    : 10.0 / 10.0",
        color: "terminal-green",
      },
      { type: "output", text: "Status  : Open to internships" },
      {
        type: "output",
        text: "→ Scrolling to about section...",
        color: "terminal-amber",
      },
    ],
  },
  "./whoami": {
    lines: [
      {
        type: "output",
        text: "aayush tikone — systems engineer",
        color: "terminal-green",
      },
      { type: "output", text: "uid=1000(aayush) gid=1000(engineers)" },
      {
        type: "output",
        text: "groups: low-latency, concurrency, c++, open-source",
      },
      {
        type: "output",
        text: "last login: building performance-critical systems",
      },
    ],
  },
  "skills --list": {
    scroll: "architecture",
    lines: [
      {
        type: "output",
        text: "[languages]  C++17/20, Java, SQL, Bash",
        color: "terminal-blue",
      },
      {
        type: "output",
        text: "[systems]    Multithreading, Lock-free DS, Linux",
        color: "terminal-blue",
      },
      {
        type: "output",
        text: "[tools]      GDB, Valgrind, perf, Git",
        color: "terminal-blue",
      },
      {
        type: "output",
        text: "[concepts]   Order Matching, RAII, Cache Locality",
        color: "terminal-blue",
      },
      {
        type: "output",
        text: "→ Scrolling to tech stack...",
        color: "terminal-amber",
      },
    ],
  },
  "contact --open": {
    scroll: "contact",
    lines: [
      {
        type: "output",
        text: "Opening contact form...",
        color: "terminal-green",
      },
      { type: "output", text: "Response time: < 24 hours" },
    ],
  },
};

function InteractiveTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    mkLine({
      type: "output",
      text: 'Welcome! Type "help" to see available commands.',
      color: "terminal-cyan",
    }),
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on line count change only
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length]);

  const run = useCallback((raw: string) => {
    const cmd = raw.trim().toLowerCase();
    setLines((prev) => [...prev, mkLine({ type: "input", text: raw })]);
    setHistory((h) => [raw, ...h].slice(0, 20));
    setHistIdx(-1);

    if (cmd === "clear") {
      setLines([]);
      return;
    }

    const match = TERMINAL_COMMANDS[cmd];
    if (match) {
      // animate lines one by one
      match.lines.forEach((l, i) => {
        setTimeout(() => {
          setLines((prev) => [...prev, mkLine(l)]);
        }, i * 60);
      });
      if (match.scroll) {
        setTimeout(
          () =>
            document
              .getElementById(match.scroll!)
              ?.scrollIntoView({ behavior: "smooth" }),
          match.lines.length * 60 + 200,
        );
      }
    } else if (cmd === "") {
      // do nothing
    } else {
      setLines((prev) => [
        ...prev,
        mkLine({
          type: "output",
          text: `command not found: ${raw}. Type "help" for available commands.`,
          color: "destructive",
        }),
      ]);
    }
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setInput(history[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? "" : history[next]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const cmds = Object.keys(TERMINAL_COMMANDS);
      const match = cmds.find((c) => c.startsWith(input.toLowerCase()));
      if (match) setInput(match);
    }
  };

  return (
    <div
      data-ocid="hero.terminal.panel"
      className="terminal-card rounded-lg overflow-hidden w-full max-w-2xl mx-auto cursor-text"
      onClick={() => inputRef.current?.focus()}
      onKeyDown={() => inputRef.current?.focus()}
      role="presentation"
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="font-mono text-xs text-muted-foreground ml-2 flex-1 text-center">
          aayush@portfolio — interactive shell
        </span>
        <span className="font-mono text-xs text-muted-foreground opacity-50">
          bash
        </span>
      </div>

      {/* Output area */}
      <div className="p-4 h-48 overflow-y-auto font-mono text-xs space-y-0.5 bg-background/60">
        {lines.map((line) => {
          if (line.type === "input") {
            return (
              <div key={line.id} className="flex gap-2">
                <span className="text-terminal-green shrink-0">
                  aayush@portfolio:~$
                </span>
                <span className="text-foreground">{line.text}</span>
              </div>
            );
          }
          return (
            <div
              key={line.id}
              className={`pl-0 leading-relaxed ${
                line.color === "terminal-green"
                  ? "text-terminal-green"
                  : line.color === "terminal-cyan"
                    ? "text-terminal-cyan"
                    : line.color === "terminal-blue"
                      ? "text-terminal-blue"
                      : line.color === "terminal-amber"
                        ? "text-terminal-amber"
                        : line.color === "destructive"
                          ? "text-destructive"
                          : "text-muted-foreground"
              }`}
            >
              {line.text || "\u00a0"}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-card/60">
        <span className="font-mono text-xs text-terminal-green shrink-0">
          aayush@portfolio:~$
        </span>
        <input
          ref={inputRef}
          data-ocid="hero.terminal.input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/40 caret-terminal-green"
          placeholder='type "help" or try "ls projects"'
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <span className="cursor-blink text-terminal-green text-xs font-mono">
          ▋
        </span>
      </div>
    </div>
  );
}

// ─── HoverCommandPreview ──────────────────────────────────────────────────────

function HoverCommandPreview({ lines }: { lines: string[] }) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisibleLines([]);
    setLineIdx(0);
    setCharIdx(0);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []); // intentional: reset only on mount

  useEffect(() => {
    if (lineIdx >= lines.length) return;
    const target = lines[lineIdx];
    if (charIdx < target.length) {
      timeoutRef.current = setTimeout(() => {
        setVisibleLines((prev) => {
          const next = [...prev];
          next[lineIdx] = target.slice(0, charIdx + 1);
          return next;
        });
        setCharIdx((c) => c + 1);
      }, 40);
    } else {
      timeoutRef.current = setTimeout(() => {
        setLineIdx((i) => i + 1);
        setCharIdx(0);
      }, 60);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [lineIdx, charIdx, lines]);

  return (
    <div
      className="absolute bottom-full mb-2 left-0 z-30 bg-background/95 border border-terminal-green/40 rounded-sm px-3 py-2 w-48 font-mono text-xs text-terminal-green pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150"
      style={{ transform: "translateY(0px)" }}
    >
      {visibleLines.map((line) => (
        <div key={line} className="leading-relaxed whitespace-pre">
          {line || <span className="opacity-0">.</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Particle Canvas ────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    // init particles
    const count = Math.floor((canvas.width * canvas.height) / 18000);
    particlesRef.current = Array.from({ length: Math.min(count, 80) }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59, 130, 246, 0.5)";
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-60"
    />
  );
}

// ─── Typing Animation ────────────────────────────────────────────────────────

const TYPING_ROLES = [
  "Systems Engineer",
  "C++ Developer",
  "Low-Latency Infrastructure",
  "Multithreading & Concurrency",
];

function TypingEffect() {
  const [roleIdx, setRoleIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "pause" | "erasing">("typing");

  useEffect(() => {
    const target = TYPING_ROLES[roleIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (displayed.length < target.length) {
        timeout = setTimeout(
          () => setDisplayed(target.slice(0, displayed.length + 1)),
          65,
        );
      } else {
        timeout = setTimeout(() => setPhase("pause"), 1800);
      }
    } else if (phase === "pause") {
      timeout = setTimeout(() => setPhase("erasing"), 400);
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
      } else {
        setRoleIdx((i) => (i + 1) % TYPING_ROLES.length);
        setPhase("typing");
      }
    }
    return () => clearTimeout(timeout);
  }, [displayed, phase, roleIdx]);

  return (
    <span className="font-mono text-terminal-green glow-text-green">
      {displayed}
      <span className="cursor-blink">▋</span>
    </span>
  );
}

// ─── Scroll Reveal ────────────────────────────────────────────────────────────

function RevealSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Section Heading ──────────────────────────────────────────────────────────

type AccentColor = "blue" | "green" | "cyan";

function SectionHeading({
  label,
  title,
  subtitle,
  accent = "blue",
}: {
  label: string;
  title: string;
  subtitle?: string;
  accent?: AccentColor;
}) {
  const accentClass = `section-accent-${accent}`;
  const labelColor =
    accent === "green"
      ? "text-terminal-green"
      : accent === "cyan"
        ? "text-terminal-cyan"
        : "text-terminal-blue";

  return (
    <div className={`mb-12 ${accentClass}`}>
      <p
        className={`font-mono text-xs ${labelColor} mb-2 tracking-widest uppercase flex items-center gap-2`}
      >
        <span className="opacity-50">~/portfolio/</span>
        <span>{label}</span>
        <span className="opacity-40">$</span>
        <span className="cursor-blink opacity-60">▋</span>
      </p>
      <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-muted-foreground text-sm max-w-xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── GitHub Contribution Grid ─────────────────────────────────────────────────

function ContribGrid() {
  const weeks = 26;
  const days = 7;

  const seed = (i: number) => {
    const x = Math.sin(i * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  const getLevel = (w: number, d: number) => {
    const idx = w * 7 + d;
    const r = seed(idx);
    if (r < 0.45) return 0;
    if (r < 0.65) return 1;
    if (r < 0.8) return 2;
    if (r < 0.92) return 3;
    return 4;
  };

  const levelColors = [
    "rgba(22,197,94,0.08)",
    "rgba(22,197,94,0.2)",
    "rgba(22,197,94,0.45)",
    "rgba(22,197,94,0.7)",
    "rgba(22,197,94,0.95)",
  ];

  return (
    <div className="flex gap-[3px] overflow-x-auto pb-2">
      {Array.from({ length: weeks }, (_, w) => {
        const weekLabel = `week-col-${w + 1}`;
        return (
          <div key={weekLabel} className="flex flex-col gap-[3px]">
            {Array.from({ length: days }, (_, d) => {
              const level = getLevel(w, d);
              const cellLabel = `cell-${w + 1}-${d + 1}`;
              return (
                <div
                  key={cellLabel}
                  className="contrib-cell w-[10px] h-[10px] rounded-sm"
                  style={{ backgroundColor: levelColors[level] }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── NavStatusPill ────────────────────────────────────────────────────────────

function NavStatusPill() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="hidden md:flex relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pill */}
      <div
        className="font-mono text-[10px] border border-terminal-green/30 rounded-full px-3 py-1 text-terminal-green bg-terminal-green/5 cursor-default select-none transition-all duration-150"
        style={{ willChange: "box-shadow" }}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-terminal-green mr-1.5 animate-pulse align-middle" />
        SYSTEM: ONLINE
      </div>

      {/* Expanded dropdown */}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 pointer-events-none"
        style={{
          opacity: hovered ? 1 : 0,
          transform: `translateX(-50%) translateY(${hovered ? "0px" : "-6px"})`,
          transition: "opacity 150ms ease, transform 150ms ease",
        }}
      >
        <div
          className="bg-card border border-terminal-green/30 rounded-sm px-3 py-2 font-mono text-[10px] space-y-0.5 min-w-[160px] shadow-lg"
          style={{ boxShadow: "0 4px 20px oklch(0.725 0.195 149.8 / 0.12)" }}
        >
          <div className="text-terminal-cyan mb-1">$ system_status</div>
          <div className="text-terminal-green">CPU: Stable</div>
          <div className="text-terminal-green">Latency: &lt;1ms</div>
          <div className="text-terminal-green">Modules: Active</div>
        </div>
      </div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav({ visitorCount }: { visitorCount: bigint | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scroll = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  }, []);

  const links = [
    { id: "about", label: "about", ocid: "nav.about.link" },
    { id: "architecture", label: "tech", ocid: "nav.tech.link" },
    { id: "projects", label: "projects", ocid: "nav.projects.link" },
    { id: "experience", label: "experience", ocid: "nav.experience.link" },
    {
      id: "achievements",
      label: "achievements",
      ocid: "nav.achievements.link",
    },
    { id: "contact", label: "contact", ocid: "nav.contact.link" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => scroll("hero")}
          className="font-mono text-lg font-bold text-terminal-green glow-text-green tracking-wider"
        >
          AT<span className="cursor-blink text-terminal-cyan">_</span>
        </button>

        {/* Desktop nav */}
        <NavStatusPill />
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <button
              type="button"
              key={l.id}
              data-ocid={l.ocid}
              onClick={() => scroll(l.id)}
              className="nav-link font-mono text-xs tracking-wider"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {visitorCount !== null && (
            <span className="font-mono text-xs text-muted-foreground border border-border px-2 py-1 rounded-sm">
              <Users className="inline w-3 h-3 mr-1 opacity-60" />
              {visitorCount.toString()} visits
            </span>
          )}
          <button
            type="button"
            onClick={() => scroll("contact")}
            className="font-mono text-xs px-3 py-1.5 border border-terminal-green/50 text-terminal-green hover:bg-terminal-green/10 rounded-sm transition-all"
          >
            $ contact
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden font-mono text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-background/95 backdrop-blur-md border-b border-border"
          >
            <nav className="flex flex-col px-6 py-4 gap-4">
              {links.map((l) => (
                <button
                  type="button"
                  key={l.id}
                  data-ocid={l.ocid}
                  onClick={() => scroll(l.id)}
                  className="nav-link text-left font-mono text-sm"
                >
                  {l.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const scroll = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const metrics = [
    "100+ Problems Solved",
    "10.0 CGPA",
    "Systems Programming Focus",
    "Multithreading & Concurrency",
  ];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden terminal-grid hero-scanline hero-crt"
    >
      <ParticleCanvas />

      {/* Radial gradient — tighter falloff so grid stays visible at edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 30% 40%, transparent 0%, oklch(0.118 0.012 240 / 0.5) 60%, oklch(0.118 0.012 240 / 0.9) 100%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-20">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left column: existing content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Prompt line */}
            <p className="font-mono text-sm text-terminal-cyan mb-6 tracking-wide">
              <span className="text-terminal-green">aayush@portfolio</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-terminal-blue">~</span>
              <span className="text-muted-foreground">$ </span>
              <span className="text-foreground">./whoami</span>
            </p>

            {/* Name */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-4 tracking-tight leading-none">
              Aayush <span className="text-terminal-blue">Tikone</span>
            </h1>

            {/* Typing role */}
            <div className="h-10 flex items-center mb-6">
              <span className="font-mono text-lg md:text-xl text-muted-foreground mr-2">
                &gt;{" "}
              </span>
              <TypingEffect />
            </div>

            {/* Tagline */}
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
              Building performance-critical systems where{" "}
              <span className="text-terminal-cyan font-medium">latency</span>,{" "}
              <span className="text-terminal-cyan font-medium">
                concurrency
              </span>
              , and{" "}
              <span className="text-terminal-cyan font-medium">
                memory efficiency
              </span>{" "}
              matter.
            </p>

            {/* Metric badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-2 mb-10"
            >
              {metrics.map((m) => (
                <span key={m} className="metric-badge">
                  ▸ {m}
                </span>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <div className="relative group">
                <HoverCommandPreview
                  lines={[
                    "$ run projects",
                    "loading modules...",
                    "system ready ✓",
                  ]}
                />
                <Button
                  data-ocid="hero.cta.primary_button"
                  onClick={() => scroll("projects")}
                  className="font-mono text-sm bg-terminal-blue/20 border border-terminal-blue/60 text-terminal-blue hover:bg-terminal-blue/30 hover:border-terminal-blue glow-blue px-6 py-2.5"
                  variant="outline"
                >
                  View Projects
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
              <div className="relative group">
                <HoverCommandPreview
                  lines={["$ open contact", "loading form...", "ready ✓"]}
                />
                <Button
                  data-ocid="hero.cta.secondary_button"
                  onClick={() => scroll("contact")}
                  variant="ghost"
                  className="font-mono text-sm text-muted-foreground hover:text-terminal-green border border-border hover:border-terminal-green/50"
                >
                  <Terminal className="mr-2 w-4 h-4" />
                  Get in Touch
                </Button>
              </div>
            </motion.div>

            {/* Interactive terminal */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="mt-12"
            >
              <InteractiveTerminal />
            </motion.div>
          </motion.div>

          {/* Right column: particle avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="hidden md:flex items-center justify-center"
          >
            <div
              data-scan="avatar"
              className="relative w-80 h-96 lg:w-96 lg:h-[480px]"
            >
              <ParticleAvatar />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="flex flex-col items-center gap-1"
          >
            <span className="font-mono text-xs text-muted-foreground/60">
              scroll
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 rotate-90" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────

function About() {
  const skills = [
    { prompt: "languages", value: "C++17/20, Java, SQL, Bash" },
    {
      prompt: "paradigms",
      value: "Systems Programming, OOP, Concurrent Programming",
    },
    {
      prompt: "interests",
      value: "Low-latency systems, Order matching engines, Kernel internals",
    },
    { prompt: "education", value: "B.Tech CSE — 10.0 CGPA" },
    { prompt: "status", value: "Open to internships & collaborative projects" },
  ];

  return (
    <section id="about" className="py-24 px-6 max-w-6xl mx-auto">
      <RevealSection>
        <SectionHeading
          label="about.me"
          title="Who Am I"
          subtitle="A systems engineering student obsessed with writing fast, correct, and scalable code."
          accent="cyan"
        />
      </RevealSection>

      <div className="grid md:grid-cols-2 gap-8">
        <RevealSection delay={0.1}>
          <div className="terminal-card rounded-lg p-6 h-full">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="font-mono text-xs text-muted-foreground ml-2">
                terminal — bash
              </span>
            </div>

            <div className="space-y-3 font-mono text-sm">
              <p className="text-terminal-green">$ whoami</p>
              <div className="pl-2 text-foreground leading-relaxed text-sm">
                <p>
                  I'm{" "}
                  <span className="text-terminal-cyan font-semibold">
                    Aayush Tikone
                  </span>{" "}
                  — a systems engineering student deeply focused on building
                  performance-critical software.
                </p>
                <p className="mt-3 text-muted-foreground">
                  My work centres around C++, multithreaded concurrency, and
                  low-latency architecture — the kind of code where every
                  nanosecond and every byte matters.
                </p>
              </div>

              <div className="mt-6 space-y-2">
                {skills.map((s) => (
                  <div key={s.prompt} className="flex gap-2 flex-wrap">
                    <span className="text-terminal-blue shrink-0">
                      [{s.prompt}]
                    </span>
                    <span className="text-muted-foreground">{s.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="text-terminal-green">$</span>
                <span className="text-terminal-amber animate-pulse">▋</span>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection delay={0.2}>
          <div className="space-y-4">
            {[
              {
                icon: <Cpu className="w-5 h-5" />,
                title: "Systems Programmer",
                desc: "Deep expertise in C++ systems programming — from memory management to lock-free data structures and concurrent algorithm design.",
                color: "terminal-blue",
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: "Performance Engineer",
                desc: "Every component I build is profiled, benchmarked, and optimised. Latency budgets are first-class design constraints.",
                color: "terminal-green",
              },
              {
                icon: <Layers className="w-5 h-5" />,
                title: "Infrastructure Builder",
                desc: "Experienced in building server-side systems with JDBC, MySQL, Apache Tomcat, and Linux-native tooling.",
                color: "terminal-cyan",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="terminal-card rounded-lg p-5 flex gap-4"
              >
                <div className={`shrink-0 text-${item.color} mt-0.5`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── Skill Code Snippets ──────────────────────────────────────────────────────

const SKILL_SNIPPETS: Record<string, string> = {
  "C++17/20": "std::thread worker(process_orders);",
  Multithreading: "std::mutex order_mutex;",
  "Memory Management": "std::unique_ptr<Order> order;",
  "Linux Internals": "ps aux | grep engine",
  "Lock-free DS": "std::atomic<int> counter{0};",
  POSIX: "#include <pthread.h>",
  IPC: "pipe(fd); fork();",
  GDB: "break main; run",
  Valgrind: "--leak-check=full",
  perf: "perf stat ./engine",
  MySQL: "SELECT * FROM orders;",
  JDBC: "conn.prepareStatement(sql);",
  "Order Matching": "match(buy, sell);",
  RAII: "std::lock_guard<std::mutex> lg(m);",
  "Cache Locality": "alignas(64) Order book[];",
};

function getSkillSnippet(item: string): string {
  return SKILL_SNIPPETS[item] ?? `// ${item}`;
}

// ─── Technical Architecture ───────────────────────────────────────────────────

const TECH_CATEGORIES = [
  {
    label: "Languages",
    icon: <Code2 className="w-4 h-4" />,
    color: "blue",
    items: ["C++17/20", "Java", "Python", "SQL", "Bash"],
  },
  {
    label: "Systems",
    icon: <Cpu className="w-4 h-4" />,
    color: "green",
    items: [
      "Multithreading",
      "Memory Management",
      "Lock-free DS",
      "Linux Internals",
      "POSIX",
      "IPC",
    ],
  },
  {
    label: "Tools",
    icon: <Terminal className="w-4 h-4" />,
    color: "cyan",
    items: ["Git", "GDB", "Valgrind", "Apache Tomcat", "Make", "perf"],
  },
  {
    label: "Concepts",
    icon: <Layers className="w-4 h-4" />,
    color: "amber",
    items: [
      "Order Matching",
      "Low-Latency Design",
      "JDBC",
      "RAII",
      "Cache Locality",
      "Profiling",
    ],
  },
];

function TechArchitecture() {
  return (
    <section id="architecture" className="py-24 px-6 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <RevealSection>
          <SectionHeading
            label="tech.stack"
            title="Technical Architecture"
            subtitle="The full-stack of technologies, tools and concepts I work with daily."
            accent="green"
          />
        </RevealSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TECH_CATEGORIES.map((cat, idx) => (
            <RevealSection key={cat.label} delay={idx * 0.1}>
              <div
                data-scan="skills"
                className="terminal-card rounded-lg p-5 h-full"
              >
                <div
                  className={`flex items-center gap-2 mb-4 text-terminal-${cat.color}`}
                >
                  {cat.icon}
                  <span className="font-mono text-xs font-bold tracking-widest uppercase">
                    {cat.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((item) => (
                    <div key={item} className="relative group">
                      <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-20 bg-card border border-terminal-green/30 rounded-sm px-2 py-1.5 font-mono text-[10px] text-terminal-green whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150">
                        {getSkillSnippet(item)}
                      </div>
                      <span className="tech-tag cursor-default">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Projects ─────────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    name: "Low-Latency Multithreaded Order Matching Engine",
    description:
      "A production-grade order matching engine built in C++ designed for high-frequency trading workloads. Implements concurrent order processing with price-time priority semantics.",
    tech: ["C++17", "STL", "pthreads", "Linux"],
    features: [
      "Concurrent order processing with lock-minimised critical paths",
      "Price-time priority matching algorithm",
      "Optimised order book with O(log n) insertions",
      "Low-latency architecture targeting sub-microsecond throughput",
    ],
    tag: "Featured",
    tagColor: "terminal-green",
    icon: <Zap className="w-5 h-5" />,
    highlight: "green",
    logs: [
      "[INFO] Initializing order book",
      "[INFO] Processing buy/sell orders",
      "[INFO] Latency optimization enabled",
      "[SUCCESS] Engine ready",
    ],
  },
  {
    name: "CollegeBook Student Management System",
    description:
      "Full-stack student management platform built on Java Servlets and JDBC with a relational database backend. Supports authentication, assignment workflows, and server-side validation.",
    tech: ["Java Servlets", "JDBC", "MySQL", "Apache Tomcat"],
    features: [
      "Session-based authentication system",
      "Assignment submission and tracking",
      "Optimised database query layer",
      "Server-side input validation and sanitisation",
    ],
    tag: "Full-Stack",
    tagColor: "terminal-cyan",
    icon: <Layers className="w-5 h-5" />,
    highlight: "cyan",
    logs: [
      "[INFO] Connecting to database",
      "[INFO] Loading student records",
      "[INFO] Auth module initialized",
      "[SUCCESS] System ready",
    ],
  },
];

function ProjectCard({
  p,
  idx,
}: {
  p: (typeof PROJECTS)[number];
  idx: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [visibleLogCount, setVisibleLogCount] = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = () => {
    for (const t of timeoutsRef.current) clearTimeout(t);
    timeoutsRef.current = [];
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsScanning(true);
    setVisibleLogCount(0);

    // Stream logs in staggered
    p.logs.forEach((_, i) => {
      const t = setTimeout(() => {
        setVisibleLogCount((c) => c + 1);
      }, i * 120);
      timeoutsRef.current.push(t);
    });

    // Reset scan class after animation completes
    const scanT = setTimeout(() => setIsScanning(false), 650);
    timeoutsRef.current.push(scanT);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsScanning(false);
    setVisibleLogCount(0);
    clearTimeouts();
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: clearTimeouts is stable ref-based
  useEffect(() => () => clearTimeouts(), []);

  return (
    <RevealSection delay={idx * 0.15}>
      <div
        data-ocid={`projects.item.${idx + 1}`}
        className="project-card rounded-lg p-6 flex flex-col h-full relative overflow-hidden"
        style={{
          borderColor: isHovered ? "oklch(0.598 0.183 255.6 / 0.7)" : undefined,
          boxShadow: isHovered
            ? "0 0 25px oklch(0.598 0.183 255.6 / 0.25), 0 8px 32px oklch(0 0 0 / 0.5)"
            : undefined,
          transform: isHovered ? "translateY(-4px)" : undefined,
          transition:
            "border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Scan-line sweep */}
        {isScanning && (
          <div
            className="card-scan-sweep absolute left-0 right-0 h-px bg-terminal-cyan/60 pointer-events-none z-10"
            style={{ top: 0 }}
          />
        )}

        <div className="flex items-start justify-between mb-4">
          <div className={`text-terminal-${p.highlight}`}>{p.icon}</div>
          <Badge
            className={`font-mono text-xs bg-terminal-${p.highlight}/10 border-terminal-${p.highlight}/40 text-terminal-${p.highlight}`}
            variant="outline"
          >
            {p.tag}
          </Badge>
        </div>

        <h3 className="font-display font-bold text-lg text-foreground mb-3 leading-tight">
          {p.name}
        </h3>

        <p className="text-sm text-muted-foreground mb-5 leading-relaxed flex-1">
          {p.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {p.tech.map((t) => (
            <span key={t} className="tech-tag">
              {t}
            </span>
          ))}
        </div>

        <div className="space-y-1.5 border-t border-border pt-4">
          {p.features.map((f) => (
            <div
              key={f}
              className="flex items-start gap-2 text-xs text-muted-foreground"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-terminal-green shrink-0 mt-0.5" />
              <span>{f}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-4 flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-terminal-cyan transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View on GitHub
        </button>

        {/* Log stream overlay */}
        {isHovered && visibleLogCount > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-background/85 backdrop-blur-sm border-t border-terminal-blue/30 px-3 py-2 font-mono text-[10px] space-y-0.5 max-h-[80px] overflow-hidden z-20">
            {p.logs.slice(0, visibleLogCount).map((log) => (
              <div
                key={log}
                className={
                  log.startsWith("[SUCCESS]")
                    ? "text-terminal-green"
                    : "text-muted-foreground"
                }
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </RevealSection>
  );
}

function Projects() {
  return (
    <section id="projects" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <RevealSection>
          <SectionHeading
            label="projects"
            title="Engineering Work"
            subtitle="Projects built with real engineering constraints — performance, reliability, and correctness."
            accent="blue"
          />
        </RevealSection>

        <div className="grid md:grid-cols-2 gap-6">
          {PROJECTS.map((p, idx) => (
            <ProjectCard key={p.name} p={p} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Experience ───────────────────────────────────────────────────────────────

function Experience() {
  const entries = [
    {
      role: "Software Engineering Intern",
      org: "BRIQUE Technology Solutions",
      period: "May 2024 – July 2024",
      tags: ["Java Servlets", "MySQL", "JDBC", "Apache Tomcat", "REST APIs"],
      bullets: [
        "Developed backend modules using Java Servlets, handling request processing and server-side logic",
        "Designed and optimised relational database schemas in MySQL for efficient data access",
        "Implemented JDBC database connectivity layers for robust data operations",
        "Deployed and managed applications on Apache Tomcat server",
        "Optimised request-processing logic, reducing response latency across key endpoints",
      ],
    },
    {
      role: "Systems Engineering Student",
      org: "B.Tech Computer Science Engineering",
      period: "2022 – Present",
      tags: ["C++", "Systems Programming", "Competitive Coding", "Algorithms"],
      bullets: [
        "Maintaining a 10.0 CGPA across core computer science and systems courses",
        "Specialising in low-latency systems, concurrency models, and OS internals",
        "Solved 100+ algorithm and data-structure problems across competitive platforms",
        "Built production-grade projects applying real engineering constraints",
      ],
    },
  ];

  return (
    <section id="experience" className="py-24 px-6 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <RevealSection>
          <SectionHeading
            label="experience"
            title="Engineering Journey"
            accent="cyan"
          />
        </RevealSection>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border md:left-8" />

          <div className="space-y-8">
            {entries.map((e, idx) => (
              <RevealSection key={e.role} delay={idx * 0.15}>
                <div className="pl-16 md:pl-20 relative">
                  {/* Dot */}
                  <div className="absolute left-4 md:left-6 top-2 w-4 h-4 rounded-full border-2 border-terminal-blue bg-background flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-terminal-blue" />
                  </div>

                  <div className="terminal-card rounded-lg p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-display font-bold text-foreground">
                          {e.role}
                        </h3>
                        <p className="text-sm text-terminal-cyan font-mono">
                          {e.org}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground border border-border px-2 py-1 rounded-sm self-start shrink-0">
                        <Clock className="inline w-3 h-3 mr-1" />
                        {e.period}
                      </span>
                    </div>

                    <ul className="space-y-1.5 mb-4">
                      {e.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-terminal-green shrink-0 mt-0.5" />
                          {b}
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap gap-1.5">
                      {e.tags.map((t) => (
                        <span key={t} className="tech-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Engineering Philosophy ───────────────────────────────────────────────────

function Philosophy() {
  const pillars = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Performance First",
      desc: "Latency and memory efficiency are first-class design concerns — not afterthoughts. Every architecture decision is evaluated through a performance lens before it ships.",
      color: "terminal-blue",
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Concurrency by Design",
      desc: "Systems are designed for parallelism from the ground up. Concurrency isn't bolted on — the data model, synchronisation strategy, and critical paths are all designed in tandem.",
      color: "terminal-green",
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Measure Everything",
      desc: "Profiling and benchmarking drive every optimisation decision. Intuition is a starting point — perf counters, Valgrind, and instrumented benchmarks are the truth.",
      color: "terminal-cyan",
    },
  ];

  return (
    <section id="philosophy" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <RevealSection>
          <SectionHeading
            label="philosophy"
            title="Engineering Philosophy"
            subtitle="Core principles that guide every system I design and build."
            accent="green"
          />
        </RevealSection>

        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((p, idx) => (
            <RevealSection key={p.title} delay={idx * 0.15}>
              <div className="terminal-card rounded-lg p-6 h-full relative overflow-hidden group">
                {/* Background glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, oklch(${
                      p.color === "terminal-blue"
                        ? "0.598 0.183 255.6"
                        : p.color === "terminal-green"
                          ? "0.725 0.195 149.8"
                          : "0.695 0.155 198.5"
                    } / 0.06), transparent 70%)`,
                  }}
                />

                <div className={`text-${p.color} mb-4`}>{p.icon}</div>
                <h3 className="font-display font-bold text-xl text-foreground mb-3">
                  {p.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.desc}
                </p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Achievements ─────────────────────────────────────────────────────────────

function StatMonitorCard({
  value,
  label,
  sub,
  icon,
  accentColor,
  fill,
  isActive,
  ocid,
  delay,
}: {
  value: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  accentColor: string;
  fill: number;
  isActive?: boolean;
  ocid: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <RevealSection delay={delay}>
      <motion.div
        ref={ref}
        data-ocid={ocid}
        className={`stat-monitor rounded-sm p-5 flex flex-col gap-3 group ${isActive ? "active-stat" : ""}`}
        style={
          {
            ["--stat-accent-color" as string]: accentColor,
            ["--stat-fill" as string]: inView ? fill : 0,
          } as React.CSSProperties
        }
      >
        {/* Top row: label + status dot */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/60">{icon}</span>
            <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
              {label}
            </span>
          </div>
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 6px ${accentColor}`,
            }}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Value */}
        <div
          className="font-mono text-4xl font-bold tracking-tight"
          style={{
            color: accentColor,
            textShadow: `0 0 20px ${accentColor}60`,
          }}
        >
          {value}
        </div>

        {/* Sub label */}
        <p className="font-mono text-xs text-muted-foreground leading-relaxed">
          {sub}
        </p>
      </motion.div>
    </RevealSection>
  );
}

function Achievements() {
  const stats = [
    {
      value: "100+",
      label: "Problems Solved",
      sub: "Competitive programming platforms",
      icon: <Code2 className="w-3.5 h-3.5" />,
      accentColor: "oklch(0.725 0.195 149.8)",
      fill: 1,
      isActive: false,
    },
    {
      value: "10.0",
      label: "CGPA",
      sub: "Perfect academic score — top of cohort",
      icon: <Award className="w-3.5 h-3.5" />,
      accentColor: "oklch(0.598 0.183 255.6)",
      fill: 1,
      isActive: true,
    },
    {
      value: "2",
      label: "Production Projects",
      sub: "Real engineering constraints, shipped",
      icon: <Layers className="w-3.5 h-3.5" />,
      accentColor: "oklch(0.695 0.155 198.5)",
      fill: 0.5,
      isActive: false,
    },
    {
      value: "4+",
      label: "Tech Categories",
      sub: "Languages, systems, tools, concepts",
      icon: <GitBranch className="w-3.5 h-3.5" />,
      accentColor: "oklch(0.78 0.17 83.5)",
      fill: 0.75,
      isActive: false,
    },
  ];

  return (
    <section id="achievements" className="py-24 px-6 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <RevealSection>
          <SectionHeading
            label="achievements"
            title="By the Numbers"
            accent="blue"
          />
        </RevealSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => (
            <StatMonitorCard
              key={s.label}
              value={s.value}
              label={s.label}
              sub={s.sub}
              icon={s.icon}
              accentColor={s.accentColor}
              fill={s.fill}
              isActive={s.isActive}
              ocid={`achievements.item.${idx + 1}`}
              delay={idx * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── GitHub Activity ──────────────────────────────────────────────────────────

function GitHubActivity() {
  return (
    <section id="github" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <RevealSection>
          <SectionHeading
            label="github"
            title="GitHub Activity"
            subtitle="Open source contributions and project activity."
            accent="green"
          />
        </RevealSection>

        <RevealSection delay={0.1}>
          <div className="terminal-card rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Github className="w-5 h-5 text-terminal-green" />
              <a
                href="https://github.com/tikoneaayush"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-terminal-cyan hover:text-terminal-green transition-colors"
              >
                github.com/tikoneaayush
              </a>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </div>

            {/* Contribution grid */}
            <div className="mb-6 overflow-x-auto">
              <ContribGrid />
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-6">
              <span>Less</span>
              {[0.08, 0.2, 0.45, 0.7, 0.95].map((o) => (
                <div
                  key={o}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: `rgba(22,197,94,${o})` }}
                />
              ))}
              <span>More</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 border-t border-border pt-5">
              {[
                {
                  label: "Repositories",
                  value: "12+",
                  icon: <GitBranch className="w-4 h-4" />,
                },
                {
                  label: "Commits",
                  value: "200+",
                  icon: <Activity className="w-4 h-4" />,
                },
                {
                  label: "Stars",
                  value: "8+",
                  icon: <Star className="w-4 h-4" />,
                },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="flex justify-center text-terminal-green mb-1">
                    {s.icon}
                  </div>
                  <div className="font-mono text-xl font-bold text-foreground">
                    {s.value}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

// ─── ContactHint ──────────────────────────────────────────────────────────────

function ContactHint({ hint }: { hint: string }) {
  return (
    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 font-mono text-[10px] text-terminal-green mt-0.5 text-center">
      {hint}
    </span>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────

const CONTACT_EMAIL = "aayushtikone7@gmail.com";

function Contact({ actor }: { actor: ReturnType<typeof useActor>["actor"] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [copied, setCopied] = useState(false);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      toast.success("Email copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy email.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (!actor) {
      toast.error("Backend not ready. Please try again.");
      return;
    }
    setStatus("loading");
    try {
      await actor.submitMessage(name.trim(), email.trim(), message.trim());
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
      toast.success("Message sent! I'll get back to you soon.");
    } catch {
      setStatus("error");
      toast.error("Failed to send message. Please try again.");
    }
  };

  return (
    <section id="contact" className="py-24 px-6 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <RevealSection>
          <SectionHeading
            label="contact"
            title="Get in Touch"
            subtitle="Interested in collaboration, internships, or just want to talk systems programming?"
            accent="cyan"
          />
        </RevealSection>

        <div className="grid md:grid-cols-2 gap-10">
          <RevealSection delay={0.1}>
            <div className="space-y-6">
              <div className="terminal-card rounded-lg p-5">
                <p className="font-mono text-xs text-terminal-green mb-3">
                  $ cat contact.json
                </p>
                <pre className="font-mono text-xs text-muted-foreground leading-relaxed overflow-x-auto">
                  {`{
  "name": "Aayush Tikone",
  "role": "Systems Engineering Student",
  "open_to": [
    "Internships",
    "Research collaboration",
    "Open source projects"
  ],
  "response_time": "< 24 hours",
  "contacts": {
    "github": "github.com/tikoneaayush",
    "linkedin": "linkedin.com/in/aayushtikone",
    "email": "aayushtikone7@gmail.com"
  }
}`}
                </pre>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative group flex flex-col items-center">
                  <a
                    href="https://github.com/tikoneaayush"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="contact.github.link"
                    className="flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-terminal-green border border-border hover:border-terminal-green/50 px-3 py-2 rounded-sm transition-all"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                  <ContactHint hint="> open_repository()" />
                </div>
                <div className="relative group flex flex-col items-center">
                  <a
                    href="https://www.linkedin.com/in/aayushtikone"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="contact.linkedin.link"
                    className="flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-terminal-blue border border-border hover:border-terminal-blue/50 px-3 py-2 rounded-sm transition-all"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                  <ContactHint hint="> open_profile()" />
                </div>
                <div className="relative group flex flex-col items-center">
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    data-ocid="contact.email.link"
                    className="flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-terminal-cyan border border-border hover:border-terminal-cyan/50 px-3 py-2 rounded-sm transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                  <ContactHint hint="> compose_message()" />
                </div>
                <div className="relative group flex flex-col items-center">
                  <button
                    type="button"
                    onClick={copyEmail}
                    data-ocid="contact.copy_email.button"
                    className="flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-terminal-amber border border-border hover:border-terminal-amber/50 px-3 py-2 rounded-sm transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? "Copied!" : "Copy Email"}
                  </button>
                  <ContactHint hint="> copy(email)" />
                </div>
              </div>
            </div>
          </RevealSection>

          <RevealSection delay={0.2}>
            <div className="terminal-card rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <span className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="font-mono text-xs text-muted-foreground ml-2">
                  send_message.sh
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="font-mono text-xs text-terminal-cyan block mb-1.5"
                  >
                    --name
                  </label>
                  <Input
                    id="contact-name"
                    data-ocid="contact.name.input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="font-mono text-sm bg-input border-border focus:border-terminal-blue focus:ring-terminal-blue/30"
                    disabled={status === "loading"}
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="font-mono text-xs text-terminal-cyan block mb-1.5"
                  >
                    --email
                  </label>
                  <Input
                    id="contact-email"
                    data-ocid="contact.email.input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="font-mono text-sm bg-input border-border focus:border-terminal-blue focus:ring-terminal-blue/30"
                    disabled={status === "loading"}
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="font-mono text-xs text-terminal-cyan block mb-1.5"
                  >
                    --message
                  </label>
                  <Textarea
                    id="contact-message"
                    data-ocid="contact.message.textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={5}
                    className="font-mono text-sm bg-input border-border focus:border-terminal-blue focus:ring-terminal-blue/30 resize-none"
                    disabled={status === "loading"}
                  />
                </div>

                <Button
                  data-ocid="contact.submit_button"
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full font-mono text-sm bg-terminal-blue/20 border border-terminal-blue/60 text-terminal-blue hover:bg-terminal-blue/30 hover:border-terminal-blue transition-all"
                  variant="outline"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="mr-2 w-4 h-4" />
                      ./send_message
                    </>
                  )}
                </Button>

                <AnimatePresence>
                  {status === "success" && (
                    <motion.div
                      data-ocid="contact.success_state"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="font-mono text-xs text-terminal-green border border-terminal-green/30 bg-terminal-green/5 rounded-sm px-3 py-2 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Message queued. Response incoming.
                    </motion.div>
                  )}
                  {status === "error" && (
                    <motion.div
                      data-ocid="contact.error_state"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="font-mono text-xs text-destructive border border-destructive/30 bg-destructive/5 rounded-sm px-3 py-2 flex items-center gap-2"
                    >
                      <span>✕</span>
                      Error: Failed to send. Retry?
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-mono text-xs text-muted-foreground">
          <span className="text-terminal-green">aayush@portfolio</span>
          <span className="text-muted-foreground">:~$ </span>
          <span className="text-foreground">exit 0</span>
        </div>
        <p className="font-mono text-xs text-muted-foreground text-center">
          © {year}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-terminal-cyan hover:text-terminal-blue transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}

// ─── CLI Easter Egg ───────────────────────────────────────────────────────────

type EggLine = { text: string; color?: "green" | "cyan" | "error" | "muted" };

function CliEasterEgg() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [lines, setLines] = useState<EggLine[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = () => {
    for (const t of timeoutsRef.current) clearTimeout(t);
    timeoutsRef.current = [];
  };

  // Global keydown listener to open overlay
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || target.isContentEditable)
        return;
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setOpen(true);
        setInput(e.key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Escape closes the overlay
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when lines change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: clearTimeouts is stable ref-based
  useEffect(() => () => clearTimeouts(), []);

  const addLine = (line: EggLine) => {
    setLines((prev) => [...prev.slice(-20), line]);
  };

  const runCommand = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    addLine({ text: `$ ${raw}`, color: "green" });

    switch (cmd) {
      case "help":
        addLine({
          text: "Available commands: projects | resume | github | contact | clear",
          color: "cyan",
        });
        break;
      case "projects":
        addLine({ text: "→ Navigating to projects...", color: "muted" });
        {
          const t = setTimeout(() => {
            document
              .getElementById("projects")
              ?.scrollIntoView({ behavior: "smooth" });
            setOpen(false);
          }, 600);
          timeoutsRef.current.push(t);
        }
        break;
      case "resume":
        addLine({ text: "→ Opening GitHub profile...", color: "muted" });
        window.open("https://github.com/tikoneaayush", "_blank");
        {
          const t = setTimeout(() => setOpen(false), 600);
          timeoutsRef.current.push(t);
        }
        break;
      case "github":
        addLine({
          text: "→ Opening github.com/tikoneaayush...",
          color: "muted",
        });
        window.open("https://github.com/tikoneaayush", "_blank");
        {
          const t = setTimeout(() => setOpen(false), 600);
          timeoutsRef.current.push(t);
        }
        break;
      case "contact":
        addLine({ text: "→ Navigating to contact...", color: "muted" });
        {
          const t = setTimeout(() => {
            document
              .getElementById("contact")
              ?.scrollIntoView({ behavior: "smooth" });
            setOpen(false);
          }, 600);
          timeoutsRef.current.push(t);
        }
        break;
      case "clear":
        setLines([]);
        break;
      default:
        if (cmd !== "") {
          addLine({ text: `command not found: ${cmd}`, color: "error" });
        }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      runCommand(input);
      setInput("");
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Terminal overlay */}
          <motion.div
            data-ocid="cli.dialog"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-8 left-1/2 z-50 w-full max-w-md -translate-x-1/2 terminal-card rounded-lg overflow-hidden"
            style={{
              boxShadow:
                "0 0 40px oklch(0.725 0.195 149.8 / 0.2), 0 20px 60px oklch(0 0 0 / 0.6)",
            }}
          >
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                CLIfolio — press ESC to close
              </span>
              <button
                type="button"
                data-ocid="cli.close_button"
                onClick={() => setOpen(false)}
                className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Output */}
            <div className="px-4 py-3 min-h-[80px] max-h-[160px] overflow-y-auto font-mono text-xs space-y-0.5 bg-background/60">
              {lines.slice(-6).map((line) => (
                <div
                  key={`${line.color}-${line.text}`}
                  className={
                    line.color === "green"
                      ? "text-terminal-green"
                      : line.color === "cyan"
                        ? "text-terminal-cyan"
                        : line.color === "error"
                          ? "text-destructive"
                          : "text-muted-foreground"
                  }
                >
                  {line.text}
                </div>
              ))}
              {lines.length === 0 && (
                <div className="text-muted-foreground/50">
                  Type a command. Try{" "}
                  <span className="text-terminal-cyan">help</span>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input row */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-card/60">
              <span className="font-mono text-xs text-terminal-green shrink-0">
                $
              </span>
              <input
                ref={inputRef}
                data-ocid="cli.input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                className="flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/40 caret-terminal-green"
                placeholder="type a command..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <span className="cursor-blink text-terminal-green text-xs font-mono">
                ▋
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const { actor, isFetching } = useActor();
  const [visitorCount, setVisitorCount] = useState<bigint | null>(null);
  const [didCount, setDidCount] = useState(false);

  useEffect(() => {
    if (!actor || isFetching || didCount) return;
    setDidCount(true);
    (async () => {
      try {
        await actor.incrementVisitorCount();
        const count = await actor.getVisitorCount();
        setVisitorCount(count);
      } catch {
        // silently fail
      }
    })();
  }, [actor, isFetching, didCount]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CLICursor />
      <Toaster
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "font-mono text-xs bg-card border-border",
            success: "text-terminal-green border-terminal-green/30",
            error: "text-destructive border-destructive/30",
          },
        }}
      />
      <CliEasterEgg />
      <Nav visitorCount={visitorCount} />
      <main>
        <Hero />
        <About />
        <TechArchitecture />
        <Projects />
        <Experience />
        <Philosophy />
        <Achievements />
        <GitHubActivity />
        <Contact actor={actor} />
      </main>
      <Footer />
    </div>
  );
}
