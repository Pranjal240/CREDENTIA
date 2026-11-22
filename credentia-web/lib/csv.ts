/**
 * Builds a CSV in the browser and downloads it. Nothing leaves the device.
 * Every cell is quoted, and a leading formula character is neutralised so a
 * spreadsheet never runs a cell as a formula.
 */
export function saveCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const safe = (cell: string | number | null | undefined) => {
    let text = cell == null ? '' : String(cell)
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
    return `"${text.replaceAll('"', '""')}"`
  }
  const csv = rows.map((row) => row.map(safe).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
