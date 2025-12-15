import { useState, useRef, useEffect, useCallback } from "react";
import { useForm, Controller, useController } from "react-hook-form";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition,
} from "@headlessui/react";



// public forms
export const DateInput = ({
  control,
  name,
  mode = "single",
  className = "",
  error = "",
  minDate = new Date(1900, 0, 1),
  maxDate = new Date(),
  placeholder = "Select date",
}) => {
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = field.value;

        const displayValue =
          mode === "single"
            ? value
              ? value.toLocaleDateString()
              : ""
            : value?.from && value?.to
              ? `${value.from.toLocaleDateString()} - ${value.to.toLocaleDateString()}`
              : "";

        const defaultMonth =
          mode === "single"
            ? value || new Date() // today first
            : value?.from || new Date(); // today first


        return (
          <div className={`relative text-xl flex flex-col ${className}`}>
            {/* Display input */}
            <input
              type="text"
              value={displayValue}
              readOnly
              onClick={() => setShowCalendar(!showCalendar)}
              placeholder={placeholder}
              className={`border p-2 w-full cursor-pointer rounded-2xl ${error ? "border-red-600" : "border-black"
                } focus:outline-none`}
              style={{
                boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
              }}
            />

            {/* Error message */}
            <span className="text-md h-6 text-red-600 pl-2">
              {error?.message || ""}
            </span>

            {/* Calendar */}
            {showCalendar && (
              <div className="absolute z-10 top-12 bg-white p-2 border rounded-2xl shadow-lg">
                <DayPicker
                  mode={mode}
                  selected={value}
                  onSelect={(date) => {
                    if (mode === "single") {
                      field.onChange(date || null);
                      if (date) setShowCalendar(false);
                    } else if (mode === "range") {
                      field.onChange({
                        from: date?.from || null,
                        to: date?.to || null,
                      });
                      if (date?.from && date?.to) {
                        setShowCalendar(false);
                      }
                    }
                  }}
                  captionLayout="dropdown"
                  defaultMonth={defaultMonth}
                  fromMonth={minDate}
                  toMonth={maxDate}
                  disabled={{
                    before: minDate,
                    after: maxDate,
                  }}
                />
              </div>
            )}
          </div>
        );
      }}
    />
  );
};



export const FormInput = ({
  placeholder,
  register,
  name,
  error = "",
  type = "text",
  className = "",
  disabled = false,
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <input
        {...register(name, {
          onChange: (e) => {
            let value = e.target.value;
            if (value.length > 0) {
              value = value.charAt(0).toUpperCase() + value.slice(1);
            }
            e.target.value = value;
          },
        })}
        type={type}
        disabled={disabled}
        className={`border text-xl px-2 py-3 rounded-2xl w-full ${error !== "" ? "border-red-600" : "border-black"
          } focus:outline-none ${disabled ? "border-gray-400 cursor-not-allowed" : ""
          }`}
        style={{
          boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
        }}
        placeholder={placeholder}
      />
      <span className="text-red-600 text-md h-6 pl-2">
        {error.message}
      </span>
    </div>
  );
};


export const DropdownInput = ({
  control,
  name,
  options = [],
  error = "",
  disabled,
  className = "",
}) => {
  return (
    <div className={`flex flex-col  ${className}`}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Listbox
            value={field.value ?? ""}
            onChange={field.onChange}
            disabled={disabled}
          >
            <div className="relative w-full">
              <ListboxButton
                disabled={disabled}
                className={`text-xl relative w-full cursor-pointer rounded-2xl border bg-white py-3 pl-3 pr-10 text-left ${error !== "" ? "border-red-600" : "border-black"
                  } focus:outline-none ${disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                style={{ boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)" }}
              >
                <span className="block truncate">
                  {field.value
                    ? options.find((o) => o.value === field.value)?.label
                    : "Select an option"}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </ListboxButton>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-2xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-lg">
                  {options.map((opt) => (
                    <ListboxOption
                      key={opt.value}
                      value={opt.value}
                      className={({ active: _active }) =>
                        `relative cursor-pointer select-none py-2 pl-10 pr-4 text-xl ${_active
                          ? "bg-blue-100 text-blue-900"
                          : "text-gray-900"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`text-xl block truncate ${selected ? "font-medium" : "font-normal"
                              }`}
                          >
                            {opt.label}
                          </span>
                          {selected && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                              <svg
                                className="h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </span>
                          )}
                        </>
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Transition>
            </div>
          </Listbox>
        )}
      />
      <span className="text-red-600 text-md h-6 pl-2">{error.message}</span>
    </div>
  );
};

export const ContactNumberInput = ({
  control,
  name,
  error = "",
  className = "",
}) => {
  return (
    <div className="flex h-fit flex-col w-full">
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <input
            {...field}
            value={field.value ?? ""}
            type="tel"
            placeholder="Enter contact number"
            onChange={(e) => {
              const numeric = e.target.value.replace(/\D/g, "");
              field.onChange(numeric);
            }}
            className={`border rounded-2xl px-2 py-3 text-xl w-full shadow-inner outline-none ${className} ${error !== "" ? "border-red-600" : "border-black"
              }`}
            style={{ boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)" }}
          />

        )}
      />
      <span className="text-red-600 text-md h-6 pl-2">{error.message}</span>
    </div>
  );
};

export const EmailInput = ({ control, name, error = "", className = "" }) => {
  return (
    <div className="flex flex-col w-full gap-2">
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <input
            {...field}
            value={field.value ?? ""} // ✅ Always controlled
            type="email"
            placeholder="Enter email"
            className={`border rounded-2xl px-2 py-3 text-lg w-full shadow-inner outline-none ${className} ${error !== "" ? "border-red-600" : "border-black"
              }`}
            style={{
              boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
            }}
          />
        )}
      />
      <span className="text-red-600 text-md h-6 pl-2">{error.message}</span>

    </div>
  );
};


export function FileInput({ control, name, className = "" }) {
  const {
    field: { value = { files: [], url: "" }, onChange },
    fieldState: { error = "" },
  } = useController({ name, control });

  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [fileList, setFileList] = useState(value.files || []);
  const [urlValue, setUrlValue] = useState(value.url || "");

  const updateValue = (files, url) => {
    onChange({ files, url });
  };

  const handleFiles = useCallback(
    (files) => {
      if (files.length) {
        const newFiles = Array.from(files);
        const updatedFiles = [...fileList, ...newFiles];
        setFileList(updatedFiles);
        updateValue(updatedFiles, urlValue);
      }
    },
    [fileList, urlValue]
  );


  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleFileInputChange = (e) => handleFiles(e.target.files);

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setUrlValue(url);
    updateValue(fileList, url);
  };

  const removeFile = (index) => {
    const newFiles = [...fileList];
    newFiles.splice(index, 1);
    setFileList(newFiles);
    updateValue(newFiles, urlValue);
  };

  return (
    <div className={`${className} flex flex-col `}>

      <div className="flex flex-col w-full gap-2">
        <input
          type="url"
          placeholder="Enter file URL"
          value={urlValue}
          onChange={handleUrlChange}
          className="border p-2 w-full rounded-2xl text-xl shadow-inner outline-none border-black "
          style={{
            boxShadow: "inset 0 1px 1px rgba(1, 1, 1, 0.50)",
          }}
        />
      </div>



      <div className="flex gap-x-5 mt-2">
        <div
          className={`min-w-[10rem] h-[6rem] border rounded-3xl flex flex-col items-center justify-center cursor-pointer p-4 ${dragging ? "border-blue-500 bg-blue-50" : "border-black"
            }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current.click()}
        >
          <p className="text-xs">
            Drag or <span className="text-[#6A60FF]">Choose Files </span>
          </p>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileInputChange}
            multiple
          />

        </div>

        {fileList.length > 0 && (
          <ul className=" w-full h-[6rem] flex flex-wrap overflow-y-auto ">
            {fileList.map((f, i) => (
              <li key={i} className="flex w-1/2 h-fit rounded-sm justify-between items-center hover:bg-gray-300">
                <span className="w-[93%] text-end  cursor-default">{f.name}</span>
                <button
                  type="button"
                  className="text-red-500 underline ml-2 cursor-pointer"
                  onClick={() => removeFile(i)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 7l16 0" />
                    <path d="M10 11l0 6" />
                    <path d="M14 11l0 6" />
                    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                  </svg>


                </button>
              </li>
            ))}
          </ul>
        )}


      </div>



      <span className="text-red-600 text-md h-6 pl-2">{error.message}</span>

    </div>
  );
}







// 
// components/form/FormField.jsx
export const FormField = ({
  id,
  label,
  placeholder,
  type = "text",
  register,
  error = "",
  disabled,
}) => {
  return (
    <div className="flex flex-col gap-y-2">
      <label htmlFor={id} className="text-xl font-semibold">
        {label}
      </label>
      <input
        id={id}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        {...register}
        className={`border-1 bg-[#242424] border-[#373737] rounded-sm text-2xl px-3 py-2 ${error ? "border-red-500" : ""
          }`}
      />
      <span className="text-red-500 h-6 text-sm">{error.message}</span>
    </div>
  );
};

export default FormField;
