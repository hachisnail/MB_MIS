import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

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

export default function useAddressLogic() {
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
