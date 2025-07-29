import { useState, useEffect, useCallback } from "react";
import StyledButton from "@/components/buttons/StyledButton";
import usePrompt from "@/hooks/usePrompt"; 
import ConfirmationModal from "@/components/modals/ConfirmationModal"; 

import {
  StyledInput,
  LabeledInput,
  StyledSelect,
  StyledRadioSelector,
  StyledFileInput,
} from "@/features/Utilities";

const Notice = () => {
  return (
    <div className="w-[30rem] h-fit flex flex-col justify-center gap-y-5">
      <span className="text-5xl font-hina font-extralight">NOTICE</span>
      <span className="text-lg font-hind font-medium text-justify ">
        &nbsp; &nbsp; &nbsp; &nbsp; In addition to preserving your historic
        objects it is important to remember to preserve the history or story
        that goes with them. For example, the uniform worn by your great grand
        father is just a uniform if the story is lost. Take the time to write
        down the story that goes with your objects; include any background
        details that would help our team understand the significance of the
        item.
      </span>
      <span className="text-xl font-hina font-ligt text-right">
        “The Story Matters as Much as the Artifact”
      </span>
    </div>
  );
};

const Person = ({ value, onChange, errors, validateField }) => {
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

      {/* Last Row: Province, Barangay, City, Street */}
      <div className="w-full h-fit flex justify-between">
        <div className="w-[33rem] flex flex-col h-fit gap-y-5">
          <LabeledInput
            label="Province"
            value={value.province}
            onChange={handleChange("province")}
            onBlur={handleBlur("province")}
            error={errors.province}
            isRequired={true}  
          />
          <LabeledInput
            label="Barangay"
            value={value.barangay}
            onChange={handleChange("barangay")}
            onBlur={handleBlur("barangay")}
            error={errors.barangay}
            isRequired={true}  
          />
        </div>

        <div className="w-[24rem] pl-5 h-fit gap-y-5 flex flex-col items-end">
          <LabeledInput
            label="City"
            value={value.city}
            onChange={handleChange("city")}
            onBlur={handleBlur("city")}
            error={errors.city}
            isRequired={true}  
          />
          <LabeledInput
            label="Street"
            value={value.street}
            onChange={handleChange("street")}
            onBlur={handleBlur("street")}
            error={errors.street}
            isRequired={true}  
          />
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

  const initialFormData = {
    person: {
      firstName: "",
      lastName: "",
      age: "",
      phone: "",
      sex: "",
      email: "",
      organization: "",
      province: "",
      barangay: "",
      city: "",
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

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData);
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
      const errors = { ...prev }; // Start with existing errors

      switch (section) {
        case "person":
          const personValue = valueToValidate != null ? String(valueToValidate) : "";
          let isPersonFieldInvalid = false;

          // Check for empty fields (except for the conditional ones)
          if ([
            "firstName", "lastName", "organization", "province",
            "barangay", "city", "street"
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
          }

          if (isPersonFieldInvalid) {
            errors[fieldName] = true;
          } else {
            delete errors[fieldName]; // --- CRITICAL: Delete error if now valid
          }
          break;

        case "type":
          if (fieldName === "type" && !valueToValidate) {
            errors.type = true;
          } else {
            delete errors.type; // --- CRITICAL: Delete error if now valid
          }
          break;

        case "lendDetails":
          if (formData.type === "lending") { // Only validate if type is lending
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
              delete errors[fieldName]; // --- CRITICAL: Delete error if now valid
            }
          } else {
             // If type is NOT lending, ensure any lendDetails errors are cleared
             // This covers cases where user switches from Lending to Donation
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
  [formData.type, validateArtifactFiles, emailRegex, phoneRegex]
);
  const validateCurrentStep = useCallback(() => {
    let currentStepErrors = {};
    let hasErrors = false;

    if (step === 1) {
      // Person details
      const personFields = [
        "firstName",
        "lastName",
        "age",
        "phone",
        "sex",
        "email",
        "organization",
        "province",
        "barangay",
        "city",
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
    } else if (step === 2) {
      // Contribution Type
      if (!formData.type) {
        currentStepErrors.type = true;
        hasErrors = true;
      }
    } else if (step === 3 && formData.type === "lending") {
      // Lend Details (conditional)
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
      // Artifact Details
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
      // Artifact Files (Conditional: URL OR File)
      const artifactFileErrors = validateArtifactFiles(formData.artifactFiles); // Pass the current formData.artifactFiles
      if (Object.keys(artifactFileErrors).length > 0) {
        currentStepErrors = { ...currentStepErrors, ...artifactFileErrors };
        hasErrors = true;
      }
    }

    setFormErrors((prev) => ({ ...prev, ...currentStepErrors }));
    return !hasErrors;
  }, [step, formData, validateArtifactFiles]);

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    // On final step, validate all fields of the current step before submitting
    if (validateCurrentStep()) {
      setShowSubmitConfirm(true);
    }
  };

  const confirmSubmit = () => {
    console.log("Final form data:", formData);
    //axios request to send data to db



    setShowSubmitConfirm(false);
    resetForm();
    setStep(0);
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
      <div className="w-screen min-w-fit items-center justify-center min-h-screen flex flex-col">
        <div className="min-w-[30rem] w-fit h-fit flex gap-y-5 flex-col">
          <div className="min-w-[30rem] p-10 min-h-[15rem] bg-white rounded-lg shadow-2xl shadow-black/80 flex flex-col items-center justify-center">
            {steps[step].component}
          </div>
          <div className="flex justify-between">
            <StyledButton
              onClick={handlePrevious}
              buttonColor="bg-black"
              hoverColor="hover:bg-gray-900"
              textColor="text-white"
              disabled={step === 0}
            >
              Previous
            </StyledButton>

            <div className="flex gap-x-3">

            {isNoticeStep ? (
              <div className="h-full w-fit flex items-center">
                <span className="text-xl font-semibold ">Proceed to the form.</span>
              </div>
            ) : null}
            {isDirty && !isNoticeStep &&  (
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
