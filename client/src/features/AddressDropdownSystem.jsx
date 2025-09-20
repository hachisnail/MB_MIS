import React, { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import axios from "axios";

/**
 * AddressDropdownSystem.jsx
 *
 * Improvements over previous version:
 * - Persistent caching (localStorage + in-memory) w/ TTL & versioning
 * - Resilient fetching with retries, timeouts, and stale-while-revalidate
 * - Auto-match & auto-advance: typing an exact match auto-selects and focuses next field
 * - Keyboard navigation + Enter-to-accept top match
 * - Better loading/error UX; offline fallback if cached data exists
 * - Fixed effect bug that prevented auto-matching from running
 *
 * Exports: { TypedDropdown, useAddressLogic, AddressSelector } (default AddressSelector)
 */

/******************** Networking & Cache Utilities ********************/
const API_BASE = "https://psgc.cloud/api";
const CACHE_VERSION = "v2"; // bump to invalidate old cache
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const memCache = {
  provinces: null,
  cities: new Map(),
  barangays: new Map(),
};

const axiosClient = axios.create({
  baseURL: API_BASE,
  timeout: 12000,
});

async function fetchWithRetry(url, { retries = 3, delay = 500, signal } = {}) {
  let attempt = 0;
  while (true) {
    try {
      const res = await axiosClient.get(url, { signal });
      return res.data;
    } catch (err) {
      attempt++;
      const retriable = !err.response || err.code === "ECONNABORTED" || (err.response && err.response.status >= 500);
      if (!retriable || attempt > retries) throw err;
      await new Promise((r) => setTimeout(r, delay * Math.pow(2, attempt - 1)));
    }
  }
}

function lsKey(key) {
  return `AddressDS:${CACHE_VERSION}:${key}`;
}

function writeCache(key, value) {
  try {
    localStorage.setItem(
      lsKey(key),
      JSON.stringify({ t: Date.now(), v: value })
    );
  } catch { }
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(lsKey(key));
    if (!raw) return null;
    const { t, v } = JSON.parse(raw);
    if (Date.now() - t > TTL_MS) return null; // expired
    return v;
  } catch {
    return null;
  }
}

async function loadWithCache({ key, memGet, memSet, url }) {
  // 1) Try in-memory
  const mem = memGet();
  if (mem && (Array.isArray(mem) ? mem.length : mem.size)) return { data: mem, fresh: false };

  // 2) Try localStorage
  const cached = readCache(key);
  if (cached) {
    memSet(cached);
    // SWR: refresh in background but don't block UI
    refreshInBackground();
    return { data: cached, fresh: false };
  }

  // 3) Fetch network
  const controller = new AbortController();
  const data = await fetchWithRetry(url, { signal: controller.signal });
  memSet(data);
  writeCache(key, data);
  return { data, fresh: true };

  async function refreshInBackground() {
    try {
      const fresh = await fetchWithRetry(url);
      memSet(fresh);
      writeCache(key, fresh);
    } catch {
      // ignore background failures
    }
  }
}

/******************** Fuzzy Matching Helpers ********************/
function fuzzyMatchScore(searchTerm, targetString) {
  if (!searchTerm || !targetString) return 0;
  const search = searchTerm.toLowerCase().trim();
  const target = targetString.toLowerCase();

  if (target === search) return 4; // exact full equality
  if (target.includes(search)) return 3; // substring

  // in-order char match
  let si = 0;
  for (let i = 0; i < target.length && si < search.length; i++) {
    if (target[i] === search[si]) si++;
  }
  if (si === search.length) return 2;

  // word boundary
  const words = target.split(/\s+/);
  if (words.some((w) => w.startsWith(search))) return 1;

  return 0;
}

function rankByRelevance(items, searchTerm) {
  if (!searchTerm) return items;
  return items
    .map((it) => ({ ...it, relevance: fuzzyMatchScore(searchTerm, it.name) }))
    .filter((it) => it.relevance > 0)
    .sort((a, b) => (b.relevance !== a.relevance ? b.relevance - a.relevance : a.name.localeCompare(b.name)));
}

/******************** TypedDropdown (searchable + auto-advance) ********************/
const TypedDropdown = forwardRef(function TypedDropdown(
  {
    placeholder = "Type to search...",
    options = [],
    selectedItem = null,
    onChange = () => { },
    disabled = false,
    isLoading = false,
    error = null,
    filterFunction = null,
    showSuggestions = true,
    maxSuggestions = 8,
    className = "",
    variant = "default", // default | rounded | minimal
    size = "medium", // small | medium | large
    showClearButton = true,
    autoSelectOnExactMatch = true,
    onAutoSelect = null, // called after auto selection
  },
  ref
) {
  const inputRef = useRef(null);
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus(), blur: () => inputRef.current?.blur(), input: inputRef.current }));

  const [inputText, setInputText] = useState(selectedItem?.name || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filtered, setFiltered] = useState(options);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Keep input in sync with external selection
  useEffect(() => {
    setInputText(selectedItem?.name || "");
  }, [selectedItem]);

  // Filter whenever input or options change
  useEffect(() => {
    const f = (filterFunction ? filterFunction(inputText) : options.filter((o) => o.name.toLowerCase().includes((inputText || "").toLowerCase())));
    const next = f.slice(0, maxSuggestions);
    setFiltered(next);
    setFocusedIndex(-1);

    // Auto-select on exact match (case-insensitive full equality)
    if (!disabled && autoSelectOnExactMatch && inputText && options.length) {
      const exact = options.find((o) => o.name.toLowerCase() === inputText.toLowerCase());
      if (exact && (!selectedItem || exact.code !== selectedItem.code)) {
        onChange(exact);
        setShowDropdown(false);
        setFocusedIndex(-1);
        onAutoSelect && onAutoSelect(exact);
      }
    }
  }, [inputText, options, filterFunction, maxSuggestions, disabled]);

  const getVariantStyles = () => {
    const base = "flex items-center border transition-colors";
    switch (variant) {
      case "rounded":
        return `${base} rounded-2xl px-4 py-2`;
      case "minimal":
        return `${base} border-0 border-b-2 px-2 py-1 rounded-none`;
      default:
        return `${base} rounded-lg px-3 py-1`;
    }
  };

  const getSizeStyles = () => (size === "small" ? "text-sm h-6" : size === "large" ? "text-lg h-5" : "text-md h-[17px]");

  const handleInputChange = (e) => {
    if (disabled) return;
    const value = e.target.value;
    setInputText(value);
    setShowDropdown(true);
    setFocusedIndex(-1);
    if (selectedItem && value !== selectedItem.name) onChange(null);
  };

  const handleSelect = (item) => {
    setInputText(item.name);
    onChange(item);
    setShowDropdown(false);
    setFocusedIndex(-1);
  };

  const handleClear = () => {
    onChange(null);
    setInputText("");
    setShowDropdown(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    switch (e.key) {
      case "Escape":
        setShowDropdown(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
      case "Enter":
        e.preventDefault();
        if (showDropdown && focusedIndex >= 0 && filtered[focusedIndex]) {
          handleSelect(filtered[focusedIndex]);
          onAutoSelect && onAutoSelect(filtered[focusedIndex]);
        } else if (filtered.length > 0 && showDropdown) {
          handleSelect(filtered[0]);
          onAutoSelect && onAutoSelect(filtered[0]);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        setShowDropdown(true);
        setFocusedIndex((p) => (filtered.length ? (p + 1) % filtered.length : -1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setShowDropdown(true);
        setFocusedIndex((p) => (filtered.length ? (p - 1 + filtered.length) % filtered.length : -1));
        break;
      case "Tab":
        setShowDropdown(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const containerStyles = getVariantStyles();

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className={`${containerStyles} ${disabled ? "bg-gray-100 cursor-not-allowed border-gray-300" : error ? "bg-white border-red-500 focus-within:ring-2 focus-within:ring-gray-300" : "bg-white border-black focus-within:ring-2 focus-within:ring-gray-300"}`}
        style={{ boxShadow: "inset 0 1px 1px rgba(1,1,1,0.5)" }}
      >
        <input
          ref={inputRef}
          className={`outline-none flex-grow placeholder-gray-400 bg-transparent py-0 leading-tight appearance-none ${getSizeStyles()}`}
          placeholder={disabled ? "Please select previous field first" : placeholder}
          value={inputText}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={() => !disabled && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />

        {isLoading && (
          <div className="ml-2 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#524433]"></div>
          </div>
        )}

        {selectedItem && !disabled && !isLoading && showClearButton && (
          <button
            type="button"
            className="ml-2 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded"
            onClick={handleClear}
            title="Clear selection"
            aria-label="Clear selection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>
      )}

      {showDropdown && !disabled && showSuggestions && (
        <div
          className={`absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-300 shadow-lg ${variant === "rounded" ? "rounded" : "rounded-md"}`}
          role="listbox"
        >
          {isLoading ? (
            <div className="px-3 py-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#524433] mx-auto mb-2"></div>
              Loading...
            </div>
          ) : filtered.length > 0 ? (
            <>
              {filtered.map((option, index) => (
                <div
                  key={option.code || index}
                  className={`px-3 py-2 cursor-pointer transition-colors ${index === focusedIndex ? "bg-gray-50" : "hover:bg-gray-100"} ${index === 0 ? "bg-gray-50" : ""}`}
                  onClick={() => { handleSelect(option); onAutoSelect && onAutoSelect(option); }}
                  role="option"
                  aria-selected={selectedItem?.code === option.code}
                >
                  <div className="font-medium">{option.name}</div>
                  {typeof option.relevance === "number" && (
                    <div className="text-xs text-gray-500">
                      {option.relevance >= 4 ? "Exact" : option.relevance === 3 ? "Contains" : option.relevance === 2 ? "In-order" : "Prefix"}
                    </div>
                  )}
                </div>
              ))}
              <div className="px-3 py-2 text-xs text-gray-500 border-t">Showing top {filtered.length} results. Type more to refine.</div>
            </>
          ) : (
            <div className="px-3 py-4 text-center text-gray-500">No results</div>
          )}
        </div>
      )}
    </div>
  );
});

/******************** useAddressLogic Hook ********************/
function useAddressLogic({ forceRefresh = false } = {}) {
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);

  const [provincesError, setProvincesError] = useState(null);
  const [citiesError, setCitiesError] = useState(null);
  const [barangaysError, setBarangaysError] = useState(null);

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);

  // Load provinces (SWR + persistent cache)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingProvinces(true);
      setProvincesError(null);
      try {
        const key = "provinces";
        if (forceRefresh) localStorage.removeItem(lsKey(key));
        const { data } = await loadWithCache({
          key,
          memGet: () => memCache.provinces,
          memSet: (v) => (memCache.provinces = Array.isArray(v) ? v.slice().sort((a, b) => a.name.localeCompare(b.name)) : v),
          url: "/provinces",
        });
        if (!cancelled) setProvinces(memCache.provinces || []);
      } catch (e) {
        if (!cancelled) setProvincesError("Failed to load provinces.");
      } finally {
        if (!cancelled) setIsLoadingProvinces(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [forceRefresh]);

  // When province changes, load cities
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCities([]);
      setSelectedCity(null);
      setBarangays([]);
      setSelectedBarangay(null);
      setCitiesError(null);

      if (!selectedProvince) return;

      setIsLoadingCities(true);
      try {
        const key = `cities:${selectedProvince.code}`;
        const cachedMap = memCache.cities.get(selectedProvince.code);
        if (forceRefresh) localStorage.removeItem(lsKey(key));
        const { data } = await loadWithCache({
          key,
          memGet: () => cachedMap,
          memSet: (v) => memCache.cities.set(selectedProvince.code, Array.isArray(v) ? v.slice().sort((a, b) => a.name.localeCompare(b.name)) : v),
          url: `/provinces/${selectedProvince.code}/cities-municipalities`,
        });
        if (!cancelled) setCities(memCache.cities.get(selectedProvince.code) || []);
      } catch (e) {
        if (!cancelled) setCitiesError("Failed to load cities.");
      } finally {
        if (!cancelled) setIsLoadingCities(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedProvince, forceRefresh]);

  // When city changes, load barangays
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBarangays([]);
      setSelectedBarangay(null);
      setBarangaysError(null);

      if (!selectedCity) return;

      setIsLoadingBarangays(true);
      try {
        const key = `barangays:${selectedCity.code}`;
        const cachedMap = memCache.barangays.get(selectedCity.code);
        if (forceRefresh) localStorage.removeItem(lsKey(key));
        const { data } = await loadWithCache({
          key,
          memGet: () => cachedMap,
          memSet: (v) => memCache.barangays.set(selectedCity.code, Array.isArray(v) ? v.slice().sort((a, b) => a.name.localeCompare(b.name)) : v),
          url: `/cities-municipalities/${selectedCity.code}/barangays`,
        });
        if (!cancelled) setBarangays(memCache.barangays.get(selectedCity.code) || []);
      } catch (e) {
        if (!cancelled) setBarangaysError("Failed to load barangays.");
      } finally {
        if (!cancelled) setIsLoadingBarangays(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCity, forceRefresh]);

  // Filtering hooks (memoized)
  const getFilteredProvinces = useMemo(() => (term = "") => (term.trim() ? rankByRelevance(provinces, term) : provinces), [provinces]);
  const getFilteredCities = useMemo(() => (term = "") => (term.trim() ? rankByRelevance(cities, term) : cities), [cities]);
  const getFilteredBarangays = useMemo(() => (term = "") => (term.trim() ? rankByRelevance(barangays, term) : barangays), [barangays]);

  return {
    // data
    provinces, cities, barangays,

    // selections
    selectedProvince, setSelectedProvince,
    selectedCity, setSelectedCity,
    selectedBarangay, setSelectedBarangay,

    // loading & errors
    isLoadingProvinces, isLoadingCities, isLoadingBarangays,
    provincesError, citiesError, barangaysError,

    // filters
    getFilteredProvinces, getFilteredCities, getFilteredBarangays,

    // utils
    clearAll: () => {
      setSelectedProvince(null);
      setSelectedCity(null);
      setSelectedBarangay(null);
      setCities([]);
      setBarangays([]);
    },

    isProvinceValid: !!selectedProvince,
    isCityValid: !!selectedCity,
    isBarangayValid: !!selectedBarangay,
    isAddressComplete: !!(selectedProvince && selectedCity && selectedBarangay),
  };
}

/******************** AddressSelector (auto-advance through fields) ********************/
function AddressSelector({
  onAddressChange = () => { },
  initialValues = {},
  variant = "rounded",
  size = "medium",
  className = "",
  showLabels = true,
  labelStyle = "side", // "top" | "side"
  required = true,
  errors = {},
  autoProceed = true, // if true, proceeds to next field on selection or exact match
  forceRefresh = false,
}) {
  const {
    provinces, cities, barangays,
    selectedProvince, setSelectedProvince,
    selectedCity, setSelectedCity,
    selectedBarangay, setSelectedBarangay,
    getFilteredProvinces, getFilteredCities, getFilteredBarangays,
    isLoadingProvinces, isLoadingCities, isLoadingBarangays,
    provincesError, citiesError, barangaysError,
    clearAll, isAddressComplete,
  } = useAddressLogic({ forceRefresh });

  // Refs for auto-advance focus
  const provinceRef = useRef(null);
  const cityRef = useRef(null);
  const barangayRef = useRef(null);

  // Notify parent of changes
  useEffect(() => {
    onAddressChange({ province: selectedProvince, city: selectedCity, barangay: selectedBarangay, isComplete: isAddressComplete });
  }, [selectedProvince, selectedCity, selectedBarangay, isAddressComplete]);

  // Initialize from provided values
  useEffect(() => {
    if (initialValues.province) setSelectedProvince(initialValues.province);
    if (initialValues.city) setSelectedCity(initialValues.city);
    if (initialValues.barangay) setSelectedBarangay(initialValues.barangay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labelEl = (label, isReq) => (
    !showLabels ? null : (
      <span className="text-md font-medium">{label}{isReq && <span className="text-red-500 ml-1">*</span>}</span>
    )
  );

  const rowClass = labelStyle === "top" ? "flex flex-col gap-y-2" : "flex w-full items-center justify-between";
  const ddWidth = labelStyle === "top" ? "w-full" : "w-60";

  // Auto-advance handlers
  const handleProvinceAutoSelect = () => { if (autoProceed) cityRef.current?.focus(); };
  const handleCityAutoSelect = () => { if (autoProceed) barangayRef.current?.focus(); };

  return (
    <div className={`w-full flex flex-col gap-y-5 ${className}`}>
      {/* Province */}
      <div className={rowClass}>
        {labelEl("Province", required)}
        <div className={ddWidth}>
          <TypedDropdown
            ref={provinceRef}
            placeholder="Type to search provinces..."
            options={provinces}
            selectedItem={selectedProvince}
            onChange={setSelectedProvince}
            isLoading={isLoadingProvinces}
            error={errors.province || provincesError}
            filterFunction={getFilteredProvinces}
            maxSuggestions={12}
            variant={variant}
            size={size}
            onAutoSelect={handleProvinceAutoSelect}
          />
        </div>
      </div>

      {/* City/Municipality */}
      <div className={rowClass}>
        {labelEl("City/Municipality", required)}
        <div className={ddWidth}>
          <TypedDropdown
            ref={cityRef}
            placeholder={selectedProvince ? "Type to search cities..." : "Select province first"}
            options={cities}
            selectedItem={selectedCity}
            onChange={setSelectedCity}
            disabled={!selectedProvince}
            isLoading={isLoadingCities}
            error={errors.city || citiesError}
            filterFunction={getFilteredCities}
            maxSuggestions={12}
            variant={variant}
            size={size}
            onAutoSelect={handleCityAutoSelect}
          />
        </div>
      </div>

      {/* Barangay */}
      <div className={rowClass}>
        {labelEl("Barangay", required)}
        <div className={ddWidth}>
          <TypedDropdown
            ref={barangayRef}
            placeholder={selectedCity ? "Type to search barangays..." : "Select city first"}
            options={barangays}
            selectedItem={selectedBarangay}
            onChange={setSelectedBarangay}
            disabled={!selectedCity}
            isLoading={isLoadingBarangays}
            error={errors.barangay || barangaysError}
            filterFunction={getFilteredBarangays}
            maxSuggestions={16}
            variant={variant}
            size={size}
            onAutoSelect={() => { /* final field */ }}
          />
        </div>
      </div>

      {(selectedProvince || selectedCity || selectedBarangay) && (
        <div className="flex justify-end">
          <button type="button" onClick={clearAll} className="text-sm text-gray-600 hover:text-gray-800 underline">Clear All Selections</button>
        </div>
      )}
    </div>
  );
}

export { TypedDropdown, useAddressLogic, AddressSelector };
export default AddressSelector;
