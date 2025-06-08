
export default function StyledButton({
  children,
  className = "",
  onClick,
  type = "button",
  disabled = false,
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 bg-gray-900 text-white rounded 
                  hover:bg-gray-950 focus:outline-none focus:ring-2 
                  focus:ring-gray-400 cursor-pointer disabled:opacity-50 
                  disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
