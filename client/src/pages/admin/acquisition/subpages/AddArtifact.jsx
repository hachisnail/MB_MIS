import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Toast from '@/features/Toast';
import usePrompt from '@/hooks/usePrompt';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import axiosClient from '@/lib/axiosClient';
import {
  FormInput,
  DropdownInput,
  ContactNumberInput,
  EmailInput,
  FileInput,
} from '@/features/FormUtilities';
import { TypedDropdown, useAddressLogic } from '@/features/AddressDropdownSystem';

const initialFormData = {
  // Donor details
  firstName: '',
  lastName: '',
  birthDate: null,
  sex: '',
  email: '',
  contact: '',
  organization: '',
  // Address
  street: '',
  barangay: '',
  city: '',
  province: '',
  // Type
  type: '', // donation | lending
  lendingReason: '',
  lendDuration: { from: null, to: null },
  lendConditions: '',
  lendLiabilities: '',
  // Artifact details
  artifactTitle: '',
  artifactDescription: '',
  narrative: '',
  acquisitionDetails: '',
  additionalInfo: '',
  // Files
  artifactImages: { files: [], url: '' },
  artifactRelatedImages: { files: [], url: '' },
  artifactDocuments: { files: [], url: '' },
};

// Validation schemas for each page
const page1Schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  contact: yup.string().matches(/^(09|\+639)\d{9}$/, 'Please enter a valid phone number').nullable(),
  organization: yup.string().nullable(),
  street: yup.string().nullable(),
  province: yup.string().required('Province is required'),
  city: yup.string().required('City is required'),
  barangay: yup.string().required('Barangay is required'),
  type: yup.string().required('Contribution type is required'),
  lendingReason: yup.string().when('type', {
    is: 'lending',
    then: (schema) => schema.required('Lending reason is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  lendDuration: yup.object().when('type', {
    is: 'lending',
    then: (schema) => schema.shape({
      from: yup.date().required('Start date is required').nullable(),
      to: yup.date()
        .required('End date is required')
        .nullable()
        .test('is-after-from', 'End date must be after start date', function (value) {
          const { from } = this.parent;
          if (!from || !value) return true;
          return new Date(value) > new Date(from);
        }),
    }),
    otherwise: (schema) => schema.nullable(),
  }),
  lendConditions: yup.string().nullable(),
  lendLiabilities: yup.string().nullable(),
});

const page2Schema = yup.object({
  artifactTitle: yup.string().required('Artifact title is required'),
  artifactDescription: yup.string().nullable(),
  narrative: yup.string().nullable(),
  acquisitionDetails: yup.string().nullable(),
  additionalInfo: yup.string().nullable(),
});

const page3Schema = yup.object({
  artifactImages: yup.mixed().nullable(),
  artifactRelatedImages: yup.mixed().nullable(),
  artifactDocuments: yup.mixed().nullable(),
});

const SectionTitle = ({ children }) => (
  <h2 className="text-3xl font-semibold text-gray-900 mb-4">{children}</h2>
);

// Custom DateInput component using React Calendar
const ReactCalendarInput = ({ control, name, error = "", className = "", minDate, maxDate, placeholder = "Select date" }) => {
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = field.value;
        const displayValue = value ? value.toLocaleDateString() : "";

        return (
          <div className={`relative ${className}`}>
            <input
              type="text"
              value={displayValue}
              readOnly
              onClick={() => setShowCalendar(!showCalendar)}
              placeholder={placeholder}
              className={`border rounded-2xl px-2 py-3 text-xl w-full cursor-pointer ${error ? "border-red-600" : "border-black"
                } focus:outline-none`}
              style={{
                boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
              }}
            />

            <span className="text-red-600 text-md h-6 pl-2 block">
              {error?.message || ""}
            </span>

            {showCalendar && (
              <div className="absolute z-50 top-12 bg-white border rounded-2xl shadow-lg p-2">
                <Calendar
                  onChange={(date) => {
                    field.onChange(date);
                    setShowCalendar(false);
                  }}
                  value={value}
                  minDate={minDate}
                  maxDate={maxDate}
                  className="react-calendar-custom"
                />
              </div>
            )}
          </div>
        );
      }}
    />
  );
};

const AddArtifact = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1); // 1, 2, or 3
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastConfig, setToastConfig] = useState({ message: '', type: 'success' });

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

  // React Hook Form setup for each page
  const page1Form = useForm({
    defaultValues: initialFormData,
    resolver: yupResolver(page1Schema),
    mode: 'onTouched'
  });

  const page2Form = useForm({
    defaultValues: initialFormData,
    resolver: yupResolver(page2Schema),
    mode: 'onTouched'
  });

  const page3Form = useForm({
    defaultValues: initialFormData,
    resolver: yupResolver(page3Schema),
    mode: 'onTouched'
  });

  // Get current form data from all forms
  const getCurrentFormData = () => {
    const page1Data = page1Form.getValues();
    const page2Data = page2Form.getValues();
    const page3Data = page3Form.getValues();
    return { ...page1Data, ...page2Data, ...page3Data };
  };

  // State for tracking unsaved changes
  const [isDirty, setIsDirty] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Use the prompt hook to warn about unsaved changes
  const { PromptModal } = usePrompt(
    "You have unsaved changes. Are you sure you want to leave?",
    isDirty && hasUserInteracted,
    "light"
  );

  // Track if user has actually interacted with the form
  const markAsInteracted = useCallback(() => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
  }, [hasUserInteracted]);

  // Check if form has actual changes (not just initialization)
  const checkForRealChanges = useCallback(() => {
    const page1Values = page1Form.getValues();
    const page2Values = page2Form.getValues();
    const page3Values = page3Form.getValues();

    // Check if any field has a non-empty, non-default value
    const hasPage1Changes =
      page1Values.firstName !== '' ||
      page1Values.lastName !== '' ||
      page1Values.email !== '' ||
      page1Values.contact !== '' ||
      page1Values.organization !== '' ||
      page1Values.street !== '' ||
      page1Values.province !== '' ||
      page1Values.city !== '' ||
      page1Values.barangay !== '' ||
      page1Values.type !== '';

    const hasPage2Changes =
      page2Values.artifactTitle !== '' ||
      page2Values.artifactDescription !== '' ||
      page2Values.narrative !== '' ||
      page2Values.acquisitionDetails !== '' ||
      page2Values.additionalInfo !== '';

    const hasPage3Changes =
      (page3Values.artifactImages?.files?.length || 0) > 0 ||
      (page3Values.artifactRelatedImages?.files?.length || 0) > 0 ||
      (page3Values.artifactDocuments?.files?.length || 0) > 0 ||
      page3Values.artifactImages?.url !== '' ||
      page3Values.artifactRelatedImages?.url !== '' ||
      page3Values.artifactDocuments?.url !== '';

    return hasPage1Changes || hasPage2Changes || hasPage3Changes;
  }, [page1Form, page2Form, page3Form]);

  // Watch for form changes in all forms
  useEffect(() => {
    let isFirstRender = true;

    const subscription1 = page1Form.watch((value, { name, type }) => {
      if (isFirstRender) {
        isFirstRender = false;
        return;
      }
      if (type === 'change' && !hasUserInteracted) {
        markAsInteracted();
      }
      if (type === 'change') {
        const hasChanges = checkForRealChanges();
        setIsDirty(hasChanges);
      }
    });

    return () => {
      subscription1.unsubscribe();
    };
  }, [page1Form, hasUserInteracted, checkForRealChanges, markAsInteracted]);

  useEffect(() => {
    let isFirstRender = true;

    const subscription2 = page2Form.watch((value, { name, type }) => {
      if (isFirstRender) {
        isFirstRender = false;
        return;
      }
      if (type === 'change' && !hasUserInteracted) {
        markAsInteracted();
      }
      if (type === 'change') {
        const hasChanges = checkForRealChanges();
        setIsDirty(hasChanges);
      }
    });

    return () => {
      subscription2.unsubscribe();
    };
  }, [page2Form, hasUserInteracted, checkForRealChanges, markAsInteracted]);

  useEffect(() => {
    let isFirstRender = true;

    const subscription3 = page3Form.watch((value, { name, type }) => {
      if (isFirstRender) {
        isFirstRender = false;
        return;
      }
      if (type === 'change' && !hasUserInteracted) {
        markAsInteracted();
      }
      if (type === 'change') {
        const hasChanges = checkForRealChanges();
        setIsDirty(hasChanges);
      }
    });

    return () => {
      subscription3.unsubscribe();
    };
  }, [page3Form, hasUserInteracted, checkForRealChanges, markAsInteracted]);

  const showToast = useCallback((message, type = 'success') => {
    setToastConfig({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToastConfig(prevConfig => ({
      ...prevConfig,
      message: ''
    }));
  }, []);

  // Automatically hide toast after 3 seconds when message changes
  useEffect(() => {
    if (toastConfig.message) {
      const timer = setTimeout(() => {
        setToastConfig(prev => ({ ...prev, message: '' }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastConfig.message]);

  // Handle address changes and sync with form
  const handleProvinceChange = (province) => {
    markAsInteracted();
    setSelectedProvince(province);
    const provinceName = province?.name || '';
    page1Form.setValue('province', provinceName, { shouldValidate: true });
    page1Form.setValue('city', '', { shouldValidate: false });
    page1Form.setValue('barangay', '', { shouldValidate: false });
    setSelectedCity(null);
    setSelectedBarangay(null);

    if (province) {
      page1Form.clearErrors('province');
    }
  };

  const handleCityChange = (city) => {
    markAsInteracted();
    setSelectedCity(city);
    const cityName = city?.name || '';
    page1Form.setValue('city', cityName, { shouldValidate: true });
    page1Form.setValue('barangay', '', { shouldValidate: false });
    setSelectedBarangay(null);

    if (city) {
      page1Form.clearErrors('city');
    }
  };

  const handleBarangayChange = (barangay) => {
    markAsInteracted();
    setSelectedBarangay(barangay);
    const barangayName = barangay?.name || '';
    page1Form.setValue('barangay', barangayName, { shouldValidate: true });

    if (barangay) {
      page1Form.clearErrors('barangay');
    }
  };

  const handleNext = async () => {
    let isValid = false;

    if (currentPage === 1) {
      // Validate address fields manually
      let hasErrors = false;

      if (!selectedProvince) {
        page1Form.setError('province', { type: 'manual', message: 'Province is required' });
        hasErrors = true;
      } else {
        page1Form.clearErrors('province');
      }

      if (!selectedCity) {
        page1Form.setError('city', { type: 'manual', message: 'City is required' });
        hasErrors = true;
      } else {
        page1Form.clearErrors('city');
      }

      if (!selectedBarangay) {
        page1Form.setError('barangay', { type: 'manual', message: 'Barangay is required' });
        hasErrors = true;
      } else {
        page1Form.clearErrors('barangay');
      }

      isValid = await page1Form.trigger() && !hasErrors;

      if (isValid) {
        // Sync data between forms
        const page1Data = page1Form.getValues();
        page2Form.reset({ ...page2Form.getValues(), ...page1Data });
        setCurrentPage(2);
      }
    } else if (currentPage === 2) {
      isValid = await page2Form.trigger();

      if (isValid) {
        // Sync data between forms
        const page2Data = page2Form.getValues();
        page3Form.reset({ ...page3Form.getValues(), ...page2Data });
        setCurrentPage(3);
      }
    }

    if (!isValid) {
      showToast('Please complete all required fields', 'error');
    }
  };

  const handlePrevious = () => {
    if (currentPage === 2) {
      // Sync data between forms
      const page2Data = page2Form.getValues();
      page1Form.reset({ ...page1Form.getValues(), ...page2Data });
      setCurrentPage(1);
    } else if (currentPage === 3) {
      // Sync data between forms
      const page3Data = page3Form.getValues();
      page2Form.reset({ ...page2Form.getValues(), ...page3Data });
      setCurrentPage(2);
    }
  };

  const handleDone = async () => {
    const isValid = await page3Form.trigger();
    if (!isValid) {
      showToast('Please complete all required fields', 'error');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    try {
      const formData = getCurrentFormData();

      // Step 1: Upload files if any exist
      let uploadedFiles = {
        artifactImages: [],
        artifactRelatedImages: [],
        artifactDocuments: []
      };

      const hasFiles =
        (formData.artifactImages?.files?.length || 0) > 0 ||
        (formData.artifactRelatedImages?.files?.length || 0) > 0 ||
        (formData.artifactDocuments?.files?.length || 0) > 0;

      if (hasFiles) {
        const fileFormData = new FormData();

        // Add category parameter to match contribution form
        fileFormData.append("category", "private");

        // Add all files to FormData
        formData.artifactImages?.files?.forEach((file) => {
          fileFormData.append('files', file);
        });
        formData.artifactRelatedImages?.files?.forEach((file) => {
          fileFormData.append('files', file);
        });
        formData.artifactDocuments?.files?.forEach((file) => {
          fileFormData.append('files', file);
        });

        // Upload files
        const uploadResponse = await axiosClient.post('/auth/contribution/files', fileFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const allUploadedFiles = uploadResponse.data.files || [];

        // Distribute uploaded files back to their respective categories
        let fileIndex = 0;
        const artifactImagesCount = formData.artifactImages?.files?.length || 0;
        const relatedImagesCount = formData.artifactRelatedImages?.files?.length || 0;

        uploadedFiles.artifactImages = allUploadedFiles.slice(fileIndex, fileIndex + artifactImagesCount);
        fileIndex += artifactImagesCount;

        uploadedFiles.artifactRelatedImages = allUploadedFiles.slice(fileIndex, fileIndex + relatedImagesCount);
        fileIndex += relatedImagesCount;

        uploadedFiles.artifactDocuments = allUploadedFiles.slice(fileIndex);
      }

      // Step 2: Prepare contribution payload
      const contributionPayload = {
        // Donor information
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthDate: formData.birthDate,
        sex: formData.sex,
        email: formData.email,
        contact: formData.contact,
        organization: formData.organization,

        // Address
        street: formData.street,
        barangay: formData.barangay,
        city: formData.city,
        province: formData.province,

        // Contribution type
        type: formData.type,
        lendingReason: formData.lendingReason,
        lendDuration: formData.lendDuration,
        lendConditions: formData.lendConditions,
        lendLiabilities: formData.lendLiabilities,

        // Artifact details
        artifactTitle: formData.artifactTitle,
        artifactDescription: formData.artifactDescription,
        narrative: formData.narrative,
        acquisitionDetails: formData.acquisitionDetails,
        additionalInfo: formData.additionalInfo,

        // Uploaded files
        artifactImages: uploadedFiles.artifactImages,
        artifactRelatedImages: uploadedFiles.artifactRelatedImages,
        artifactDocuments: uploadedFiles.artifactDocuments,

        // URL fields (if any)
        imageUrls: formData.artifactImages?.url ? [formData.artifactImages.url] : [],
        relatedImageUrls: formData.artifactRelatedImages?.url ? [formData.artifactRelatedImages.url] : [],
        documentUrls: formData.artifactDocuments?.url ? [formData.artifactDocuments.url] : [],

        // Admin submission - no captcha needed
        category: 'private'
      };

      // Step 3: Submit contribution
      const response = await axiosClient.post('/auth/contribution', contributionPayload);

      // Step 4: Success - clear form and show success message
      page1Form.reset(initialFormData);
      page2Form.reset(initialFormData);
      page3Form.reset(initialFormData);
      setCurrentPage(1);

      // Reset address selections
      setSelectedProvince(null);
      setSelectedCity(null);
      setSelectedBarangay(null);

      setIsDirty(false);
      setHasUserInteracted(false);

      showToast('Artifact contribution submitted successfully!', 'success');

      // Optional: Navigate back to acquisition page after a delay
      setTimeout(() => {
        navigate('/admin/acquisition');
      }, 2000);

    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit contribution. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelSubmit = () => setShowConfirmModal(false);

  // Page 1: Donor Information + Address + Contribution Type
  const renderPage1 = () => (
    <div className="w-[85rem] mx-auto p-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Left 2 columns */}
        <div className="col-span-2">
          {/* Donor Information */}
          <div className="mb-8">
            <SectionTitle>Donor Information</SectionTitle>
            <hr className="border-gray-300 mb-6" />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <FormInput
                  placeholder="First Name"
                  register={page1Form.register}
                  name="firstName"
                  error={page1Form.formState.errors.firstName || ""}
                  className="w-full h-12 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <FormInput
                  placeholder="Last Name"
                  register={page1Form.register}
                  name="lastName"
                  error={page1Form.formState.errors.lastName || ""}
                  className="w-full h-12 text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <EmailInput
                  control={page1Form.control}
                  name="email"
                  error={page1Form.formState.errors.email || ""}
                  className="w-full h-12 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="w-full [&>div]:w-full [&_input]:w-full [&_input]:h-12 [&_input]:text-base">
                  <ContactNumberInput
                    control={page1Form.control}
                    name="contact"
                    error={page1Form.formState.errors.contact || ""}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Birth Date
                </label>
                <ReactCalendarInput
                  control={page1Form.control}
                  name="birthDate"
                  error={page1Form.formState.errors.birthDate || ""}
                  className="w-full"
                  maxDate={new Date()}
                  placeholder="Select birth date"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Sex
                </label>
                <DropdownInput
                  control={page1Form.control}
                  name="sex"
                  error={page1Form.formState.errors.sex || ""}
                  options={[
                    { value: "", label: "Select sex" },
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                    { value: "prefer_not_to_say", label: "Prefer not to say" },
                  ]}
                  className="w-full h-12 text-base"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Organization
                </label>
                <FormInput
                  placeholder="Organization"
                  register={page1Form.register}
                  name="organization"
                  error={page1Form.formState.errors.organization || ""}
                  className="w-full h-12 text-base"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mb-6">
            <SectionTitle>Address</SectionTitle>
            <hr className="border-gray-300 mb-6" />

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Province <span className="text-red-500">*</span>
                </label>
                <TypedDropdown
                  placeholder="Type to search..."
                  options={provinces}
                  selectedItem={selectedProvince}
                  onChange={handleProvinceChange}
                  isLoading={isLoadingProvinces}
                  error={page1Form.formState.errors.province?.message || provincesError || ""}
                  filterFunction={getFilteredProvinces}
                  maxSuggestions={10}
                  variant="rounded"
                  size="medium"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <TypedDropdown
                  placeholder={selectedProvince ? "Type to search..." : "Select province first"}
                  options={cities}
                  selectedItem={selectedCity}
                  onChange={handleCityChange}
                  disabled={!selectedProvince}
                  isLoading={isLoadingCities}
                  error={page1Form.formState.errors.city?.message || citiesError || ""}
                  filterFunction={getFilteredCities}
                  maxSuggestions={10}
                  variant="rounded"
                  size="medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Barangay <span className="text-red-500">*</span>
                </label>
                <TypedDropdown
                  placeholder={selectedCity ? "Type to search..." : "Select city first"}
                  options={barangays}
                  selectedItem={selectedBarangay}
                  onChange={handleBarangayChange}
                  disabled={!selectedCity}
                  isLoading={isLoadingBarangays}
                  error={page1Form.formState.errors.barangay?.message || barangaysError || ""}
                  filterFunction={getFilteredBarangays}
                  maxSuggestions={12}
                  variant="rounded"
                  size="medium"
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Street
                </label>
                <FormInput
                  placeholder="Street"
                  register={page1Form.register}
                  name="street"
                  error={page1Form.formState.errors.street || ""}
                  className="w-full h-12 text-base"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 column */}
        <div className="col-span-1">
          <div className="mb-6">
            <SectionTitle>Contribution Type</SectionTitle>
            <hr className="border-gray-300 mb-6" />

            <div className="mb-4">
              <label className="block text-base font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <DropdownInput
                control={page1Form.control}
                name="type"
                error={page1Form.formState.errors.type || ""}
                options={[
                  { value: "", label: "Choose type" },
                  { value: "donation", label: "Donation" },
                  { value: "lending", label: "Lending" },
                ]}
                className="w-full h-12 text-base"
              />
            </div>

            {page1Form.watch("type") === "lending" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Reason for Lending <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Explain the reason for lending"
                    value={page1Form.watch("lendingReason") || ""}
                    onChange={(e) => page1Form.setValue("lendingReason", e.target.value)}
                    rows={3}
                    className={`border rounded-2xl px-2 py-3 text-xl w-full resize-none ${page1Form.formState.errors.lendingReason ? "border-red-600" : "border-black"
                      } focus:outline-none`}
                    style={{
                      boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
                    }}
                  />
                  <span className="text-red-600 text-md h-6 pl-2">
                    {page1Form.formState.errors.lendingReason?.message || ""}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Lend From <span className="text-red-500">*</span>
                    </label>
                    <ReactCalendarInput
                      control={page1Form.control}
                      name="lendDuration.from"
                      error={page1Form.formState.errors.lendDuration?.from || ""}
                      className="w-full"
                      minDate={new Date()}
                      placeholder="Select start date"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Lend To <span className="text-red-500">*</span>
                    </label>
                    <ReactCalendarInput
                      control={page1Form.control}
                      name="lendDuration.to"
                      error={page1Form.formState.errors.lendDuration?.to || ""}
                      className="w-full"
                      minDate={(() => {
                        const fromDate = page1Form.getValues("lendDuration.from");
                        if (fromDate) {
                          const nextDay = new Date(fromDate);
                          nextDay.setDate(nextDay.getDate() + 1);
                          return nextDay;
                        }
                        return new Date();
                      })()}
                      placeholder="Select end date"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Conditions
                  </label>
                  <textarea
                    placeholder="Provide any conditions for lending"
                    value={page1Form.watch("lendConditions") || ""}
                    onChange={(e) => page1Form.setValue("lendConditions", e.target.value)}
                    rows={3}
                    className={`border rounded-2xl px-2 py-3 text-xl w-full resize-none ${page1Form.formState.errors.lendConditions ? "border-red-600" : "border-black"
                      } focus:outline-none`}
                    style={{
                      boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
                    }}
                  />
                  <span className="text-red-600 text-md h-6 pl-2">
                    {page1Form.formState.errors.lendConditions?.message || ""}
                  </span>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Liabilities
                  </label>
                  <textarea
                    placeholder="Specify liabilities, if any"
                    value={page1Form.watch("lendLiabilities") || ""}
                    onChange={(e) => page1Form.setValue("lendLiabilities", e.target.value)}
                    rows={3}
                    className={`border rounded-2xl px-2 py-3 text-xl w-full resize-none ${page1Form.formState.errors.lendLiabilities ? "border-red-600" : "border-black"
                      } focus:outline-none`}
                    style={{
                      boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
                    }}
                  />
                  <span className="text-red-600 text-md h-6 pl-2">
                    {page1Form.formState.errors.lendLiabilities?.message || ""}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Page 2: Artifact Details
  const renderPage2 = () => (
    <div className="w-[85rem] mx-auto p-6">
      <div className="mb-8">
        <SectionTitle>Artifact Details</SectionTitle>
        <hr className="border-gray-300 mb-6" />

        <div className="mb-6">
          <label className="block text-base font-medium text-gray-700 mb-2">
            Artifact Title <span className="text-red-500">*</span>
          </label>
          <FormInput
            placeholder="Artifact Title"
            register={page2Form.register}
            name="artifactTitle"
            error={page2Form.formState.errors.artifactTitle || ""}
            className="w-full h-12 text-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Artifact Description
            </label>
            <textarea
              placeholder="Describe the artifact..."
              value={page2Form.watch("artifactDescription") || ""}
              onChange={(e) => page2Form.setValue("artifactDescription", e.target.value)}
              rows={6}
              className={`border rounded-2xl px-2 py-3 text-xl w-full resize-none ${page2Form.formState.errors.artifactDescription ? "border-red-600" : "border-black"
                } focus:outline-none`}
              style={{
                boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
              }}
            />
            <span className="text-red-600 text-md h-6 pl-2">
              {page2Form.formState.errors.artifactDescription?.message || ""}
            </span>
          </div>
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Narrative
            </label>
            <textarea
              placeholder="Provide story/background of the artifact..."
              value={page2Form.watch("narrative") || ""}
              onChange={(e) => page2Form.setValue("narrative", e.target.value)}
              rows={6}
              className={`border rounded-2xl px-2 py-3 text-xl w-full resize-none ${page2Form.formState.errors.narrative ? "border-red-600" : "border-black"
                } focus:outline-none`}
              style={{
                boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
              }}
            />
            <span className="text-red-600 text-md h-6 pl-2">
              {page2Form.formState.errors.narrative?.message || ""}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Acquisition Details
            </label>
            <textarea
              placeholder="Details about acquisition..."
              value={page2Form.watch("acquisitionDetails") || ""}
              onChange={(e) => page2Form.setValue("acquisitionDetails", e.target.value)}
              rows={6}
              className={`border rounded-2xl px-2 py-3 text-xl w-full resize-none ${page2Form.formState.errors.acquisitionDetails ? "border-red-600" : "border-black"
                } focus:outline-none`}
              style={{
                boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
              }}
            />
            <span className="text-red-600 text-md h-6 pl-2">
              {page2Form.formState.errors.acquisitionDetails?.message || ""}
            </span>
          </div>
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Additional Info
            </label>
            <textarea
              placeholder="Any other relevant information..."
              value={page2Form.watch("additionalInfo") || ""}
              onChange={(e) => page2Form.setValue("additionalInfo", e.target.value)}
              rows={6}
              className={`border rounded-2xl px-2 py-3 text-xl w-full resize-none ${page2Form.formState.errors.additionalInfo ? "border-red-600" : "border-black"
                } focus:outline-none`}
              style={{
                boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
              }}
            />
            <span className="text-red-600 text-md h-6 pl-2">
              {page2Form.formState.errors.additionalInfo?.message || ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Page 3: Artifact Images and Files
  const renderPage3 = () => (
    <div className="w-[85rem] mx-auto p-6">
      <div className="mb-8">
        <SectionTitle>Artifact Images and Files</SectionTitle>
        <hr className="border-gray-300 mb-6" />

        <div className="space-y-10">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Artifact Images</h3>
            <p className="text-sm text-gray-600 mb-4">Upload photos of the artifact</p>
            <FileInput
              control={page3Form.control}
              name="artifactImages"
              className="w-full"
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Related Images</h3>
            <p className="text-sm text-gray-600 mb-4">Upload related or contextual images</p>
            <FileInput
              control={page3Form.control}
              name="artifactRelatedImages"
              className="w-full"
            />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Documents</h3>
            <p className="text-sm text-gray-600 mb-4">Upload documents (e.g., provenance, certificates)</p>
            <FileInput
              control={page3Form.control}
              name="artifactDocuments"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const SummaryBlock = () => (
    <div className="space-y-2 text-sm">
      <div>
        <strong>Name:</strong> {getCurrentFormData().firstName} {getCurrentFormData().lastName}
      </div>
      <div>
        <strong>Email:</strong> {getCurrentFormData().email || '—'}
      </div>
      <div>
        <strong>Contact:</strong> {getCurrentFormData().contact || '—'}
      </div>
      <div>
        <strong>Birth Date:</strong> {getCurrentFormData().birthDate ? new Date(getCurrentFormData().birthDate).toLocaleDateString() : '—'}
      </div>
      <div>
        <strong>Sex:</strong> {getCurrentFormData().sex || '—'}
      </div>
      <div>
        <strong>Organization:</strong> {getCurrentFormData().organization || '—'}
      </div>
      <div>
        <strong>Address:</strong>{' '}
        {[getCurrentFormData().street, getCurrentFormData().barangay, getCurrentFormData().city, getCurrentFormData().province].filter(Boolean).join(', ') || '—'}
      </div>
      <div>
        <strong>Type:</strong> {getCurrentFormData().type || '—'}
      </div>
      {getCurrentFormData().type === 'lending' && (
        <>
          <div>
            <strong>Lending Period:</strong>{' '}
            {getCurrentFormData().lendDuration?.from ? new Date(getCurrentFormData().lendDuration.from).toLocaleDateString() : '—'} to {getCurrentFormData().lendDuration?.to ? new Date(getCurrentFormData().lendDuration.to).toLocaleDateString() : '—'}
          </div>
          <div>
            <strong>Reason:</strong> {getCurrentFormData().lendingReason || '—'}
          </div>
          <div>
            <strong>Conditions:</strong> {getCurrentFormData().lendConditions || '—'}
          </div>
          <div>
            <strong>Liabilities:</strong> {getCurrentFormData().lendLiabilities || '—'}
          </div>
        </>
      )}
      <div>
        <strong>Artifact Title:</strong> {getCurrentFormData().artifactTitle || '—'}
      </div>
      <div>
        <strong>Description:</strong> {getCurrentFormData().artifactDescription || '—'}
      </div>
      <div>
        <strong>Narrative:</strong> {getCurrentFormData().narrative || '—'}
      </div>
      <div>
        <strong>Acquisition Details:</strong> {getCurrentFormData().acquisitionDetails || '—'}
      </div>
      <div>
        <strong>Additional Info:</strong> {getCurrentFormData().additionalInfo || '—'}
      </div>
      <div>
        <strong>Artifact Images:</strong>{' '}
        {(getCurrentFormData().artifactImages?.files?.length || 0) > 0
          ? `${getCurrentFormData().artifactImages.files.length} file(s)`
          : '—'}{' '}
        {getCurrentFormData().artifactImages?.url ? `(URL: ${getCurrentFormData().artifactImages.url})` : ''}
      </div>
      <div>
        <strong>Related Images:</strong>{' '}
        {(getCurrentFormData().artifactRelatedImages?.files?.length || 0) > 0
          ? `${getCurrentFormData().artifactRelatedImages.files.length} file(s)`
          : '—'}{' '}
        {getCurrentFormData().artifactRelatedImages?.url ? `(URL: ${getCurrentFormData().artifactRelatedImages.url})` : ''}
      </div>
      <div>
        <strong>Documents:</strong>{' '}
        {(getCurrentFormData().artifactDocuments?.files?.length || 0) > 0
          ? `${getCurrentFormData().artifactDocuments.files.length} file(s)`
          : '—'}{' '}
        {getCurrentFormData().artifactDocuments?.url ? `(URL: ${getCurrentFormData().artifactDocuments.url})` : ''}
      </div>
    </div>
  );

  return (
    <>
      {PromptModal}

      <div className="w-full h-full bg-white">
        <div className="flex-1">
          {currentPage === 1 ? renderPage1() : currentPage === 2 ? renderPage2() : renderPage3()}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-between items-center w-[85rem] mx-auto">
            <div>
              {currentPage === 1 ? (
                <button
                  onClick={() => navigate('/admin/acquisition')}
                  className="px-8 py-3 bg-black text-white text-lg rounded hover:bg-gray-800 transition-colors"
                >
                  Return
                </button>
              ) : (
                <button
                  onClick={handlePrevious}
                  className="px-8 py-3 bg-black text-white text-lg rounded hover:bg-gray-800 transition-colors"
                >
                  PREV
                </button>
              )}
            </div>

            <div>
              {currentPage < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-black text-white text-lg rounded hover:bg-gray-800 transition-colors"
                >
                  NEXT
                </button>
              ) : (
                <button
                  onClick={handleDone}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-black text-white text-lg rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  )}
                  {isSubmitting ? 'SUBMITTING...' : 'DONE'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={cancelSubmit}
        onConfirm={confirmSubmit}
        title="Confirm Artifact Contribution"
        message={
          <div className="space-y-3">
            <div>
              <p>Are you sure you want to submit this artifact contribution?</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md text-sm max-h-96 overflow-y-auto">
              <SummaryBlock />
            </div>
            <p className="text-sm text-gray-600">This will submit the contribution to the backend for processing.</p>
          </div>
        }
        type="question"
        theme="light"
      />

      <Toast
        message={toastConfig.message}
        type={toastConfig.type}
        onClose={hideToast}
      />
    </>
  );
};

export default AddArtifact;
