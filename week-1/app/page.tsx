"use client";

import React, { useState, useEffect, useRef } from "react";

// --- Types ---
type ProjectCategory = "All" | "Systems & Cloud" | "Full Stack" | "AI & ML";

interface Project {
  id: string;
  title: string;
  category: "Systems & Cloud" | "Full Stack" | "AI & ML";
  description: string;
  architecture: string;
  tags: string[];
  githubUrl: string;
  liveUrl?: string;
  featured?: boolean;
}

interface Experience {
  role: string;
  company: string;
  period: string;
  location: string;
  bullets: string[];
  techStack: string[];
}

interface Education {
  degree: string;
  institution: string;
  period: string;
  gpa: string;
  honors: string;
  coursework: string[];
}

// --- Data ---
const PROJECTS: Project[] = [
  {
    id: "1",
    title: "Distributed Key-Value Store",
    category: "Systems & Cloud",
    description: "A fault-tolerant distributed key-value storage engine inspired by Raft consensus algorithm.",
    architecture: "Implemented leader election, log replication, snapshotting, and gRPC communication for node clustering.",
    tags: ["Go", "gRPC", "Raft", "Distributed Systems", "Docker"],
    githubUrl: "https://github.com",
    featured: true,
  },
  {
    id: "2",
    title: "Algorithmic Code Visualizer",
    category: "Full Stack",
    description: "Interactive visual execution platform for graph traversal, dynamic programming, and sorting algorithms.",
    architecture: "Custom AST parser in TypeScript calculating real-time memory frames and time complexity steps on Web Workers.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Canvas API", "Web Workers"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    featured: true,
  },
  {
    id: "3",
    title: "Neural Code Reviewer Bot",
    category: "AI & ML",
    description: "Automated GitHub Action bot utilizing transformer models to detect AST anti-patterns and performance bottlenecks.",
    architecture: "Built with PyTorch & HuggingFace, fine-tuned on 45,000+ open-source PR reviews with LangChain pipeline.",
    tags: ["Python", "PyTorch", "FastAPI", "Docker", "HuggingFace"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
  },
  {
    id: "4",
    title: "High-Throughput Packet Sniffer",
    category: "Systems & Cloud",
    description: "Low-overhead multi-threaded network packet analyzer capable of processing 100k+ packets/sec with zero drops.",
    architecture: "Leveraged C++20, raw Linux AF_PACKET sockets, ring buffers, and SIMD protocol header decoding.",
    tags: ["C++20", "Linux Kernel", "Networking", "Multithreading"],
    githubUrl: "https://github.com",
  },
  {
    id: "5",
    title: "Campus Peer Mentorship Portal",
    category: "Full Stack",
    description: "Real-time tutoring match platform adopted by university CS department with 1,200+ active student users.",
    architecture: "PostgreSQL with row-level security, Prisma ORM, Redis caching layer, and WebSockets for instant messaging.",
    tags: ["React", "Node.js", "PostgreSQL", "Redis", "Socket.io"],
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
  },
  {
    id: "6",
    title: "Medical Image Segmentation CNN",
    category: "AI & ML",
    description: "U-Net architecture for biomedical MRI scan segmentation achieving 94.2% Dice similarity coefficient.",
    architecture: "Engineered data augmentation pipeline using Albumentations and trained on Google Cloud TPUs with mixed precision.",
    tags: ["Python", "TensorFlow", "OpenCV", "GCP", "Pandas"],
    githubUrl: "https://github.com",
  },
];

const SKILL_CATEGORIES = [
  {
    name: "Languages",
    skills: ["TypeScript / JavaScript", "Python", "C / C++", "Go (Golang)", "Java", "SQL"],
  },
  {
    name: "Systems & Backend",
    skills: ["Node.js / Express", "FastAPI", "PostgreSQL", "Redis", "gRPC", "Docker & Linux"],
  },
  {
    name: "Frontend & UI",
    skills: ["React / Next.js", "Tailwind CSS", "HTML5 & CSS3", "State Management", "Responsive UI"],
  },
  {
    name: "Foundational CS",
    skills: ["Data Structures & Algorithms", "Operating Systems", "Computer Networks", "Distributed Computing", "Git & CI/CD"],
  },
];

const EXPERIENCES: Experience[] = [
  {
    role: "Software Engineering Intern",
    company: "CloudScale Technologies",
    period: "Jun 2025 – Aug 2025",
    location: "San Francisco, CA (Hybrid)",
    bullets: [
      "Engineered microservice metrics ingestion pipeline using Go and Kafka, cutting pipeline latency by 32%.",
      "Created 14 automated integration test suites across Kubernetes deployments, reducing regression bugs in production.",
      "Collaborated with senior platform engineers on optimizing PostgreSQL database connection pools under peak traffic.",
    ],
    techStack: ["Go", "Kafka", "Kubernetes", "PostgreSQL", "Docker"],
  },
  {
    role: "Undergraduate Teaching Assistant (CS201: Data Structures)",
    company: "Department of Computer Science",
    period: "Jan 2025 – May 2025",
    location: "University Campus",
    bullets: [
      "Mentored 60+ students weekly in C++ memory management, tree traversals, graph algorithms, and asymptotic complexity.",
      "Conducted weekly lab coding sessions, debugged assignments, and graded midterm algorithms examinations.",
    ],
    techStack: ["C++", "Valgrind", "GDB", "Git", "Linux"],
  },
];

const EDUCATION: Education = {
  degree: "Bachelor of Science in Computer Science",
  institution: "State University School of Computing",
  period: "Expected Graduation: May 2026",
  gpa: "3.96 / 4.00",
  honors: "Dean's Honor List (All Semesters), Departmental Merit Scholar",
  coursework: [
    "Design & Analysis of Algorithms",
    "Operating Systems & Architecture",
    "Distributed Systems",
    "Database Management Systems",
    "Computer Networks",
    "Object-Oriented Software Design",
  ],
};

export default function ComputerSciencePortfolio() {
  const [activeTab, setActiveTab] = useState<"experience" | "education">("experience");
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>("All");
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Terminal state
  const [terminalHistory, setTerminalHistory] = useState<Array<{ cmd: string; output: string | React.ReactNode }>>([
    {
      cmd: "whoami",
      output: "mike.newton (CS Undergrad, Software Engineer, Problem Solver)",
    },
    {
      cmd: "help",
      output: "Available commands: 'about', 'skills', 'projects', 'education', 'contact', 'clear', 'sudo hire'",
    },
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [formSent, setFormSent] = useState(false);

  const filteredProjects = selectedCategory === "All"
    ? PROJECTS
    : PROJECTS.filter((p) => p.category === selectedCategory);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("michaelnewton1708@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  // Terminal Command Executor
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCmd = terminalInput.trim().toLowerCase();
    if (!cleanCmd) return;

    let output: string | React.ReactNode = "";

    switch (cleanCmd) {
      case "help":
        output = "Available commands: 'about', 'skills', 'projects', 'education', 'contact', 'clear', 'sudo hire'";
        break;
      case "about":
        output = "Passionate 3rd-year CS student with a strong background in Systems, Distributed Services, and Full-Stack development. Currently open for Summer & Fall internships!";
        break;
      case "skills":
        output = "Languages: TypeScript, Python, C++, Go, Java, SQL | Stack: React, Next.js, Node, Docker, PostgreSQL, Linux, Git";
        break;
      case "projects":
        output = "Key highlights: Distributed Raft KV Store (Go), Algorithm Visualizer (Next.js), Neural Reviewer (PyTorch). Scroll to Projects section to see source code.";
        break;
      case "education":
        output = `B.S. in Computer Science | GPA: ${EDUCATION.gpa} | ${EDUCATION.honors}`;
        break;
      case "contact":
        output = "Email: michaelnewton1708@gmail.com | GitHub: github.com/Axcelion017| LinkedIn: www.linkedin.com/in/michael-alexander-newton-255a79340";
        break;
      case "sudo hire":
      case "hire":
        output = "ACCESS GRANTED: Candidate profile unlocked! Contact me via email or submit a quick note in the contact form below.";
        break;
      case "clear":
        setTerminalHistory([]);
        setTerminalInput("");
        return;
      default:
        output = `Command not recognized: '${cleanCmd}'. Type 'help' to see valid commands.`;
    }

    setTerminalHistory((prev) => [...prev, { cmd: terminalInput, output }]);
    setTerminalInput("");
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setFormSent(true);
    setTimeout(() => {
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      setFormSent(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-200 selection:bg-cyan-500 selection:text-black antialiased font-sans">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-24">
        {/* --- Navigation Bar --- */}
        <nav className="flex items-center justify-between py-4 px-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 sticky top-4 z-50 shadow-2xl">
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-mono font-bold text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-150">
              AC
            </div>
            <span className="font-mono text-sm tracking-tight text-slate-200 font-semibold group-hover:text-cyan-400 transition-colors duration-150">
              Mike.cs
            </span>
          </a>

          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#about" className="hover:text-cyan-400 transition-colors duration-150">About</a>
            <a href="#projects" className="hover:text-cyan-400 transition-colors duration-150">Projects</a>
            <a href="#skills" className="hover:text-cyan-400 transition-colors duration-150">Skills</a>
            <a href="#experience" className="hover:text-cyan-400 transition-colors duration-150">Experience</a>
            <a href="#terminal" className="hover:text-cyan-400 transition-colors duration-150">Terminal</a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#contact"
              className="text-xs sm:text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 px-4 py-2 rounded-xl transition-all duration-150 ease-out shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              Get in Touch
            </a>
          </div>
        </nav>

        {/* --- Hero Section --- */}
        <section id="about" className="pt-8 sm:pt-14 space-y-8">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/30 text-emerald-400 text-xs font-mono shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Available for Summer/Fall 2026 Internships
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8 space-y-6">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Architecting systems & <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400">
                  scalable software solutions.
                </span>
              </h1>

              <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
                Hi, I'm <strong className="text-white">Michael Alexander Newton</strong> — a Computer Science student passionate about distributed computing, systems architecture, and modern full-stack engineering. Focused on writing performant, clean, and reliable code.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#projects"
                  className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-semibold text-sm transition-all duration-150 ease-out shadow-lg shadow-cyan-500/25 active:scale-95 flex items-center gap-2"
                >
                  <span>Explore Projects</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </a>

                <a
                  href="#terminal"
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-slate-200 border border-slate-800 font-mono text-sm transition-all duration-150 ease-out active:scale-95 flex items-center gap-2"
                >
                  <span className="text-cyan-400">&gt;_</span>
                  <span>Launch Terminal</span>
                </a>

                <button
                  onClick={handleCopyEmail}
                  className="px-4 py-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 active:bg-slate-700 text-slate-300 border border-slate-800/80 text-sm transition-all duration-150 ease-out active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{copiedEmail ? "Copied to Clipboard!" : "Copy Email"}</span>
                </button>
              </div>
            </div>

            {/* Quick Stat Metric Card */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md hover:border-cyan-500/40 transition-colors duration-150">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-cyan-400">3.96</div>
                <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">CS Cumulative GPA</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md hover:border-indigo-500/40 transition-colors duration-150">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-indigo-400">2+</div>
                <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">Internships & TA</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md hover:border-emerald-500/40 transition-colors duration-150">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400">15+</div>
                <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">Git Repositories</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md hover:border-sky-500/40 transition-colors duration-150">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-sky-400">250+</div>
                <div className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">Problems Solved</div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Interactive Terminal Section --- */}
        <section id="terminal" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span className="text-cyan-400 font-mono">&gt;</span> Interactive Shell
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Explore profile via command line or click suggestion tags below.</p>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
              bash v5.2
            </span>
          </div>

          {/* Terminal Window Box */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800/90 shadow-2xl overflow-hidden font-mono text-xs sm:text-sm">
            {/* Header / Mac Buttons */}
            <div className="bg-slate-900/90 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              </div>
              <span className="text-xs text-slate-400">alex@workstation: ~/portfolio</span>
              <button
                onClick={() => setTerminalHistory([])}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-150"
              >
                Clear
              </button>
            </div>

            {/* Terminal Body */}
            <div className="p-4 sm:p-6 space-y-3 min-h-[220px] max-h-[340px] overflow-y-auto">
              <div className="text-slate-500 text-xs">
                Welcome to Mike's CS Shell. Type <span className="text-cyan-400">'help'</span> for an index of all commands.
              </div>

              {terminalHistory.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <span className="text-emerald-400">visitor@web:~$</span>
                    <span>{item.cmd}</span>
                  </div>
                  <div className="text-slate-300 pl-4 border-l border-slate-800">{item.output}</div>
                </div>
              ))}

              <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 text-cyan-400 pt-1">
                <span className="text-emerald-400 whitespace-nowrap">visitor@web:~$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="type a command... (e.g. skills, projects, sudo hire)"
                  className="bg-transparent text-slate-100 focus:outline-none w-full font-mono text-xs sm:text-sm placeholder-slate-600"
                  autoComplete="off"
                  spellCheck="false"
                />
              </form>
              <div ref={terminalEndRef} />
            </div>

            {/* Quick Command Pills */}
            <div className="bg-slate-900/60 p-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500">Quick run:</span>
              {["about", "skills", "projects", "education", "sudo hire", "clear"].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => {
                    setTerminalInput(cmd);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-cyan-300 transition-colors duration-150 cursor-pointer"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* --- Projects Section --- */}
        <section id="projects" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Engineered Projects</h2>
              <p className="text-sm text-slate-400 mt-1">Highlighted applications, systems code, and academic work.</p>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
              {(["All", "Systems & Cloud", "Full Stack", "AI & ML"] as ProjectCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all duration-150 ease-out cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group rounded-2xl bg-slate-900/60 border border-slate-800/90 p-6 flex flex-col justify-between hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all duration-200 ease-out hover:-translate-y-1 shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-800/40">
                      {project.category}
                    </span>
                    <div className="flex items-center gap-3">
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="GitHub Repository"
                        className="text-slate-400 hover:text-white transition-colors duration-150"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                      </a>
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Live Demo"
                          className="text-slate-400 hover:text-cyan-400 transition-colors duration-150"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors duration-150">
                    {project.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300">
                    <span className="text-cyan-400 font-semibold font-mono">Arch: </span>
                    {project.architecture}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/60">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/70 text-slate-300 border border-slate-700/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- Technical Skills Section --- */}
        <section id="skills" className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Technical Arsenal</h2>
            <p className="text-sm text-slate-400 mt-1">Core languages, backend tools, and CS foundations.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SKILL_CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all duration-150"
              >
                <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">
                  {cat.name}
                </h3>
                <ul className="space-y-2.5">
                  {cat.skills.map((skill) => (
                    <li key={skill} className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* --- Interactive Experience & Education Toggle --- */}
        <section id="experience" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Background & Academics</h2>
              <p className="text-sm text-slate-400 mt-1">Professional experience, university milestones, and coursework.</p>
            </div>

            {/* Tab Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setActiveTab("experience")}
                className={`text-xs px-4 py-2 rounded-lg font-semibold transition-all duration-150 ease-out cursor-pointer ${
                  activeTab === "experience"
                    ? "bg-cyan-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Work Experience
              </button>
              <button
                onClick={() => setActiveTab("education")}
                className={`text-xs px-4 py-2 rounded-lg font-semibold transition-all duration-150 ease-out cursor-pointer ${
                  activeTab === "education"
                    ? "bg-cyan-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Education & Honors
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "experience" ? (
            <div className="space-y-4">
              {EXPERIENCES.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-cyan-500/40 transition-colors duration-150 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h3 className="text-base font-bold text-white">{exp.role}</h3>
                      <p className="text-xs text-cyan-400 font-medium">{exp.company} • {exp.location}</p>
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 self-start sm:self-auto">
                      {exp.period}
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {exp.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                        <span className="text-cyan-400 mt-1">▹</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {exp.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">{EDUCATION.degree}</h3>
                  <p className="text-xs text-cyan-400 font-medium">{EDUCATION.institution}</p>
                </div>
                <div className="text-right self-start sm:self-auto">
                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                    {EDUCATION.period}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Academic Standing</div>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-1">GPA: {EDUCATION.gpa}</div>
                  <div className="text-xs text-slate-300 mt-1">{EDUCATION.honors}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Research Interests</div>
                  <div className="text-xs text-slate-300 mt-2 space-y-1">
                    <p>• Consensus protocols and distributed state machines</p>
                    <p>• High-concurrency network runtime architectures</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">Key Coursework</h4>
                <div className="flex flex-wrap gap-2">
                  {EDUCATION.coursework.map((course) => (
                    <span
                      key={course}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium"
                    >
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* --- Interactive Contact Section --- */}
        <section id="contact" className="space-y-6">
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Info Column */}
              <div className="lg:col-span-5 space-y-6">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">Initiate Contact</span>
                <h2 className="text-3xl font-extrabold text-white">Let's discuss an engineering opportunity.</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  I'm actively seeking Software Engineering internships and full-time opportunities. Feel free to reach out via email or send a direct message here.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span>michaelnewton1708@gmail.com</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span>United States (Open to Relocation & Remote)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleCopyEmail}
                    className="text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-cyan-400 px-4 py-2.5 rounded-xl border border-slate-700 transition-all duration-150 ease-out active:scale-95"
                  >
                    {copiedEmail ? "✓ Copied: michaelnewton1708@gmail.com" : "Copy Email to Clipboard"}
                  </button>
                </div>
              </div>

              {/* Right Form Column */}
              <div className="lg:col-span-7">
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Your Name</label>
                      <input
                        type="text"
                        placeholder="Ada Lovelace"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">Your Email</label>
                      <input
                        type="email"
                        placeholder="ada@company.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Message</label>
                    <textarea
                      rows={4}
                      placeholder="Hi Alex, I saw your distributed key-value store project and would love to chat about..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold text-sm transition-all duration-150 ease-out shadow-lg shadow-cyan-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {formSent ? (
                      <span className="text-slate-950">✓ Message Dispatched Successfully!</span>
                    ) : (
                      <>
                        <span>Transmit Message</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* --- Footer --- */}
        <footer className="pt-8 pb-12 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Michael Alexander Newton • Computer Science Portfolio</p>
          <p className="font-mono">Built with Next.js & Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}