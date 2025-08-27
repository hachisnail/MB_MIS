import { useState, Fragment } from "react";
import { Dialog, DialogPanel, TransitionChild, Transition } from "@headlessui/react";

const ImageViewerModal = ({ images = [], initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!images || images.length === 0) return null;

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const showCycleButtons = images.length > 1;

  return (
    <Transition show={true} as={Fragment}>
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
              <DialogPanel className="relative w-fit max-h-[71rem] transform overflow-hidden rounded-lg bg-transparent px-10 pt-10 pb-3 text-left align-middle shadow-xl transition-all">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute cursor-pointer hover:text-red-300 top-2 right-2 text-white text-3xl font-bold z-50"
                >
                  &times;
                </button>

                {/* Image Display */}
                <div className="flex items-center justify-center relative">
                  {showCycleButtons && (
                    <button
                      onClick={prevImage}
                      className="absolute -left-11 text-white text-4xl px-4 z-20"
                    >
                      &#10094;
                    </button>
                  )}

                  <img
                    src={images[currentIndex].src}
                    alt={images[currentIndex].label || `Image ${currentIndex + 1}`}
                    className="min-w-[50rem] min-h-[40rem] max-h-[80vh] object-contain mx-auto rounded-lg"
                  />

                  {showCycleButtons && (
                    <button
                      onClick={nextImage}
                      className="absolute -right-11 text-white text-4xl px-4 z-20"
                    >
                      &#10095;
                    </button>
                  )}
                </div>

                {/* Caption */}
                <div className="text-center mt-2 text-white text-lg">
                  {images[currentIndex].label || `Image ${currentIndex + 1}`}
                </div>

                {/* Image Counter */}
                {showCycleButtons && (
                  <div className="text-center text-white text-sm mt-1">
                    {currentIndex + 1} / {images.length}
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ImageViewerModal;
