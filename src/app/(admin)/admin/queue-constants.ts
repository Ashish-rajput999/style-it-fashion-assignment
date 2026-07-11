// Shared constants for the admin queue — no server imports allowed here
// (imported by both server page.tsx and client AdminQueueClient.tsx)

export const KANBAN_COLUMNS = [
  {
    id: 'INCOMING',
    label: 'Incoming',
    statuses: ['QUOTED'] as string[],
    color: '#7A5AF8',
    bg: '#F1EEFF',
    icon: '📥',
  },
  {
    id: 'INTAKE',
    label: 'Admin Intake',
    statuses: ['ADMIN_INTAKE'] as string[],
    color: '#B98313',
    bg: '#FEF8E8',
    icon: '🗂️',
  },
  {
    id: 'PROCESSING',
    label: 'Transcription & Analysis',
    statuses: ['TRANSCRIBING', 'TRANSCRIBED', 'GENERATING'] as string[],
    color: '#2F69FF',
    bg: '#EBF0FF',
    icon: '⚙️',
  },
  {
    id: 'EDITING',
    label: 'Editing & Review',
    statuses: ['IN_EDITING', 'LOCKED'] as string[],
    color: '#B98313',
    bg: '#FEF8E8',
    icon: '✏️',
  },
  {
    id: 'DISPATCHED',
    label: 'Delivered',
    statuses: ['DISPATCHED'] as string[],
    color: '#198C61',
    bg: '#E8F7F1',
    icon: '✅',
  },
]
