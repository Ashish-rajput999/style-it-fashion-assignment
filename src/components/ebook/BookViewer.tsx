'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BookViewerProps {
  children: React.ReactNode[]
  watermarkText?: string
  bindingLabel?: string
}

// Framer Motion 3D page-flip variants
const pageVariants = {
  enterFromRight: {
    rotateY: 90,
    opacity: 0,
    transformOrigin: 'left center',
    scale: 0.97,
  },
  enterFromLeft: {
    rotateY: -90,
    opacity: 0,
    transformOrigin: 'right center',
    scale: 0.97,
  },
  center: {
    rotateY: 0,
    opacity: 1,
    scale: 1,
    transformOrigin: 'center center',
    transition: {
      type: 'spring' as const,
      stiffness: 160,
      damping: 28,
      mass: 1.1,
    },
  },
  exitToLeft: {
    rotateY: -90,
    opacity: 0,
    transformOrigin: 'right center',
    scale: 0.97,
    transition: {
      type: 'spring' as const,
      stiffness: 180,
      damping: 30,
    },
  },
  exitToRight: {
    rotateY: 90,
    opacity: 0,
    transformOrigin: 'left center',
    scale: 0.97,
    transition: {
      type: 'spring' as const,
      stiffness: 180,
      damping: 30,
    },
  },
}

const WatermarkOverlay = ({ text }: { text?: string }) => (
  <div
    className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none"
    aria-hidden="true"
  >
    {/* Three diagonal watermark passes to ensure coverage on all page heights */}
    {[-20, 15, 50].map((top, i) => (
      <div
        key={i}
        className="absolute w-[200%] whitespace-nowrap text-gray-300/30 font-black text-[11px] tracking-[6px] uppercase"
        style={{
          top: `${top}%`,
          left: '-20%',
          transform: 'rotate(-35deg)',
          letterSpacing: '8px',
        }}
      >
        {Array(8).fill(text || 'PREVIEW — NOT FOR DISTRIBUTION').join('    ')}
      </div>
    ))}
  </div>
)

const PageShell = ({
  children,
  pageNumber,
  side,
  watermarkText,
}: {
  children: React.ReactNode
  pageNumber: number
  side: 'left' | 'right' | 'single'
  watermarkText?: string
}) => (
  <div
    className="relative flex flex-col overflow-auto bg-white h-full"
    style={{
      boxShadow:
        side === 'left'
          ? 'inset -8px 0 20px -8px rgba(0,0,0,0.12)'
          : side === 'right'
          ? 'inset 8px 0 20px -8px rgba(0,0,0,0.12)'
          : 'none',
    }}
  >
    {/* Inner page padding */}
    <div className="relative z-10 flex-1 p-6 md:p-8 overflow-auto">{children}</div>

    {/* Watermark on every page */}
    <WatermarkOverlay text={watermarkText} />

    {/* Page number */}
    <div
      className={`absolute bottom-3 text-[10px] font-semibold text-gray-400 font-mono z-30 ${
        side === 'left' ? 'left-4' : 'right-4'
      }`}
    >
      {pageNumber}
    </div>
  </div>
)

export const BookViewer: React.FC<BookViewerProps> = ({
  children,
  watermarkText,
   bindingLabel,
}) => {
  const [spread, setSpread] = useState(0) // which spread (pair of pages or single page) we're on
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const pages = React.Children.toArray(children)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const totalSteps = isMobile ? pages.length : Math.ceil(pages.length / 2)

  const goNext = useCallback(() => {
    if (isAnimating || spread >= totalSteps - 1) return
    setDirection('next')
    setSpread((s) => s + 1)
  }, [isAnimating, spread, totalSteps])

  const goPrev = useCallback(() => {
    if (isAnimating || spread <= 0) return
    setDirection('prev')
    setSpread((s) => s - 1)
  }, [isAnimating, spread])

  const leftPage = isMobile ? pages[spread] : pages[spread * 2]
  const rightPage = isMobile ? null : pages[spread * 2 + 1]
  const leftPageNum = isMobile ? spread + 1 : spread * 2 + 1
  const rightPageNum = spread * 2 + 2

  return (
    <div className="flex flex-col items-center w-full">
      {/* Outer book frame */}
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
        style={{
          perspective: '2000px',
          backgroundColor: '#1a1a2e',
          padding: '12px 16px 16px',
        }}
      >
        {/* Book binding label */}
        <div className="flex justify-center mb-2">
          <span className="text-[10px] font-bold tracking-widest text-white/30 uppercase font-mono">
            {bindingLabel || 'Instant Preview — Read Only'}
          </span>
        </div>

        {/* Book spread — animates on page turns */}
        <div
          className="relative w-full overflow-hidden rounded-lg bg-[#e2e8f0]"
          style={{
            minHeight: '520px',
            // @ts-ignore
            '--tw-shadow': 'inset 0 2px 16px rgba(0,0,0,0.3)',
          }}
        >
          {/* Spine shadow - hidden on mobile viewports */}
          {!isMobile && (
            <>
              <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                style={{ width: '4px', background: 'linear-gradient(to right, #64748b, #94a3b8, #64748b)' }}
              />
              <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                style={{ width: '60px', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.18) 0%, transparent 70%)' }}
              />
            </>
          )}

          <AnimatePresence
            initial={false}
            mode="wait"
          >
            <motion.div
              key={spread}
              className="flex w-full h-full absolute inset-0"
              style={{ transformStyle: 'preserve-3d' }}
              initial={direction === 'next' ? pageVariants.enterFromRight : pageVariants.enterFromLeft}
              animate={pageVariants.center}
              exit={direction === 'next' ? pageVariants.exitToLeft : pageVariants.exitToRight}
              onAnimationStart={() => setIsAnimating(true)}
              onAnimationComplete={() => setIsAnimating(false)}
            >
              {/* Left page */}
              <div className={`${isMobile ? 'w-full' : 'w-1/2'} h-full border-r border-gray-300/70`}>
                <PageShell pageNumber={leftPageNum} side={isMobile ? 'single' : 'left'} watermarkText={watermarkText}>
                  {leftPage}
                </PageShell>
              </div>

              {/* Right page */}
              {!isMobile && (
                <div className="w-1/2 h-full border-l border-gray-300/70">
                  <PageShell pageNumber={rightPageNum} side="right" watermarkText={watermarkText}>
                    {rightPage ?? (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <p className="text-sm font-serif italic">End of preview</p>
                      </div>
                    )}
                  </PageShell>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-4 mt-5">
        <button
          onClick={goPrev}
          disabled={spread === 0 || isAnimating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-white border border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          ← Previous
        </button>

        {/* Dot indicators */}
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (isAnimating) return
                setDirection(i > spread ? 'next' : 'prev')
                setSpread(i)
              }}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                i === spread ? 'bg-indigo-600 w-5' : 'bg-gray-300'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={spread >= totalSteps - 1 || isAnimating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-white border border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          Next →
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-2 font-mono">
        {isMobile ? `Page ${spread + 1} of ${totalSteps}` : `Spread ${spread + 1} of ${totalSteps}`}
      </p>
    </div>
  )
}
