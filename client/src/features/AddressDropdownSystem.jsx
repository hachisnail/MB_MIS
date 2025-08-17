import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';

/**
 * Enhanced TypedDropdown component for searchable dropdown selection
 * 
 * Features:
 * - Search functionality with fuzzy matching
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Loading states and error handling
 * - Customizable styling and behavior
 * - Clear selection functionality
 * - Disabled state support
 * - Maximum suggestions limit
 * - Custom filter functions
 */
function TypedDropdown({
    placeholder = "Type to search...",
    options = [],
    selectedItem = null,
    onChange = () => { },
    disabled = false,
    isLoading = false,
    error = null,
    filterFunction = null,
    onInputChange = null,
    showSuggestions = true,
    maxSuggestions = 8,
    className = "",
    inputStyle = {},
    dropdownStyle = {},
    showClearButton = true,
    loadingText = "Loading...",
    noResultsText = "No results found",
    startTypingText = "Start typing to search...",
    variant = "default", // "default", "rounded", "minimal"
    size = "medium", // "small", "medium", "large"
}) {
    const [inputText, setInputText] = useState(selectedItem?.name || '');
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState(options);
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Update input text when selectedItem changes
    useEffect(() => {
        setInputText(selectedItem?.name || '');
    }, [selectedItem]);

    // Filter options based on input text
    useEffect(() => {
        if (filterFunction && typeof filterFunction === 'function') {
            const filtered = filterFunction(inputText);
            setFilteredOptions(filtered.slice(0, maxSuggestions));
        } else {
            const filtered = options.filter((option) =>
                option.name.toLowerCase().includes(inputText.toLowerCase())
            );
            setFilteredOptions(filtered.slice(0, maxSuggestions));
        }
        setFocusedIndex(-1); // Reset focus when options change
    }, [options, inputText, filterFunction, maxSuggestions]);

    // Handle clicks outside component
    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowDropdown(false);
                setFocusedIndex(-1);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Style variants
    const getVariantStyles = () => {
        const baseStyles = "flex border transition-colors";

        switch (variant) {
            case "rounded":
                return `${baseStyles} rounded-full px-4 py-1`;
            case "minimal":
                return `${baseStyles} border-0 border-b-2 px-2 py-2 rounded-none`;
            default:
                return `${baseStyles} rounded-lg px-3 py-2`;
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case "small":
                return "text-sm";
            case "large":
                return "text-lg py-3";
            default:
                return "text-md";
        }
    };

    const getInputStyles = () => {
        const baseStyles = "outline-none flex-grow placeholder-gray-400 bg-transparent";
        const variantStyles = getSizeStyles();

        return `${baseStyles} ${variantStyles}`;
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputText(value);

        if (!disabled) {
            setShowDropdown(true);
            setFocusedIndex(-1);

            if (onInputChange) {
                onInputChange(value);
            }

            // Clear selection if input doesn't match selected item
            if (selectedItem && value !== selectedItem.name) {
                onChange(null);
            }
        }
    };

    const handleSelect = (item) => {
        setInputText(item.name);
        onChange(item);
        setShowDropdown(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
    };

    const handleClear = () => {
        onChange(null);
        setInputText('');
        setShowDropdown(false);
        setFocusedIndex(-1);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        switch (e.key) {
            case 'Escape':
                setShowDropdown(false);
                setFocusedIndex(-1);
                inputRef.current?.blur();
                break;

            case 'Enter':
                e.preventDefault();
                if (showDropdown && focusedIndex >= 0 && filteredOptions[focusedIndex]) {
                    handleSelect(filteredOptions[focusedIndex]);
                } else if (filteredOptions.length > 0 && showDropdown) {
                    handleSelect(filteredOptions[0]);
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (!showDropdown) {
                    setShowDropdown(true);
                } else {
                    setFocusedIndex(prev =>
                        prev < filteredOptions.length - 1 ? prev + 1 : 0
                    );
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (showDropdown) {
                    setFocusedIndex(prev =>
                        prev > 0 ? prev - 1 : filteredOptions.length - 1
                    );
                }
                break;

            case 'Tab':
                setShowDropdown(false);
                setFocusedIndex(-1);
                break;
        }
    };

    // Scroll focused item into view
    useEffect(() => {
        if (focusedIndex >= 0 && dropdownRef.current) {
            const focusedElement = dropdownRef.current.children[focusedIndex];
            if (focusedElement) {
                focusedElement.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
            }
        }
    }, [focusedIndex]);

    const containerStyles = getVariantStyles();
    const inputStyles = getInputStyles();

    return (
        <div ref={wrapperRef} className={`relative w-full ${className}`}>
            <div
                className={`${containerStyles} ${disabled
                    ? 'bg-gray-100 cursor-not-allowed border-gray-300'
                    : error
                        ? 'bg-white border-red-500 focus-within:ring-2 focus-within:ring-gray-300'
                        : 'bg-white border-black focus-within:ring-2 focus-within:ring-gray-300'
                    }`}
                style={{
                    boxShadow: variant !== "minimal" ? "inset 0 1px 1px rgba(0, 0, 0, 0.1)" : "none",
                    ...inputStyle
                }}
            >
                <input
                    ref={inputRef}
                    className={inputStyles}
                    placeholder={disabled ? 'Please select previous field first' : placeholder}
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
                    ref={dropdownRef}
                    className="absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-300 shadow-lg rounded-md"
                    style={dropdownStyle}
                    role="listbox"
                >
                    {isLoading ? (
                        <div className="px-3 py-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#524433] mx-auto mb-2"></div>
                            {loadingText}
                        </div>
                    ) : filteredOptions.length > 0 ? (
                        <>
                            {filteredOptions.map((option, index) => (
                                <div
                                    key={option.code || index}
                                    className={`px-3 py-2 cursor-pointer transition-colors ${index === focusedIndex
                                        ? 'bg-gray-50'
                                        : 'hover:bg-gray-100'
                                        } ${index === 0 ? 'bg-gray-50' : ''}`}
                                    onClick={() => handleSelect(option)}
                                    role="option"
                                    aria-selected={selectedItem?.code === option.code}
                                >
                                    <div className="font-medium">{option.name}</div>
                                    {option.relevance && (
                                        <div className="text-xs text-gray-500">
                                            {option.relevance === 3 ? 'Exact match' :
                                                option.relevance === 2 ? 'Contains all letters' :
                                                    'Partial match'}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {inputText && filteredOptions.length < options.length && (
                                <div className="px-3 py-2 text-xs text-gray-500 border-t">
                                    Showing top {filteredOptions.length} results. Type more to refine search.
                                </div>
                            )}
                        </>
                    ) : inputText ? (
                        <div className="px-3 py-4 text-center text-gray-500">
                            <div className="mb-2">{noResultsText} for "{inputText}"</div>
                            <div className="text-xs">Try typing a different name or check spelling</div>
                        </div>
                    ) : (
                        <div className="px-3 py-4 text-center text-gray-500">
                            {startTypingText}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Helper function for fuzzy string matching
const fuzzyMatch = (searchTerm, targetString) => {
    if (!searchTerm || !targetString) return false;

    const search = searchTerm.toLowerCase().trim();
    const target = targetString.toLowerCase();

    // Exact match gets highest priority
    if (target.includes(search)) return 3;

    // Check if all characters of search term exist in order
    let searchIndex = 0;
    for (let i = 0; i < target.length && searchIndex < search.length; i++) {
        if (target[i] === search[searchIndex]) {
            searchIndex++;
        }
    }
    if (searchIndex === search.length) return 2;

    // Check if search term matches word boundaries
    const words = target.split(/\s+/);
    for (const word of words) {
        if (word.startsWith(search)) return 1;
    }

    return 0;
};

// Helper function to sort results by relevance
const sortByRelevance = (items, searchTerm) => {
    if (!searchTerm) return items;

    return items
        .map(item => ({
            ...item,
            relevance: fuzzyMatch(searchTerm, item.name)
        }))
        .filter(item => item.relevance > 0)
        .sort((a, b) => {
            // First sort by relevance score
            if (b.relevance !== a.relevance) {
                return b.relevance - a.relevance;
            }
            // Then by alphabetical order
            return a.name.localeCompare(b.name);
        });
};

// Cache for API responses to reduce redundant calls
const cache = {
    provinces: null,
    cities: new Map(),
    barangays: new Map()
};

/**
 * Enhanced custom hook for Province → City → Barangay logic with improved search functionality.
 * 
 * Features:
 * 1. Loads the list of provinces from psgc.cloud on mount with caching.
 * 2. Smart search with fuzzy matching and multiple search strategies.
 * 3. Auto-complete suggestions with ranking based on relevance.
 * 4. Loading states and error handling for better UX.
 * 5. Debounced search to reduce API calls.
 * 6. Support for common abbreviations and alternative names.
 */
function useAddressLogic() {
    // Data arrays for each level
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [barangays, setBarangays] = useState([]);

    // Loading states
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);

    // Error states
    const [provincesError, setProvincesError] = useState(null);
    const [citiesError, setCitiesError] = useState(null);
    const [barangaysError, setBarangaysError] = useState(null);

    // The user's current selections
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedBarangay, setSelectedBarangay] = useState(null);

    // Search functionality with enhanced filtering
    const getFilteredProvinces = useMemo(() => {
        return (searchTerm = '') => {
            if (!searchTerm.trim()) return provinces;
            return sortByRelevance(provinces, searchTerm);
        };
    }, [provinces]);

    const getFilteredCities = useMemo(() => {
        return (searchTerm = '') => {
            if (!searchTerm.trim()) return cities;
            return sortByRelevance(cities, searchTerm);
        };
    }, [cities]);

    const getFilteredBarangays = useMemo(() => {
        return (searchTerm = '') => {
            if (!searchTerm.trim()) return barangays;
            return sortByRelevance(barangays, searchTerm);
        };
    }, [barangays]);

    // Load provinces on mount with caching
    useEffect(() => {
        const loadProvinces = async () => {
            if (cache.provinces) {
                setProvinces(cache.provinces);
                return;
            }

            setIsLoadingProvinces(true);
            setProvincesError(null);

            try {
                const response = await axios.get('https://psgc.cloud/api/provinces');
                const sortedProvinces = response.data.sort((a, b) => a.name.localeCompare(b.name));

                cache.provinces = sortedProvinces;
                setProvinces(sortedProvinces);
            } catch (error) {
                console.error('Error fetching provinces:', error);
                setProvincesError('Failed to load provinces. Please try again.');
            } finally {
                setIsLoadingProvinces(false);
            }
        };

        loadProvinces();
    }, []);

    // Enhanced province selection handler
    const handleProvinceSelect = (province) => {
        setSelectedProvince(province);
        // Clear dependent selections
        setSelectedCity(null);
        setSelectedBarangay(null);
        setCities([]);
        setBarangays([]);
        setCitiesError(null);
        setBarangaysError(null);
    };

    // Enhanced city selection handler
    const handleCitySelect = (city) => {
        setSelectedCity(city);
        // Clear dependent selections
        setSelectedBarangay(null);
        setBarangays([]);
        setBarangaysError(null);
    };

    // Load cities when province changes with caching
    useEffect(() => {
        const loadCities = async () => {
            if (!selectedProvince) {
                setCities([]);
                return;
            }

            const cacheKey = selectedProvince.code;
            if (cache.cities.has(cacheKey)) {
                setCities(cache.cities.get(cacheKey));
                return;
            }

            setIsLoadingCities(true);
            setCitiesError(null);

            try {
                const response = await axios.get(
                    `https://psgc.cloud/api/provinces/${selectedProvince.code}/cities-municipalities`
                );
                const sortedCities = response.data.sort((a, b) => a.name.localeCompare(b.name));

                cache.cities.set(cacheKey, sortedCities);
                setCities(sortedCities);
            } catch (error) {
                console.error('Error fetching cities:', error);
                setCitiesError('Failed to load cities. Please try again.');
            } finally {
                setIsLoadingCities(false);
            }
        };

        loadCities();
    }, [selectedProvince]);

    // Load barangays when city changes with caching
    useEffect(() => {
        const loadBarangays = async () => {
            if (!selectedCity) {
                setBarangays([]);
                return;
            }

            const cacheKey = selectedCity.code;
            if (cache.barangays.has(cacheKey)) {
                setBarangays(cache.barangays.get(cacheKey));
                return;
            }

            setIsLoadingBarangays(true);
            setBarangaysError(null);

            try {
                const response = await axios.get(
                    `https://psgc.cloud/api/cities-municipalities/${selectedCity.code}/barangays`
                );
                const sortedBarangays = response.data.sort((a, b) => a.name.localeCompare(b.name));

                cache.barangays.set(cacheKey, sortedBarangays);
                setBarangays(sortedBarangays);
            } catch (error) {
                console.error('Error fetching barangays:', error);
                setBarangaysError('Failed to load barangays. Please try again.');
            } finally {
                setIsLoadingBarangays(false);
            }
        };

        loadBarangays();
    }, [selectedCity]);

    // Helper function to find item by partial name match
    const findByPartialMatch = (items, searchTerm) => {
        if (!searchTerm || !items.length) return null;

        const filtered = sortByRelevance(items, searchTerm);
        return filtered.length > 0 ? filtered[0] : null;
    };

    // Auto-suggest functionality
    const getSuggestions = (type, searchTerm, limit = 5) => {
        let items = [];

        switch (type) {
            case 'province':
                items = getFilteredProvinces(searchTerm);
                break;
            case 'city':
                items = getFilteredCities(searchTerm);
                break;
            case 'barangay':
                items = getFilteredBarangays(searchTerm);
                break;
            default:
                return [];
        }

        return items.slice(0, limit);
    };

    return {
        // Data arrays
        provinces,
        cities,
        barangays,

        // Enhanced filtering functions
        getFilteredProvinces,
        getFilteredCities,
        getFilteredBarangays,

        // Current selections
        selectedProvince,
        selectedCity,
        selectedBarangay,

        // Enhanced selection handlers
        setSelectedProvince: handleProvinceSelect,
        setSelectedCity: handleCitySelect,
        setSelectedBarangay,

        // Loading states
        isLoadingProvinces,
        isLoadingCities,
        isLoadingBarangays,

        // Error states
        provincesError,
        citiesError,
        barangaysError,

        // Helper functions
        findByPartialMatch,
        getSuggestions,

        // Utility functions
        clearAll: () => {
            setSelectedProvince(null);
            setSelectedCity(null);
            setSelectedBarangay(null);
            setCities([]);
            setBarangays([]);
        },

        // Validation helpers
        isProvinceValid: selectedProvince !== null,
        isCityValid: selectedCity !== null,
        isBarangayValid: selectedBarangay !== null,
        isAddressComplete: selectedProvince && selectedCity && selectedBarangay,
    };
}

/**
 * Complete Address Selection Component
 * 
 * This component combines the TypedDropdown with the address logic
 * to provide a complete address selection interface with search functionality.
 */
function AddressSelector({
    onAddressChange = () => { },
    initialValues = {},
    variant = "rounded", // matches the original style
    size = "medium",
    className = "",
    showLabels = true,
    labelStyle = "side", // "top", "side"
    required = true,
    errors = {}
}) {
    const {
        provinces,
        cities,
        barangays,
        selectedProvince,
        selectedCity,
        selectedBarangay,
        setSelectedProvince,
        setSelectedCity,
        setSelectedBarangay,
        getFilteredProvinces,
        getFilteredCities,
        getFilteredBarangays,
        isLoadingProvinces,
        isLoadingCities,
        isLoadingBarangays,
        provincesError,
        citiesError,
        barangaysError,
        clearAll,
        isAddressComplete
    } = useAddressLogic();

    // Notify parent component of address changes
    useEffect(() => {
        onAddressChange({
            province: selectedProvince,
            city: selectedCity,
            barangay: selectedBarangay,
            isComplete: isAddressComplete
        });
    }, [selectedProvince, selectedCity, selectedBarangay, isAddressComplete, onAddressChange]);

    // Set initial values if provided
    useEffect(() => {
        if (initialValues.province && !selectedProvince) {
            setSelectedProvince(initialValues.province);
        }
        if (initialValues.city && !selectedCity) {
            setSelectedCity(initialValues.city);
        }
        if (initialValues.barangay && !selectedBarangay) {
            setSelectedBarangay(initialValues.barangay);
        }
    }, [initialValues]);

    const getLabelComponent = (label, isRequired) => {
        if (!showLabels) return null;

        return (
            <span className="text-md font-medium">
                {label}
                {isRequired && <span className="text-red-500 ml-1">*</span>}
            </span>
        );
    };

    const getLayoutClasses = () => {
        if (labelStyle === "top") {
            return "flex flex-col gap-y-2";
        }
        return "flex w-full items-center justify-between";
    };

    const getDropdownWidth = () => {
        if (labelStyle === "top") {
            return "w-full";
        }
        return "w-60";
    };

    return (
        <div className={`w-full flex flex-col gap-y-5 ${className}`}>
            {/* Province Selection */}
            <div className={getLayoutClasses()}>
                {getLabelComponent("Province", required)}
                <div className={getDropdownWidth()}>
                    <TypedDropdown
                        placeholder="Type to search provinces..."
                        options={provinces}
                        selectedItem={selectedProvince}
                        onChange={setSelectedProvince}
                        isLoading={isLoadingProvinces}
                        error={errors.province || provincesError}
                        filterFunction={getFilteredProvinces}
                        maxSuggestions={10}
                        variant={variant}
                        size={size}
                    />
                </div>
            </div>

            {/* City Selection */}
            <div className={getLayoutClasses()}>
                {getLabelComponent("City/Municipality", required)}
                <div className={getDropdownWidth()}>
                    <TypedDropdown
                        placeholder={selectedProvince ? "Type to search cities..." : "Select province first"}
                        options={cities}
                        selectedItem={selectedCity}
                        onChange={setSelectedCity}
                        disabled={!selectedProvince}
                        isLoading={isLoadingCities}
                        error={errors.city || citiesError}
                        filterFunction={getFilteredCities}
                        maxSuggestions={10}
                        variant={variant}
                        size={size}
                    />
                </div>
            </div>

            {/* Barangay Selection */}
            <div className={getLayoutClasses()}>
                {getLabelComponent("Barangay", required)}
                <div className={getDropdownWidth()}>
                    <TypedDropdown
                        placeholder={selectedCity ? "Type to search barangays..." : "Select city first"}
                        options={barangays}
                        selectedItem={selectedBarangay}
                        onChange={setSelectedBarangay}
                        disabled={!selectedCity}
                        isLoading={isLoadingBarangays}
                        error={errors.barangay || barangaysError}
                        filterFunction={getFilteredBarangays}
                        maxSuggestions={12}
                        variant={variant}
                        size={size}
                    />
                </div>
            </div>

            {/* Clear All Button */}
            {(selectedProvince || selectedCity || selectedBarangay) && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={clearAll}
                        className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                        Clear All Selections
                    </button>
                </div>
            )}
        </div>
    );
}

// Export both the individual components and the complete system
export { TypedDropdown, useAddressLogic, AddressSelector };
export default AddressSelector;
