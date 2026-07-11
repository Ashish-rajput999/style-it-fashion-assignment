'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'

interface DocumentEditorProps {
  outputId: string
  initialContent: string  // HTML string or JSON stringified doc
  isLocked: boolean
  onLockChange: (locked: boolean) => void
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold transition-all ${
        active
          ? 'bg-[#6D5DF6] text-white shadow-sm'
          : disabled
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

export function DocumentEditor({ outputId, initialContent, isLocked, onLockChange }: DocumentEditorProps) {
  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isAiAssisting, setIsAiAssisting] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [locked, setLocked] = useState(isLocked)

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
      Placeholder.configure({ placeholder: 'Start editing the meeting minutes document…' }),
    ],
    content: initialContent || '<p></p>',
    editable: !locked,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[500px] px-12 py-10 text-[var(--doc-ink,#101936)] leading-relaxed',
      },
    },
  })

  // Keep editable state in sync with locked
  useEffect(() => {
    if (editor) {
      editor.setEditable(!locked)
    }
  }, [editor, locked])

  const wordCount = editor?.storage?.characterCount?.words() ?? 0
  const charCount = editor?.storage?.characterCount?.characters() ?? 0

  const saveContent = useCallback(async () => {
    if (!editor || locked) return
    setSaveStatus('saving')
    try {
      const content = editor.getHTML()
      const res = await fetch('/api/admin/output/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputId, contentJson: content }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: any) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 5000)
    }
  }, [editor, outputId, locked])

  const handleAiAssist = useCallback(async () => {
    if (!editor || locked) return
    const selection = editor.state.selection
    const { from, to } = selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')

    if (!selectedText || selectedText.trim().length < 10) {
      setAiError('Select at least 10 characters of text to use AI Assist.')
      setTimeout(() => setAiError(null), 4000)
      return
    }

    setIsAiAssisting(true)
    setAiError(null)
    try {
      const res = await fetch('/api/admin/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Replace selected text with AI reformulation
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, data.reformulated).run()
    } catch (err: any) {
      setAiError(err.message || 'AI Assist failed.')
    } finally {
      setIsAiAssisting(false)
    }
  }, [editor, locked])

  const handleLock = useCallback(async () => {
    const action = locked ? 'unlock' : 'lock'
    const confirmed = window.confirm(
      locked
        ? 'Unlock this document to allow further edits?'
        : 'Lock this document? This will prevent any further edits until unlocked.'
    )
    if (!confirmed) return

    try {
      const res = await fetch('/api/admin/output/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputId, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLocked(data.locked)
      onLockChange(data.locked)
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }, [outputId, locked, onLockChange])

  if (!editor) return null

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Top action bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        {/* Preview / Editor tabs */}
        <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-0.5">
          {(['editor', 'preview'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${
                activeView === v
                  ? 'bg-[#6D5DF6] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {v === 'editor' ? '✏️ Editor' : '👁️ Preview'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {aiError && (
            <span className="text-[10px] text-red-500 font-medium">⚠ {aiError}</span>
          )}

          {/* AI Assist */}
          <button
            onClick={handleAiAssist}
            disabled={isAiAssisting || locked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
              isAiAssisting
                ? 'bg-violet-100 text-violet-400 cursor-not-allowed'
                : locked
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-md hover:scale-105'
            }`}
          >
            {isAiAssisting ? (
              <>
                <span className="w-3 h-3 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                Assisting…
              </>
            ) : (
              <>✨ AI Assist</>
            )}
          </button>

          {/* Lock toggle */}
          <button
            onClick={handleLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
              locked
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {locked ? '🔓 Unlock' : '🔒 Lock'}
          </button>

          {/* Save */}
          <button
            onClick={saveContent}
            disabled={saveStatus === 'saving' || locked}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold transition shadow ${
              saveStatus === 'saving'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : saveStatus === 'saved'
                ? 'bg-emerald-100 text-emerald-700'
                : saveStatus === 'error'
                ? 'bg-red-100 text-red-700'
                : locked
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#6D5DF6] text-white hover:bg-[#5B4DE0]'
            }`}
          >
            {saveStatus === 'saving' ? '…Saving' :
             saveStatus === 'saved' ? '✓ Saved' :
             saveStatus === 'error' ? '✗ Error' :
             '💾 Save Changes'}
          </button>
        </div>
      </div>

      {/* Formatting toolbar — only in editor view */}
      {activeView === 'editor' && !locked && (
        <div className="flex items-center gap-0.5 px-4 py-2 border-b border-gray-100 bg-white flex-wrap">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <strong>B</strong>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <em>I</em>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Strikethrough"
          >
            <s>S</s>
          </ToolbarButton>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            H3
          </ToolbarButton>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet List"
          >
            •≡
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Numbered List"
          >
            1≡
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Blockquote"
          >
            ❝
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="Code block"
          >
            {'</>'}
          </ToolbarButton>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            ↩
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            ↪
          </ToolbarButton>
        </div>
      )}

      {/* Locked banner */}
      {locked && (
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
          <span className="text-amber-600 text-sm">🔒</span>
          <span className="text-xs font-bold text-amber-700">
            This document is locked and read-only. Click "Unlock" to enable editing.
          </span>
        </div>
      )}

      {/* Editor area — simulated A4 page canvas */}
      <div className="flex-1 overflow-auto bg-[#F1F5F9] p-8">
        <div
          className="mx-auto bg-white shadow-xl rounded-sm"
          style={{
            maxWidth: '794px',
            minHeight: '1123px', // A4 ratio approximation
            fontFamily: '"Inter", system-ui, sans-serif',
          }}
        >
          {activeView === 'editor' ? (
            <EditorContent editor={editor} />
          ) : (
            <div
              className="prose prose-sm max-w-none px-12 py-10 text-[#101936]"
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          )}
        </div>
      </div>

      {/* Footer word/char counter */}
      <div className="px-5 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-[10px] text-gray-400 font-medium">
        <div className="flex gap-4">
          <span><strong className="text-gray-600">{wordCount}</strong> words</span>
          <span><strong className="text-gray-600">{charCount}</strong> characters</span>
        </div>
        <div className="flex items-center gap-2">
          {locked && (
            <span className="text-amber-600 font-bold">🔒 Locked — read only</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-emerald-600 font-bold">✓ Changes saved</span>
          )}
        </div>
      </div>
    </div>
  )
}
