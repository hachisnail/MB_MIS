// ./components/ReviewStep.jsx
import { format } from "date-fns";

const ReviewStep = ({ formData, onBack, onConfirm }) => {
  const fileItems = Array.isArray(formData.requestLetterUpload)
    ? formData.requestLetterUpload
    : [];

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-[85rem] flex flex-col items-center justify-between">
        <div className="w-full flex flex-col shadow-md rounded-lg justify-center shadow-gray-500 px-20 py-10">
          {/* Header */}
          <div className="w-full pb-5 border-b">
            <span className="text-5xl font-hina">Review &amp; Confirm.</span>
          </div>

          <div className="w-full pt-10">
            <div className="text-2xl font-semibold mb-6 text-center">
              Submission Summary
            </div>

            {/* Centered Review Card */}
            <div className="bg-white rounded-xl ring-1 ring-black/5 p-6 leading-7 w-[50rem] max-w-full mx-auto break-words">
              {/* Name */}
              <div className="mb-4">
                <div className="text-[11px] uppercase tracking-wide text-gray-500">Name</div>
                <div className="text-xl font-semibold break-words">
                  {formData.firstName} {formData.lastName}
                </div>
              </div>
              <hr className="border-gray-300 my-4" />

              {/* Email / Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Email</div>
                  <div className="text-base font-semibold break-words">{formData.email}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Phone Number</div>
                  <div className="text-base font-semibold break-words">
                    {formData.phone || "Not provided"}
                  </div>
                </div>
              </div>

              {/* Address / Organization */}
              <div className="mt-6 min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-gray-500">Address</div>
                <div className="text-base font-semibold break-words">
                  {formData.street ? `${formData.street}, ` : ""}
                  {formData.barangay}, {formData.city}, {formData.province}
                </div>
              </div>
              <div className="mt-4 min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-gray-500">Organization</div>
                <div className="text-base font-semibold break-words">
                  {formData.organization || "Not provided"}
                </div>
              </div>

              <hr className="border-gray-300 my-6" />

              {/* Purpose / Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Purpose of Visit</div>
                  <div className="text-base font-semibold break-words">
                    {formData.purpose || "—"}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Preferred Date</div>
                  <div className="text-base font-semibold break-words">
                    {formData.selectedDate
                      ? format(formData.selectedDate, "MMMM d")
                      : "Not selected"}
                  </div>
                </div>
              </div>

              {/* Population / Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Population Count</div>
                  <div className="text-base font-semibold break-words">
                    {formData.populationCount ? `${formData.populationCount}` : "—"}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Preferred Time</div>
                  <div className="text-base font-semibold break-words">
                    {formData.selectedTime || "No specific time preference"}
                  </div>
                </div>
              </div>

              <hr className="border-gray-300 my-6" />

              {/* Notes */}
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Notes</div>
                <p className="text-base font-medium text-gray-900 whitespace-pre-wrap break-words">
                  {formData.additionalNotes || "—"}
                </p>
              </div>

              {/* Files */}
              {fileItems.length > 0 && (
                <>
                  <hr className="border-gray-300 my-6" />
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                      Request Letter Files
                    </div>
                    <ul className="list-disc ml-5 text-sm font-medium">
                      {fileItems.map((f, i) => (
                        <li key={i} className="break-words">
                          {typeof f === "string" ? f : f?.name || "file"}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Centered Note */}
            <p className="max-w-[50rem] mx-auto text-sm text-gray-600 mt-4 text-center break-words">
              Your appointment will be submitted for review. You will receive a
              confirmation email shortly after submission.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="w-full flex justify-between mt-8">
          <button
            type="button"
            onClick={() => onBack({})}
            className="w-44 h-15 rounded-md bg-black text-white text-2xl hover:bg-gray-800"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-44 h-15 rounded-md bg-black text-white text-2xl hover:bg-gray-800"
          >
            Submit Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
