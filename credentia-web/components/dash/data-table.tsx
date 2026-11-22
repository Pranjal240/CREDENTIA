'use client'

import * as React from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Funnel, SearchX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/ui/search-bar'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { EmptyState } from '@/components/dash/kit'
import { useSearch } from '@/components/search/search-context'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  /** Makes the header sortable. Return a string or a number. */
  sortValue?: (row: T) => string | number
  className?: string
  align?: 'left' | 'right'
  /** Hidden below the small breakpoint to keep the table readable on phones. */
  hideOnMobile?: boolean
}

export interface TableFilter<T> {
  id: string
  label: string
  options: { value: string; label: string }[]
  predicate: (row: T, value: string) => boolean
}

interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  getRowId: (row: T) => string
  /** Text matched by the search box. Omit to hide search. */
  searchText?: (row: T) => string
  searchPlaceholder?: string
  filters?: TableFilter<T>[]
  pageSize?: number
  loading?: boolean
  emptyTitle?: string
  emptyHint?: string
  onRowClick?: (row: T) => void
  /** Extra controls on the right of the toolbar. */
  toolbar?: React.ReactNode
  /** Names the table for assistive technology. */
  label: string
  /** Hands the search words to the AI search palette. Needs the search provider. */
  askAI?: boolean
  /** Words to start the search box with, for example from a ?q= link. A new value replaces what is typed. */
  initialQuery?: string
}

/**
 * The table used by every list in the dashboards. Search and filters work on the
 * rows already loaded, so they answer instantly. Ask AI passes the same words to
 * the search palette, which looks through the whole database.
 */
export function DataTable<T>({
  rows,
  columns,
  getRowId,
  searchText,
  searchPlaceholder = 'Search',
  filters = [],
  pageSize = 10,
  loading,
  emptyTitle = 'Nothing here yet',
  emptyHint,
  onRowClick,
  toolbar,
  label,
  askAI = true,
  initialQuery,
}: DataTableProps<T>) {
  const search = useSearch()
  const [query, setQuery] = React.useState(initialQuery ?? '')
  React.useEffect(() => {
    if (initialQuery !== undefined) setQuery(initialQuery)
  }, [initialQuery])
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({})
  const [sort, setSort] = React.useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)
  const [page, setPage] = React.useState(0)

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = rows.filter((row) => {
      for (const filter of filters) {
        const value = filterValues[filter.id]
        if (value && value !== 'all' && !filter.predicate(row, value)) return false
      }
      return !q || !searchText || searchText(row).toLowerCase().includes(q)
    })
    if (sort) {
      const column = columns.find((c) => c.key === sort.key)
      if (column?.sortValue) {
        const get = column.sortValue
        list = [...list].sort((a, b) => {
          const av = get(a)
          const bv = get(b)
          const result = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
          return sort.dir === 'asc' ? result : -result
        })
      }
    }
    return list
  }, [rows, query, filterValues, sort, columns, filters, searchText])

  // Any change to what is shown starts again from the first page.
  React.useEffect(() => setPage(0), [query, filterValues, sort, rows.length])

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize))
  const current = Math.min(page, pageCount - 1)
  const slice = visible.slice(current * pageSize, current * pageSize + pageSize)
  const from = visible.length === 0 ? 0 : current * pageSize + 1
  const to = Math.min(visible.length, current * pageSize + pageSize)
  const hasToolbar = Boolean(searchText) || filters.length > 0 || toolbar

  const toggleSort = (key: string) =>
    setSort((prev) => (prev?.key === key ? (prev.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }))

  return (
    <div className="min-w-0">
      {hasToolbar ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {searchText ? (
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder={searchPlaceholder}
              className="min-w-[200px] flex-1 sm:max-w-sm"
              onAskAI={askAI ? (q) => search.open({ query: q }) : undefined}
            />
          ) : null}
          {filters.map((filter) => (
            <label key={filter.id} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] pl-2.5 focus-within:border-white/25">
              <Funnel className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">{filter.label}</span>
              <select
                value={filterValues[filter.id] ?? 'all'}
                onChange={(e) => setFilterValues((prev) => ({ ...prev, [filter.id]: e.target.value }))}
                className="min-h-10 cursor-pointer bg-transparent py-2 pl-1 pr-3 text-xs font-semibold text-foreground outline-none"
              >
                <option value="all">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {toolbar ? <div className="ml-auto flex flex-wrap items-center gap-2">{toolbar}</div> : null}
        </div>
      ) : null}

      <div className="overflow-x-auto scrollbar-thin rounded-xl">
        <table className="w-full border-separate border-spacing-0 text-left" aria-label={label} aria-busy={loading || undefined}>
          <thead>
            <tr>
              {columns.map((column, i) => {
                const sorted = sort?.key === column.key ? sort.dir : null
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : column.sortValue ? 'none' : undefined}
                    className={cn(
                      'bg-white/[0.05] px-3 py-2 text-[11px] font-bold text-muted-foreground',
                      i === 0 && 'rounded-l-lg',
                      i === columns.length - 1 && 'rounded-r-lg',
                      column.align === 'right' && 'text-right',
                      column.hideOnMobile && 'hidden sm:table-cell',
                    )}
                  >
                    {column.sortValue ? (
                      <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1 rounded transition-colors hover:text-foreground">
                        {column.header}
                        {sorted === 'asc' ? <ArrowUp className="size-3" /> : sorted === 'desc' ? <ArrowDown className="size-3" /> : null}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: Math.min(pageSize, 5) }).map((_, r) => (
                  <tr key={r}>
                    {columns.map((column) => (
                      <td key={column.key} className={cn('border-t border-white/[0.06] px-3 py-3', column.hideOnMobile && 'hidden sm:table-cell')}>
                        <div className="skeleton h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : slice.map((row) => (
                  <tr
                    key={getRowId(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn('group', onRowClick && 'cursor-pointer')}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'border-t border-white/[0.06] px-3 py-2.5 text-[12px] text-foreground/90 transition-colors group-hover:bg-white/[0.03]',
                          column.align === 'right' && 'text-right',
                          column.hideOnMobile && 'hidden sm:table-cell',
                          column.className,
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!loading && visible.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title={rows.length === 0 ? emptyTitle : 'No matches'}
          hint={rows.length === 0 ? emptyHint : 'Try another word or clear a filter.'}
        />
      ) : null}

      {!loading && visible.length > pageSize ? (
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="tabular">
            {from} to {to} of {visible.length}
          </span>
          <div className="flex items-center gap-1.5">
            <SmoothButton size="icon-sm" variant="outline" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)}>
              <ChevronLeft />
            </SmoothButton>
            <span className="tabular px-1">
              {current + 1} / {pageCount}
            </span>
            <SmoothButton size="icon-sm" variant="outline" aria-label="Next page" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>
              <ChevronRight />
            </SmoothButton>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default DataTable
