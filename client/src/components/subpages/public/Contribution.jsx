import { useState, useEffect, useCallback, useRef } from "react";
import StyledButton from "@/components/buttons/StyledButton";
import usePrompt from "@/hooks/usePrompt";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { useNavigate } from "react-router-dom";
import useAddressLogic from "@/hooks/useAddressLogic";
import axiosClient from "@/lib/axiosClient";
import Toast from "@/features/Toast";

import {
  StyledInput,
  LabeledInput,
  StyledSelect,
  StyledRadioSelector,
  StyledFileInput,
} from "@/features/Utilities";

// Enhanced TypedDropdown component for address selection
function TypedDropdown({
  placeholder,
  options,
  selectedItem,
  onChange,
  disabled = false,
  isLoading = false,
  error = null,
  filterFunction = null,
  onInputChange = null,
  showSuggestions = true,
  maxSuggestions = 8
}) {
  const [inputText, setInputText] = useState(selectedItem?.name || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputText(selectedItem?.name || '');
  }, [selectedItem]);

  useEffect(() => {
    if (filterFunction && typeof filterFunction === 'function') {
      const filtered = filterFunction(inputText);
      setFilteredOptions(filtered.slice(0, maxSuggestions));
    } else {
      const filtered = options.filter((o) =>
        o.name.toLowerCase().includes(inputText.toLowerCase())
      );
      setFilteredOptions(filtered.slice(0, maxSuggestions));
    }
  }, [options, inputText, filterFunction, maxSuggestions]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputText(value);

    if (!disabled) {
      setShowDropdown(true);
      if (onInputChange) {
        onInputChange(value);
      }
      if (selectedItem && value !== selectedItem.name) {
        onChange(null);
      }
    }
  };

  const handleSelect = (item) => {
    setInputText(item.name);
    onChange(item);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange(null);
    setInputText('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Escape':
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions.length > 0 && showDropdown) {
          handleSelect(filteredOptions[0]);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!showDropdown) {
          setShowDropdown(true);
        }
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={`flex border rounded-full px-4 py-1 transition-colors ${disabled
          ? 'bg-gray-100 cursor-not-allowed border-gray-300'
          : error
            ? 'bg-white border-red-500 focus-within:ring-2 focus-within:ring-gray-300'
            : 'bg-white border-black focus-within:ring-2 focus-within:ring-gray-300'
          }`}
        style={{ boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)" }}
      >
        <input
          ref={inputRef}
          className="outline-none flex-grow placeholder-gray-400 text-md bg-transparent"
          placeholder={disabled ? 'Please select previous field first' : placeholder}
          value={inputText}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={() => !disabled && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {isLoading && (
          <div className="ml-2 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#524433]"></div>
          </div>
        )}

        {selectedItem && !disabled && !isLoading && (
          <button
            type="button"
            className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
            onClick={handleClear}
            title="Clear selection"
          >
            ×
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {showDropdown && !disabled && showSuggestions && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-300 shadow-lg rounded-md">
          {isLoading ? (
            <div className="px-3 py-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#524433] mx-auto mb-2"></div>
              Loading...
            </div>
          ) : filteredOptions.length > 0 ? (
            <>
              {filteredOptions.map((option, index) => (
                <div
                  key={option.code}
                  className={`px-3 py-2 cursor-pointer transition-colors hover:bg-gray-100 ${index === 0 ? 'bg-gray-50' : ''
                    }`}
                  onClick={() => handleSelect(option)}
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
              <div className="mb-2">No results found for "{inputText}"</div>
              <div className="text-xs">Try typing a different name or check spelling</div>
            </div>
          ) : (
            <div className="px-3 py-4 text-center text-gray-500">
              Start typing to search...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const Notice = () => {
  return (
    <div className="w-[35rem] h-fit flex flex-col justify-center gap-y-5">
      <span className="text-6xl font-hina font-extralight">NOTICE</span>
      <span className="text-xl font-hind font-medium text-justify ">
        &nbsp; &nbsp; &nbsp; &nbsp; In addition to preserving your historic
        objects it is important to remember to preserve the history or story
        that goes with them. For example, the uniform worn by your great grand
        father is just a uniform if the story is lost. Take the time to write
        down the story that goes with your objects; include any background
        details that would help our team understand the significance of the
        item.
      </span>
      <span className="text-2xl font-hina font-ligt text-right">
        "The Story Matters as Much as the Artifact"
      </span>
    </div>
  );
};

const Person = ({
  value,
  onChange,
  errors,
  validateField,
  provinces,
  cities,
  barangays,
  selectedProvince,
  setSelectedProvince,
  selectedCity,
  setSelectedCity,
  selectedBarangay,
  setSelectedBarangay,
  getFilteredProvinces,
  getFilteredCities,
  getFilteredBarangays,
  isLoadingProvinces,
  isLoadingCities,
  isLoadingBarangays,
  provincesError,
  citiesError,
  barangaysError
}) => {
  const handleChange = (field) => (e) => {
    onChange({ ...value, [field]: e.target.value });
  };

  const handleBlur = (field) => () => {
    validateField("person", field, value[field]);
  };

  return (
    <div className="w-[50rem] h-fit flex flex-col justify-center gap-y-5">
      <div className="w-full h-fit pb-4 border-b">
        <span className="text-5xl font-hina font-extralight">
          Tell us about yourself.
        </span>
      </div>

      {/* First Row: Name, Age, Phone, LastName, Sex, Email */}
      <div className="w-full h-fit flex justify-between">
        <div className="w-[33rem] flex flex-col h-fit gap-y-5">
          {/* First Name - Uses LabeledInput */}
          <LabeledInput
            placeholder="Francisco"
            label="First Name"
            value={value.firstName}
            onChange={handleChange("firstName")}
            onBlur={handleBlur("firstName")}
            error={errors.firstName}
            width="w-80"
            isRequired={true}
          />
          <LabeledInput
            label="Age"
            value={value.age}
            onChange={handleChange("age")}
            onBlur={handleBlur("age")}
            error={errors.age}
            isRequired={true}
          />
          <LabeledInput
            label="Phone Number"
            value={value.phone}
            onChange={handleChange("phone")}
            onBlur={handleBlur("phone")}
            error={errors.phone}
            isRequired={true}
          />
        </div>

        <div className="w-[24rem] pl-5 h-fit gap-y-5 flex flex-col items-end">
          <div className="w-80">
            {/* Last Name - Uses StyledInput directly as per original layout */}
            <StyledInput
              placeholder="Turko" // Keep original placeholder if any
              value={value.lastName}
              onChange={handleChange("lastName")}
              onBlur={handleBlur("lastName")}
              error={errors.lastName}
            />
          </div>
          <div className="flex w-full items-center justify-between">
            {/* Sex - Uses StyledSelect with a separate label span as per original layout */}
            <span className="text-xs font-medium">
              Sex<span className="text-red-500 ml-1">*</span>
            </span>{" "}
            {/* Add asterisk directly here for the span label */}
            <div className="w-60">
              <StyledSelect
                value={value.sex}
                onChange={(selectedValue) => {
                  onChange({ ...value, sex: selectedValue });
                  validateField("person", "sex", selectedValue);
                }}
                onBlur={() => validateField("person", "sex", value.sex)}
                error={errors.sex}
                placeholder="Select sex"
                options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                  { label: "Other", value: "other" },
                ]}
              />
            </div>
          </div>

          <LabeledInput
            label="Email"
            value={value.email}
            onChange={handleChange("email")}
            onBlur={handleBlur("email")}
            error={errors.email}
            isRequired={true}
          />
        </div>
      </div>

      {/* Middle Row: Single full-width organization input */}
      <LabeledInput
        label="Organization" // Changed label to Organization
        value={value.organization} // Uses organization data field
        onChange={handleChange("organization")}
        onBlur={handleBlur("organization")}
        error={errors.organization}
        width="w-[41.25rem]"
        isRequired={true} // Explicitly mark as required
      />

      {/* Address Section with TypedDropdown */}
      <div className="w-full h-fit flex justify-between">
        <div className="w-[33rem] flex flex-col h-fit gap-y-5">
          <div className="flex w-full items-center justify-between">
            <span className="text-md font-medium">
              Province<span className="text-red-500 ml-1">*</span>
            </span>
            <div className="w-60">
              <TypedDropdown
                placeholder="Type to search..."
                options={provinces}
                selectedItem={selectedProvince}
                onChange={setSelectedProvince}
                isLoading={isLoadingProvinces}
                error={errors.province}
                filterFunction={getFilteredProvinces}
                maxSuggestions={10}
              />
            </div>
          </div>

          <div className="flex w-full items-center justify-between">
            <span className="text-md font-medium">
              Barangay<span className="text-red-500 ml-1">*</span>
            </span>
            <div className="w-60">
              <TypedDropdown
                placeholder={selectedCity ? "Type to search..." : "Select city first"}
                options={barangays}
                selectedItem={selectedBarangay}
                onChange={setSelectedBarangay}
                disabled={!selectedCity}
                isLoading={isLoadingBarangays}
                error={errors.barangay}
                filterFunction={getFilteredBarangays}
                maxSuggestions={12}
              />
            </div>
          </div>
        </div>

        <div className="w-[24rem] pl-5 h-fit gap-y-5 flex flex-col items-end">
          <div className="flex w-full items-center justify-between">
            <span className="text-md font-medium">
              City/Municipality<span className="text-red-500 ml-1">*</span>
            </span>
            <div className="w-60">
              <TypedDropdown
                placeholder={selectedProvince ? "Type to search..." : "Select province first"}
                options={cities}
                selectedItem={selectedCity}
                onChange={setSelectedCity}
                disabled={!selectedProvince}
                isLoading={isLoadingCities}
                error={errors.city}
                filterFunction={getFilteredCities}
                maxSuggestions={10}
              />
            </div>
          </div>

          <div className="flex w-full items-center justify-between">
            <span className="text-md font-medium">
              Street
            </span>
            <div className="w-60">
              <StyledInput
                placeholder="House number, street name, etc."
                value={value.street}
                onChange={handleChange("street")}
                onBlur={handleBlur("street")}
                error={errors.street}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Type = ({ value, onChange, errors, validateField }) => {
  const handleOptionChange = (e) => {
    onChange(e.target.value);
    validateField("type", "type", e.target.value);
  };

  return (
    <div className="w-[30rem] h-fit flex flex-col justify-center gap-y-3">
      <div className="w-full h-fit pb-4 border-b flex justify-between">
        <span className="text-5xl font-hina font-extralight">
          Contribution type.
        </span>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#000000"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="cursor-pointer"
        >
          <path d="M12 9h.01" />
          <path d="M11 12h1v4h1" />
          <path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9 -9 9s-9 -1.8 -9 -9s1.8 -9 9 -9z" />
        </svg>
      </div>

      <span className="text-md font-hind">
        Choose between the two types of arrangement.
      </span>

      <div className="mx-auto flex">
        <StyledRadioSelector
          selectedOption={value}
          onChange={handleOptionChange}
          onBlur={() => validateField("type", "type", value)}
          error={errors.type}
          name="contributionType"
          options={[
            { label: "Lending", value: "lending" },
            { label: "Donation", value: "donation" },
          ]}
          isRequired={true}
        />
        <span className="text-red-500 ml-1">*</span>
      </div>
    </div>
  );
};

const LendDetails = ({ value, onChange, errors, validateField }) => {
  const handleChange = (field) => (e) => {
    onChange({ ...value, [field]: e.target.value });
  };

  const handleBlur = (field) => () => {
    validateField("lendDetails", field, value[field]);
  };

  return (
    <div className="w-[50rem] h-fit flex flex-col justify-center gap-y-3">
      <div className="w-full h-fit pb-4 border-b">
        <span className="text-5xl font-hina font-extralight">
          Lending Details.
        </span>
      </div>

      <LabeledInput
        width="w-180"
        style="2"
        label="Proposed Duration of the loan"
        value={value.duration}
        onChange={handleChange("duration")}
        onBlur={handleBlur("duration")}
        error={errors.duration}
        isRequired={true}
      />
      <LabeledInput
        width="w-180"
        style="2"
        label="Specific conditions or requirements for display or handling of the artifact?"
        value={value.displayHandlingCondition}
        onChange={handleChange("displayHandlingCondition")}
        onBlur={handleBlur("displayHandlingCondition")}
        error={errors.displayHandlingCondition}
        isRequired={true}
      />

      <LabeledInput
        width="w-180"
        style="2"
        label="Specific liability concerns or requirements you have regarding the artifact?"
        value={value.liabilityConcerns}
        onChange={handleChange("liabilityConcerns")}
        onBlur={handleBlur("liabilityConcerns")}
        error={errors.liabilityConcerns}
        isRequired={true}
      />
      <LabeledInput
        width="w-180"
        style="2"
        label="Reason for lending."
        value={value.lendingReason}
        onChange={handleChange("lendingReason")}
        onBlur={handleBlur("lendingReason")}
        error={errors.lendingReason}
        isRequired={true}
      />
    </div>
  );
};

const ArtifactDetails = ({ value, onChange, errors, validateField }) => {
  const handleChange = (field) => (e) => {
    onChange({ ...value, [field]: e.target.value });
  };

  const handleBlur = (field) => () => {
    validateField("artifactDetails", field, value[field]);
  };

  return (
    <div className="w-[50rem] h-fit flex flex-col justify-center gap-y-3">
      <div className="w-full h-fit pb-4 border-b">
        <span className="text-5xl font-hina font-extralight">
          About the artifact.
        </span>
      </div>

      <LabeledInput
        width="w-180"
        style="2"
        label="Title/Name of the artifact."
        value={value.title}
        onChange={handleChange("title")}
        onBlur={handleBlur("title")}
        error={errors.title}
        isRequired={true}
      />
      <LabeledInput
        width="w-180"
        style="2"
        label="Artifact description"
        value={value.description}
        onChange={handleChange("description")}
        onBlur={handleBlur("description")}
        error={errors.description}
        isRequired={true}
      />

      <LabeledInput
        width="w-180"
        style="2"
        label="How and where did you acquire the artifact."
        value={value.acquisition}
        onChange={handleChange("acquisition")}
        onBlur={handleBlur("acquisition")}
        error={errors.acquisition}
        isRequired={true}
      />
      <LabeledInput
        width="w-180"
        style="2"
        label="Is there any other information about the artifact that the museum should know? (Optional)"
        value={value.otherInfo}
        onChange={handleChange("otherInfo")}
        onBlur={handleBlur("otherInfo")}
        error={errors.otherInfo}
        isRequired={false}
      />
      <LabeledInput
        width="w-180"
        style="2"
        label="Would you like to provide a brief narrative or story related to the artifact? (Optional)"
        value={value.moreInfo}
        onChange={handleChange("moreInfo")}
        onBlur={handleBlur("moreInfo")}
        error={errors.moreInfo}
        isRequired={false}
      />
    </div>
  );
};

const ArtifactFiles = ({ value, onChange, errors, validateField }) => {
  const getUrlValue = (field) => value[field] || "";

  const getFileCount = (field) => value.uploadedFiles?.[field]?.length || 0;

  const handleFileUpdate = (field) => (files) => {
    const updatedArtifactFiles = {
      ...value,
      uploadedFiles: {
        ...(value.uploadedFiles || {}),
        [field]: files,
      },
    };

    onChange(updatedArtifactFiles);

    validateField("artifactFiles", field, updatedArtifactFiles);
  };

  const handleChange = (field) => (e) => {
    const newUrlValue = e.target.value;
    const updatedArtifactFiles = {
      ...value,
      [field]: newUrlValue,
    };

    onChange(updatedArtifactFiles);

    validateField("artifactFiles", field, updatedArtifactFiles);
  };

  const handleBlur = (field) => () => {
    validateField("artifactFiles", field, value);
  };

  return (
    <div className="w-[50rem] h-fit flex flex-col justify-center items-end gap-y-4">
      <div className="w-full h-fit pb-4 border-b">
        <span className="text-5xl font-hina font-extralight">
          Attach Files
        </span>
      </div>

      {/* Image Section */}
      <LabeledInput
        width="w-180"
        style="2"
        label="Image URL (Optional)"
        value={getUrlValue("image")}
        onChange={handleChange("image")}
        onBlur={handleBlur("image")}
        placeholder="Paste URL"
        isRequired={false}
      />
      <div className="w-180 h-fit">
        <StyledFileInput
          onFilesSelected={handleFileUpdate("image")}
          accept=".jpg,.png,.pdf"
          multiple={true}
          label="Drag or Choose Image Files"
          initialFiles={value.uploadedFiles?.image || []}
          error={errors.imageFile}
          isRequired={false}
        />
      </div>

      {/* Docs Section */}
      <LabeledInput
        width="w-180"
        style="2"
        label="Document URL (Optional)"
        value={getUrlValue("docs")}
        onChange={handleChange("docs")}
        onBlur={handleBlur("docs")}
        placeholder="Paste URL"
        isRequired={false}
      />
      <div className="w-180 h-fit">
        <StyledFileInput
          onFilesSelected={handleFileUpdate("docs")}
          accept=".pdf,.doc,.docx"
          multiple={true}
          label="Drag or Choose Document Files"
          initialFiles={value.uploadedFiles?.docs || []}
          error={errors.docsFile}
          isRequired={false}
        />
      </div>

      {/* Related Images Section */}
      <LabeledInput
        width="w-180"
        style="2"
        label="Related Images URL (Optional)"
        value={getUrlValue("relatedImages")}
        onChange={handleChange("relatedImages")}
        onBlur={handleBlur("relatedImages")}
        placeholder="Paste URL"
        isRequired={false}
      />
      <div className="w-180 h-fit">
        <StyledFileInput
          onFilesSelected={handleFileUpdate("relatedImages")}
          accept=".jpg,.png"
          multiple={true}
          label="Drag or Choose Related Image Files"
          initialFiles={value.uploadedFiles?.relatedImages || []}
          error={errors.relatedImagesFile}
          isRequired={false}
        />
      </div>
    </div>
  );
};

const Contribution = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  // Address logic hook
  const {
    provinces,
    cities,
    barangays,
    selectedProvince,
    setSelectedProvince,
    selectedCity,
    setSelectedCity,
    selectedBarangay,
    setSelectedBarangay,
    getFilteredProvinces,
    getFilteredCities,
    getFilteredBarangays,
    isLoadingProvinces,
    isLoadingCities,
    isLoadingBarangays,
    provincesError,
    citiesError,
    barangaysError
  } = useAddressLogic();

  const initialFormData = {
    person: {
      firstName: "",
      lastName: "",
      age: "",
      phone: "",
      sex: "",
      email: "",
      organization: "",
      street: "",
    },
    type: "",
    lendDetails: {
      duration: "",
      displayHandlingCondition: "",
      liabilityConcerns: "",
      lendingReason: "",
    },
    artifactDetails: {
      title: "",
      description: "",
      acquisition: "",
      otherInfo: "",
      moreInfo: "",
    },
    artifactFiles: {
      image: "",
      docs: "",
      relatedImages: "",
      uploadedFiles: { image: [], docs: [], relatedImages: [] },
    },
  };

  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Toast state
  const [toastConfig, setToastConfig] = useState({
    message: '',
    type: 'success'
  });

  // Toast functions
  const showToast = useCallback((message, type = 'success') => {
    setToastConfig({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToastConfig(prev => ({ ...prev, message: '' }));
  }, []);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData) ||
    selectedProvince || selectedCity || selectedBarangay;
  const { PromptModal } = usePrompt(
    "You have unsaved changes. Are you sure you want to leave?",
    isDirty,
    "light"
  );

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(09|\+639)\d{9}$/;

  const validateArtifactFiles = useCallback((artifactFilesData) => {
    const errors = {};

    const isFieldValid = (urlField, filesField) => {
      const urlValue = artifactFilesData[urlField] ? artifactFilesData[urlField].trim() : "";
      const filesPresent = (artifactFilesData.uploadedFiles?.[filesField]?.length || 0) > 0;
      return urlValue !== "" || filesPresent;
    };

    if (!isFieldValid("image", "image")) {
      errors.imageFile = true;
    } else {
      delete errors.imageFile;
    }

    if (!isFieldValid("docs", "docs")) {
      errors.docsFile = true;
    } else {
      delete errors.docsFile;
    }

    if (!isFieldValid("relatedImages", "relatedImages")) {
      errors.relatedImagesFile = true;
    } else {
      delete errors.relatedImagesFile;
    }

    return errors;
  }, []);

  const validateField = useCallback(
    (section, fieldName, valueToValidate) => {
      setFormErrors((prev) => {
        const errors = { ...prev };

        switch (section) {
          case "person":
            const personValue = valueToValidate != null ? String(valueToValidate) : "";
            let isPersonFieldInvalid = false;

            if ([
              "firstName", "lastName", "organization", "street"
            ].includes(fieldName) && !personValue.trim()) {
              isPersonFieldInvalid = true;
            } else if (fieldName === "age" &&
              (!personValue || isNaN(personValue) || parseInt(personValue) <= 0)) {
              isPersonFieldInvalid = true;
            } else if (fieldName === "phone" && (!personValue || !phoneRegex.test(personValue))) {
              isPersonFieldInvalid = true;
            } else if (fieldName === "sex" && !personValue) {
              isPersonFieldInvalid = true;
            } else if (fieldName === "email" && (!personValue || !emailRegex.test(personValue))) {
              isPersonFieldInvalid = true;
            } else if (fieldName === "province" && !selectedProvince) {
              isPersonFieldInvalid = true;
            } else if (fieldName === "city" && !selectedCity) {
              isPersonFieldInvalid = true;
            } else if (fieldName === "barangay" && !selectedBarangay) {
              isPersonFieldInvalid = true;
            }

            if (isPersonFieldInvalid) {
              errors[fieldName] = true;
            } else {
              delete errors[fieldName];
            }
            break;

          case "type":
            if (fieldName === "type" && !valueToValidate) {
              errors.type = true;
            } else {
              delete errors.type;
            }
            break;

          case "lendDetails":
            if (formData.type === "lending") {
              const lendValue = valueToValidate != null ? String(valueToValidate) : "";
              let isLendFieldInvalid = false;

              if (
                (fieldName === "duration" && !lendValue.trim()) ||
                (fieldName === "displayHandlingCondition" && !lendValue.trim()) ||
                (fieldName === "liabilityConcerns" && !lendValue.trim()) ||
                (fieldName === "lendingReason" && !lendValue.trim())
              ) {
                isLendFieldInvalid = true;
              }

              if (isLendFieldInvalid) {
                errors[fieldName] = true;
              } else {
                delete errors[fieldName];
              }
            } else {
              delete errors.duration;
              delete errors.displayHandlingCondition;
              delete errors.liabilityConcerns;
              delete errors.lendingReason;
            }
            break;

          case "artifactDetails":
            const artifactValue = valueToValidate != null ? String(valueToValidate) : "";
            let isArtifactFieldInvalid = false;

            if (
              (fieldName === "title" && !artifactValue.trim()) ||
              (fieldName === "description" && !artifactValue.trim()) ||
              (fieldName === "acquisition" && !artifactValue.trim())
            ) {
              isArtifactFieldInvalid = true;
            }

            if (isArtifactFieldInvalid) {
              errors[fieldName] = true;
            } else {
              delete errors[fieldName];
            }
            if (fieldName === "otherInfo" || fieldName === "moreInfo") {
              delete errors[fieldName];
            }
            break;

          case "artifactFiles":
            const artifactFileErrors = validateArtifactFiles(valueToValidate);

            const fileErrorFields = ["imageFile", "docsFile", "relatedImagesFile"];
            fileErrorFields.forEach(field => {
              if (artifactFileErrors[field]) {
                errors[field] = true;
              } else {
                delete errors[field];
              }
            });
            break;

          default:
            break;
        }
        return errors;
      });
    },
    [formData.type, validateArtifactFiles, emailRegex, phoneRegex, selectedProvince, selectedCity, selectedBarangay]
  );

  const validateCurrentStep = useCallback(() => {
    let currentStepErrors = {};
    let hasErrors = false;

    if (step === 1) {
      const personFields = [
        "firstName",
        "lastName",
        "age",
        "phone",
        "sex",
        "email",
        "organization",
        "street",
      ];
      personFields.forEach((field) => {
        const valueToCheck = formData.person[field] != null ? String(formData.person[field]) : "";
        let isFieldInvalid = false;
        if (field === "email" && (!valueToCheck || !emailRegex.test(valueToCheck))) {
          isFieldInvalid = true;
        } else if (field === "phone" && (!valueToCheck || !phoneRegex.test(valueToCheck))) {
          isFieldInvalid = true;
        } else if (
          field === "age" &&
          (!valueToCheck || isNaN(valueToCheck) || parseInt(valueToCheck) <= 0)
        ) {
          isFieldInvalid = true;
        } else if (valueToCheck.trim() === "") {
          isFieldInvalid = true;
        }

        if (isFieldInvalid) {
          currentStepErrors[field] = true;
          hasErrors = true;
        }
      });

      if (!selectedProvince) {
        currentStepErrors.province = true;
        hasErrors = true;
      }
      if (!selectedCity) {
        currentStepErrors.city = true;
        hasErrors = true;
      }
      if (!selectedBarangay) {
        currentStepErrors.barangay = true;
        hasErrors = true;
      }
    } else if (step === 2) {
      if (!formData.type) {
        currentStepErrors.type = true;
        hasErrors = true;
      }
    } else if (step === 3 && formData.type === "lending") {
      const lendFields = [
        "duration",
        "displayHandlingCondition",
        "liabilityConcerns",
        "lendingReason",
      ];
      lendFields.forEach((field) => {
        const valueToCheck = formData.lendDetails[field] != null ? String(formData.lendDetails[field]) : "";
        if (valueToCheck.trim() === "") {
          currentStepErrors[field] = true;
          hasErrors = true;
        }
      });
    } else if (
      (step === 3 && formData.type !== "lending") ||
      (step === 4 && formData.type === "lending")
    ) {
      const artifactDetailFields = ["title", "description", "acquisition"];
      artifactDetailFields.forEach((field) => {
        const valueToCheck = formData.artifactDetails[field] != null ? String(formData.artifactDetails[field]) : "";
        if (valueToCheck.trim() === "") {
          currentStepErrors[field] = true;
          hasErrors = true;
        }
      });
    } else if (
      (step === 4 && formData.type !== "lending") ||
      (step === 5 && formData.type === "lending")
    ) {
      const artifactFileErrors = validateArtifactFiles(formData.artifactFiles);
      if (Object.keys(artifactFileErrors).length > 0) {
        currentStepErrors = { ...currentStepErrors, ...artifactFileErrors };
        hasErrors = true;
      }
    }

    setFormErrors((prev) => ({ ...prev, ...currentStepErrors }));
    return !hasErrors;
  }, [step, formData, validateArtifactFiles, emailRegex, phoneRegex, selectedProvince, selectedCity, selectedBarangay]);

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    if (validateCurrentStep()) {
      setShowSubmitConfirm(true);
    }
  };

  const confirmSubmit = async () => {
    try {
      // First, upload all files if any exist
      const uploadedFileNames = {
        image: [],
        docs: [],
        relatedImages: []
      };

      // Helper function to upload files
      const uploadFiles = async (files) => {
        if (!files || files.length === 0) return [];

        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });

        try {
          const response = await axiosClient.post('/auth/contribution/files', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return response.data.files || [];
        } catch (error) {
          console.error('Error uploading files:', error);
          throw error;
        }
      };

      // Upload each type of file if they exist
      if (formData.artifactFiles.uploadedFiles?.image?.length > 0) {
        console.log('Uploading image files...');
        uploadedFileNames.image = await uploadFiles(formData.artifactFiles.uploadedFiles.image);
      }

      if (formData.artifactFiles.uploadedFiles?.docs?.length > 0) {
        console.log('Uploading document files...');
        uploadedFileNames.docs = await uploadFiles(formData.artifactFiles.uploadedFiles.docs);
      }

      if (formData.artifactFiles.uploadedFiles?.relatedImages?.length > 0) {
        console.log('Uploading related image files...');
        uploadedFileNames.relatedImages = await uploadFiles(formData.artifactFiles.uploadedFiles.relatedImages);
      }

      // Now submit the contribution data with the uploaded filenames
      const submissionData = {
        firstName: formData.person.firstName,
        lastName: formData.person.lastName,
        age: formData.person.age,
        phone: formData.person.phone,
        sex: formData.person.sex,
        email: formData.person.email,
        organization: formData.person.organization,
        province: selectedProvince?.name || '',
        city: selectedCity?.name || '',
        barangay: selectedBarangay?.name || '',
        street: formData.person.street,
        contributionType: formData.type,
        ...(formData.type === 'lending' && {
          duration: formData.lendDetails.duration,
          displayHandlingCondition: formData.lendDetails.displayHandlingCondition,
          liabilityConcerns: formData.lendDetails.liabilityConcerns,
          lendingReason: formData.lendDetails.lendingReason,
        }),
        title: formData.artifactDetails.title,
        description: formData.artifactDetails.description,
        acquisition: formData.artifactDetails.acquisition,
        otherInfo: formData.artifactDetails.otherInfo,
        moreInfo: formData.artifactDetails.moreInfo,
        imageFiles: uploadedFileNames.image,
        documentFiles: uploadedFileNames.docs,
        relatedImageFiles: uploadedFileNames.relatedImages,
        imageUrls: formData.artifactFiles.image || '',
        documentUrls: formData.artifactFiles.docs || '',
        relatedImageUrls: formData.artifactFiles.relatedImages || '',
      };

      console.log("Submitting contribution data:", submissionData);

      const response = await axiosClient.post('/auth/contribution', submissionData);

      console.log("Contribution submitted successfully:", response.data);
      showToast('Contribution submitted successfully!', 'success');
      setShowSubmitConfirm(false);
      resetForm();
      setSelectedProvince(null);
      setSelectedCity(null);
      setSelectedBarangay(null);
      setStep(0);
    } catch (error) {
      console.error("Network error submitting contribution:", error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Error submitting contribution: ${errorMessage}`, 'error');
    }
  };

  const cancelSubmit = () => setShowSubmitConfirm(false);

  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
  };

  const clearInputs = () => {
    isDirty ? setShowClearConfirm(true) : resetForm();
  };

  const confirmClear = () => {
    resetForm();
    setShowClearConfirm(false);
  };

  const cancelClear = () => setShowClearConfirm(false);

  const steps = [
    {
      name: "notice",
      component: <Notice />,
    },
    {
      name: "person",
      component: (
        <Person
          value={formData.person}
          onChange={(val) => setFormData((prev) => ({ ...prev, person: val }))}
          errors={formErrors}
          validateField={validateField}
          provinces={provinces}
          cities={cities}
          barangays={barangays}
          selectedProvince={selectedProvince}
          setSelectedProvince={setSelectedProvince}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          selectedBarangay={selectedBarangay}
          setSelectedBarangay={setSelectedBarangay}
          getFilteredProvinces={getFilteredProvinces}
          getFilteredCities={getFilteredCities}
          getFilteredBarangays={getFilteredBarangays}
          isLoadingProvinces={isLoadingProvinces}
          isLoadingCities={isLoadingCities}
          isLoadingBarangays={isLoadingBarangays}
          provincesError={provincesError}
          citiesError={citiesError}
          barangaysError={barangaysError}
        />
      ),
    },
    {
      name: "type",
      component: (
        <Type
          value={formData.type}
          onChange={(val) => setFormData((prev) => ({ ...prev, type: val }))}
          errors={formErrors}
          validateField={validateField}
        />
      ),
    },
    ...(formData.type === "lending"
      ? [
        {
          name: "lendDetails",
          component: (
            <LendDetails
              value={formData.lendDetails}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, lendDetails: val }))
              }
              errors={formErrors}
              validateField={validateField}
            />
          ),
        },
      ]
      : []),
    {
      name: "artifactDetails",
      component: (
        <ArtifactDetails
          value={formData.artifactDetails}
          onChange={(val) =>
            setFormData((prev) => ({ ...prev, artifactDetails: val }))
          }
          errors={formErrors}
          validateField={validateField}
        />
      ),
    },
    {
      name: "artifactFiles",
      component: (
        <ArtifactFiles
          value={formData.artifactFiles}
          onChange={(val) =>
            setFormData((prev) => ({ ...prev, artifactFiles: val }))
          }
          errors={formErrors}
          validateField={validateField}
        />
      ),
    },
  ];

  const isLastStep = step === steps.length - 1;
  const isNoticeStep = step === 0;

  return (
    <>
      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={cancelClear}
        onConfirm={confirmClear}
        title="Clear Form?"
        message="You have unsaved changes. Are you sure you want to clear the form?"
        type="question"
        theme="light"
      />
      <ConfirmationModal
        isOpen={showSubmitConfirm}
        onClose={cancelSubmit}
        onConfirm={confirmSubmit}
        title="Confirm Submission?"
        message="Are you sure you want to submit this contribution?"
        type="question"
        theme="light"
      />
      {PromptModal}
      <Toast
        type={toastConfig.type}
        message={toastConfig.message}
        onClose={hideToast}
      />
      <div className="w-screen min-w-fit items-center justify-center min-h-screen flex flex-col">
        <div className="min-w-[30rem] w-fit h-fit flex gap-y-5 flex-col">
          <div className="min-w-[30rem] p-10 min-h-[15rem] bg-white rounded-lg shadow-md shadow-gray-400 flex flex-col items-center justify-center">
            {steps[step].component}
          </div>
          <div className="flex justify-between">
            {isNoticeStep ? (
              <StyledButton
                onClick={() => {
                  navigate(-1);
                }}
                buttonColor="bg-black"
                hoverColor="hover:bg-gray-900"
                textColor="text-white"
              >
                Return
              </StyledButton>
            ) : (
              <StyledButton
                onClick={handlePrevious}
                buttonColor="bg-black"
                hoverColor="hover:bg-gray-900"
                textColor="text-white"
                disabled={step === 0}
              >
                Previous
              </StyledButton>
            )}
            <div className="flex gap-x-3">
              {isNoticeStep ? (
                <div className="h-full w-fit flex items-center">
                  <span className="text-xl font-semibold ">Proceed to the form.</span>
                </div>
              ) : null}
              {isDirty && !isNoticeStep && (
                <StyledButton
                  onClick={clearInputs}
                  buttonColor="bg-gray-600"
                  hoverColor="hover:bg-gray-700"
                  textColor="text-white"
                >
                  Clear Inputs
                </StyledButton>
              )}

              {isLastStep ? (
                <StyledButton
                  onClick={handleSubmit}
                  buttonColor="bg-green-700"
                  hoverColor="hover:bg-green-800"
                  textColor="text-white"
                >
                  Submit
                </StyledButton>
              ) : (
                <StyledButton
                  onClick={handleNext}
                  buttonColor="bg-black"
                  hoverColor="hover:bg-gray-900"
                  textColor="text-white"
                >
                  {isNoticeStep ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 12l-10 0" />
                      <path d="M20 12l-4 4" />
                      <path d="M20 12l-4 -4" />
                      <path d="M4 4l0 16" />
                    </svg>
                  ) : (
                    "Next"
                  )}
                </StyledButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contribution;
