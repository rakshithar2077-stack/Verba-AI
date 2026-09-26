import { useState, useRef, useEffect } from "react"
import Tesseract from "tesseract.js"
import { pipeline } from "@huggingface/transformers"

let translator = null
let aiModel = null
let aiModelPromise = null

async function getTranslator() {
  if (!translator) {
    translator = await pipeline(
      "translation",
      "Xenova/nllb-200-distilled-600M",
      {
        dtype: "q8"
      }
    )
  }
  return translator
}

async function createAIModel() {
  const supportsWebGPU = typeof navigator !== "undefined" && !!navigator.gpu
  if (supportsWebGPU) {
    try {
      return await pipeline(
        "text-generation",
        "onnx-community/SmolLM2-135M-Instruct-ONNX",
        {
          device: "webgpu",
          dtype: "q4f16"
        }
      )
    } catch (error) {
      console.warn("WebGPU AI load failed, using CPU fallback.", error)
    }
  }
  return await pipeline(
    "text-generation",
    "onnx-community/SmolLM2-135M-Instruct-ONNX",
    {
      dtype: "q4"
    }
  )
}

function getAIModel() {
  if (aiModel) return Promise.resolve(aiModel)
  if (!aiModelPromise) {
    aiModelPromise = createAIModel()
      .then((model) => {
        aiModel = model
        return model
      })
      .catch((error) => {
        aiModelPromise = null
        throw error
      })
  }
  return aiModelPromise
}

function warmAIModel() {
  getAIModel().catch((error) => {
    console.warn("Background AI warm-up failed:", error)
  })
}

const demoWordCoach = {
  friendship: {
    meaning: "A close and caring relationship between people who trust and support each other.",
    breakdown: "friend-ship",
    pronunciation: "FRIEND-ship",
    tip: "Say friend first, then add ship smoothly."
  },
  reading: {
    meaning: "The activity of looking at written words and understanding their meaning.",
    breakdown: "read-ing",
    pronunciation: "REE-ding",
    tip: "Read each part clearly, then blend the word."
  },
  difficult: {
    meaning: "Not easy to do, understand, or pronounce.",
    breakdown: "dif-fi-cult",
    pronunciation: "DIF-fi-cult",
    tip: "Break it into three small parts and say them slowly."
  },
  confidence: {
    meaning: "The feeling of being sure about your ability to do something.",
    breakdown: "con-fi-dence",
    pronunciation: "CON-fi-dence",
    tip: "Keep the first syllable strong and finish the word smoothly."
  },
  technology: {
    meaning: "Tools, systems, and methods created to solve problems or do useful work.",
    breakdown: "tech-nol-o-gy",
    pronunciation: "tek-NOL-uh-jee",
    tip: "Say it in four small parts instead of rushing the whole word."
  },
  inclusive: {
    meaning: "Designed so that different people can take part and feel supported.",
    breakdown: "in-clu-sive",
    pronunciation: "in-KLOO-siv",
    tip: "Stress the middle part: KLOO."
  },
  bustling: {
    meaning: "Full of busy activity, movement, and people.",
    breakdown: "bus-tling",
    pronunciation: "BUS-tling",
    tip: "Say bus first, then blend tling smoothly."
  },
  curiosity: {
    meaning: "A strong desire to learn or know more about something.",
    breakdown: "cu-ri-os-i-ty",
    pronunciation: "kyoo-ree-OS-uh-tee",
    tip: "Say it in small parts and stress OS."
  },
  learning: {
    meaning: "The process of gaining knowledge or a new skill.",
    breakdown: "learn-ing",
    pronunciation: "LERN-ing",
    tip: "Keep learn clear, then add ing."
  },
  support: {
    meaning: "Help or encouragement given to someone.",
    breakdown: "sup-port",
    pronunciation: "suh-PORT",
    tip: "Stress the second part: PORT."
  },
  student: {
    meaning: "A person who is learning or studying something.",
    breakdown: "stu-dent",
    pronunciation: "STOO-dent",
    tip: "Say the first part clearly, then finish with dent."
  },
  pronunciation: {
    meaning: "The way a word is spoken aloud.",
    breakdown: "pro-nun-ci-a-tion",
    pronunciation: "pruh-nun-see-AY-shun",
    tip: "Say each part slowly before blending them."
  },
  assistance: {
    meaning: "Help given to make a task easier.",
    breakdown: "as-sis-tance",
    pronunciation: "uh-SIS-tuhns",
    tip: "Stress SIS and keep the ending light."
  },
  communication: {
    meaning: "The process of sharing information, ideas, or feelings.",
    breakdown: "com-mu-ni-ca-tion",
    pronunciation: "kuh-myoo-nuh-KAY-shun",
    tip: "Break it into parts and stress KAY."
  }
}

function buildInstantWordHelp(word) {
  const key = word.toLowerCase()
  if (demoWordCoach[key]) return { word, ...demoWordCoach[key] }
  const cleaned = key.replace(/[^a-z]/g, "")
  let breakdown = cleaned
  if (cleaned.length >= 8) {
    const chunks = cleaned.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy](?=[^aeiouy]))?/g) || [cleaned]
    breakdown = chunks.filter(Boolean).join("-")
  } else if (cleaned.length >= 5) {
    const chunks = cleaned.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy](?=$|[^aeiouy]))?/g) || [cleaned]
    breakdown = chunks.filter(Boolean).join("-")
  }
  return {
    word,
    meaning: `In this passage, “${word}” refers to the idea described by the surrounding sentence.`,
    breakdown,
    pronunciation: word.toUpperCase(),
    tip: `Say ${word} in small parts, then blend the parts together slowly.`
  }
}

function extractAIText(result) {
  const generated = result?.[0]?.generated_text
  if (typeof generated === "string") return generated
  if (Array.isArray(generated)) {
    const last = generated[generated.length - 1]
    if (typeof last === "string") return last
    if (last?.content) return last.content
  }
  return ""
}

function App() {
  const [page, setPage] = useState("home")

  useEffect(() => {
    const timer = setTimeout(() => {
      const startWarmup = () => warmAIModel()
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        window.requestIdleCallback(startWarmup, { timeout: 2500 })
      } else {
        startWarmup()
      }
    }, 900)
    return () => clearTimeout(timer)
  }, [])
  const [image, setImage] = useState(null)
  const [ocrText, setOcrText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div style={{ ...styles.app, background: darkMode ? "#0f1020" : "#ffffff", color: darkMode ? "#f8fafc" : "#171725" }}>
      {page === "home" && (
        <HomePage
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onStart={() => setPage("upload")}
          onDashboard={() => setPage("dashboard")}
          onHowItWorks={() => setPage("howitworks")}
        />
      )}

      {page === "dashboard" && (
        <DashboardPage
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onBack={() => setPage("home")}
          onStart={() => setPage("upload")}
        />
      )}

      {page === "howitworks" && (
        <HowItWorksPage
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onBack={() => setPage("home")}
          onStart={() => setPage("upload")}
        />
      )}

      {page === "upload" && (
        <UploadPage
          image={image}
          setImage={setImage}
          ocrText={ocrText}
          setOcrText={setOcrText}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          onBack={() => setPage("home")}
          onContinue={() => setPage("reading")}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      )}

      {page === "reading" && (
        <ReadingWorkspace
          displayText={ocrText}
          onBack={() => setPage("upload")}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      )}
    </div>
  )
}

function HomePage({ darkMode, setDarkMode, onStart, onDashboard, onHowItWorks }) {
  return (
    <div style={{ ...styles.home, background: darkMode ? "radial-gradient(circle at 10% 10%,#4c1d95 0,transparent 25%),radial-gradient(circle at 90% 12%,#1e3a8a 0,transparent 23%),radial-gradient(circle at 55% 100%,#312e81 0,transparent 30%),linear-gradient(135deg,#090b18 0%,#111326 48%,#0b1020 100%)" : styles.home.background, color: darkMode ? "#f8fafc" : "#171725" }}>
      <div style={{ ...styles.homeNav, background: darkMode ? "rgba(17,19,38,.72)" : "rgba(255,255,255,.78)", borderColor: darkMode ? "rgba(167,139,250,.18)" : "rgba(226,232,240,.9)" }}>
        <div style={styles.brandMark}><div style={styles.brandLogo}>V</div><div><strong>Verba AI</strong><span>Inclusive Reading Assistant</span></div></div>
        <div style={styles.navLinks}>
          <button style={{ ...styles.navLink, color: darkMode ? "#ddd6fe" : "#475569" }} onClick={onDashboard}>Dashboard</button>
          <button style={{ ...styles.navLink, color: darkMode ? "#ddd6fe" : "#475569" }} onClick={onHowItWorks}>How it works</button>
          <button style={{ ...styles.navLink, color: darkMode ? "#f8fafc" : "#334155" }} onClick={() => setDarkMode((value) => !value)}>{darkMode ? "☀️" : "🌙"}</button>
        </div>
      </div>

      <div style={styles.heroShell}>
        <div style={styles.heroGlow}>
          <div style={{ ...styles.heroBadge, background: darkMode ? "rgba(167,139,250,.14)" : styles.heroBadge.background, color: darkMode ? "#c4b5fd" : styles.heroBadge.color, borderColor: darkMode ? "rgba(196,181,253,.25)" : styles.heroBadge.borderColor }}>
            ✦ AI-POWERED INCLUSIVE READING
          </div>
          <h1 style={{ ...styles.heroTitle, color: darkMode ? "#f8fafc" : styles.heroTitle.color }}>
            Read smarter. <span style={styles.gradientText}>Understand better.</span>
          </h1>
          <p style={{ ...styles.heroText, color: darkMode ? "#c7d2fe" : styles.heroText.color }}>
            Verba AI turns ordinary reading into an interactive, adaptive experience with voice tracking, AI assistance and multilingual support.
          </p>
          <div style={styles.heroActions}>
            <button style={styles.primaryButton} onClick={onStart}>Start a Reading Session →</button>
            <button style={{ ...styles.secondaryHeroButton, color: darkMode ? "#e9d5ff" : "#5b21b6", borderColor: darkMode ? "#5b4a8a" : "#ddd6fe", background: darkMode ? "rgba(91,74,138,.18)" : "rgba(255,255,255,.75)" }} onClick={onDashboard}>View Demo Dashboard</button>
          </div>
        </div>
        <div style={styles.heroPreview}>
          <div style={styles.previewTop}><span style={styles.previewDot}></span><span style={styles.previewDot}></span><span style={styles.previewDot}></span><span style={{ marginLeft: "auto", fontSize: "10px", color: "#94a3b8", fontWeight: 800 }}>LIVE READING</span></div>
          <div style={styles.previewBody}>
            <div style={styles.previewMiniLabel}>CURRENT WORD</div>
            <div style={styles.previewWord}>understanding</div>
            <div style={styles.previewLine}><span>Reading becomes easier when</span> <b>understanding</b> <span>is supported.</span></div>
            <div style={styles.previewProgress}><div style={{ width: "68%", height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,#8b5cf6,#4f46e5)" }}></div></div>
            <div style={styles.previewBottom}><span>🎤 Voice tracking</span><span>✨ AI Coach ready</span><span>🌐 7 languages</span></div>
          </div>
        </div>
      </div>

      <div style={styles.statsStrip}>
        <div style={styles.homeStatItem}><strong>OCR</strong><span>Instant text extraction</span></div>
        <div style={styles.homeStatItem}><strong>VOICE</strong><span>Word-by-word tracking</span></div>
        <div style={styles.homeStatItem}><strong>AI</strong><span>Adaptive reading support</span></div>
        <div style={styles.homeStatItem}><strong>LANGUAGE</strong><span>Multilingual learning</span></div>
      </div>

      <div style={styles.featureGrid}>
        <Feature darkMode={darkMode} icon="📖" title="Smart Reading" text="Upload a page and turn printed content into an interactive reading workspace." />
        <Feature darkMode={darkMode} icon="🎤" title="Voice Tracking" text="Follow spoken progress and visually guide the reader through the passage." />
        <Feature darkMode={darkMode} icon="✨" title="AI Word Coach" text="Explain difficult words, pronunciation and reading tips in context." />
        <Feature darkMode={darkMode} icon="🧠" title="Adaptive Support" text="Use reading patterns to provide personalized practice suggestions." />
        <Feature darkMode={darkMode} icon="🌐" title="Language Support" text="Translate reading material to make learning more accessible." />
        <Feature darkMode={darkMode} icon="📊" title="Progress Insights" text="Present reading sessions through clear metrics and visual summaries." />
      </div>
      <div style={{ marginTop: "70px", color: darkMode ? "#94a3b8" : "#64748b", fontSize: "11px", fontWeight: 700, letterSpacing: ".4px" }}>VERBA AI • AI FOR INCLUSIVE DIGITAL TRANSFORMATION</div>
    </div>
  )
}


function DashboardPage({ darkMode, setDarkMode, onBack, onStart }) {
  const panel = darkMode ? "#171827" : "rgba(255,255,255,.86)"
  const text = darkMode ? "#f8fafc" : "#171725"
  const muted = darkMode ? "#a5b4fc" : "#64748b"
  return (
    <div style={{ ...styles.demoPage, background: darkMode ? "radial-gradient(circle at 90% 0%,#312e81 0,transparent 25%),linear-gradient(135deg,#0b0d1a,#111326)" : styles.demoPage.background, color: text }}>
      <div style={{ ...styles.demoNav, background: darkMode ? "rgba(15,16,32,.82)" : "rgba(255,255,255,.82)", borderColor: darkMode ? "#2d2d43" : "#e8eaf2" }}>
        <button style={{ ...styles.backButton, color: muted }} onClick={onBack}>← Home</button>
        <div style={styles.brandMark}><div style={styles.smallLogo}>V</div><div><strong style={{ color: text }}>Verba AI</strong><span style={{ color: muted }}>Learning Dashboard</span></div></div>
        <div style={{ display: "flex", gap: "9px" }}><button style={{ ...styles.dashboardGhost, color: muted, borderColor: darkMode ? "#3f3f5c" : "#e2e8f0" }} onClick={() => setDarkMode((value) => !value)}>{darkMode ? "☀️" : "🌙"}</button><button style={styles.dashboardStart} onClick={onStart}>New Session</button></div>
      </div>
      <div style={styles.dashboardContainer}>
        <div style={styles.dashboardHeading}><div><div style={styles.demoEyebrow}>LEARNER OVERVIEW</div><h1 style={{ ...styles.demoTitle, color: text }}>Reading Dashboard</h1><p style={{ ...styles.demoSubtitle, color: muted }}>A visual overview of reading activity, AI support and learning progress.</p></div><div style={styles.dashboardDate}>Demo profile<br/><strong>Active learner</strong></div></div>
        <div style={styles.metricGrid}>
          <MetricCard darkMode={darkMode} icon="🎯" label="Reading accuracy" value="87%" change="+8%" />
          <MetricCard darkMode={darkMode} icon="📚" label="Sessions completed" value="24" change="This month" />
          <MetricCard darkMode={darkMode} icon="⏱️" label="Reading time" value="3h 42m" change="+26 min" />
          <MetricCard darkMode={darkMode} icon="✨" label="AI interventions" value="41" change="Personalized" />
        </div>
        <div style={styles.dashboardGrid}>
          <div style={{ ...styles.dashboardPanel, background: panel, borderColor: darkMode ? "#34344d" : "#e8eaf2" }}>
            <div style={styles.panelHeader}><div><strong style={{ color: text }}>Reading Progress</strong><span style={{ color: muted }}>Last 7 sessions</span></div><span style={styles.panelBadge}>LIVE DEMO</span></div>
            <div style={styles.chartArea}>
              {[58,66,61,74,69,82,87].map((height, index) => <div key={index} style={styles.chartColumn}><div style={{ ...styles.chartBar, height: `${height}%` }}></div><span style={{ color: muted }}>S{index + 1}</span></div>)}
            </div>
          </div>
          <div style={{ ...styles.dashboardPanel, background: panel, borderColor: darkMode ? "#34344d" : "#e8eaf2" }}>
            <div style={styles.panelHeader}><div><strong style={{ color: text }}>AI Learning Insights</strong><span style={{ color: muted }}>Adaptive support summary</span></div><span style={styles.aiInsightIcon}>✦</span></div>
            <div style={styles.insightItem}><span>🔎</span><div><strong style={{ color: text }}>Focus area</strong><p style={{ color: muted }}>Long and unfamiliar words are receiving extra practice.</p></div></div>
            <div style={styles.insightItem}><span>🎧</span><div><strong style={{ color: text }}>Support mode</strong><p style={{ color: muted }}>Guided reading with pronunciation assistance.</p></div></div>
            <div style={styles.insightItem}><span>🚀</span><div><strong style={{ color: text }}>Next step</strong><p style={{ color: muted }}>Practice difficult words before the next passage.</p></div></div>
          </div>
        </div>
        <div style={styles.dashboardGrid}>
          <div style={{ ...styles.dashboardPanel, background: panel, borderColor: darkMode ? "#34344d" : "#e8eaf2" }}>
            <div style={styles.panelHeader}><div><strong style={{ color: text }}>Recent Sessions</strong><span style={{ color: muted }}>Demo activity</span></div><span style={{ color: muted, fontSize: "11px" }}>View all →</span></div>
            {[["Science passage","92%","12 min"],["Story reading","84%","8 min"],["History worksheet","78%","14 min"]].map((row,index)=><div key={index} style={{ ...styles.sessionRow, borderColor: darkMode ? "#2d2d43" : "#eef2f7" }}><div><strong style={{ color: text }}>{row[0]}</strong><span style={{ color: muted }}>AI-assisted session</span></div><b style={{ color: index === 0 ? "#16a34a" : "#7c3aed" }}>{row[1]}</b><span style={{ color: muted }}>{row[2]}</span></div>)}
          </div>
          <div style={{ ...styles.dashboardPanel, background: darkMode ? "linear-gradient(145deg,#221a3c,#151729)" : "linear-gradient(145deg,#f5f3ff,#eef2ff)", borderColor: darkMode ? "#493a69" : "#e2ddff" }}>
            <div style={styles.aiBannerIcon}>✨</div><div style={{ ...styles.demoEyebrow, marginTop: "15px" }}>VERBA AI COACH</div><h2 style={{ margin: "8px 0", color: text, fontSize: "24px" }}>Personalized reading support</h2><p style={{ margin: 0, color: muted, lineHeight: 1.7, fontSize: "13px" }}>AI can identify difficult words, reading pauses and patterns to make the next session more supportive.</p><button style={{ ...styles.dashboardStart, marginTop: "18px" }} onClick={onStart}>Try Reading Workspace →</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ darkMode, icon, label, value, change }) {
  return <div style={{ ...styles.metricCard, background: darkMode ? "#171827" : "rgba(255,255,255,.86)", borderColor: darkMode ? "#34344d" : "#e8eaf2" }}><div style={styles.metricIcon}>{icon}</div><span style={{ color: darkMode ? "#a5b4fc" : "#64748b" }}>{label}</span><strong style={{ color: darkMode ? "#f8fafc" : "#171725" }}>{value}</strong><small>{change}</small></div>
}

function HowItWorksPage({ darkMode, setDarkMode, onBack, onStart }) {
  const text = darkMode ? "#f8fafc" : "#171725"
  const muted = darkMode ? "#a5b4fc" : "#64748b"
  const cards = [
    ["01", "Capture or upload", "Bring a book page, worksheet or document into Verba AI."],
    ["02", "Extract the text", "OCR converts the page into readable digital text for the workspace."],
    ["03", "Read aloud", "Speech recognition follows the learner and highlights the reading flow."],
    ["04", "Get AI support", "AI Word Coach can explain difficult words and provide pronunciation help."],
    ["05", "Adapt the session", "Reading patterns can be used to create personalized practice insights."],
    ["06", "Learn in more languages", "Translation helps make reading material accessible across languages."]
  ]
  return (
    <div style={{ ...styles.demoPage, background: darkMode ? "radial-gradient(circle at 10% 0%,#4c1d95 0,transparent 27%),linear-gradient(135deg,#0b0d1a,#111326)" : styles.demoPage.background, color: text }}>
      <div style={{ ...styles.demoNav, background: darkMode ? "rgba(15,16,32,.82)" : "rgba(255,255,255,.82)", borderColor: darkMode ? "#2d2d43" : "#e8eaf2" }}>
        <button style={{ ...styles.backButton, color: muted }} onClick={onBack}>← Home</button>
        <div style={styles.brandMark}><div style={styles.smallLogo}>V</div><div><strong style={{ color: text }}>Verba AI</strong><span style={{ color: muted }}>Product Flow</span></div></div>
        <button style={{ ...styles.dashboardGhost, color: muted, borderColor: darkMode ? "#3f3f5c" : "#e2e8f0" }} onClick={() => setDarkMode((value) => !value)}>{darkMode ? "☀️" : "🌙"}</button>
      </div>
      <div style={styles.flowContainer}>
        <div style={styles.flowHero}><div style={styles.demoEyebrow}>FROM PAGE TO PERSONALIZED SUPPORT</div><h1 style={{ ...styles.demoTitle, color: text }}>How Verba AI works</h1><p style={{ ...styles.demoSubtitle, color: muted }}>A simple visual journey showing how OCR, speech, AI and translation come together in one inclusive reading experience.</p></div>
        <div style={styles.flowGrid}>
          {cards.map((card,index)=><div key={card[0]} style={{ ...styles.flowCard, background: darkMode ? "#171827" : "rgba(255,255,255,.86)", borderColor: darkMode ? "#34344d" : "#e8eaf2" }}><div style={styles.flowNumber}>{card[0]}</div><div style={styles.flowConnector}>{index < cards.length - 1 ? "→" : "✓"}</div><h3 style={{ color: text }}>{card[1]}</h3><p style={{ color: muted }}>{card[2]}</p></div>)}
        </div>
        <div style={{ ...styles.architecturePanel, background: darkMode ? "#151627" : "linear-gradient(135deg,#ffffff,#f7f5ff)", borderColor: darkMode ? "#34344d" : "#e5ddff" }}>
          <div><div style={styles.demoEyebrow}>SYSTEM OVERVIEW</div><h2 style={{ margin: "7px 0", color: text }}>Inclusive Reading Pipeline</h2><p style={{ color: muted, lineHeight: 1.65, fontSize: "13px", maxWidth: "560px" }}>Capture → OCR → Reading Workspace → Speech Tracking → AI Assistance → Translation → Progress Insights</p></div>
          <div style={styles.architectureNodes}><span>📷 Input</span><b>→</b><span>🔎 OCR</span><b>→</b><span>🎤 Voice</span><b>→</b><span>✨ AI</span><b>→</b><span>📊 Insights</span></div>
        </div>
        <button style={styles.primaryButton} onClick={onStart}>Open Interactive Reading Demo →</button>
      </div>
    </div>
  )
}

function Feature({ darkMode, icon, title, text }) {
  return (
    <div style={{ ...styles.featureCard, background: darkMode ? "#1b1b2b" : styles.featureCard.background, borderColor: darkMode ? "#34344d" : styles.featureCard.borderColor, color: darkMode ? "#f8fafc" : "#171725" }}>
      <div style={styles.featureIcon}>{icon}</div>
      <h3 style={{ color: darkMode ? "#f8fafc" : "#171725" }}>{title}</h3>
      <p style={{ color: darkMode ? "#a5b4fc" : "#64748b" }}>{text}</p>
    </div>
  )
}

function UploadPage({
  image,
  setImage,
  ocrText,
  setOcrText,
  isProcessing,
  setIsProcessing,
  onBack,
  onContinue,
  darkMode,
  setDarkMode
}) {
  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return
    setImage(URL.createObjectURL(file))
    setOcrText("")
  }

  const extractText = async () => {
    if (!image) return

    setIsProcessing(true)

    try {
      const result = await Tesseract.recognize(
        image,
        "eng",
        {
          logger: (info) => {
            console.log(info)
          }
        }
      )

      setOcrText(result.data.text)
    } catch (error) {
      console.error(error)
      alert("Could not extract text from the image.")
    }

    setIsProcessing(false)
  }

  return (
    <div style={{ ...styles.page, background: darkMode ? "linear-gradient(135deg,#0f1020,#171725)" : styles.page.background, color: darkMode ? "#f8fafc" : "#171725" }}>
      <div style={{ ...styles.topBar, background: darkMode ? "rgba(15,16,32,.9)" : styles.topBar.background, borderColor: darkMode ? "#2d2d43" : "#e8eaf2" }}>
        <button style={{ ...styles.backButton, color: darkMode ? "#f8fafc" : styles.backButton.color }} onClick={onBack}>
          ← Back
        </button>
        <div style={styles.smallLogo}>V</div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ ...styles.stepText, color: darkMode ? "#a5b4fc" : styles.stepText.color }}>Step 1 of 2</div>
          <button style={{ ...styles.controlButton, background: darkMode ? "#25253a" : "rgba(255,255,255,.9)", color: darkMode ? "#f8fafc" : "#334155", borderColor: darkMode ? "#3f3f5c" : "#e2e8f0" }} onClick={() => setDarkMode((value) => !value)}>{darkMode ? "☀️" : "🌙"}</button>
        </div>
      </div>

      <div style={styles.uploadContainer}>
        <div style={{ ...styles.pageBadge, background: darkMode ? "#292044" : styles.pageBadge.background, color: darkMode ? "#c4b5fd" : styles.pageBadge.color }}>
          READING MATERIAL
        </div>

        <h1 style={{ ...styles.pageTitle, color: darkMode ? "#f8fafc" : styles.pageTitle.color }}>
          Bring your reading material
        </h1>

        <p style={{ ...styles.pageSubtitle, color: darkMode ? "#a5b4fc" : styles.pageSubtitle.color }}>
          Upload a photo of a book page, worksheet or document.
        </p>

        <label style={{ ...styles.uploadBox, background: darkMode ? "linear-gradient(145deg,#1b1b2b,#20203a)" : styles.uploadBox.background, borderColor: darkMode ? "#7c5ce8" : "#c4b5fd" }}>
          {image ? (
            <img
              src={image}
              alt="Uploaded page"
              style={styles.previewImage}
            />
          ) : (
            <>
              <div style={styles.uploadIcon}>↑</div>
              <h3 style={{ color: darkMode ? "#f8fafc" : "#171725" }}>Upload a page</h3>
              <p style={{ color: darkMode ? "#a5b4fc" : "#64748b" }}>PNG, JPG or JPEG</p>
            </>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
        </label>

        {image && (
          <button
            style={styles.secondaryButton}
            onClick={extractText}
            disabled={isProcessing}
          >
            {isProcessing
              ? "Extracting text..."
              : "Extract Text"}
          </button>
        )}

        {ocrText && (
          <div style={{ ...styles.ocrCard, background: darkMode ? "#1b1b2b" : styles.ocrCard.background, borderColor: darkMode ? "#34344d" : "#e7e9f2" }}>
            <div style={styles.ocrHeader}>
              <h3 style={{ color: darkMode ? "#f8fafc" : "#171725" }}>Extracted Text</h3>
              <span style={styles.successBadge}>✓ Ready</span>
            </div>

            <textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              style={{ ...styles.textarea, background: darkMode ? "#11121f" : styles.textarea.background, color: darkMode ? "#f8fafc" : "#171725", borderColor: darkMode ? "#3f3f5c" : "#e2e8f0" }}
            />

            <button
              style={styles.primaryButton}
              onClick={onContinue}
            >
              Continue to Reading →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ReadingWorkspace({ displayText, onBack, darkMode, setDarkMode }) {
  const [currentWord, setCurrentWord] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [spokenText, setSpokenText] = useState("")
  const [fontSize, setFontSize] = useState(22)

  const [targetLanguage, setTargetLanguage] = useState("tam_Taml")
  const [translation, setTranslation] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)

  const [assistantEnabled, setAssistantEnabled] = useState(true)
  const [assistantStatus, setAssistantStatus] = useState("Ready")
  const [readingStartedAt, setReadingStartedAt] = useState(null)
  const [pauseCount, setPauseCount] = useState(0)
  const [readingReport, setReadingReport] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiStatus, setAiStatus] = useState("idle")
  const [aiError, setAiError] = useState("")
  const [aiWordHelp, setAiWordHelp] = useState(null)
  const [isWordHelpLoading, setIsWordHelpLoading] = useState(false)
  const [aiLearningMode, setAiLearningMode] = useState("Adaptive Reading")
  const [aiPattern, setAiPattern] = useState("")
  const [aiNextPlan, setAiNextPlan] = useState("")

  const recognitionRef = useRef(null)
  const currentWordRef = useRef(0)

  const pauseTimerRef = useRef(null)
  const isSpeakingRef = useRef(false)
  const isListeningRef = useRef(false)
  const assistantEnabledRef = useRef(true)
  const readingStartedAtRef = useRef(null)
  const spokenTextRef = useRef("")

  const words = displayText
    .split(/\s+/)
    .filter(Boolean)

  useEffect(() => {
    currentWordRef.current = currentWord
  }, [currentWord])

  useEffect(() => {
    assistantEnabledRef.current = assistantEnabled
  }, [assistantEnabled])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }

      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current)
      }

      window.speechSynthesis.cancel()
    }
  }, [])

  const normalizeWord = (word) => {
    return word
      .toLowerCase()
      .replace(/[.,!?;:"'()[\]{}]/g, "")
      .trim()
  }

  const resetPauseTimer = () => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current)
    }

    if (!assistantEnabledRef.current) return
    if (!isListeningRef.current) return
    if (isSpeakingRef.current) return

    pauseTimerRef.current = setTimeout(() => {
      setPauseCount((count) => count + 1)
      speakNextWord()
    }, 5000)
  }

  const speakNextWord = () => {
    if (!assistantEnabledRef.current) return
    if (!isListeningRef.current) return
    if (isSpeakingRef.current) return

    const nextIndex = Math.min(
      currentWordRef.current + 1,
      words.length - 1
    )

    if (nextIndex <= currentWordRef.current) {
      setAssistantStatus("Finished")
      return
    }

    const nextWord = normalizeWord(words[nextIndex])

    if (!nextWord) return

    isSpeakingRef.current = true
    setAssistantStatus("Helping...")

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.log(error)
      }
    }

    currentWordRef.current = nextIndex
    setCurrentWord(nextIndex)

    window.speechSynthesis.cancel()

    const utterance =
      new SpeechSynthesisUtterance(nextWord)

    utterance.lang = "en-US"
    utterance.rate = 0.65
    utterance.pitch = 1

    utterance.onend = () => {
      isSpeakingRef.current = false
      setAssistantStatus("Listening")

      if (
        assistantEnabledRef.current
      ) {
        setTimeout(() => {
          if (!recognitionRef.current) return

          try {
            recognitionRef.current.start()
          } catch (error) {
            console.log(error)
          }
        }, 300)
      }

      resetPauseTimer()
    }

    utterance.onerror = () => {
      isSpeakingRef.current = false
      setAssistantStatus("Listening")

      if (
        assistantEnabledRef.current
      ) {
        try {
          recognitionRef.current?.start()
        } catch (error) {
          console.log(error)
        }
      }

      resetPauseTimer()
    }

    window.speechSynthesis.speak(utterance)
  }

  const findSpokenWord = (spoken) => {
    const spokenWords = spoken
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)

    if (spokenWords.length === 0) return

    const lastSpokenWord = normalizeWord(
      spokenWords[spokenWords.length - 1]
    )

    if (!lastSpokenWord) return

    const startIndex = currentWordRef.current

    for (
      let i = startIndex;
      i < Math.min(startIndex + 10, words.length);
      i++
    ) {
      if (
        normalizeWord(words[i]) ===
        lastSpokenWord
      ) {
        currentWordRef.current = i
        setCurrentWord(i)
        return
      }
    }
  }

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert(
        "Speech Recognition is not supported in this browser. Please use Google Chrome."
      )
      return
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.log(error)
      }
    }

    const recognition =
      new SpeechRecognition()

    spokenTextRef.current = ""
    setSpokenText("")

    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.lang = "en-US"

    recognition.onstart = () => {
      isListeningRef.current = true
      if (!readingStartedAtRef.current) {
        readingStartedAtRef.current = Date.now()
        setReadingStartedAt(readingStartedAtRef.current)
      }
      setIsListening(true)
      setAssistantStatus(
        assistantEnabledRef.current
          ? "Listening"
          : "Assistant off"
      )
      setReadingReport(null)
      setPauseCount(0)
      resetPauseTimer()
    }

    recognition.onresult = (event) => {
      let fullTranscript = ""

      for (
        let i = 0;
        i < event.results.length;
        i++
      ) {
        fullTranscript +=
          event.results[i][0].transcript + " "
      }

      spokenTextRef.current = fullTranscript.trim()
      setSpokenText(spokenTextRef.current)

      let latestTranscript = ""

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        latestTranscript +=
          event.results[i][0].transcript + " "
      }

      findSpokenWord(latestTranscript)

      resetPauseTimer()
    }

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      )

      if (event.error === "not-allowed") {
        isListeningRef.current = false
        setIsListening(false)
        alert(
          "Microphone permission was denied. Please allow microphone access in Chrome."
        )
        return
      }

      if (event.error === "no-speech" || event.error === "aborted") {
        return
      }

      isListeningRef.current = false
      setIsListening(false)
    }

    recognition.onend = () => {
      if (
        isListeningRef.current &&
        !isSpeakingRef.current
      ) {
        setTimeout(() => {
          if (!isListeningRef.current || recognitionRef.current !== recognition) return
          try {
            recognition.start()
          } catch (error) {
            console.log(error)
          }
        }, 250)
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (error) {
      console.error(error)
    }
  }

  const askAIAboutCurrentWord = async () => {
    const word = normalizeWord(words[currentWordRef.current] || "")
    if (!word) return
    const instantHelp = buildInstantWordHelp(word)
    setIsWordHelpLoading(true)
    setAiWordHelp(instantHelp)
    setAiStatus("loading")
    setAiError("")
    try {
      const model = await getAIModel()
      setAiStatus("ready")
      const previousWords = words.slice(Math.max(0, currentWordRef.current - 4), currentWordRef.current).join(" ")
      const nextWords = words.slice(currentWordRef.current + 1, currentWordRef.current + 5).join(" ")
      const prompt = `You are Verba AI Word Coach. Word: ${word}. Context: ${previousWords} ${nextWords}. Give exactly 4 short lines. Meaning: simple context meaning. Breakdown: syllables with hyphens. Pronunciation: easy English spelling, no IPA. Reading tip: one short tip.`
      const result = await model(prompt, {
        max_new_tokens: 72,
        do_sample: false
      })
      const text = extractAIText(result).replace(prompt, "").trim()
      const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean)
      const getLine = (label) => {
        const found = lines.find((line) => line.toLowerCase().startsWith(label.toLowerCase() + ":"))
        return found ? found.slice(label.length + 1).trim() : ""
      }
      const aiHelp = {
        word,
        meaning: getLine("Meaning") || instantHelp.meaning,
        breakdown: getLine("Breakdown") || instantHelp.breakdown,
        pronunciation: getLine("Pronunciation") || instantHelp.pronunciation,
        tip: getLine("Reading tip") || instantHelp.tip
      }
      setAiWordHelp(aiHelp)
    } catch (error) {
      console.warn("AI word help fallback:", error)
      setAiStatus("ready")
      setAiError("")
      setAiWordHelp(instantHelp)
    } finally {
      setIsWordHelpLoading(false)
    }
  }

  const speakAIWord = () => {
    const word = aiWordHelp?.word || normalizeWord(words[currentWordRef.current] || "")
    if (!word || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const speech = new SpeechSynthesisUtterance(word)
    speech.lang = "en-US"
    speech.rate = 0.55
    speech.volume = 1
    window.speechSynthesis.resume()
    window.speechSynthesis.speak(speech)
  }

  const generateReadingReport = async (finalSpokenText) => {
    const expectedWords = words.map(normalizeWord).filter(Boolean)
    const spokenWords = finalSpokenText
      .split(/\s+/)
      .map(normalizeWord)
      .filter(Boolean)

    const skippedWords = []
    const incorrectWords = []
    const repeatedWords = []
    let correctWords = 0
    let expectedIndex = 0

    for (const spokenWord of spokenWords) {
      if (expectedIndex >= expectedWords.length) {
        repeatedWords.push(spokenWord)
        continue
      }

      if (spokenWord === expectedWords[expectedIndex]) {
        correctWords++
        expectedIndex++
        continue
      }

      let foundAhead = -1
      for (let j = expectedIndex + 1; j < Math.min(expectedIndex + 4, expectedWords.length); j++) {
        if (expectedWords[j] === spokenWord) {
          foundAhead = j
          break
        }
      }

      if (foundAhead !== -1) {
        skippedWords.push(...expectedWords.slice(expectedIndex, foundAhead))
        correctWords++
        expectedIndex = foundAhead + 1
      } else if (spokenWords.length > 1 && spokenWord === spokenWords[spokenWords.indexOf(spokenWord) - 1]) {
        repeatedWords.push(spokenWord)
      } else {
        incorrectWords.push(spokenWord)
        expectedIndex++
      }
    }

    if (expectedIndex < expectedWords.length) {
      skippedWords.push(...expectedWords.slice(expectedIndex))
    }

    const totalWords = expectedWords.length
    const accuracy = totalWords ? Math.round((correctWords / totalWords) * 100) : 0
    const duration = readingStartedAtRef.current
      ? Math.max(1, Math.round((Date.now() - readingStartedAtRef.current) / 1000))
      : 0

    const uniqueSkipped = [...new Set(skippedWords)]
    const uniqueRepeated = [...new Set(repeatedWords)]
    const uniqueIncorrect = [...new Set(incorrectWords)]
    const errorCount = uniqueSkipped.length + uniqueIncorrect.length
    const wordsPerMinute = duration > 0 ? Math.round((correctWords / duration) * 60) : 0
    const pauseRate = duration > 0 ? Math.round((pauseCount / duration) * 60 * 10) / 10 : 0
    let supportMode = "Confidence Building"
    let supportReason = "Your reading was mostly consistent, so Verba can focus on confidence and fluency."
    if (accuracy < 70 || pauseCount >= 3) {
      supportMode = "Guided Reading"
      supportReason = "Verba detected several accuracy or pause signals, so the next session should provide more step-by-step support."
    } else if (accuracy < 85 || uniqueRepeated.length >= 2 || uniqueIncorrect.length >= 2) {
      supportMode = "Focused Practice"
      supportReason = "Verba detected a small group of words or reading patterns that need targeted practice."
    }
    const focusWords = [...new Set([...uniqueIncorrect, ...uniqueSkipped])].slice(0, 6)
    const adaptiveActions = supportMode === "Guided Reading"
      ? ["Keep the 5-second continuation assistant enabled", "Practice difficult words one at a time", "Use AI word explanations before rereading"]
      : supportMode === "Focused Practice"
      ? ["Practice the detected focus words", "Use AI word help for unfamiliar words", "Reread the same passage to improve fluency"]
      : ["Try a slightly longer passage", "Keep using word highlighting", "Practice reading with fewer pauses"]

    const analysis = {
      totalWords,
      correctWords,
      skippedWords: uniqueSkipped,
      repeatedWords: uniqueRepeated,
      incorrectWords: uniqueIncorrect,
      accuracy,
      pauseCount,
      duration,
      wordsPerMinute,
      pauseRate,
      errorCount,
      supportMode,
      supportReason,
      focusWords,
      adaptiveActions
    }

    setAiLearningMode(supportMode)
    setAiPattern(supportReason)
    setAiNextPlan(adaptiveActions.join(" • "))
    setIsAnalyzing(true)
    try {
      setAiStatus("loading")
      setAiError("")
      const model = await getAIModel()
      setAiStatus("ready")
      const prompt = `Verba AI adaptive reading coach. Use only these measured signals: accuracy ${analysis.accuracy}%, correct ${analysis.correctWords}/${analysis.totalWords}, pauses ${analysis.pauseCount}, pace ${analysis.wordsPerMinute} wpm, skipped ${analysis.skippedWords.join(", ") || "none"}, repeated ${analysis.repeatedWords.join(", ") || "none"}, incorrect ${analysis.incorrectWords.join(", ") || "none"}, focus ${analysis.focusWords.join(", ") || "none"}, mode ${analysis.supportMode}. Return exactly four short sections:
AI Reading Pattern
Adaptive Support
Next Session Plan
Encouragement
Use only Verba features: highlighting, 5-second voice help, AI word help, translation and rereading. No diagnosis.`

      const result = await model(prompt, {
        max_new_tokens: 120,
        do_sample: false
      })

      setAiStatus("ready")
      const rawText = extractAIText(result) || "Unable to generate AI feedback."
      const text = rawText.replace(prompt, "").trim() || rawText
      setReadingReport({ ...analysis, aiFeedback: text, aiGenerated: true })
    } catch (error) {
      console.error("AI reading analysis error:", error)
      setAiStatus("error")
      setAiError(error?.message || "AI reading analysis failed.")
      setReadingReport({
        ...analysis,
        aiFeedback: "The local AI model could not finish this analysis. The reading metrics below were still calculated from your session.",
        aiGenerated: false
      })
    } finally {
      setIsAnalyzing(false)
      setAssistantStatus("Ready")
    }
  }

  const stopListening = () => {
    const finalSpokenText = spokenTextRef.current || spokenText
    isListeningRef.current = false

    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = null
    }

    window.speechSynthesis.cancel()

    isSpeakingRef.current = false

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.log(error)
      }

      recognitionRef.current = null
    }

    setIsListening(false)
    setAssistantStatus("Analyzing...")
    if (finalSpokenText.trim()) {
      generateReadingReport(finalSpokenText)
    } else {
      setAssistantStatus("Ready")
    }
  }

  const toggleAssistant = () => {
    const newValue = !assistantEnabled

    setAssistantEnabled(newValue)
    assistantEnabledRef.current = newValue

    if (!newValue) {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current)
        pauseTimerRef.current = null
      }

      window.speechSynthesis.cancel()
      isSpeakingRef.current = false
      setAssistantStatus("Assistant off")
    } else if (isListening) {
      setAssistantStatus("Listening")
      resetPauseTimer()
    }
  }

  const nextWord = () => {
    const next = Math.min(
      currentWordRef.current + 1,
      words.length - 1
    )

    currentWordRef.current = next
    setCurrentWord(next)
    resetPauseTimer()
  }

  const previousWord = () => {
    const previous = Math.max(
      currentWordRef.current - 1,
      0
    )

    currentWordRef.current = previous
    setCurrentWord(previous)
    resetPauseTimer()
  }

  const translateText = async () => {
    if (!displayText.trim()) return

    setIsTranslating(true)
    setTranslation("")

    try {
      const translatorModel =
        await getTranslator()

      const result = await translatorModel(
        displayText,
        {
          src_lang: "eng_Latn",
          tgt_lang: targetLanguage
        }
      )

      console.log(
        "TRANSLATION RESULT:",
        result
      )

      if (
        Array.isArray(result) &&
        result.length > 0
      ) {
        setTranslation(
          result[0].translation_text ||
            "No translation returned."
        )
      } else {
        setTranslation(
          "No translation returned."
        )
      }
    } catch (error) {
      console.error(
        "Translation error:",
        error
      )

      setTranslation(
        "Translation failed."
      )
    } finally {
      setIsTranslating(false)
    }
  }

  const progress =
    words.length > 0
      ? Math.round(
          ((currentWord + 1) /
            words.length) *
            100
        )
      : 0

  return (
    <div
      style={{
        ...styles.readingPage,
        background: darkMode
          ? "#10101a"
          : "#f7f8fc",
        color: darkMode
          ? "#ffffff"
          : "#171725"
      }}
    >
      <div style={{ ...styles.readingTopBar, background: darkMode ? "rgba(16,16,26,.92)" : styles.readingTopBar.background, borderColor: darkMode ? "#2d2d43" : "#e5e7eb", color: darkMode ? "#f8fafc" : "#171725" }}>
        <button
          style={{
            ...styles.backButton,
            color: darkMode
              ? "#ffffff"
              : "#333333"
          }}
          onClick={onBack}
        >
          ← Back
        </button>

        <div style={{ ...styles.readingLogo, color: darkMode ? "#f8fafc" : "#171725" }}>
          <div style={styles.smallLogo}>V</div>
          <span>Verba AI</span>
        </div>

        <div style={styles.controls}>
          <button
            style={{ ...styles.controlButton, background: darkMode ? "#25253a" : styles.controlButton.background, color: darkMode ? "#f8fafc" : "#334155", borderColor: darkMode ? "#3f3f5c" : "#e2e8f0" }}
            onClick={() =>
              setFontSize((size) =>
                Math.max(16, size - 2)
              )
            }
          >
            A−
          </button>

          <button
            style={{ ...styles.controlButton, background: darkMode ? "#25253a" : styles.controlButton.background, color: darkMode ? "#f8fafc" : "#334155", borderColor: darkMode ? "#3f3f5c" : "#e2e8f0" }}
            onClick={() =>
              setFontSize((size) =>
                Math.min(34, size + 2)
              )
            }
          >
            A+
          </button>

          <button
            style={{ ...styles.controlButton, background: darkMode ? "#25253a" : styles.controlButton.background, color: darkMode ? "#f8fafc" : "#334155", borderColor: darkMode ? "#3f3f5c" : "#e2e8f0" }}
            onClick={() =>
              setDarkMode((value) => !value)
            }
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      <div style={styles.progressContainer}>
        <div style={{ ...styles.progressInfo, color: darkMode ? "#a5b4fc" : styles.progressInfo.color }}>
          <span>Reading Progress</span>
          <span>{progress}%</span>
        </div>

        <div style={{ ...styles.progressBar, background: darkMode ? "#2c2845" : styles.progressBar.background }}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progress}%`
            }}
          />
        </div>
      </div>

      <div style={styles.workspace}>
        <main
          style={{
            ...styles.readingCard,
            background: darkMode
              ? "#1b1b2b"
              : "#ffffff",
            borderColor: darkMode ? "#34344d" : "rgba(226,232,240,.8)",
            color: darkMode ? "#f8fafc" : "#171725"
          }}
        >
          <div style={styles.readingCardHeader}>
            <div>
              <span style={styles.readingLabel}>
                READING MODE
              </span>

              <h2 style={{ ...styles.readingTitle, color: darkMode ? "#f8fafc" : "#171725" }}>
                Read aloud
              </h2>
            </div>

            <div
              style={{
                ...styles.statusPill,
                background: isListening
                  ? "#dcfce7"
                  : "#f1f5f9",
                color: isListening
                  ? "#15803d"
                  : "#64748b"
              }}
            >
              <span
                style={{
                  ...styles.statusDot,
                  background: isListening
                    ? "#22c55e"
                    : "#94a3b8"
                }}
              />

              {isListening
                ? "Listening"
                : "Ready"}
            </div>
          </div>

          <div
            style={{
              ...styles.textArea,
              background: darkMode ? "#11121f" : "linear-gradient(180deg,#ffffff,#fcfcff)",
              borderColor: darkMode ? "#34344d" : "#eef0f5",
              color: darkMode ? "#f8fafc" : "#27272a",
              fontSize: `${fontSize}px`,
              lineHeight: 1.9
            }}
          >
            {words.map((word, index) => (
              <span
                key={`${word}-${index}`}
                onClick={() => {
                  currentWordRef.current =
                    index
                  setCurrentWord(index)
                  resetPauseTimer()
                }}
                style={{
                  ...styles.word,
                  background:
                    index === currentWord
                      ? "#c4b5fd"
                      : "transparent",
                  color:
                    index === currentWord
                      ? "#4c1d95"
                      : darkMode
                      ? "#e5e7eb"
                      : "#27272a",
                  borderRadius:
                    index === currentWord
                      ? "7px"
                      : "0",
                  cursor: "pointer"
                }}
              >
                {word}{" "}
              </span>
            ))}
          </div>

          <div style={styles.readingControls}>
            <button
              style={styles.listenButton}
              onClick={() => {
                window.speechSynthesis.cancel()
                const speech = new SpeechSynthesisUtterance("Hello, I am Verba AI")
                speech.lang = "en-US"
                speech.rate = 0.7
                speech.volume = 1
                window.speechSynthesis.resume()
                window.speechSynthesis.speak(speech)
              }}
            >
              🔊 Test Voice
            </button>
            <button
              style={{ ...styles.controlButtonLarge, background: darkMode ? "#25253a" : "white", color: darkMode ? "#f8fafc" : "#334155", borderColor: darkMode ? "#3f3f5c" : "#e2e8f0" }}
              onClick={previousWord}
            >
              ← Previous
            </button>

            {!isListening ? (
              <button
                style={styles.listenButton}
                onClick={startListening}
              >
                🎤 Start Listening
              </button>
            ) : (
              <button
                style={styles.stopButton}
                onClick={stopListening}
              >
                ⏹ Stop Listening
              </button>
            )}

            <button
              style={{ ...styles.controlButtonLarge, background: darkMode ? "#25253a" : "white", color: darkMode ? "#f8fafc" : "#334155", borderColor: darkMode ? "#3f3f5c" : "#e2e8f0" }}
              onClick={nextWord}
            >
              Next Word →
            </button>
          </div>

          <div style={{ ...styles.spokenBox, background: darkMode ? "#171827" : styles.spokenBox.background, borderColor: darkMode ? "#34344d" : "#e8edf3", color: darkMode ? "#f8fafc" : "#171725" }}>
            <div style={styles.spokenHeader}>
              <span>🎤 You said</span>

              {isListening && (
                <span style={styles.liveText}>
                  LIVE
                </span>
              )}
            </div>

            <p style={{ color: darkMode ? "#cbd5e1" : "#334155" }}>
              {spokenText ||
                "Start listening and read the text aloud..."}
            </p>
          </div>

          {(isAnalyzing || readingReport) && (
            <section style={styles.reportCard}>
              <div style={{ ...styles.reportHeader, borderColor: darkMode ? "#40385f" : "#eeeafd" }}>
                <div>
                  <div style={styles.reportEyebrow}>VERBA AI • READING INSIGHTS</div>
                  <h2 style={styles.reportTitle}>Your Reading Report</h2>
                  <p style={{ ...styles.reportSubtitle, color: darkMode ? "#a5b4fc" : styles.reportSubtitle.color }}>Local AI turns your reading behavior into personalized, inclusive support.</p>
                </div>
                <div style={styles.aiBadge}>✦ LOCAL AI</div>
              </div>

              {isAnalyzing ? (
                <div style={styles.analyzingBox}>
                  <div style={styles.aiOrb}>✦</div>
                  <div style={styles.analyzingContent}>
                    <div style={styles.analyzingLabel}>AI ANALYSIS IN PROGRESS</div>
                    <strong>Verba is understanding your reading</strong>
                    <p>Checking accuracy, pauses, repeated words and reading patterns.</p>
                    <div style={styles.loadingBar}><div style={styles.loadingFill} /></div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ ...styles.reportHero, background: darkMode ? "linear-gradient(135deg,#25233b,#1b1b2b 65%)" : styles.reportHero.background, borderColor: darkMode ? "#40385f" : "#e9ddff" }}>
                    <div style={{...styles.scoreRing, background: `conic-gradient(#7c3aed ${readingReport.accuracy * 3.6}deg, #e9e5ff 0deg)`}}>
                      <div style={{ ...styles.scoreInner, background: darkMode ? "#171827" : "#ffffff", color: darkMode ? "#f8fafc" : "#171725" }}>
                        <strong>{readingReport.accuracy}%</strong>
                        <span>accuracy</span>
                      </div>
                    </div>
                    <div style={styles.heroSummary}>
                      <div style={styles.summaryTop}>
                        <span style={styles.summaryBadge}>SESSION COMPLETE</span>
                        <span style={styles.aiMiniBadge}>AI ANALYZED</span>
                      </div>
                      <h3 style={{ color: darkMode ? "#f8fafc" : "#171725" }}>{readingReport.accuracy >= 90 ? "Excellent reading progress" : readingReport.accuracy >= 75 ? "Strong reading progress" : "Good start — keep practicing"}</h3>
                      <p style={{ color: darkMode ? "#a5b4fc" : "#64748b" }}>Verba compared your spoken reading with the page and created targeted feedback for your next attempt.</p>
                    </div>
                  </div>

                  <div style={styles.reportStats}>
                    <div style={styles.reportStat}>
                      <div style={{...styles.statIcon, background: "#ecfdf5", color: "#059669"}}>✓</div>
                      <strong>{readingReport.correctWords}</strong>
                      <small>Correct words</small>
                    </div>
                    <div style={styles.reportStat}>
                      <div style={{...styles.statIcon, background: "#fff7ed", color: "#ea580c"}}>↷</div>
                      <strong>{readingReport.skippedWords.length}</strong>
                      <small>Skipped words</small>
                    </div>
                    <div style={styles.reportStat}>
                      <div style={{...styles.statIcon, background: "#eff6ff", color: "#2563eb"}}>↺</div>
                      <strong>{readingReport.repeatedWords.length}</strong>
                      <small>Repeated words</small>
                    </div>
                    <div style={styles.reportStat}>
                      <div style={{...styles.statIcon, background: "#f5f3ff", color: "#7c3aed"}}>◷</div>
                      <strong>{readingReport.duration}s</strong>
                      <small>Reading time</small>
                    </div>
                  </div>

                  <div style={{ ...styles.adaptiveAiCard, background: darkMode ? "linear-gradient(145deg,#21183d,#171827)" : "linear-gradient(145deg,#faf7ff,#ffffff)", borderColor: darkMode ? "#4c3b72" : "#e9ddff" }}>
                    <div style={styles.adaptiveAiHeader}>
                      <div style={styles.aiOrbSmall}>✦</div>
                      <div>
                        <div style={{ ...styles.aiFeedbackTitle, color: darkMode ? "#ffffff" : "#171725" }}>AI Adaptive Support</div>
                        <div style={{ ...styles.aiFeedbackSub, color: darkMode ? "#a5b4fc" : "#6d28d9" }}>Verba changed the support plan from this session's reading behavior</div>
                      </div>
                    </div>
                    <div style={styles.adaptiveGrid}>
                      <div style={{ ...styles.adaptiveMetric, background: darkMode ? "#25233b" : "#ffffff" }}>
                        <span>Recommended mode</span>
                        <strong>{readingReport.supportMode}</strong>
                      </div>
                      <div style={{ ...styles.adaptiveMetric, background: darkMode ? "#25233b" : "#ffffff" }}>
                        <span>Reading pace</span>
                        <strong>{readingReport.wordsPerMinute} wpm</strong>
                      </div>
                      <div style={{ ...styles.adaptiveMetric, background: darkMode ? "#25233b" : "#ffffff" }}>
                        <span>Pause rate</span>
                        <strong>{readingReport.pauseRate}/min</strong>
                      </div>
                    </div>
                    <p style={{ ...styles.adaptiveReason, color: darkMode ? "#cbd5e1" : "#475569" }}>{readingReport.supportReason}</p>
                    <div style={{ ...styles.adaptivePlan, background: darkMode ? "#11121f" : "#ffffff", color: darkMode ? "#e2e8f0" : "#334155" }}>
                      <strong>Next session:</strong> {readingReport.adaptiveActions.join(" • ")}
                    </div>
                  </div>

                  <div style={styles.aiFeedbackBox}>
                    <div style={styles.aiFeedbackTop}>
                      <div style={styles.aiFeedbackIcon}>✦</div>
                      <div>
                        <div style={styles.aiFeedbackTitle}>Verba's Personalized Feedback</div>
                        <div style={styles.aiFeedbackSub}>Generated locally from this session</div>
                      </div>
                    </div>
                    <div style={styles.aiFeedbackText}>{readingReport.aiFeedback}</div>
                  </div>

                  <div style={styles.reportBottomGrid}>
                    <div style={{ ...styles.detailCard, background: darkMode ? "#25233b" : "rgba(255,255,255,.9)", borderColor: darkMode ? "#40385f" : "#e5e7eb", color: darkMode ? "#f8fafc" : "#171725" }}>
                      <div style={styles.detailIcon}>⏸</div>
                      <div>
                        <span>Long pauses</span>
                        <strong>{readingReport.pauseCount}</strong>
                        <small>5-second assistance triggers</small>
                      </div>
                    </div>
                    <div style={{ ...styles.practiceCard, background: darkMode ? "#25233b" : "rgba(255,255,255,.9)", borderColor: darkMode ? "#40385f" : "#e5e7eb", color: darkMode ? "#f8fafc" : "#171725" }}>
                      <div style={styles.practiceHeader}>
                        <div>
                          <span>🎯 Practice focus</span>
                          <small>Words Verba noticed</small>
                        </div>
                        <span style={styles.practiceBadge}>NEXT SESSION</span>
                      </div>
                      <div style={styles.practiceWords}>
                        {(readingReport.incorrectWords.length ? readingReport.incorrectWords : readingReport.skippedWords.slice(0, 6)).slice(0, 6).map((word, index) => (
                          <span key={`${word}-${index}`} style={styles.practiceChip}>{word}</span>
                        ))}
                        {!readingReport.incorrectWords.length && !readingReport.skippedWords.length && (
                          <span style={styles.noPractice}>No specific words flagged — nice work! ✨</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ ...styles.reportFooter, borderColor: darkMode ? "#40385f" : "#eeeafd", color: darkMode ? "#a5b4fc" : "#64748b" }}>
                    <span>💜 Keep reading at your own pace.</span>
                    <span>Voice tracking • Pause assistance • Local AI</span>
                  </div>
                </>
              )}
            </section>
          )}
        </main>

        <aside
          style={{
            ...styles.assistantCard,
            background: darkMode
              ? "#1b1b2b"
              : "#ffffff",
            borderColor: darkMode ? "#34344d" : "rgba(226,232,240,.8)",
            color: darkMode ? "#f8fafc" : "#171725"
          }}
        >
          <div style={styles.assistantIcon}>
            ✨
          </div>

          <h2 style={{ color: darkMode ? "#f8fafc" : "#171725" }}>Verba Assist</h2>

          <p style={{ ...styles.assistantText, color: darkMode ? "#a5b4fc" : styles.assistantText.color }}>
            I'm following along with you. The word
            you're currently reading is highlighted.
          </p>

          <div style={{ ...styles.currentWordCard, background: darkMode ? "#25233b" : styles.currentWordCard.background, borderColor: darkMode ? "#4c3d75" : "#e4ddff" }}>
            <span style={styles.currentWordLabel}>
              Current word
            </span>

            <strong
              style={{ ...styles.currentWordValue, color: darkMode ? "#c4b5fd" : styles.currentWordValue.color }}
            >
              {words[currentWord] || "—"}
            </strong>
          </div>

          <div style={{ ...styles.voiceAssistantCard, background: darkMode ? "#211f33" : styles.voiceAssistantCard.background, borderColor: darkMode ? "#40385f" : "#ddd6fe" }}>
            <div style={styles.voiceAssistantHeader}>
              <span style={{ color: darkMode ? "#f8fafc" : "#171725" }}>🔊 Voice Assistant</span>

              <button
                style={{
                  ...styles.toggleButton,
                  background:
                    assistantEnabled
                      ? "#7c3aed"
                      : "#cbd5e1"
                }}
                onClick={toggleAssistant}
              >
                <span
                  style={{
                    ...styles.toggleCircle,
                    transform:
                      assistantEnabled
                        ? "translateX(18px)"
                        : "translateX(0)"
                  }}
                />
              </button>
            </div>

            <p style={{ ...styles.voiceAssistantDescription, color: darkMode ? "#a5b4fc" : styles.voiceAssistantDescription.color }}>
              If you pause for 5 seconds, Verba will
              slowly read the next word to help you
              continue.
            </p>

            <div style={{ ...styles.assistantStatus, color: darkMode ? "#cbd5e1" : styles.assistantStatus.color }}>
              <span
                style={{
                  ...styles.statusDot,
                  background:
                    assistantEnabled
                      ? "#22c55e"
                      : "#94a3b8"
                }}
              />

              {assistantStatus}
            </div>
          </div>

          <div
            style={{
              ...styles.translationCard,
              background: darkMode ? "linear-gradient(145deg,#21183d,#171827)" : "linear-gradient(145deg,#faf7ff,#ffffff)",
              borderColor: darkMode ? "#4c3b72" : "#e9ddff"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
              <div style={{ ...styles.translationTitle, color: darkMode ? "#f8fafc" : "#171725", marginBottom: 0 }}>✨ Verba AI Coach</div>
              <span style={{ fontSize: "11px", fontWeight: 800, padding: "5px 8px", borderRadius: "999px", background: aiStatus === "ready" ? "#dcfce7" : aiStatus === "error" ? "#fee2e2" : "#ede9fe", color: aiStatus === "ready" ? "#15803d" : aiStatus === "error" ? "#b91c1c" : "#6d28d9" }}>
                {aiStatus === "ready" ? "AI READY" : aiStatus === "error" ? "AI ERROR" : "LOADING AI"}
              </span>
            </div>
            <p style={{ ...styles.voiceAssistantDescription, color: darkMode ? "#a5b4fc" : styles.voiceAssistantDescription.color, marginTop: "10px" }}>
              Local generative AI understands your reading pattern and gives personalized support for difficult words and reading practice. No API key is required.
            </p>
            {aiError && (
              <div style={{ fontSize: "11px", color: darkMode ? "#fca5a5" : "#b91c1c", marginBottom: "10px", lineHeight: 1.5 }}>
                {aiError.slice(0, 180)}
              </div>
            )}
            <button
              style={{ ...styles.translateButton, opacity: isWordHelpLoading ? 0.7 : 1 }}
              onClick={askAIAboutCurrentWord}
              disabled={isWordHelpLoading}
            >
              {isWordHelpLoading ? "✨ AI is thinking..." : `✨ Ask AI about “${words[currentWord] || "this word"}”`}
            </button>
            {aiWordHelp && (
              <div style={{ marginTop: "12px", padding: "14px", borderRadius: "14px", background: darkMode ? "#11121f" : "#ffffff", color: darkMode ? "#e2e8f0" : "#334155", border: `1px solid ${darkMode ? "#34344d" : "#eeeafd"}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "12px" }}>
                  <div>
                    <div style={{ fontSize: "10px", fontWeight: 900, letterSpacing: ".8px", color: darkMode ? "#a78bfa" : "#7c3aed", textTransform: "uppercase" }}>AI Word Coach</div>
                    <div style={{ fontSize: "20px", fontWeight: 900, marginTop: "3px", color: darkMode ? "#f8fafc" : "#171725" }}>{aiWordHelp.word}</div>
                  </div>
                  <button onClick={speakAIWord} style={{ border: "none", borderRadius: "10px", padding: "8px 10px", background: darkMode ? "#302653" : "#f3f0ff", color: darkMode ? "#ddd6fe" : "#6d28d9", fontWeight: 800, cursor: "pointer" }}>🔊 Hear</button>
                </div>
                <div style={{ display: "grid", gap: "9px" }}>
                  <div style={{ padding: "10px", borderRadius: "11px", background: darkMode ? "#1b1b2b" : "#f8fafc" }}>
                    <div style={{ fontSize: "10px", fontWeight: 900, color: darkMode ? "#a5b4fc" : "#64748b", textTransform: "uppercase", letterSpacing: ".6px" }}>Meaning</div>
                    <div style={{ marginTop: "4px", fontSize: "13px", lineHeight: 1.5 }}>{aiWordHelp.meaning}</div>
                  </div>
                  <div style={{ padding: "10px", borderRadius: "11px", background: darkMode ? "#1b1b2b" : "#f8fafc" }}>
                    <div style={{ fontSize: "10px", fontWeight: 900, color: darkMode ? "#a5b4fc" : "#64748b", textTransform: "uppercase", letterSpacing: ".6px" }}>Word breakdown</div>
                    <div style={{ marginTop: "4px", fontSize: "16px", fontWeight: 900, color: darkMode ? "#c4b5fd" : "#5b21b6", letterSpacing: ".8px" }}>{aiWordHelp.breakdown}</div>
                  </div>
                  <div style={{ padding: "10px", borderRadius: "11px", background: darkMode ? "#1b1b2b" : "#f8fafc" }}>
                    <div style={{ fontSize: "10px", fontWeight: 900, color: darkMode ? "#a5b4fc" : "#64748b", textTransform: "uppercase", letterSpacing: ".6px" }}>Easy pronunciation</div>
                    <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 800, lineHeight: 1.5 }}>{aiWordHelp.pronunciation}</div>
                  </div>
                  <div style={{ padding: "10px", borderRadius: "11px", background: darkMode ? "#1b1b2b" : "#f8fafc" }}>
                    <div style={{ fontSize: "10px", fontWeight: 900, color: darkMode ? "#a5b4fc" : "#64748b", textTransform: "uppercase", letterSpacing: ".6px" }}>Reading tip</div>
                    <div style={{ marginTop: "4px", fontSize: "12px", lineHeight: 1.5 }}>{aiWordHelp.tip}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ ...styles.translationCard, background: darkMode ? "#171827" : styles.translationCard.background, borderColor: darkMode ? "#34344d" : "#e2e8f0" }}>
            <div style={{ ...styles.translationTitle, color: darkMode ? "#f8fafc" : "#171725" }}>
              🌐 Translate Reading
            </div>

            <select
              value={targetLanguage}
              onChange={(e) =>
                setTargetLanguage(
                  e.target.value
                )
              }
              style={{ ...styles.languageSelect, background: darkMode ? "#25253a" : "white", color: darkMode ? "#f8fafc" : "#171725", borderColor: darkMode ? "#3f3f5c" : "#cbd5e1" }}
            >
              <option value="tam_Taml">
                🇮🇳 Tamil
              </option>

              <option value="hin_Deva">
                🇮🇳 Hindi
              </option>

              <option value="tel_Telu">
                🇮🇳 Telugu
              </option>

              <option value="mal_Mlym">
                🇮🇳 Malayalam
              </option>

              <option value="fra_Latn">
                🇫🇷 French
              </option>

              <option value="spa_Latn">
                🇪🇸 Spanish
              </option>

              <option value="deu_Latn">
                🇩🇪 German
              </option>
            </select>

            <button
              style={styles.translateButton}
              onClick={translateText}
              disabled={isTranslating}
            >
              {isTranslating
                ? "Translating..."
                : "Translate"}
            </button>

            {translation && (
              <div style={{ ...styles.translationResult, background: darkMode ? "#25253a" : "#ffffff", borderColor: darkMode ? "#3f3f5c" : "#e2e8f0", color: darkMode ? "#e5e7eb" : "#334155" }}>
                {translation}
              </div>
            )}
          </div>

          <div style={{ ...styles.assistantTip, background: darkMode ? "#171827" : styles.assistantTip.background, borderColor: darkMode ? "#34344d" : "#e8edf3", color: darkMode ? "#cbd5e1" : "#334155" }}>
            <span>💡</span>

            <p>
              Tip: Read naturally. Verba will track
              your voice and highlight the matching
              word.
            </p>
          </div>

          <div style={styles.statsCard}>
            <div>
              <span>Words</span>
              <strong>{words.length}</strong>
            </div>

            <div>
              <span>Current</span>
              <strong>
                {Math.min(
                  currentWord + 1,
                  words.length
                )}
              </strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

const styles = {
  homeNav: { width: "100%", maxWidth: "1180px", minHeight: "68px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px 8px 12px", boxSizing: "border-box", border: "1px solid", borderRadius: "20px", backdropFilter: "blur(18px)", boxShadow: "0 18px 55px rgba(15,23,42,.08)" },
  brandMark: { display: "flex", alignItems: "center", gap: "10px" },
  brandLogo: { width: "42px", height: "42px", borderRadius: "13px", background: "linear-gradient(135deg,#8b5cf6,#4f46e5)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "20px", boxShadow: "0 8px 20px rgba(79,70,229,.25)" },
  navLinks: { display: "flex", alignItems: "center", gap: "5px" },
  navLink: { border: "none", background: "transparent", padding: "9px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: "800", cursor: "pointer" },
  heroShell: { width: "100%", maxWidth: "1180px", display: "grid", gridTemplateColumns: "1.05fr .95fr", alignItems: "center", gap: "55px", padding: "78px 0 55px" },
  heroGlow: { position: "relative" },
  heroActions: { display: "flex", gap: "11px", flexWrap: "wrap" },
  secondaryHeroButton: { border: "1px solid", borderRadius: "15px", padding: "15px 20px", fontSize: "14px", fontWeight: "800", cursor: "pointer", backdropFilter: "blur(10px)" },
  heroPreview: { borderRadius: "28px", padding: "12px", background: "linear-gradient(145deg,rgba(139,92,246,.42),rgba(59,130,246,.22))", boxShadow: "0 35px 80px rgba(76,29,149,.22)", transform: "rotate(1.2deg)" },
  previewTop: { height: "30px", display: "flex", alignItems: "center", gap: "5px", padding: "0 9px" },
  previewDot: { width: "7px", height: "7px", borderRadius: "50%", background: "rgba(255,255,255,.7)" },
  previewBody: { background: "rgba(255,255,255,.96)", borderRadius: "20px", padding: "28px", minHeight: "300px", boxSizing: "border-box", color: "#171725", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.7)" },
  previewMiniLabel: { color: "#7c3aed", fontSize: "9px", fontWeight: "900", letterSpacing: "1.3px" },
  previewWord: { fontSize: "30px", fontWeight: "900", margin: "7px 0 24px", letterSpacing: "-1px" },
  previewLine: { fontSize: "17px", lineHeight: 1.9, color: "#475569" },
  previewProgress: { height: "8px", background: "#ede9fe", borderRadius: "999px", overflow: "hidden", marginTop: "30px" },
  previewBottom: { display: "flex", gap: "9px", flexWrap: "wrap", marginTop: "20px", fontSize: "9px", fontWeight: "800", color: "#64748b" },
  statsStrip: { width: "100%", maxWidth: "1180px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px", background: "rgba(148,163,184,.18)", border: "1px solid rgba(148,163,184,.18)", borderRadius: "20px", overflow: "hidden", marginBottom: "30px" },
  homeStat: {},
  homeStatItem: { padding: "16px 18px", display: "flex", flexDirection: "column", gap: "4px", background: "rgba(255,255,255,.58)" },
  demoPage: { minHeight: "100vh", paddingBottom: "70px", boxSizing: "border-box" },
  demoNav: { height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px", borderBottom: "1px solid", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 10 },
  dashboardContainer: { maxWidth: "1180px", margin: "0 auto", padding: "52px 28px" },
  dashboardHeading: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "20px", marginBottom: "28px" },
  demoEyebrow: { color: "#7c3aed", fontSize: "9px", fontWeight: "900", letterSpacing: "1.5px" },
  demoTitle: { fontSize: "clamp(34px,5vw,52px)", letterSpacing: "-2.5px", margin: "8px 0 8px" },
  demoSubtitle: { margin: 0, fontSize: "14px", lineHeight: 1.7, maxWidth: "650px" },
  dashboardDate: { padding: "12px 16px", borderRadius: "14px", background: "rgba(124,58,237,.08)", color: "#7c3aed", fontSize: "10px", lineHeight: 1.5, textAlign: "right" },
  dashboardGhost: { border: "1px solid", background: "transparent", borderRadius: "10px", padding: "9px 12px", cursor: "pointer" },
  dashboardStart: { border: "none", borderRadius: "10px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", padding: "10px 14px", fontWeight: "800", cursor: "pointer", fontSize: "11px" },
  metricGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "13px", marginBottom: "15px" },
  metricCard: { padding: "19px", border: "1px solid", borderRadius: "20px", boxShadow: "0 14px 35px rgba(15,23,42,.06)", display: "flex", flexDirection: "column", gap: "5px" },
  metricIcon: { width: "35px", height: "35px", borderRadius: "11px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f0ff", marginBottom: "6px" },
  dashboardGrid: { display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: "15px", marginBottom: "15px" },
  dashboardPanel: { border: "1px solid", borderRadius: "22px", padding: "21px", boxShadow: "0 14px 35px rgba(15,23,42,.05)" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "18px" },
  panelBadge: { fontSize: "8px", fontWeight: "900", color: "#7c3aed", background: "#f3f0ff", borderRadius: "999px", padding: "5px 8px" },
  chartArea: { height: "210px", display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: "15px", padding: "12px 4px 0", borderBottom: "1px dashed #cbd5e1" },
  chartColumn: { height: "100%", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: "8px", fontSize: "9px", fontWeight: "700" },
  chartBar: { width: "100%", maxWidth: "42px", borderRadius: "10px 10px 3px 3px", background: "linear-gradient(180deg,#a78bfa,#4f46e5)", minHeight: "28px" },
  aiInsightIcon: { width: "34px", height: "34px", borderRadius: "11px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white" },
  insightItem: { display: "flex", gap: "10px", padding: "12px 0", borderBottom: "1px solid rgba(148,163,184,.16)" },
  sessionRow: { display: "grid", gridTemplateColumns: "1fr auto auto", gap: "16px", alignItems: "center", padding: "13px 0", borderBottom: "1px solid" },
  aiBannerIcon: { width: "48px", height: "48px", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontSize: "22px", boxShadow: "0 12px 24px rgba(124,58,237,.22)" },
  flowContainer: { maxWidth: "1120px", margin: "0 auto", padding: "65px 28px" },
  flowHero: { textAlign: "center", marginBottom: "45px" },
  flowGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "15px" },
  flowCard: { position: "relative", padding: "23px", border: "1px solid", borderRadius: "22px", minHeight: "170px", boxShadow: "0 14px 35px rgba(15,23,42,.05)" },
  flowNumber: { width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg,#8b5cf6,#4f46e5)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "900" },
  flowConnector: { position: "absolute", right: "18px", top: "18px", color: "#a78bfa", fontWeight: "900" },
  architecturePanel: { marginTop: "20px", padding: "26px", border: "1px solid", borderRadius: "25px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "25px", flexWrap: "wrap", boxShadow: "0 18px 45px rgba(76,29,149,.08)" },
  architectureNodes: { display: "flex", alignItems: "center", gap: "9px", flexWrap: "wrap", fontSize: "11px", fontWeight: "800" },
  app: { minHeight: "100vh", fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" },
  app: { minHeight: "100vh", fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" },
  home: { minHeight: "100vh", background: "radial-gradient(circle at 15% 15%,#ede9fe 0,transparent 28%),radial-gradient(circle at 85% 20%,#dbeafe 0,transparent 25%),linear-gradient(135deg,#fafaff 0%,#ffffff 48%,#f5f7ff 100%)", display: "flex", flexDirection: "column", alignItems: "center", padding: "72px 28px 60px", boxSizing: "border-box" },
  logo: { width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg,#8b5cf6,#4f46e5)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", fontWeight: "900", boxShadow: "0 20px 45px rgba(79,70,229,.25)", marginBottom: "30px" },
  heroBadge: { padding: "8px 13px", borderRadius: "999px", background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.14)", fontSize: "11px", fontWeight: "800", letterSpacing: "1.7px", color: "#6d28d9", marginBottom: "18px" },
  heroTitle: { fontSize: "clamp(44px,7vw,70px)", lineHeight: 1.02, margin: 0, textAlign: "center", letterSpacing: "-4px", color: "#171725", maxWidth: "900px" },
  gradientText: { background: "linear-gradient(90deg,#8b5cf6,#4f46e5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  heroText: { maxWidth: "680px", textAlign: "center", fontSize: "18px", lineHeight: 1.75, color: "#64748b", margin: "24px 0 30px" },
  primaryButton: { border: "none", borderRadius: "15px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", padding: "15px 25px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 14px 30px rgba(79,70,229,.25)", transition: "transform .2s,box-shadow .2s" },
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(3,minmax(200px,1fr))", gap: "18px", maxWidth: "980px", width: "100%", marginTop: "72px" },
  featureCard: { background: "rgba(255,255,255,.72)", backdropFilter: "blur(14px)", border: "1px solid rgba(226,232,240,.9)", borderRadius: "22px", padding: "25px", boxShadow: "0 12px 35px rgba(15,23,42,.06)" },
  featureIcon: { width: "48px", height: "48px", borderRadius: "15px", background: "#f3f0ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "17px" },
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#f8f9ff,#ffffff)" },
  topBar: { height: "74px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 35px", borderBottom: "1px solid #e8eaf2", background: "rgba(255,255,255,.88)", backdropFilter: "blur(14px)", position: "sticky", top: 0, zIndex: 5 },
  backButton: { border: "none", background: "transparent", fontSize: "14px", cursor: "pointer", color: "#334155", fontWeight: "700" },
  smallLogo: { width: "39px", height: "39px", borderRadius: "12px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", boxShadow: "0 8px 18px rgba(79,70,229,.2)" },
  stepText: { color: "#64748b", fontSize: "13px", fontWeight: "600" },
  uploadContainer: { maxWidth: "820px", margin: "65px auto", padding: "0 25px" },
  pageBadge: { display: "inline-flex", padding: "7px 11px", borderRadius: "999px", background: "#f3f0ff", color: "#6d28d9", fontSize: "10px", fontWeight: "900", letterSpacing: "1.4px" },
  pageTitle: { fontSize: "clamp(34px,5vw,48px)", letterSpacing: "-2px", margin: "15px 0 10px", color: "#171725" },
  pageSubtitle: { color: "#64748b", fontSize: "16px", lineHeight: 1.6, marginBottom: "32px" },
  uploadBox: { minHeight: "310px", border: "2px dashed #c4b5fd", borderRadius: "24px", background: "linear-gradient(145deg,#ffffff,#faf8ff)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", boxShadow: "0 18px 45px rgba(76,29,149,.06)" },
  uploadIcon: { width: "64px", height: "64px", borderRadius: "20px", background: "#ede9fe", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "31px", fontWeight: "700" },
  previewImage: { width: "100%", maxHeight: "470px", objectFit: "contain", background: "#f8fafc" },
  secondaryButton: { marginTop: "18px", width: "100%", padding: "14px", border: "1px solid #c4b5fd", borderRadius: "13px", background: "#f3f0ff", color: "#5b21b6", fontWeight: "800", cursor: "pointer" },
  ocrCard: { marginTop: "22px", padding: "24px", background: "white", borderRadius: "22px", border: "1px solid #e7e9f2", boxShadow: "0 15px 35px rgba(15,23,42,.06)" },
  ocrHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" },
  successBadge: { color: "#047857", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "6px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "800" },
  textarea: { width: "100%", minHeight: "190px", marginTop: "15px", padding: "16px", boxSizing: "border-box", border: "1px solid #e2e8f0", borderRadius: "14px", fontSize: "16px", lineHeight: 1.7, resize: "vertical", outline: "none", background: "#fbfcff" },
  readingPage: { minHeight: "100vh", transition: "background .2s" },
  readingTopBar: { height: "74px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 30px", borderBottom: "1px solid #e5e7eb", background: "rgba(255,255,255,.82)", backdropFilter: "blur(12px)" },
  readingLogo: { display: "flex", alignItems: "center", gap: "10px", fontWeight: "900", fontSize: "17px" },
  controls: { display: "flex", gap: "7px" },
  controlButton: { border: "1px solid #e2e8f0", background: "rgba(255,255,255,.9)", borderRadius: "10px", padding: "8px 12px", cursor: "pointer", fontWeight: "700", boxShadow: "0 4px 12px rgba(15,23,42,.04)" },
  progressContainer: { maxWidth: "1400px", margin: "18px auto", padding: "0 30px" },
  progressInfo: { display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: "700" },
  progressBar: { height: "7px", background: "#e9e5ff", borderRadius: "999px", overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg,#8b5cf6,#4f46e5)", borderRadius: "999px", transition: "width .3s" },
  workspace: { maxWidth: "1400px", margin: "26px auto", padding: "0 30px 50px", display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: "24px" },
  readingCard: { borderRadius: "26px", padding: "32px", boxShadow: "0 16px 45px rgba(15,23,42,.07)", border: "1px solid rgba(226,232,240,.8)" },
  readingCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px" },
  readingTitle: { margin: "6px 0 0", fontSize: "26px", letterSpacing: "-.7px" },
  readingLabel: { fontSize: "10px", letterSpacing: "1.7px", color: "#7c3aed", fontWeight: "900" },
  statusPill: { padding: "8px 12px", borderRadius: "999px", display: "flex", alignItems: "center", gap: "7px", fontSize: "11px", fontWeight: "800" },
  statusDot: { width: "8px", height: "8px", borderRadius: "50%" },
  textArea: { marginTop: "28px", padding: "28px 25px", minHeight: "330px", color: "#27272a", background: "linear-gradient(180deg,#ffffff,#fcfcff)", border: "1px solid #eef0f5", borderRadius: "20px" },
  word: { display: "inline", padding: "4px 5px", transition: "background .15s,color .15s", borderRadius: "7px" },
  readingControls: { display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "20px" },
  controlButtonLarge: { border: "1px solid #e2e8f0", background: "white", borderRadius: "12px", padding: "12px 17px", cursor: "pointer", fontWeight: "700", boxShadow: "0 5px 14px rgba(15,23,42,.04)" },
  listenButton: { border: "none", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", borderRadius: "12px", padding: "13px 19px", cursor: "pointer", fontWeight: "800", boxShadow: "0 9px 20px rgba(79,70,229,.2)" },
  stopButton: { border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "white", borderRadius: "12px", padding: "13px 19px", cursor: "pointer", fontWeight: "800", boxShadow: "0 9px 20px rgba(220,38,38,.16)" },
  spokenBox: { marginTop: "20px", background: "#f8fafc", border: "1px solid #e8edf3", borderRadius: "16px", padding: "17px" },
  spokenHeader: { display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "12px" },
  liveText: { color: "#16a34a", fontSize: "10px", letterSpacing: ".7px", background: "#dcfce7", padding: "4px 7px", borderRadius: "999px" },
  reportCard: { marginTop: "26px", padding: "30px", borderRadius: "30px", background: "linear-gradient(145deg,#ffffff 0%,#fbfaff 50%,#f5f3ff 100%)", border: "1px solid #e6ddff", boxShadow: "0 24px 65px rgba(76,29,149,.13)", overflow: "hidden" },
  reportHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "18px", paddingBottom: "20px", borderBottom: "1px solid #eeeafd" },
  reportEyebrow: { display: "inline-flex", alignItems: "center", padding: "6px 10px", borderRadius: "999px", background: "#f0ebff", color: "#6d28d9", fontSize: "9px", fontWeight: "900", letterSpacing: "1.1px" },
  reportTitle: { margin: "10px 0 4px", fontSize: "30px", letterSpacing: "-1px", color: "#181725" },
  reportSubtitle: { margin: 0, color: "#64748b", fontSize: "13px" },
  aiBadge: { background: "#111827", color: "#ffffff", padding: "9px 12px", borderRadius: "999px", fontSize: "9px", fontWeight: "900", whiteSpace: "nowrap", boxShadow: "0 8px 18px rgba(15,23,42,.12)" },
  analyzingBox: { marginTop: "24px", padding: "25px", display: "flex", alignItems: "center", gap: "18px", background: "rgba(255,255,255,.9)", borderRadius: "22px", border: "1px solid #e9ddff", boxShadow: "0 10px 30px rgba(76,29,149,.06)" },
  aiOrb: { width: "58px", height: "58px", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", color: "white", fontSize: "25px", flexShrink: 0, boxShadow: "0 12px 25px rgba(124,58,237,.25)" },
  analyzingContent: { flex: 1 },
  analyzingLabel: { color: "#7c3aed", fontSize: "9px", fontWeight: "900", letterSpacing: "1.2px", marginBottom: "5px" },
  loadingBar: { marginTop: "13px", height: "7px", borderRadius: "999px", background: "#ede9fe", overflow: "hidden" },
  loadingFill: { width: "45%", height: "100%", borderRadius: "999px", background: "linear-gradient(90deg,#7c3aed,#c4b5fd)" },
  reportHero: { marginTop: "22px", padding: "24px", display: "flex", alignItems: "center", gap: "24px", borderRadius: "24px", background: "linear-gradient(135deg,#f5f3ff,#ffffff 65%)", border: "1px solid #e9ddff" },
  scoreRing: { width: "126px", height: "126px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 12px 30px rgba(124,58,237,.12)" },
  scoreInner: { width: "96px", height: "96px", borderRadius: "50%", background: "#ffffff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 5px 16px rgba(76,29,149,.08)" },
  heroSummary: { minWidth: 0 },
  summaryTop: { display: "flex", gap: "7px", alignItems: "center", flexWrap: "wrap" },
  summaryBadge: { color: "#047857", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "5px 9px", borderRadius: "999px", fontSize: "8px", fontWeight: "900", letterSpacing: ".7px" },
  aiMiniBadge: { color: "#6d28d9", background: "#ede9fe", padding: "5px 9px", borderRadius: "999px", fontSize: "8px", fontWeight: "900", letterSpacing: ".7px" },
  reportStats: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginTop: "14px" },
  reportStat: { background: "rgba(255,255,255,.92)", border: "1px solid #ececf3", borderRadius: "18px", padding: "15px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", boxShadow: "0 7px 20px rgba(15,23,42,.04)" },
  statIcon: { width: "31px", height: "31px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", marginBottom: "2px" },
  adaptiveAiCard: { marginTop: "16px", padding: "20px", borderRadius: "22px", border: "1px solid", boxShadow: "0 12px 28px rgba(124,58,237,.08)" },
  adaptiveAiHeader: { display: "flex", alignItems: "center", gap: "11px", marginBottom: "15px" },
  aiOrbSmall: { width: "38px", height: "38px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", color: "white", fontWeight: "900" },
  adaptiveGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" },
  adaptiveMetric: { padding: "13px", borderRadius: "14px", border: "1px solid #eeeafd", display: "flex", flexDirection: "column", gap: "5px" },
  "adaptiveMetric span": { fontSize: "10px", color: "#64748b", fontWeight: "700" },
  "adaptiveMetric strong": { fontSize: "14px", color: "#6d28d9" },
  adaptiveReason: { margin: "13px 0", fontSize: "12px", lineHeight: 1.6 },
  adaptivePlan: { padding: "12px", borderRadius: "13px", fontSize: "12px", lineHeight: 1.6, border: "1px solid #eeeafd" },
  aiFeedbackBox: { marginTop: "16px", padding: "21px", background: "linear-gradient(135deg,#151525,#21183d)", color: "#f8fafc", borderRadius: "22px", lineHeight: 1.7, boxShadow: "0 15px 32px rgba(15,23,42,.15)" },
  aiFeedbackTop: { display: "flex", alignItems: "center", gap: "11px", marginBottom: "13px" },
  aiFeedbackIcon: { width: "36px", height: "36px", borderRadius: "11px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(196,181,253,.14)", color: "#c4b5fd" },
  aiFeedbackTitle: { fontWeight: "900", color: "#ffffff", fontSize: "14px" },
  aiFeedbackSub: { color: "#a5b4fc", fontSize: "10px", marginTop: "2px" },
  aiFeedbackText: { whiteSpace: "pre-wrap", color: "#e5e7eb", fontSize: "13px", lineHeight: 1.75, borderTop: "1px solid rgba(255,255,255,.09)", paddingTop: "13px" },
  reportBottomGrid: { marginTop: "14px", display: "grid", gridTemplateColumns: "minmax(180px,.55fr) minmax(0,1.45fr)", gap: "12px" },
  detailCard: { padding: "18px", borderRadius: "19px", background: "rgba(255,255,255,.9)", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "12px" },
  detailIcon: { width: "42px", height: "42px", borderRadius: "13px", background: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  practiceCard: { padding: "18px", borderRadius: "19px", background: "rgba(255,255,255,.9)", border: "1px solid #e5e7eb" },
  practiceHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", fontWeight: "800", fontSize: "13px" },
  practiceBadge: { color: "#6d28d9", background: "#f3f0ff", padding: "5px 8px", borderRadius: "999px", fontSize: "8px", fontWeight: "900", letterSpacing: ".6px", whiteSpace: "nowrap" },
  practiceWords: { display: "flex", flexWrap: "wrap", gap: "7px", marginTop: "12px" },
  practiceChip: { padding: "7px 10px", borderRadius: "999px", background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", fontSize: "11px", fontWeight: "800" },
  noPractice: { color: "#64748b", fontSize: "12px" },
  reportFooter: { display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginTop: "16px", paddingTop: "13px", borderTop: "1px solid #eeeafd", color: "#64748b", fontSize: "10px", fontWeight: "700" },
  assistantCard: { borderRadius: "26px", padding: "25px", height: "fit-content", boxShadow: "0 16px 45px rgba(15,23,42,.07)", border: "1px solid rgba(226,232,240,.8)" },
  assistantIcon: { width: "47px", height: "47px", borderRadius: "15px", background: "linear-gradient(135deg,#ede9fe,#e0e7ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" },
  assistantText: { color: "#64748b", lineHeight: 1.65, fontSize: "13px" },
  currentWordCard: { marginTop: "22px", background: "linear-gradient(135deg,#f5f3ff,#eef2ff)", borderRadius: "17px", padding: "18px", border: "1px solid #e4ddff" },
  currentWordLabel: { display: "block", color: "#64748b", fontSize: "11px", marginBottom: "8px", fontWeight: "700" },
  currentWordValue: { fontSize: "25px", color: "#5b21b6" },
  voiceAssistantCard: { marginTop: "16px", padding: "17px", borderRadius: "17px", background: "#f7f5ff", border: "1px solid #ddd6fe" },
  voiceAssistantHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "800", fontSize: "13px" },
  toggleButton: { width: "39px", height: "22px", border: "none", borderRadius: "20px", padding: "2px", cursor: "pointer", transition: "background .2s" },
  toggleCircle: { display: "block", width: "18px", height: "18px", borderRadius: "50%", background: "white", transition: "transform .2s", boxShadow: "0 1px 4px rgba(0,0,0,.15)" },
  voiceAssistantDescription: { color: "#64748b", fontSize: "11px", lineHeight: 1.55, margin: "11px 0" },
  assistantStatus: { display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: "800", color: "#475569" },
  translationCard: { marginTop: "16px", padding: "17px", borderRadius: "17px", background: "#f8fafc", border: "1px solid #e2e8f0" },
  translationTitle: { fontSize: "13px", fontWeight: "900", marginBottom: "11px" },
  languageSelect: { width: "100%", padding: "10px", borderRadius: "11px", border: "1px solid #cbd5e1", background: "white", fontSize: "13px", cursor: "pointer", outline: "none" },
  translateButton: { width: "100%", marginTop: "9px", padding: "11px", border: "none", borderRadius: "11px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontWeight: "800", cursor: "pointer" },
  translationResult: { marginTop: "12px", padding: "13px", borderRadius: "11px", background: "#ffffff", border: "1px solid #e2e8f0", color: "#334155", lineHeight: 1.7, fontSize: "13px" },
  assistantTip: { marginTop: "14px", display: "flex", gap: "10px", background: "#f8fafc", border: "1px solid #e8edf3", padding: "13px", borderRadius: "14px", fontSize: "12px", lineHeight: 1.5 },
  statsCard: { marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px" }
}

export default App