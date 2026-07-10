import React from 'react'

interface DataTableProps {
  headers: string[]
  rows: (string | React.ReactNode)[][]
  widths?: string[]
}

export const DataTable: React.FC<DataTableProps> = ({ headers, rows, widths }) => {
  return (
    <table className="w-full border-collapse mb-[22px] table-fixed">
      <thead>
        <tr>
          {headers.map((header, idx) => (
            <th
              key={idx}
              className="p-[11px_12px] bg-[var(--doc-accent-dark)] text-white text-[11px] font-extrabold tracking-[1px] uppercase text-left align-top"
              style={{ width: widths?.[idx] }}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {row.map((cell, cellIdx) => (
              <td
                key={cellIdx}
                className="p-[11px_12px] border-b border-[var(--doc-line-soft)] color-[var(--doc-ink-soft)] text-[13px] leading-[1.45] align-top"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
export default DataTable
