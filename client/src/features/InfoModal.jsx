import { Fragment } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";

export const InfoModal = ({ isOpen, onClose, title, content }) => {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white px-8 pt-10 pb-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle className="sr-only">{title}</DialogTitle>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute cursor-pointer hover:text-red-500 top-3 right-4 text-gray-600 text-3xl font-bold z-50"
                >
                  &times;
                </button>

                {/* Title */}
                {title && (
                  <span className="block text-xl font-bold text-[#555555] mb-2">
                    {title}
                  </span>
                )}

                {/* Content */}
                <div className="text-lg text-[#1D1911] font-hind whitespace-pre-wrap break-words overflow-y-auto max-h-[70vh] pr-2">
                  {content}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
