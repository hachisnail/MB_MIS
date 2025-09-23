import { useState, useEffect } from "react";

/**
 * SubmitButton - A reusable submit button component with built-in loading protection
 * 
 * Features:
 * - Prevents multiple clicks during submission
 * - Shows loading state with spinner
 * - Customizable text and styling
 * - Automatic disable/enable based on loading state
 * - Visual feedback during loading
 * 
 * @param {Object} props
 * @param {Function} props.onClick - Function to call when button is clicked
 * @param {boolean} props.isLoading - Whether the button is in loading state
 * @param {string} props.children - Button text when not loading
 * @param {string} props.loadingText - Text to show when loading (default: "Submitting...")
 * @param {boolean} props.disabled - Additional disabled state
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.type - Button type (default: "button")
 * @param {Object} props.style - Inline styles
 */
const SubmitButton = ({
    onClick,
    isLoading = false,
    children = "Submit",
    loadingText = "Submitting...",
    disabled = false,
    className = "",
    type = "button",
    style = {},
    ...otherProps
}) => {
    const [internalLoading, setInternalLoading] = useState(false);
    const [clickCount, setClickCount] = useState(0);

    // Reset internal loading state when external loading changes
    useEffect(() => {
        if (!isLoading) {
            setInternalLoading(false);
            setClickCount(0);
        }
    }, [isLoading]);

    const handleClick = async (e) => {
        // Prevent multiple clicks
        if (isLoading || internalLoading || disabled) {
            e.preventDefault();
            return;
        }

        // Track click attempts for debugging
        setClickCount(prev => prev + 1);
        setInternalLoading(true);

        try {
            // Call the onClick handler
            if (onClick) {
                await onClick(e);
            }
        } catch (error) {
            console.error('SubmitButton: Error in onClick handler:', error);
        } finally {
            // Only reset internal loading if external loading is not active
            if (!isLoading) {
                setInternalLoading(false);
            }
        }
    };

    const isButtonLoading = isLoading || internalLoading;
    const isButtonDisabled = disabled || isButtonLoading;

    // Default styling that can be overridden
    const defaultClassName = "w-44 h-15 rounded-md bg-black text-white text-2xl hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2";

    // Apply loading styles
    const loadingClassName = isButtonLoading
        ? "opacity-75 cursor-not-allowed"
        : "cursor-pointer";

    const finalClassName = `${defaultClassName} ${loadingClassName} ${className}`;

    return (
        <button
            type={type}
            onClick={handleClick}
            disabled={isButtonDisabled}
            className={finalClassName}
            style={style}
            aria-busy={isButtonLoading}
            aria-disabled={isButtonDisabled}
            {...otherProps}
        >
            {isButtonLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            )}
            <span>
                {isButtonLoading ? loadingText : children}
            </span>
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && clickCount > 1 && (
                <span className="ml-1 text-xs opacity-60">({clickCount})</span>
            )}
        </button>
    );
};

export default SubmitButton;
