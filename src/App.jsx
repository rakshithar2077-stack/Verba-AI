import { useState, useRef, useEffect } from "react"
import Tesseract from "tesseract.js"

const wordCoachCache = new Map()

function App() {
  const [page, setPage] = useState("home")
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("verba-theme") === "dark")

  useEffect(() => {
    localStorage.setItem("verba-theme", darkMode ? "dark" : "light")
  }, [darkMode])
  const [image, setImage] = useState(null)
  const [ocrText, setOcrText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  return (
    <div style={{ ...styles.app, background: darkMode ? "#0b0b12" : "#f8fafc", color: darkMode ? "#f8fafc" : "#171725", minHeight: "100vh" }}>
      <button
        onClick={() => setDarkMode(value => !value)}
        aria-label="Toggle dark and light mode"
        style={{
          position: "fixed",
          top: "14px",
          right: "16px",
          zIndex: 9999,
          border: `1px solid ${darkMode ? "#475569" : "#dbe1ea"}`,
          borderRadius: "999px",
          padding: "10px 16px",
          background: darkMode ? "#1f2030" : "#ffffff",
          color: darkMode ? "#f8fafc" : "#1e293b",
          boxShadow: "0 6px 18px rgba(15,23,42,.12)",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 800
        }}
      >
        {darkMode ? "☀️ Light" : "🌙 Dark"}
      </button>

      {page === "home" && (
        <HomePage darkMode={darkMode} onStart={() => setPage("upload")} />
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
        />
      )}

      {page === "reading" && (
        <ReadingWorkspace
          displayText={ocrText}
          onBack={() => setPage("upload")}
          darkMode={darkMode}
        />
      )}
    </div>
  )
}

function HomePage({ onStart, darkMode }) {
  return (
    <div style={{ ...styles.home, background: darkMode ? "#0b0b12" : styles.home.background, color: darkMode ? "#f8fafc" : "#171725", minHeight: "100vh" }}>
      <div style={styles.logo}>V</div>
      <div style={styles.heroBadge}>
        AI-POWERED INCLUSIVE READING
      </div>
      <h1 style={{ ...styles.heroTitle, color: darkMode ? "#f8fafc" : "#171725" }}>
        Read with <span style={styles.gradientText}>confidence.</span>
      </h1>
      <p style={{ ...styles.heroText, color: darkMode ? "#aab0c0" : "#64748b" }}>
        Verba AI helps learners read, understand and follow
        text with real-time AI assistance.
      </p>
      <button style={styles.primaryButton} onClick={onStart}>
        Start Reading →
      </button>
      <div style={styles.featureGrid}>
        <Feature
          darkMode={darkMode}
          icon="📖"
          title="Smart Reading"
          text="Upload a page and extract its text automatically."
        />
        <Feature
          darkMode={darkMode}
          icon="🎤"
          title="Voice Tracking"
          text="Read aloud and follow your progress word by word."
        />
        <Feature
          darkMode={darkMode}
          icon="🌐"
          title="Language Support"
          text="Translate reading material into another language."
        />
      </div>
    </div>
  )
}

function Feature({ icon, title, text, darkMode }) {
  return (
    <div
      style={{
        ...styles.featureCard,
        background: darkMode ? "#171722" : "rgba(255,255,255,.72)",
        borderColor: darkMode ? "#34364a" : "rgba(226,232,240,.9)",
        color: darkMode ? "#f8fafc" : "#171725",
        boxShadow: darkMode ? "0 12px 35px rgba(0,0,0,.22)" : styles.featureCard.boxShadow
      }}
    >
      <div style={{ ...styles.featureIcon, background: darkMode ? "#252638" : "#f3f0ff" }}>{icon}</div>
      <h3 style={{ color: darkMode ? "#f8fafc" : "#171725", fontWeight: 800 }}>{title}</h3>
      <p style={{ color: darkMode ? "#cfd3df" : "#64748b", fontWeight: 500 }}>{text}</p>
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
  darkMode
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
    <div style={{ ...styles.page, background: darkMode ? "#0b0b12" : styles.page.background, color: darkMode ? "#f8fafc" : "#171725", minHeight: "100vh" }}>
      <div
        style={{
          ...styles.topBar,
          background: darkMode ? "rgba(23,23,34,.97)" : "rgba(255,255,255,.88)",
          borderBottomColor: darkMode ? "#34364a" : "#e8eaf2"
        }}
      >
        <button
          style={{ ...styles.backButton, color: darkMode ? "#e2e8f0" : "#334155" }}
          onClick={onBack}
        >
          ← Back
        </button>
        <div style={styles.smallLogo}>V</div>
        <div style={{ ...styles.stepText, color: darkMode ? "#aab0c0" : "#64748b" }}>Step 1 of 2</div>
      </div>

      <div style={styles.uploadContainer}>
        <div style={styles.pageBadge}>
          READING MATERIAL
        </div>

        <h1 style={styles.pageTitle}>
          Bring your reading material
        </h1>

        <p style={styles.pageSubtitle}>
          Upload a photo of a book page, worksheet or document.
        </p>

        <label style={styles.uploadBox}>
          {image ? (
            <img
              src={image}
              alt="Uploaded page"
              style={{ ...styles.previewImage, filter: darkMode ? "grayscale(1) invert(1) contrast(1.05)" : "none" }}
            />
          ) : (
            <>
              <div style={styles.uploadIcon}>↑</div>
              <h3>Upload a page</h3>
              <p>PNG, JPG or JPEG</p>
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
          <div
            style={{
              ...styles.ocrCard,
              background: darkMode ? "#171722" : "#ffffff",
              borderColor: darkMode ? "#34364a" : "#e7e9f2",
              color: darkMode ? "#f8fafc" : "#171725"
            }}
          >
            <div style={styles.ocrHeader}>
              <h3>Extracted Text</h3>
              <span style={styles.successBadge}>✓ Ready</span>
            </div>

            <textarea
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              style={{
                ...styles.textarea,
                color: darkMode ? "#f8fafc" : "#172033",
                background: darkMode ? "#11121b" : "#fbfcff",
                borderColor: darkMode ? "#3f4156" : "#e2e8f0",
                fontWeight: 600
              }}
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

function ReadingWorkspace({ displayText, onBack, darkMode }) {
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

  // Word Coach helps when a learner does not understand or cannot pronounce
  // the currently selected word. It provides meaning, a simple breakdown,
  // pronunciation audio when available, and a browser-voice fallback.
  const [wordCoach, setWordCoach] = useState(null)
  const [isWordCoachLoading, setIsWordCoachLoading] = useState(false)
  const [wordCoachError, setWordCoachError] = useState("")
  const [isPlayingWord, setIsPlayingWord] = useState(false)
  const wordAudioRef = useRef(null)

  const recognitionRef = useRef(null)
  const currentWordRef = useRef(0)
  const translationWorkerRef = useRef(null)
  const aiWorkerRef = useRef(null)

  const pauseTimerRef = useRef(null)
  const wordCoachActiveRef = useRef(false)
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
      wordAudioRef.current?.pause()
      translationWorkerRef.current?.terminate()
      aiWorkerRef.current?.terminate()
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
    if (wordCoachActiveRef.current) return
    if (isSpeakingRef.current) return

    pauseTimerRef.current = setTimeout(() => {
      setPauseCount((count) => count + 1)
      speakNextWord()
    }, 5000)
  }

  const speakNextWord = () => {
    if (!assistantEnabledRef.current) return
    if (!isListeningRef.current) return
    if (wordCoachActiveRef.current) return
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
      readingStartedAtRef.current = Date.now()
      setReadingStartedAt(readingStartedAtRef.current)
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
        alert(
          "Microphone permission was denied. Please allow microphone access in Chrome."
        )
      }

      if (
        event.error !== "aborted"
      ) {
        setIsListening(false)
      }
    }

    recognition.onend = () => {
      if (
        !isSpeakingRef.current &&
        assistantEnabledRef.current &&
        !wordCoachActiveRef.current
      ) {
        try {
          recognition.start()
        } catch (error) {
          console.log(error)
        }
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (error) {
      console.error(error)
    }
  }

  // Translation runs in its own Web Worker so loading/running the NLLB model
  // never blocks the main UI thread. Speech recognition, Word Coach, AI report
  // and the other controls can therefore remain interactive while translation runs.
  const createTranslationWorker = () => {
    if (translationWorkerRef.current) return translationWorkerRef.current

    const workerCode = `
      import { pipeline } from "https://esm.sh/@huggingface/transformers";
      let modelPromise = null;

      self.onmessage = async (event) => {
        const { id, text, src_lang, tgt_lang } = event.data;
        try {
          if (!modelPromise) {
            modelPromise = pipeline(
              "translation",
              "Xenova/nllb-200-distilled-600M",
              { dtype: "q8" }
            );
          }

          const model = await modelPromise;
          const result = await model(text, { src_lang, tgt_lang });
          const translated = Array.isArray(result) && result.length > 0
            ? result[0]?.translation_text
            : "";

          self.postMessage({
            id,
            ok: true,
            text: translated || "No translation returned."
          });
        } catch (error) {
          self.postMessage({
            id,
            ok: false,
            error: error?.message || "Translation failed"
          });
        }
      };
    `

    const blob = new Blob([workerCode], { type: "text/javascript" })
    translationWorkerRef.current = new Worker(
      URL.createObjectURL(blob),
      { type: "module" }
    )

    return translationWorkerRef.current
  }

  const runTranslationInWorker = (text, targetLanguageCode) =>
    new Promise((resolve, reject) => {
      const worker = createTranslationWorker()
      const id = `translation-${Date.now()}-${Math.random()}`

      const handler = (event) => {
        if (event.data?.id !== id) return

        worker.removeEventListener("message", handler)

        if (event.data.ok) {
          resolve(event.data.text)
        } else {
          reject(new Error(event.data.error))
        }
      }

      worker.addEventListener("message", handler)
      worker.postMessage({
        id,
        text,
        src_lang: "eng_Latn",
        tgt_lang: targetLanguageCode
      })
    })

  const createAIWorker = () => {
    if (aiWorkerRef.current) return aiWorkerRef.current
    const workerCode = `
      import { pipeline } from "https://esm.sh/@huggingface/transformers";
      let modelPromise = null;
      self.onmessage = async (event) => {
        const { id, prompt } = event.data;
        try {
          if (!modelPromise) {
            modelPromise = pipeline("text-generation", "onnx-community/Qwen2.5-0.5B-Instruct", { dtype: "q4" });
          }
          const model = await modelPromise;
          const result = await model(prompt, { max_new_tokens: 220, temperature: 0.7, do_sample: true });
          self.postMessage({ id, ok: true, text: result?.[0]?.generated_text || "Unable to generate AI feedback." });
        } catch (error) {
          self.postMessage({ id, ok: false, error: error?.message || "AI failed" });
        }
      };
    `
    const blob = new Blob([workerCode], { type: "text/javascript" })
    aiWorkerRef.current = new Worker(URL.createObjectURL(blob), { type: "module" })
    return aiWorkerRef.current
  }

  const runAIInWorker = (prompt) => new Promise((resolve, reject) => {
    const worker = createAIWorker()
    const id = `${Date.now()}-${Math.random()}`
    const handler = (event) => {
      if (event.data?.id !== id) return
      worker.removeEventListener("message", handler)
      if (event.data.ok) resolve(event.data.text.replace(prompt, "").trim() || event.data.text)
      else reject(new Error(event.data.error))
    }
    worker.addEventListener("message", handler)
    worker.postMessage({ id, prompt })
  })

  const promptForReport = (analysis) => `You are Verba AI, an inclusive reading assistant. Analyze this reading session and give short, encouraging personalized feedback.

Total words: ${analysis.totalWords}
Correctly read: ${analysis.correctWords}
Accuracy: ${analysis.accuracy}%
Skipped words: ${analysis.skippedWords.join(", ") || "None"}
Repeated words: ${analysis.repeatedWords.join(", ") || "None"}
Incorrect words: ${analysis.incorrectWords.join(", ") || "None"}
Long pauses: ${analysis.pauseCount}
Reading duration: ${analysis.duration} seconds

Give concise, personalized feedback using exactly these headings: Overall, What you did well, Needs practice, Practice words, Encouragement. Use 1-2 short sentences under each heading. Mention only patterns supported by the data.`

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

    const analysis = {
      totalWords,
      correctWords,
      skippedWords: [...new Set(skippedWords)],
      repeatedWords: [...new Set(repeatedWords)],
      incorrectWords: [...new Set(incorrectWords)],
      accuracy,
      pauseCount,
      duration
    }

    setIsAnalyzing(true)
    try {
      const text = await runAIInWorker(promptForReport(analysis))
      setReadingReport({ ...analysis, aiFeedback: text })
    } catch (error) {
      console.error("AI reading analysis error:", error)
      setReadingReport({
        ...analysis,
        aiFeedback: "AI feedback could not be generated. Please try the reading session again."
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

  const splitWordForPractice = (word) => {
    const clean = normalizeWord(word)
    if (!clean) return []

    // A lightweight fallback when the AI/dictionary is unavailable.
    const parts = clean.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy](?=$)|[^aeiouy]*)?/gi)
    return parts && parts.length ? parts : [clean]
  }

  const pauseForWordCoach = () => {
    wordCoachActiveRef.current = true

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
    }

    setAssistantStatus("Word Coach")
  }

  const resumeAfterWordCoach = () => {
    wordCoachActiveRef.current = false

    if (!assistantEnabledRef.current || !isListeningRef.current) return

    setAssistantStatus("Listening")

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        // The browser may already be restarting recognition; that is okay.
        console.log(error)
      }
    }

    resetPauseTimer()
  }

  const parseCoachAI = (aiText) => {
    const getLine = (label) => {
      const match = aiText?.match(new RegExp(`${label}:\\s*(.+)`, "i"))
      return match ? match[1].trim() : ""
    }

    return {
      meaning: getLine("Meaning"),
      breakdown: getLine("Breakdown"),
      pronunciation: getLine("Pronunciation"),
      example: getLine("Example")
    }
  }

  const loadWordCoach = async (selectedWord = words[currentWordRef.current]) => {
    const cleanWord = normalizeWord(selectedWord || "")
    if (!cleanWord) return

    pauseForWordCoach()
    setIsWordCoachLoading(true)
    setWordCoachError("")

    const cached = wordCoachCache.get(cleanWord)
    if (cached) {
      setWordCoach(cached)
      setIsWordCoachLoading(false)
      // Cached results are immediate, so the 5-second assistant can resume now.
      resumeAfterWordCoach()
      return
    }

    const contextStart = Math.max(0, currentWordRef.current - 7)
    const contextEnd = Math.min(words.length, currentWordRef.current + 8)
    const context = words.slice(contextStart, contextEnd).join(" ")

    const fallbackCoach = {
      word: selectedWord,
      meaning: `A word used in this passage: ${cleanWord}.`,
      breakdown: splitWordForPractice(cleanWord),
      pronunciation: cleanWord,
      audioUrl: "",
      example: "Try saying each part slowly, then blend the parts together."
    }

    // Show a useful first result immediately while richer AI/context help loads.
    setWordCoach({
      ...fallbackCoach,
      meaning: "Finding a simple meaning…"
    })

    const dictionaryPromise = (async () => {
      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`
        )
        if (!response.ok) return null
        const data = await response.json()
        return Array.isArray(data) ? data[0] : null
      } catch (error) {
        console.warn("Dictionary lookup unavailable:", error)
        return null
      }
    })()

    // Start AI at the same time instead of waiting for the dictionary first.
    const aiPromise = (async () => {
      try {
        const prompt = `You are an inclusive reading coach. Help a learner understand and pronounce the word "${cleanWord}" from this reading passage: "${context}". Give a very simple meaning for how the word is used here, split the word into easy-to-say syllable-like parts using hyphens, give an easy pronunciation guide, and one short example. Return exactly four lines starting with Meaning:, Breakdown:, Pronunciation:, Example:.`
        return await runAIInWorker(prompt)
      } catch (error) {
        console.warn("Word Coach AI unavailable:", error)
        return ""
      }
    })()

    // Do not make the learner wait for the slowest service. We take the first
    // useful result (dictionary, AI, or a local fallback after a short timeout),
    // show it immediately, and let the other source refine the card in the
    // background. This keeps the 5-second reader responsive.
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ type: "fallback" }), 1200)
    })

    const firstResult = await Promise.race([
      dictionaryPromise.then((data) => ({ type: "dictionary", data })),
      aiPromise.then((text) => ({ type: "ai", text })),
      timeoutPromise
    ])

    let fastCoach = { ...fallbackCoach }

    if (firstResult.type === "dictionary" && firstResult.data) {
      const dictionaryData = firstResult.data
      fastCoach = {
        word: selectedWord,
        meaning: dictionaryData?.meanings?.[0]?.definitions?.[0]?.definition || fallbackCoach.meaning,
        breakdown: splitWordForPractice(cleanWord),
        pronunciation: dictionaryData?.phonetic || dictionaryData?.phonetics?.find((item) => item?.text)?.text || cleanWord,
        audioUrl: dictionaryData?.phonetics?.find((item) => item?.audio)?.audio || "",
        example: dictionaryData?.meanings?.[0]?.definitions?.[0]?.example || fallbackCoach.example
      }
    } else if (firstResult.type === "ai" && firstResult.text) {
      const ai = parseCoachAI(firstResult.text)
      fastCoach = {
        word: selectedWord,
        meaning: ai.meaning || fallbackCoach.meaning,
        breakdown: ai.breakdown
          ? ai.breakdown.split(/[-•]/).map((part) => part.trim()).filter(Boolean)
          : fallbackCoach.breakdown,
        pronunciation: ai.pronunciation || fallbackCoach.pronunciation,
        audioUrl: "",
        example: ai.example || fallbackCoach.example
      }
    }

    wordCoachCache.set(cleanWord, fastCoach)
    setWordCoach(fastCoach)
    setIsWordCoachLoading(false)

    // Resume immediately after a usable word explanation/breakdown is visible.
    resumeAfterWordCoach()

    // Both services can finish later and refine the already-visible card.
    const [dictionaryData, aiText] = await Promise.all([
      dictionaryPromise,
      aiPromise
    ])

    const dictionaryMeaning = dictionaryData?.meanings?.[0]?.definitions?.[0]?.definition || ""
    const dictionaryExample = dictionaryData?.meanings?.[0]?.definitions?.[0]?.example || ""
    const dictionaryPhonetic = dictionaryData?.phonetic || dictionaryData?.phonetics?.find((item) => item?.text)?.text || ""
    const dictionaryAudio = dictionaryData?.phonetics?.find((item) => item?.audio)?.audio || ""

    const ai = aiText ? parseCoachAI(aiText) : {}
    const refinedCoach = {
      ...fastCoach,
      meaning: ai.meaning || dictionaryMeaning || fastCoach.meaning,
      breakdown: ai.breakdown
        ? ai.breakdown.split(/[-•]/).map((part) => part.trim()).filter(Boolean)
        : fastCoach.breakdown,
      pronunciation: ai.pronunciation || dictionaryPhonetic || fastCoach.pronunciation,
      audioUrl: dictionaryAudio || fastCoach.audioUrl,
      example: ai.example || dictionaryExample || fastCoach.example
    }

    wordCoachCache.set(cleanWord, refinedCoach)
    setWordCoach((current) => {
      if (!current || normalizeWord(current.word) !== cleanWord) return current
      return refinedCoach
    })
  }

  const playWordPronunciation = async () => {
    const word = wordCoach?.word || words[currentWordRef.current]
    if (!word) return

    if (wordCoach?.audioUrl) {
      try {
        if (!wordAudioRef.current) {
          wordAudioRef.current = new Audio()
        }
        wordAudioRef.current.src = wordCoach.audioUrl
        setIsPlayingWord(true)
        wordAudioRef.current.onended = () => setIsPlayingWord(false)
        wordAudioRef.current.onerror = () => {
          setIsPlayingWord(false)
          playWithBrowserVoice(word)
        }
        await wordAudioRef.current.play()
        return
      } catch (error) {
        console.warn("Pronunciation audio failed:", error)
      }
    }

    playWithBrowserVoice(word)
  }

  const playWithBrowserVoice = (word) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(normalizeWord(word))
    utterance.lang = "en-US"
    utterance.rate = 0.58
    utterance.pitch = 1
    utterance.onstart = () => setIsPlayingWord(true)
    utterance.onend = () => setIsPlayingWord(false)
    utterance.onerror = () => setIsPlayingWord(false)
    window.speechSynthesis.resume()
    window.speechSynthesis.speak(utterance)
  }

  const translateText = async () => {
    if (!displayText.trim() || isTranslating) return

    setIsTranslating(true)
    setTranslation("")

    try {
      // IMPORTANT: this is intentionally awaited in a Web Worker.
      // The main React thread stays free for Start Listening, Word Coach,
      // font controls, navigation, and the 5-second voice assistant.
      const translated = await runTranslationInWorker(
        displayText,
        targetLanguage
      )

      setTranslation(translated || "No translation returned.")
    } catch (error) {
      console.error("Translation error:", error)
      setTranslation("Translation failed. Please try again.")
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
      <div style={{
        ...styles.readingTopBar,
        background: darkMode ? "#171722" : "rgba(255,255,255,.92)",
        borderBottom: `1px solid ${darkMode ? "#2f3040" : "#e5e7eb"}`,
        paddingRight: "170px"
      }}>
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

        <div style={styles.readingLogo}>
          <div style={styles.smallLogo}>V</div>
          <span>Verba AI</span>
        </div>

        <div style={styles.controls}>
          <button
            style={{
              ...styles.controlButton,
              background: darkMode ? "#252638" : "rgba(255,255,255,.9)",
              color: darkMode ? "#f8fafc" : "#334155",
              borderColor: darkMode ? "#3f4156" : "#e2e8f0"
            }}
            onClick={() =>
              setFontSize((size) =>
                Math.max(16, size - 2)
              )
            }
          >
            A−
          </button>

          <button
            style={{
              ...styles.controlButton,
              background: darkMode ? "#252638" : "rgba(255,255,255,.9)",
              color: darkMode ? "#f8fafc" : "#334155",
              borderColor: darkMode ? "#3f4156" : "#e2e8f0"
            }}
            onClick={() =>
              setFontSize((size) =>
                Math.min(34, size + 2)
              )
            }
          >
            A+
          </button>

        </div>
      </div>

      <div style={styles.progressContainer}>
        <div style={styles.progressInfo}>
          <span>Reading Progress</span>
          <span>{progress}%</span>
        </div>

        <div style={styles.progressBar}>
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
            background: darkMode ? "#1b1b28" : "#ffffff",
            borderColor: darkMode ? "#4b4d61" : "#dfe3eb",
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
              background: darkMode ? "#11121b" : "linear-gradient(180deg,#ffffff,#fcfcff)",
              color: darkMode ? "#f8fafc" : "#27272a",
              borderColor: darkMode ? "#34364a" : "#eef0f5",
              boxShadow: darkMode ? "inset 0 0 0 1px rgba(255,255,255,.02)" : "none",
              fontSize: `${fontSize}px`,
              lineHeight: 1.9,
              fontWeight: 650
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
                  opacity: 1,
                  WebkitTextFillColor: "currentColor",
                  background:
                    index === currentWord
                      ? "#c4b5fd"
                      : "transparent",
                  color:
                    index === currentWord
                      ? "#4c1d95"
                      : darkMode
                      ? "#f8fafc"
                      : "#27272a",
                  borderRadius:
                    index === currentWord
                      ? "7px"
                      : "0",
                  cursor: "pointer",
                  fontWeight: index === currentWord ? 800 : 650,
                  textShadow: "none",
                  filter: "none"
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
              style={{
                ...styles.controlButtonLarge,
                background: darkMode ? "#252638" : "white",
                color: darkMode ? "#f8fafc" : "#334155",
                borderColor: darkMode ? "#3f4156" : "#e2e8f0"
              }}
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
              style={{
                ...styles.controlButtonLarge,
                background: darkMode ? "#252638" : "white",
                color: darkMode ? "#f8fafc" : "#334155",
                borderColor: darkMode ? "#3f4156" : "#e2e8f0"
              }}
              onClick={nextWord}
            >
              Next Word →
            </button>
          </div>

          <div style={{
            ...styles.spokenBox,
            background: darkMode ? "#171722" : "#f8fafc",
            borderColor: darkMode ? "#34364a" : "#e8edf3",
            color: darkMode ? "#f8fafc" : "#172033"
          }}>
            <div style={styles.spokenHeader}>
              <span>🎤 You said</span>

              {isListening && (
                <span style={styles.liveText}>
                  LIVE
                </span>
              )}
            </div>

            <p>
              {spokenText ||
                "Start listening and read the text aloud..."}
            </p>
          </div>

          {(isAnalyzing || readingReport) && (
            <section style={{
              ...styles.reportCard,
              background: darkMode ? "linear-gradient(145deg,#181827,#202034)" : styles.reportCard.background,
              borderColor: darkMode ? "#3b3560" : "#e6ddff",
              color: darkMode ? "#f8fafc" : "#171725"
            }}>
              <div style={styles.reportHeader}>
                <div>
                  <div style={styles.reportEyebrow}>VERBA AI • READING INSIGHTS</div>
                  <h2 style={{ ...styles.reportTitle, color: darkMode ? "#f8fafc" : "#181725" }}>Your Reading Report</h2>
                  <p style={{ ...styles.reportSubtitle, color: darkMode ? "#aab0c0" : "#64748b" }}>A personalized snapshot of this reading session.</p>
                </div>
                <div style={styles.aiBadge}>✦ LOCAL AI</div>
              </div>

              {isAnalyzing ? (
                <div style={{
                  ...styles.analyzingBox,
                  background: darkMode ? "#24243a" : "#ffffff",
                  borderColor: darkMode ? "#4a426d" : "#e9ddff",
                  color: darkMode ? "#f8fafc" : "#171725"
                }}>
                  <div style={styles.aiOrb}>✦</div>
                  <div style={styles.analyzingContent}>
                    <div style={{ ...styles.analyzingLabel, color: darkMode ? "#c4b5fd" : "#7c3aed" }}>AI ANALYSIS IN PROGRESS • OTHER TOOLS REMAIN AVAILABLE</div>
                    <strong style={{ display: "block", color: darkMode ? "#ffffff" : "#181725", fontSize: "18px", lineHeight: 1.35 }}>Verba is understanding your reading</strong>
                    <p style={{ margin: "6px 0 0", color: darkMode ? "#d6d8e3" : "#475569", fontSize: "14px", lineHeight: 1.55 }}>Checking accuracy, pauses, repeated words and reading patterns.</p>
                    <div style={{ ...styles.loadingBar, background: darkMode ? "#3a3554" : "#ede9fe" }}><div style={styles.loadingFill} /></div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{
                    ...styles.reportHero,
                    background: darkMode ? "linear-gradient(135deg,#25243a,#1b1b28 65%)" : "linear-gradient(135deg,#f5f3ff,#ffffff 65%)",
                    borderColor: darkMode ? "#403866" : "#e9ddff",
                    color: darkMode ? "#f8fafc" : "#171725"
                  }}>
                    <div style={{...styles.scoreRing, background: `conic-gradient(#7c3aed ${readingReport.accuracy * 3.6}deg, ${darkMode ? "#3b3650" : "#e9e5ff"} 0deg)`}}>
                      <div style={{ ...styles.scoreInner, background: darkMode ? "#171722" : "#ffffff", color: darkMode ? "#f8fafc" : "#171725" }}>
                        <strong>{readingReport.accuracy}%</strong>
                        <span>accuracy</span>
                      </div>
                    </div>
                    <div style={{ ...styles.heroSummary, color: darkMode ? "#f8fafc" : "#171725" }}>
                      <div style={styles.summaryTop}>
                        <span style={styles.summaryBadge}>SESSION COMPLETE</span>
                        <span style={styles.aiMiniBadge}>AI ANALYZED</span>
                      </div>
                      <h3 style={{ color: darkMode ? "#f8fafc" : "#171725", margin: "10px 0 7px" }}>{readingReport.accuracy >= 90 ? "Excellent reading progress" : readingReport.accuracy >= 75 ? "Strong reading progress" : "Good start — keep practicing"}</h3>
                      <p style={{ color: darkMode ? "#cbd5e1" : "#64748b", margin: 0, lineHeight: 1.6 }}>Verba compared your spoken reading with the page and created targeted feedback for your next attempt.</p>
                    </div>
                  </div>

                  <div style={styles.reportStats}>
                    <div style={{ ...styles.reportStat, background: darkMode ? "#24243a" : "rgba(255,255,255,.92)", borderColor: darkMode ? "#3d3e52" : "#ececf3", color: darkMode ? "#f8fafc" : "#171725" }}>
                      <div style={{...styles.statIcon, background: "#ecfdf5", color: "#059669"}}>✓</div>
                      <strong style={{ color: darkMode ? "#f8fafc" : "#171725" }}>{readingReport.correctWords}</strong>
                      <small style={{ color: darkMode ? "#cbd5e1" : "#64748b" }}>Correct words</small>
                    </div>
                    <div style={{ ...styles.reportStat, background: darkMode ? "#24243a" : "rgba(255,255,255,.92)", borderColor: darkMode ? "#3d3e52" : "#ececf3", color: darkMode ? "#f8fafc" : "#171725" }}>
                      <div style={{...styles.statIcon, background: "#fff7ed", color: "#ea580c"}}>↷</div>
                      <strong style={{ color: darkMode ? "#f8fafc" : "#171725" }}>{readingReport.skippedWords.length}</strong>
                      <small style={{ color: darkMode ? "#cbd5e1" : "#64748b" }}>Skipped words</small>
                    </div>
                    <div style={{ ...styles.reportStat, background: darkMode ? "#24243a" : "rgba(255,255,255,.92)", borderColor: darkMode ? "#3d3e52" : "#ececf3", color: darkMode ? "#f8fafc" : "#171725" }}>
                      <div style={{...styles.statIcon, background: "#eff6ff", color: "#2563eb"}}>↺</div>
                      <strong style={{ color: darkMode ? "#f8fafc" : "#171725" }}>{readingReport.repeatedWords.length}</strong>
                      <small style={{ color: darkMode ? "#cbd5e1" : "#64748b" }}>Repeated words</small>
                    </div>
                    <div style={{ ...styles.reportStat, background: darkMode ? "#24243a" : "rgba(255,255,255,.92)", borderColor: darkMode ? "#3d3e52" : "#ececf3", color: darkMode ? "#f8fafc" : "#171725" }}>
                      <div style={{...styles.statIcon, background: "#f5f3ff", color: "#7c3aed"}}>◷</div>
                      <strong style={{ color: darkMode ? "#f8fafc" : "#171725" }}>{readingReport.duration}s</strong>
                      <small style={{ color: darkMode ? "#cbd5e1" : "#64748b" }}>Reading time</small>
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
                    <div style={{ ...styles.detailCard, background: darkMode ? "#24243a" : "rgba(255,255,255,.9)", borderColor: darkMode ? "#3d3e52" : "#e5e7eb", color: darkMode ? "#f8fafc" : "#171725" }}>
                      <div style={styles.detailIcon}>⏸</div>
                      <div>
                        <span style={{ color: darkMode ? "#cbd5e1" : "#475569" }}>Long pauses</span>
                        <strong style={{ color: darkMode ? "#f8fafc" : "#171725" }}>{readingReport.pauseCount}</strong>
                        <small style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>5-second assistance triggers</small>
                      </div>
                    </div>
                    <div style={{ ...styles.practiceCard, background: darkMode ? "#24243a" : "rgba(255,255,255,.9)", borderColor: darkMode ? "#3d3e52" : "#e5e7eb", color: darkMode ? "#f8fafc" : "#171725" }}>
                      <div style={styles.practiceHeader}>
                        <div>
                          <span style={{ color: darkMode ? "#f8fafc" : "#171725" }}>🎯 Practice focus</span>
                          <small style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>Words Verba noticed</small>
                        </div>
                        <span style={styles.practiceBadge}>NEXT SESSION</span>
                      </div>
                      <div style={styles.practiceWords}>
                        {(readingReport.incorrectWords.length ? readingReport.incorrectWords : readingReport.skippedWords.slice(0, 6)).slice(0, 6).map((word, index) => (
                          <span key={`${word}-${index}`} style={styles.practiceChip}>{word}</span>
                        ))}
                        {!readingReport.incorrectWords.length && !readingReport.skippedWords.length && (
                          <span style={{ ...styles.noPractice, color: darkMode ? "#cbd5e1" : "#64748b" }}>No specific words flagged — nice work! ✨</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ ...styles.reportFooter, borderTopColor: darkMode ? "#37344d" : "#eeeafd", color: darkMode ? "#aab0c0" : "#64748b" }}>
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
              ? "#1b1b28"
              : "#ffffff"
          }}
        >
          <div style={styles.assistantIcon}>
            ✨
          </div>

          <h2>Verba Assist</h2>

          <p style={styles.assistantText}>
            I'm following along with you. The word
            you're currently reading is highlighted.
          </p>

          <div style={{ ...styles.currentWordCard, background: darkMode ? "#25213a" : "linear-gradient(135deg,#f5f3ff,#eef2ff)", borderColor: darkMode ? "#4c3b72" : "#e4ddff" }}>
            <span style={{ ...styles.currentWordLabel, color: darkMode ? "#b9bfd0" : "#64748b" }}>
              Current word
            </span>

            <strong
              style={{ ...styles.currentWordValue, color: darkMode ? "#c4b5fd" : "#5b21b6" }}
            >
              {words[currentWord] || "—"}
            </strong>

            <button
              onClick={() => loadWordCoach(words[currentWord])}
              style={{
                ...styles.wordCoachButton,
                background: darkMode ? "#31264f" : "#f3e8ff",
                color: darkMode ? "#e9d5ff" : "#6d28d9",
                borderColor: darkMode ? "#5b3d86" : "#ddd6fe"
              }}
            >
              💡 I don't understand / can't say this word
            </button>
          </div>

          {wordCoach && (
            <div style={{
              ...styles.wordCoachCard,
              background: darkMode ? "#181827" : "#ffffff",
              borderColor: darkMode ? "#4c3b72" : "#e4ddff",
              color: darkMode ? "#f8fafc" : "#172033"
            }}>
              <div style={styles.wordCoachHeader}>
                <div>
                  <div style={{ ...styles.wordCoachEyebrow, color: darkMode ? "#c4b5fd" : "#7c3aed" }}>AI WORD COACH</div>
                  <h3 style={{ ...styles.wordCoachTitle, color: darkMode ? "#ffffff" : "#171725" }}>
                    {wordCoach.word}
                  </h3>
                </div>
                <button
                  onClick={playWordPronunciation}
                  style={styles.wordHearButton}
                  disabled={isPlayingWord}
                >
                  {isPlayingWord ? "🔊 Playing…" : "🔊 Hear word"}
                </button>
              </div>

              {isWordCoachLoading ? (
                <div style={{ ...styles.wordCoachLoading, color: darkMode ? "#cfd3df" : "#64748b" }}>
                  ✨ Finding the meaning, word parts and an easy pronunciation…
                </div>
              ) : (
                <>
                  <div style={styles.wordCoachSection}>
                    <span>📖 Meaning</span>
                    <p>{wordCoach.meaning}</p>
                  </div>

                  <div style={styles.wordCoachSection}>
                    <span>🧩 Break it down</span>
                    <div style={styles.wordBreakdown}>
                      {wordCoach.breakdown.map((part, index) => (
                        <span key={`${part}-${index}`} style={{ ...styles.wordPart, background: darkMode ? "#2b2440" : "#f5f3ff", color: darkMode ? "#ddd6fe" : "#6d28d9" }}>
                          {part}
                        </span>
                      ))}
                    </div>
                    <p style={styles.wordCoachHint}>Say each part slowly, then join them together.</p>
                  </div>

                  <div style={styles.wordCoachSection}>
                    <span>🗣️ Easy pronunciation</span>
                    <p style={styles.pronunciationText}>{wordCoach.pronunciation}</p>
                  </div>

                  <div style={styles.wordCoachSection}>
                    <span>💬 Example</span>
                    <p>{wordCoach.example}</p>
                  </div>

                  {wordCoachError && (
                    <div style={styles.wordCoachError}>{wordCoachError}</div>
                  )}
                </>
              )}
            </div>
          )}

          <div style={{ ...styles.voiceAssistantCard, background: darkMode ? "#201d31" : "#f7f5ff", borderColor: darkMode ? "#4c3b72" : "#ddd6fe", color: darkMode ? "#f8fafc" : "#172033" }}>
            <div style={styles.voiceAssistantHeader}>
              <span>🔊 Voice Assistant</span>

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

            <p style={styles.voiceAssistantDescription}>
              If you pause for 5 seconds, Verba will
              slowly read the next word to help you
              continue.
            </p>

            <div style={styles.assistantStatus}>
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

          <div style={{ ...styles.translationCard, background: darkMode ? "#171722" : "#f8fafc", borderColor: darkMode ? "#34364a" : "#e2e8f0", color: darkMode ? "#f8fafc" : "#172033" }}>
            <div style={styles.translationTitleRow}>
              <div style={styles.translationTitle}>🌐 Translate Reading</div>
              {isTranslating && <span style={styles.parallelBadge}>RUNNING</span>}
            </div>

            <select
              value={targetLanguage}
              onChange={(e) =>
                setTargetLanguage(
                  e.target.value
                )
              }
              style={{ ...styles.languageSelect, background: darkMode ? "#252638" : "white", color: darkMode ? "#f8fafc" : "#172033", borderColor: darkMode ? "#3f4156" : "#cbd5e1" }}
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
              style={{
                ...styles.translateButton,
                opacity: isTranslating ? 0.82 : 1,
                cursor: isTranslating ? "wait" : "pointer"
              }}
              onClick={translateText}
              disabled={isTranslating}
            >
              {isTranslating
                ? "Translating in background..."
                : "Translate"}
            </button>

            {isTranslating && (
              <div style={{
                marginTop: "9px",
                fontSize: "10px",
                lineHeight: 1.45,
                color: darkMode ? "#aab0c0" : "#64748b"
              }}>
                ✨ Translation is running separately. You can still start listening, use Word Coach, and use the other reading controls.
              </div>
            )}

            {translation && (
              <div style={styles.translationResult}>
                {translation}
              </div>
            )}
          </div>

          <div style={{ ...styles.assistantTip, background: darkMode ? "#171722" : "#f8fafc", borderColor: darkMode ? "#34364a" : "#e8edf3", color: darkMode ? "#dbe2ef" : "#172033" }}>
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
  wordCoachButton: { marginTop: "14px", width: "100%", border: "1px solid #ddd6fe", borderRadius: "11px", padding: "10px 12px", fontSize: "12px", fontWeight: "800", cursor: "pointer", textAlign: "left" },
  wordCoachCard: { marginTop: "12px", border: "1px solid #e4ddff", borderRadius: "17px", padding: "16px", boxShadow: "0 10px 25px rgba(76,29,149,.08)" },
  wordCoachHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "14px" },
  wordCoachEyebrow: { fontSize: "9px", fontWeight: "900", letterSpacing: "1.2px", marginBottom: "5px" },
  wordCoachTitle: { margin: 0, fontSize: "22px", lineHeight: 1.1 },
  wordHearButton: { border: "none", borderRadius: "10px", padding: "9px 11px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontWeight: "800", fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" },
  wordCoachLoading: { padding: "13px", borderRadius: "10px", background: "rgba(124,58,237,.08)", fontSize: "12px", lineHeight: 1.5 },
  wordCoachSection: { marginTop: "13px", paddingTop: "13px", borderTop: "1px solid rgba(148,163,184,.18)" },
  wordCoachSectionLabel: { fontSize: "11px", fontWeight: "900" },
  wordCoachSection: { marginTop: "13px", paddingTop: "13px", borderTop: "1px solid rgba(148,163,184,.18)" },
  wordBreakdown: { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" },
  wordPart: { padding: "6px 9px", borderRadius: "8px", fontWeight: "900", fontSize: "13px" },
  wordCoachHint: { margin: "8px 0 0", fontSize: "11px", color: "#94a3b8" },
  pronunciationText: { fontWeight: "800", letterSpacing: ".3px" },
  wordCoachError: { marginTop: "10px", fontSize: "11px", color: "#b45309", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "9px", padding: "8px" },
  voiceAssistantCard: { marginTop: "16px", padding: "17px", borderRadius: "17px", background: "#f7f5ff", border: "1px solid #ddd6fe" },
  voiceAssistantHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "800", fontSize: "13px" },
  toggleButton: { width: "39px", height: "22px", border: "none", borderRadius: "20px", padding: "2px", cursor: "pointer", transition: "background .2s" },
  toggleCircle: { display: "block", width: "18px", height: "18px", borderRadius: "50%", background: "white", transition: "transform .2s", boxShadow: "0 1px 4px rgba(0,0,0,.15)" },
  voiceAssistantDescription: { color: "#64748b", fontSize: "11px", lineHeight: 1.55, margin: "11px 0" },
  assistantStatus: { display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: "800", color: "#475569" },
  translationCard: { marginTop: "16px", padding: "17px", borderRadius: "17px", background: "#f8fafc", border: "1px solid #e2e8f0" },
  translationTitleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "11px" },
  translationTitle: { fontSize: "13px", fontWeight: "900" },
  parallelBadge: { padding: "4px 7px", borderRadius: "999px", background: "#dcfce7", color: "#15803d", fontSize: "8px", fontWeight: "900", letterSpacing: ".7px" },
  languageSelect: { width: "100%", padding: "10px", borderRadius: "11px", border: "1px solid #cbd5e1", background: "white", fontSize: "13px", cursor: "pointer", outline: "none" },
  translateButton: { width: "100%", marginTop: "9px", padding: "11px", border: "none", borderRadius: "11px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", fontWeight: "800", cursor: "pointer" },
  translationResult: { marginTop: "12px", padding: "13px", borderRadius: "11px", background: "#ffffff", border: "1px solid #e2e8f0", color: "#334155", lineHeight: 1.7, fontSize: "13px" },
  assistantTip: { marginTop: "14px", display: "flex", gap: "10px", background: "#f8fafc", border: "1px solid #e8edf3", padding: "13px", borderRadius: "14px", fontSize: "12px", lineHeight: 1.5 },
  statsCard: { marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px" }
}

export default App