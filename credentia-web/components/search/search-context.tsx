'use client'

import * as React from 'react'

export interface OpenSearchOptions {
  /** Words to start the search with. */
  query?: string
}

interface SearchApi {
  /** Opens the search palette. Safe to call from anywhere, it does nothing outside a dashboard. */
  open: (options?: OpenSearchOptions) => void
}

export const SearchContext = React.createContext<SearchApi | null>(null)

const NOOP: SearchApi = { open: () => {} }

export function useSearch(): SearchApi {
  return React.useContext(SearchContext) ?? NOOP
}
