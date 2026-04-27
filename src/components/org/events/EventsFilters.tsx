"use client";

import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import { Globe } from "lucide-react";
import { getCountryName } from "@/lib/org/events-constants";

type Event = { country?: string };

/** Desktop breakpoint must match CSS for `.events-filters-row--desktop` */
const DESKTOP_MIN_PX = 1025;
/** Gap between pills — keep in sync with `.events-filters-row` gap */
const FILTERS_GAP_PX = 10;

/** ISO user-assigned / virtual locations — no flagcdn asset; show globe */
const GLOBE_LOCATION_CODES = new Set(["online", "xx"]);

function LocationFilterIcon({ code }: { code: string }) {
  if (GLOBE_LOCATION_CODES.has(code.toLowerCase())) {
    return (
      <span className="events-filter-globe-icon" aria-hidden>
        <Globe strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span
      className="events-flag"
      style={{ backgroundImage: `url(https://flagcdn.com/w40/${code}.png)` }}
      aria-hidden
    />
  );
}

function MoreChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`events-filter-more-chevron${open ? " is-open" : ""}`}
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden
    >
      <path
        d="M1 1l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EventsFilters({
  countryFilter,
  onCountryFilterChange,
  events,
}: {
  countryFilter: string[];
  onCountryFilterChange: (next: string[]) => void;
  events: Event[];
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);
  const [visibleCountryCount, setVisibleCountryCount] = useState(0);

  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const widthsCacheRef = useRef<number[]>([]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.country) set.add(e.country.toLowerCase());
    });
    return Array.from(set).sort();
  }, [events]);

  const label = useMemo(() => {
    if (countryFilter.length === 0) return "All locations";
    if (countryFilter.length === 1) return getCountryName(countryFilter[0]);
    return `${countryFilter.length} locations`;
  }, [countryFilter]);

  /** Single-select: one country, or empty for all. Re-tap active country clears filter. */
  const selectCountry = useCallback(
    (code: string) => {
      const normalized = code.toLowerCase();
      const isOnlySelected =
        countryFilter.length === 1 && countryFilter[0].toLowerCase() === normalized;
      onCountryFilterChange(isOnlySelected ? [] : [normalized]);
      setDesktopMoreOpen(false);
    },
    [countryFilter, onCountryFilterChange]
  );

  const handleSelect = useCallback(
    (code: string | null) => {
      if (code === null) {
        onCountryFilterChange([]);
      } else {
        selectCountry(code);
      }
      setSheetOpen(false);
    },
    [onCountryFilterChange, selectCountry]
  );

  const recalculateDesktopLayout = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < DESKTOP_MIN_PX) {
      setVisibleCountryCount(countries.length);
      return;
    }
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;

    const C = countries.length;
    if (C === 0) {
      setVisibleCountryCount(0);
      return;
    }

    const children = Array.from(measure.children) as HTMLElement[];
    if (children.length < C + 2) return;

    widthsCacheRef.current = children.map((el) => {
      const s = getComputedStyle(el);
      return (
        el.offsetWidth +
        parseFloat(s.marginLeft || "0") +
        parseFloat(s.marginRight || "0")
      );
    });

    const widths = widthsCacheRef.current;
    const wAll = widths[0] ?? 0;
    const wCountries = widths.slice(1, C + 1);
    const wMore = widths[C + 1] ?? 0;
    const available = row.clientWidth;

    let bestK = 0;
    for (let k = C; k >= 0; k--) {
      let sum = wAll;
      for (let i = 0; i < k; i++) {
        sum += FILTERS_GAP_PX + (wCountries[i] ?? 0);
      }
      if (k < C) {
        sum += FILTERS_GAP_PX + wMore;
      }
      if (sum <= available) {
        bestK = k;
        break;
      }
    }
    setVisibleCountryCount(bestK);
  }, [countries]);

  useLayoutEffect(() => {
    const frameId = requestAnimationFrame(recalculateDesktopLayout);
    return () => cancelAnimationFrame(frameId);
  }, [recalculateDesktopLayout]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const ro = new ResizeObserver(() => recalculateDesktopLayout());
    ro.observe(row);
    return () => ro.disconnect();
  }, [recalculateDesktopLayout]);

  useEffect(() => {
    const onResize = () => recalculateDesktopLayout();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [recalculateDesktopLayout]);

  useEffect(() => {
    if (!desktopMoreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".events-filter-more-wrap")) {
        setDesktopMoreOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDesktopMoreOpen(false);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [desktopMoreOpen]);

  const overflowCount = countries.length - visibleCountryCount;
  const overflowCountries =
    overflowCount > 0 ? countries.slice(visibleCountryCount) : [];
  const visibleCountries = countries.slice(0, visibleCountryCount);
  const overflowSelectionActive = overflowCountries.some((c) =>
    countryFilter.includes(c)
  );

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    if (sheetOpen) {
      document.addEventListener("keydown", onEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  return (
    <div className="events-filters">
      <div ref={measureRef} className="events-filters-measure" aria-hidden>
        <button type="button" tabIndex={-1} className="events-filter-pill">
          ALL LOCATIONS
        </button>
        {countries.map((code) => (
          <button
            key={code}
            type="button"
            tabIndex={-1}
            className="events-filter-pill events-filter-pill-flag"
          >
            <LocationFilterIcon code={code} />
            {getCountryName(code)}
          </button>
        ))}
        {countries.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            className="events-filter-pill events-filter-more-measure"
          >
            More ({countries.length})
          </button>
        )}
      </div>

      <div className="events-filters-row events-filters-row--desktop">
        <div ref={rowRef} className="events-filters-desktop-inner">
          <button
            type="button"
            className={`events-filter-pill ${countryFilter.length === 0 ? "is-active" : ""}`}
            onClick={() => onCountryFilterChange([])}
          >
            ALL LOCATIONS
          </button>
          {visibleCountries.map((code) => (
            <button
              key={code}
              type="button"
              className={`events-filter-pill events-filter-pill-flag ${countryFilter.includes(code) ? "is-active" : ""}`}
              onClick={() => selectCountry(code)}
            >
              <LocationFilterIcon code={code} />
              {getCountryName(code)}
            </button>
          ))}
          {overflowCount > 0 && (
            <div className="events-filter-more-wrap">
              <button
                type="button"
                className={`events-filter-pill events-filter-more-toggle ${overflowSelectionActive ? "is-active" : ""}`}
                aria-expanded={desktopMoreOpen}
                aria-haspopup="listbox"
                aria-controls={
                  desktopMoreOpen ? "events-filter-overflow-list" : undefined
                }
                id="events-filter-more-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setDesktopMoreOpen((v) => !v);
                }}
              >
                More ({overflowCount})
                <MoreChevron open={desktopMoreOpen} />
              </button>
              {desktopMoreOpen && (
                <div
                  id="events-filter-overflow-list"
                  className="events-filter-overflow-dropdown"
                  role="listbox"
                  aria-labelledby="events-filter-more-btn"
                  aria-label="More locations"
                >
                  {overflowCountries.map((code) => (
                    <button
                      key={code}
                      type="button"
                      role="option"
                      aria-selected={countryFilter.includes(code)}
                      className={`events-filter-overflow-item events-filter-pill-flag ${countryFilter.includes(code) ? "is-active" : ""}`}
                      onClick={() => selectCountry(code)}
                    >
                      <LocationFilterIcon code={code} />
                      {getCountryName(code)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="events-filters-dropdown events-filters-dropdown--mobile">
        <button
          type="button"
          className="events-filter-trigger"
          onClick={() => setSheetOpen(true)}
          aria-expanded={sheetOpen}
          aria-haspopup="listbox"
        >
          <span>{label}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path fill="currentColor" d="M6 8L2 4h8L6 8z" />
          </svg>
        </button>
      </div>
      {sheetOpen && (
        <>
          <div
            className="events-filter-backdrop"
            aria-hidden
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="events-filter-bottom-sheet"
            role="listbox"
            aria-label="Filter by location"
          >
            <div className="events-filter-sheet-handle" aria-hidden />
            <div className="events-filter-sheet-actions">
              <button
                type="button"
                className={`events-filter-pill events-filter-sheet-item ${countryFilter.length === 0 ? "is-active" : ""}`}
                onClick={() => handleSelect(null)}
              >
                ALL LOCATIONS
              </button>
              {countries.map((code) => (
                <button
                  key={code}
                  type="button"
                  role="option"
                  aria-selected={countryFilter.includes(code)}
                  className={`events-filter-pill events-filter-pill-flag events-filter-sheet-item ${countryFilter.includes(code) ? "is-active" : ""}`}
                  onClick={() => handleSelect(code)}
                >
                  <LocationFilterIcon code={code} />
                  {getCountryName(code)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
