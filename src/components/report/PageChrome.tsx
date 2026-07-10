import React from 'react'

interface PageChromeProps {
  pageNumber: number
  totalPages?: number
  headerLeft: string
  headerRight: string
  footerLeft?: string
  footerRight?: string
  children: React.ReactNode
}

export const PageChrome: React.FC<PageChromeProps> = ({
  pageNumber,
  totalPages,
  headerLeft,
  headerRight,
  footerLeft = 'CONFIDENTIAL • INTERNAL USE',
  footerRight = 'STYLEIT FASHION PVT LTD',
  children
}) => {
  return (
    <div className="report-canvas w-full max-w-[900px] min-h-[1100px] mx-auto mb-6 p-[46px_66px_42px_66px] bg-white border border-[var(--doc-line)] shadow-[0_8px_30px_rgba(16,25,54,0.06)] flex flex-col justify-between text-left print:shadow-none print:max-w-none print:m-0">
      {/* Header */}
      <div className="flex justify-between items-center text-[11px] tracking-[1.6px] uppercase font-bold text-[var(--doc-muted)] border-b border-[var(--doc-line)] pb-3 mb-6">
        <div>{headerLeft}</div>
        <div>{headerRight}</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full">
        {children}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-[11px] tracking-[1.6px] uppercase font-bold text-[var(--doc-muted)] border-t border-[var(--doc-line)] pt-3 mt-8">
        <div>{footerLeft}</div>
        <div className="flex items-center gap-4">
          <div>{footerRight}</div>
          <div className="bg-[var(--doc-accent)] text-white font-mono px-2 py-0.5 rounded text-[10px] tracking-normal font-bold">
            PAGE {pageNumber} {totalPages ? `/ ${totalPages}` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}
