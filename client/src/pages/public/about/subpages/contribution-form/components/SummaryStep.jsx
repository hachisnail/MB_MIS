import React, { useMemo } from "react";
import Viewport from "../../../../../../features/Viewport";
import SubmitButton from "../../../../../../features/SubmitButton";

function SectionCard({ title, children }) {
  return (
    <div className="w-[50rem] h-fit rounded-2xl border border-gray-200 shadow-md bg-white">
      <div className="px-6 py-4 border-b">
        <h2 className="text-3xl font-hina">{title}</h2>
      </div>
      <div className="px-6 py-6 flex flex-col gap-y-5">{children}</div>
    </div>
  );
}

function Field({ label, value, multiline = false }) {
  if (value == null || value === "") return null;
  return (
    <div className="w-full">
      <div className="text-sm tracking-wide text-gray-600">{label}</div>
      {multiline ? (
        <div className="text-xl leading-relaxed whitespace-pre-wrap break-words">
          {value}
        </div>
      ) : (
        <div className="text-xl break-words">{value}</div>
      )}
    </div>
  );
}

function FileGroup({ title, group }) {
  const files = group?.files ?? [];
  const url = group?.url;

  if ((files?.length ?? 0) === 0 && !url) return null;

  return (
    <div className="w-full">
      <div className="text-sm tracking-wide text-gray-600">{title}</div>
      <div className="flex flex-col gap-y-2">
        {url && (
          <div className="text-xl break-all">
            URL:{" "}
            <a className="underline" href={url} target="_blank" rel="noreferrer">
              {url}
            </a>
          </div>
        )}
        {files?.length > 0 && (
          <ul className="list-disc pl-6 text-xl">
            {files.map((f, i) => (
              <li key={i}>{typeof f === "string" ? f : f?.name || `File ${i + 1}`}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const SummaryStep = ({ initialData, onBack, onConfirm, isSubmitting = false }) => {
  const address = useMemo(() => {
    const parts = [
      initialData?.street,
      initialData?.barangay,
      initialData?.city,
      initialData?.province,
    ].filter(Boolean);
    return parts.join(", ");
  }, [initialData]);

  const lendRange = useMemo(() => {
    const from = initialData?.lendDuration?.from
      ? new Date(initialData.lendDuration.from)
      : null;
    const to = initialData?.lendDuration?.to
      ? new Date(initialData.lendDuration.to)
      : null;
    const fmt = (d) =>
      d
        ? d.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
        : null;

    if (from && to) return `${fmt(from)} — ${fmt(to)}`;
    if (from) return fmt(from);
    if (to) return fmt(to);
    return null;
  }, [initialData]);

  const typeLabel = useMemo(() => {
    if (!initialData?.type) return "—";
    return initialData.type.charAt(0).toUpperCase() + initialData.type.slice(1);
  }, [initialData]);

  return (
    <div className="w-[85rem] h-fit">
      <div className="w-full min-h-[56rem] flex flex-col gap-y-6">
        {/* Title */}
        <div className="w-full">
          <div className="text-5xl font-hina">Review & Confirm</div>
          <div className="text-base text-gray-600 mt-1">
            Please review all information below. If everything looks good, click{" "}
            <b>Confirm & Submit</b>.
          </div>
        </div>

        <Viewport
          sizes={{
            lg: { width: 500, height: 545 },
            xl: { width: 675, height: 545 },
            "2xl": { width: 700, height: 545 },
            "3xl": { width: 820, height: 545 },
          }}
        >
          {/* Now all sections stacked vertically like a receipt */}
          <div className="w-full h-fit rounded-2xl border border-gray-200 shadow-md bg-white p-[1rem]">
            <div className="flex flex-col gap-6">
              <SectionCard title="Arrangement / Details">
                <Field label="Type" value={typeLabel} />
                {initialData?.type === "lending" && (
                  <>
                    <Field label="Lend Duration" value={lendRange} />
                    <Field label="Lending Conditions" value={initialData?.lendConditions} multiline />
                    <Field label="Liabilities" value={initialData?.lendLiabilities} multiline />
                    <Field label="Reason for Lending" value={initialData?.lendingReason} multiline />
                  </>
                )}
              </SectionCard>


              <SectionCard title="Personal Info">
                {initialData?.isAnonymous ? (
                  /* Anonymous Donor Display */
                  <>
                    <div className="w-full text-center py-4">
                      <p className="text-2xl font-semibold text-gray-700">
                        Anonymous Donor
                      </p>
                      <p className="text-lg text-gray-500 mt-2">
                        Your personal information will remain private
                      </p>
                    </div>
                    <Field label="Contact Email" value={initialData?.email} />
                  </>
                ) : (
                  /* Regular Donor Display */
                  <>
                    <Field
                      label="Name"
                      value={`${initialData?.firstName || ""} ${initialData?.lastName || ""}`.trim()}
                    />
                    <Field
                      label="Birthdate"
                      value={
                        initialData?.birthDate
                          ? new Date(initialData.birthDate).toLocaleDateString()
                          : ""
                      }
                    />
                    <Field label="Sex" value={initialData?.sex} />
                    <Field label="Contact" value={initialData?.contact} />
                    <Field label="Email" value={initialData?.email} />
                    <Field label="Organization" value={initialData?.organization} />
                    <Field label="Address" value={address} multiline />
                  </>
                )}
              </SectionCard>



              <SectionCard title="Artifact Details">
                <Field label="Title" value={initialData?.artifactTitle} />
                <Field label="Description" value={initialData?.artifactDescription} multiline />
                <Field label="Acquisition Details" value={initialData?.acquisitionDetails} multiline />
                <Field label="Additional Info" value={initialData?.additionalInfo} multiline />
                <Field label="Narrative / Story" value={initialData?.narrative} multiline />
              </SectionCard>

              <SectionCard title="Files">
                <FileGroup title="Artifact Images" group={initialData?.artifactImages} />
                <FileGroup title="Related Images" group={initialData?.artifactRelatedImages} />
                <FileGroup title="Documents / Research" group={initialData?.artifactDocuments} />
              </SectionCard>
            </div>
          </div>
        </Viewport>
        {/* Footer buttons */}
        <div className="w-full h-15 flex justify-between mt-4">
          <button
            type="button"
            onClick={() => onBack(initialData)}
            className="w-44 h-15 rounded-md bg-black text-white text-2xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Previous
          </button>
          <SubmitButton
            onClick={onConfirm}
            isLoading={isSubmitting}
            loadingText="Submitting..."
            className="w-64 h-15 rounded-2xl"
          >
            Confirm &amp; Submit
          </SubmitButton>
        </div>
      </div>
    </div>
  );
};

export default SummaryStep;
