import React, { useState } from "react";

const CurvedButton = ({
  text = "Button Text",
  width = 291,
  height = 78,
  bgColor = "#2F0000",
  textColor = "#FFFFFF",
  pressedColor = "",
  fontSize = 24,
  onClick,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`w-full h-full p-0 border-none bg-transparent cursor-pointer transform transition-transform duration-150 pb-1 pr-1 ${
        isPressed ? "scale-95" : "scale-100"
      }`}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        {/* Shadow group */}
        {!isPressed && (
          <g filter="url(#svgButtonShadow)">
            <path
              d="M0 0H272C282.493 0 291 8.50659 291 19V59C291 69.4934 282.493 78 272 78H0C0 78 7.5166 76.1906 11.5 70.5C15 65.5 15 58 15 58V40.5V17.5C15 17.5 14.261 11 10.5 6.5C6.73898 2 0 0 0 0Z"
              fill={isPressed ?  (pressedColor): (bgColor)}
            />
          </g>
        )}

        {/* Main button path without shadow */}
        <path
          d="M0 0H272C282.493 0 291 8.50659 291 19V59C291 69.4934 282.493 78 272 78H0C0 78 7.5166 76.1906 11.5 70.5C15 65.5 15 58 15 58V40.5V17.5C15 17.5 14.261 11 10.5 6.5C6.73898 2 0 0 0 0Z"
              fill={isPressed ?  (pressedColor): (bgColor)}

        />

        {/* Text */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill={textColor}
          fontSize={fontSize}
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          {text}
        </text>

        {/* Shadow filter */}
        <defs>
          <filter
            id="svgButtonShadow"
            x="0"
            y="0"
            width={width}
            height={height}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow"
            />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
            />
            <feBlend
              mode="normal"
              in2="effect1_dropShadow"
              result="effect2_dropShadow"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect2_dropShadow"
              result="shape"
            />
          </filter>
        </defs>
      </svg>
    </button>
  );
};

export default CurvedButton;
