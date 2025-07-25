import React from 'react';

const Button = ({ children, onClick, className, type = 'button' }) => {
  return (
    <button
      type={type}
      className={`bg-blue-500 text-white py-2 px-4 rounded ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;