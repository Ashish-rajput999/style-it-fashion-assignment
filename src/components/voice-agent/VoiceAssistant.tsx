'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Mic, MicOff, Send, X, Volume2, VolumeX, Sparkles } from 'lucide-react'

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: Date
  isFallback?: boolean
}

const CANNED_QUESTIONS = [
  'How do I submit a new meeting?',
  'What compliance frameworks are supported?',
  'Can I edit the meeting minutes before dispatching?',
  'How do clients review and sign their reports?',
  'Are my audio uploads secure?'
]

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your MeetingMind Voice Assistant. Ask me anything about creating requests, compliance audits, or report safety.",
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [cannedIndex, setCannedIndex] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isListening, isSpeaking])

  // Stop speaking when widget closes
  useEffect(() => {
    if (!isOpen) {
      handleStopSpeaking()
    }
  }, [isOpen])

  const handleStopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }

  const speakText = (text: string) => {
    if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) return

    handleStopSpeaking()

    // Clean text of markdown/tags
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/[*#_]/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    
    // Choose appropriate voice
    const voices = window.speechSynthesis.getVoices()
    const englishVoice = voices.find(v => v.lang.startsWith('en'))
    if (englishVoice) {
      utterance.voice = englishVoice
    }

    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    speechRef.current = utterance
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInputText('')
    handleStopSpeaking()

    // Trigger processing logic
    try {
      const res = await fetch('/api/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: textToSend }),
      })
      const data = await res.json()

      const replyText = data.answer || data.suggestedResponse
      const isFallback = !data.answer

      const assistantMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        isFallback,
      }

      setMessages(prev => [...prev, assistantMsg])
      speakText(replyText)
    } catch {
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: "I experienced a connection issue. Please try asking again.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMsg])
    }
  }

  // Trigger speech-to-text input (simulating or using Web Speech Recognition)
  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false)
      return
    }

    handleStopSpeaking()
    setIsListening(true)

    // Check if webkitSpeechRecognition is available
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onresult = (event: any) => {
        const SpeechText = event.results[0][0].transcript
        if (SpeechText) {
          handleSendMessage(SpeechText)
        }
        setIsListening(false)
      }

      recognition.onerror = () => {
        // Fallback to canned if error
        simulateCannedSpeech()
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } else {
      // Direct fallback to simulator
      simulateCannedSpeech()
    }
  }

  const simulateCannedSpeech = () => {
    // Cycles through seeded FAQ prompts for clean demonstration
    const question = CANNED_QUESTIONS[cannedIndex]
    setCannedIndex(prev => (prev + 1) % CANNED_QUESTIONS.length)

    setTimeout(() => {
      setIsListening(false)
      handleSendMessage(question)
    }, 2000)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[1000] font-sans text-white">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-[360px] h-[500px] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md"
          >
            {/* Header bar */}
            <div className="px-5 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <div>
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-1">
                    MeetingMind AI <Sparkles className="w-3 h-3 text-indigo-400" />
                  </h4>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Voice Assistant</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Mute toggle */}
                <button
                  onClick={() => {
                    if (!isMuted) handleStopSpeaking()
                    setIsMuted(!isMuted)
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
                  title={isMuted ? 'Unmute voice feedback' : 'Mute voice feedback'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                {/* Close */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-indigo-650 text-white rounded-tr-none font-medium'
                        : m.isFallback
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-tl-none font-medium'
                        : 'bg-white/5 text-gray-100 rounded-tl-none font-normal'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Listening state indicator */}
              {isListening && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-3 text-xs text-indigo-300 font-bold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Listening (try speaking, or wait for canned questions)...
                  </div>
                </div>
              )}

              {/* Speaking waveform indicator */}
              {isSpeaking && (
                <div className="flex justify-start">
                  <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl rounded-tl-none px-4 py-2 flex items-center gap-2">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Speaking</span>
                    <div className="flex items-end gap-0.5 h-3">
                      {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-indigo-500 animate-bounce"
                          style={{
                            height: `${h * 20}%`,
                            animationDuration: `${0.4 + i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-white/5 bg-white/5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleMicClick}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
                title="Speak to Assistant"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                placeholder="Ask a question..."
                disabled={isListening}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isListening}
                className="w-9 h-9 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl flex items-center justify-center transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-750 hover:to-violet-750 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/25 border border-white/15 focus:outline-none relative"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border border-slate-900" />
      </motion.button>
    </div>
  )
}
