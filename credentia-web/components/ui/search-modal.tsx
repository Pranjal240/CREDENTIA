"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleNotch,
  FileArrowDown,
  MagnifyingGlass,
  Plus,
  Sparkle,
  SlidersHorizontal,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * Search Modal
 *
 * A command palette panel: a search bar that live filters, toggleable "I'm
 * looking for" tags, result rows with per row actions, quick actions with
 * keyboard hints, and a files section. Ported from the owner supplied
 * reference and made data driven so it can sit on top of real search.
 *
 * - Results can be filtered here (`filterLocally`) or arrive already filtered
 *   from a server (`filterLocally={false}`).
 * - Arrow keys move through every row, Enter opens the highlighted one.
 * - The modal renders in a portal, so a blurred ancestor can never trap it.
 */

export interface SearchTag {
  id?: string;
  label: string;
  icon?: React.ReactNode;
  /** Whether the tag is currently included. Defaults to true. */
  active?: boolean;
}

export interface SearchResultAction {
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
}

export interface SearchResult {
  id?: string;
  /** Primary label (also matched against the query). */
  name: string;
  /** Secondary text such as an email or context (also matched). */
  meta?: string;
  /** Avatar image URL. Falls back to initials. */
  avatar?: string;
  /** Link target for the row. */
  href?: string;
  /** Small badge on the right, for example a status. */
  badge?: { label: string; tone?: "success" | "warning" | "danger" | "neutral" };
  /** Group label, for example "Students". A heading is drawn when it changes. */
  group?: string;
  /** Anything the caller wants handed back through onSelectResult. */
  data?: unknown;
  /** Trailing action icons. */
  actions?: SearchResultAction[];
}

export interface QuickAction {
  label: string;
  icon?: React.ReactNode;
  /** Keyboard hint shown on the right (for example "E"). */
  shortcut?: string;
  onClick?: () => void;
}

export interface SearchFile {
  name: string;
  /** File extension shown dimmed after the name (for example ".pdf"). */
  ext?: string;
  icon?: React.ReactNode;
  /** Show the verified mark next to the name. */
  verified?: boolean;
  onOpen?: () => void;
  onShare?: () => void;
}

export interface SearchAiSummary {
  text: string;
  loading?: boolean;
}

export interface SearchModalProps {
  /** Placeholder for the search input. */
  placeholder?: string;
  /** Toggleable filter tags. */
  tags?: SearchTag[];
  onTagToggle?: (tag: SearchTag, index: number) => void;
  /** Result rows. */
  results?: SearchResult[];
  /** Quick action rows. */
  quickActions?: QuickAction[];
  /** File rows. */
  files?: SearchFile[];
  /** Initial query value. */
  defaultQuery?: string;
  /** Controlled query value. */
  query?: string;
  /** Called as the query changes. */
  onQueryChange?: (query: string) => void;
  /** Called when the query is submitted with Enter and no row is highlighted. */
  onSubmit?: (query: string) => void;
  /** Called when a result row is chosen. */
  onSelectResult?: (result: SearchResult, index: number) => void;
  /** Filter the results here as the visitor types. Turn off when the server already filtered. */
  filterLocally?: boolean;
  /** Shows a spinner in the search bar. */
  loading?: boolean;
  /** Label above the results. */
  resultsLabel?: string;
  /** Shown when a query has no results. */
  emptyText?: string;
  /** A short AI generated reading of the query. */
  aiSummary?: SearchAiSummary | null;
  /** Extra classes for the root panel. */
  className?: string;

  /** Render as a centered overlay with a backdrop instead of an inline panel. */
  modal?: boolean;
  /** Controlled open state (modal mode). */
  open?: boolean;
  /** Uncontrolled initial open state (modal mode). Defaults to false. */
  defaultOpen?: boolean;
  /** Called when the modal opens (true) or closes (false). */
  onOpenChange?: (open: boolean) => void;
  /** Key (pressed with Cmd or Ctrl) that toggles the modal. Defaults to "k". Set null to disable. */
  hotkey?: string | null;
  /** Close the modal on Escape. Defaults to true. */
  closeOnEscape?: boolean;
  /** Extra classes for the overlay wrapper. */
  overlayClassName?: string;
}

const ICON = "h-[18px] w-[18px] text-muted-foreground";

const BADGE_TONE: Record<NonNullable<NonNullable<SearchResult["badge"]>["tone"]>, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-muted-foreground",
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

type Row =
  | { kind: "result"; index: number; result: SearchResult }
  | { kind: "action"; action: QuickAction }
  | { kind: "file"; file: SearchFile };

export function SearchModal({
  placeholder = "Search",
  tags = [],
  onTagToggle,
  results = [],
  quickActions = [],
  files = [],
  defaultQuery = "",
  query: queryProp,
  onQueryChange,
  onSubmit,
  onSelectResult,
  filterLocally = true,
  loading = false,
  resultsLabel,
  emptyText = "No matches. Try another word or remove a filter.",
  aiSummary = null,
  className,
  modal = false,
  open,
  defaultOpen = false,
  onOpenChange,
  hotkey = "k",
  closeOnEscape = true,
  overlayClassName,
}: SearchModalProps) {
  const [queryState, setQueryState] = useState(defaultQuery);
  const query = queryProp ?? queryState;
  const [showTags, setShowTags] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Open state, controlled through `open` or internal.
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const actualOpen = isControlled ? open : internalOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange],
  );

  // Keep the latest open state and setter reachable from the one time listener.
  const openRef = useRef(actualOpen);
  const setOpenRef = useRef(setOpen);
  useEffect(() => {
    openRef.current = actualOpen;
    setOpenRef.current = setOpen;
  });

  // Cmd or Ctrl plus the hotkey toggles, Escape closes.
  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (hotkey && e.key.toLowerCase() === hotkey.toLowerCase() && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenRef.current(!openRef.current);
      } else if (closeOnEscape && e.key === "Escape" && openRef.current) {
        setOpenRef.current(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal, hotkey, closeOnEscape]);

  // While closed the overlay stays mounted for its fade, so keep it out of the tab order.
  useEffect(() => {
    overlayRef.current?.toggleAttribute("inert", !actualOpen);
  }, [actualOpen, mounted]);

  // Focus the input when the modal opens and lock the page behind it.
  useEffect(() => {
    if (!(modal && actualOpen)) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
    };
  }, [modal, actualOpen]);

  const filteredResults = useMemo(() => {
    if (!filterLocally) return results;
    const q = query.trim().toLowerCase();
    if (!q) return results;
    return results.filter((r) => `${r.name} ${r.meta ?? ""}`.toLowerCase().includes(q));
  }, [query, results, filterLocally]);

  const rows = useMemo<Row[]>(
    () => [
      ...filteredResults.map((result, index) => ({ kind: "result" as const, index, result })),
      ...quickActions.map((action) => ({ kind: "action" as const, action })),
      ...files.map((file) => ({ kind: "file" as const, file })),
    ],
    [filteredResults, quickActions, files],
  );

  // A new set of rows starts with nothing highlighted.
  useEffect(() => setActiveIndex(-1), [rows.length, query]);

  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-row="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleQuery = (value: string) => {
    if (queryProp === undefined) setQueryState(value);
    onQueryChange?.(value);
  };

  const choose = (row: Row) => {
    if (row.kind === "result") onSelectResult?.(row.result, row.index);
    else if (row.kind === "action") row.action.onClick?.();
    else row.file.onOpen?.();
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (rows.length ? (i + 1) % rows.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (rows.length ? (i <= 0 ? rows.length - 1 : i - 1) : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[activeIndex];
      if (row) choose(row);
      else onSubmit?.(query);
    }
  };

  const hasQuery = query.trim().length > 0;
  const showResults = filteredResults.length > 0 || (hasQuery && !loading && quickActions.length + files.length === 0);
  const counter = filteredResults.length;
  const label = resultsLabel ?? (hasQuery ? "Results" : "Suggested");

  const panel = (
    <div
      role={modal ? "dialog" : undefined}
      aria-modal={modal ? true : undefined}
      aria-label={modal ? "Search" : undefined}
      className={cn(
        "mx-auto w-full max-w-xl overflow-hidden rounded-2xl text-foreground",
        "overlay-surface",
        className,
      )}
    >
      {/* Search bar */}
      <div className="flex items-center gap-1 border-b border-white/[0.08] px-4 py-3.5">
        {loading ? (
          <CircleNotch className={cn(ICON, "animate-spin motion-reduce:animate-none")} aria-hidden="true" />
        ) : (
          <MagnifyingGlass className={ICON} aria-hidden="true" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder={placeholder}
          aria-label="Search"
          role="combobox"
          aria-expanded={rows.length > 0}
          aria-controls="credentia-search-list"
          aria-activedescendant={activeIndex >= 0 ? `credentia-search-row-${activeIndex}` : undefined}
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-current outline-none placeholder:text-muted-foreground"
        />
        <div className="flex shrink-0 items-center gap-2.5">
          {tags.length > 0 ? (
            <button
              type="button"
              aria-label="Filters"
              aria-pressed={showTags}
              onClick={() => setShowTags((v) => !v)}
              className={cn(
                "grid size-8 place-items-center rounded-lg transition-colors hover:text-foreground",
                showTags ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <SlidersHorizontal className="h-[18px] w-[18px]" />
            </button>
          ) : null}
          <kbd className="hidden items-center gap-0.5 rounded-md border border-white/[0.1] bg-white/[0.06] px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted-foreground sm:flex">
            <span className="text-[13px] leading-none">⌘</span>
            {modal && hotkey ? hotkey.toUpperCase() : "F"}
          </kbd>
        </div>
      </div>

      {/* AI reading of the query */}
      {aiSummary && (aiSummary.loading || aiSummary.text) ? (
        <div className="flex items-start gap-2.5 border-b border-white/[0.08] px-4 py-3" aria-live="polite">
          <Sparkle weight="fill" className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink" aria-hidden="true" />
          <p className="text-[13px] leading-relaxed text-foreground/90">
            {aiSummary.loading ? <span className="animate-pulse-soft text-muted-foreground">Reading your search</span> : aiSummary.text}
          </p>
        </div>
      ) : null}

      {/* Tags */}
      {tags.length > 0 && showTags ? (
        <div className="border-b border-white/[0.08] px-4 py-3.5">
          <span className="text-[13px] text-muted-foreground">I&apos;m looking for...</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag, i) => {
              const on = tag.active !== false;
              return (
                <button
                  key={`${tag.id ?? tag.label}-${i}`}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onTagToggle?.(tag, i)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg py-1 pl-2.5 pr-2.5 text-[13px] ring-1 ring-inset transition-colors",
                    on
                      ? "bg-white/[0.08] text-foreground ring-white/[0.12]"
                      : "bg-transparent text-muted-foreground ring-white/[0.08] hover:text-foreground",
                  )}
                >
                  {tag.icon}
                  <span>{tag.label}</span>
                  {on ? <X className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div ref={listRef} id="credentia-search-list" role="listbox" className="max-h-[min(60vh,520px)] overflow-y-auto scrollbar-thin" data-lenis-prevent>
        {/* Results */}
        {showResults ? (
          <div className="border-b border-white/[0.08]">
            <p className="px-4 pb-2 pt-3.5 text-[13px] text-muted-foreground">
              {label}&nbsp;&nbsp;<span className="text-foreground/80">{counter}</span>
            </p>
            {filteredResults.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              <ul className="px-1.5 pb-1.5">
                {filteredResults.map((result, i) => {
                  const active = activeIndex === i;
                  const Row = result.href ? "a" : "div";
                  const showGroup = Boolean(result.group) && result.group !== filteredResults[i - 1]?.group;
                  return (
                    <React.Fragment key={`${result.id ?? result.name}-${i}`}>
                    {showGroup ? (
                      <li aria-hidden="true" className="px-2.5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {result.group}
                      </li>
                    ) : null}
                    <li>
                      <div
                        id={`credentia-search-row-${i}`}
                        data-row={i}
                        role="option"
                        aria-selected={active}
                        className={cn(
                          "group relative flex items-center rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.05]",
                          active && "bg-white/[0.07]",
                        )}
                      >
                        <Row
                          {...(result.href ? { href: result.href } : {})}
                          onClick={() => onSelectResult?.(result, i)}
                          className="flex min-w-0 flex-1 items-center text-left"
                        >
                          {result.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={result.avatar} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
                          ) : (
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/[0.1] text-[10px] font-bold text-foreground/80 ring-1 ring-white/10">
                              {initialsOf(result.name) || "?"}
                            </span>
                          )}
                          <span className="ml-2.5 min-w-0 truncate text-sm">
                            {result.name}
                            {result.meta ? <span className="pl-1.5 text-muted-foreground">{result.meta}</span> : null}
                          </span>
                        </Row>
                        {result.badge ? (
                          <span className={cn("ml-2 shrink-0 text-[11px] font-semibold", BADGE_TONE[result.badge.tone ?? "neutral"])}>
                            {result.badge.label}
                          </span>
                        ) : null}
                        {result.actions && result.actions.length > 0 ? (
                          <span className="ml-auto flex items-center gap-2.5 pl-3 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100">
                            {result.actions.map((action, ai) => (
                              <button
                                key={ai}
                                type="button"
                                aria-label={action.label}
                                onClick={(e) => {
                                  e.preventDefault();
                                  action.onClick?.();
                                }}
                                className="transition-colors hover:text-foreground"
                              >
                                {action.icon}
                              </button>
                            ))}
                          </span>
                        ) : null}
                      </div>
                    </li>
                    </React.Fragment>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}

        {/* Quick actions */}
        {quickActions.length > 0 ? (
          <div className="border-b border-white/[0.08] px-1.5 py-1.5">
            <p className="px-2.5 pb-1 pt-2 text-[13px] text-muted-foreground">Quick actions</p>
            {quickActions.map((action, i) => {
              const rowIndex = filteredResults.length + i;
              const active = activeIndex === rowIndex;
              return (
                <button
                  key={`${action.label}-${i}`}
                  id={`credentia-search-row-${rowIndex}`}
                  data-row={rowIndex}
                  role="option"
                  aria-selected={active}
                  type="button"
                  onClick={action.onClick}
                  className={cn(
                    "relative flex w-full items-center rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05]",
                    active && "bg-white/[0.07]",
                  )}
                >
                  <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-foreground/80">
                    {action.icon ?? <Plus className="h-[15px] w-[15px]" />}
                  </span>
                  <span className="pl-3 text-sm">{action.label}</span>
                  {action.shortcut ? (
                    <kbd className="ml-auto flex h-[26px] w-[26px] items-center justify-center rounded-md bg-white/[0.07] font-sans text-[13px] text-foreground/80 ring-1 ring-inset ring-white/[0.08]">
                      {action.shortcut}
                    </kbd>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Files */}
        {files.length > 0 ? (
          <div className="px-1.5 py-1.5">
            <p className="px-2.5 pb-1 pt-2 text-[13px] text-muted-foreground">
              Files&nbsp;&nbsp;<span className="text-foreground/80">{files.length}</span>
            </p>
            {files.map((file, i) => {
              const rowIndex = filteredResults.length + quickActions.length + i;
              const active = activeIndex === rowIndex;
              return (
                <div
                  key={`${file.name}-${i}`}
                  id={`credentia-search-row-${rowIndex}`}
                  data-row={rowIndex}
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "group relative flex items-center rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.05]",
                    active && "bg-white/[0.07]",
                  )}
                >
                  <button type="button" onClick={file.onOpen} className="flex min-w-0 flex-1 items-center text-left">
                    <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-foreground/80">
                      {file.icon ?? <FileArrowDown className="h-[15px] w-[15px]" />}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5 pl-3 text-sm">
                      <span className="truncate">
                        {file.name}
                        {file.ext ? <span className="text-muted-foreground">{file.ext}</span> : null}
                      </span>
                      {file.verified ? <span className="text-[11px] font-semibold text-success">Verified</span> : null}
                    </span>
                  </button>
                  {file.onShare ? (
                    <button
                      type="button"
                      onClick={file.onShare}
                      className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground opacity-80 transition-all hover:text-foreground group-hover:opacity-100"
                    >
                      <span>Share</span>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!modal) return panel;
  if (!mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      aria-hidden={!actualOpen}
      className={cn(
        "fixed inset-0 z-[130] flex items-start justify-center p-3 pt-[10vh] transition-opacity duration-200 sm:p-4 sm:pt-[12vh]",
        actualOpen ? "opacity-100" : "pointer-events-none opacity-0",
        overlayClassName,
      )}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={cn(
          "relative z-10 w-full max-w-xl transition-all duration-200 ease-out",
          actualOpen ? "translate-y-0 scale-100 opacity-100" : "-translate-y-2 scale-[0.98] opacity-0",
        )}
      >
        {panel}
      </div>
    </div>,
    document.body,
  );
}

export default SearchModal;
