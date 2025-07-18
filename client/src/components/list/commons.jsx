// common list components that are shared between other components and pages.

export const LoadingSpinner = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-7 h-7 mx-auto border-2 border-white border-t-transparent animate-spin rounded-full" />
  </div>
);

export const ErrorBox = ({ message }) => (
  <div className="w-full h-full flex items-center justify-center">

    
    <pre className="text-red-400 text-xl text-center whitespace-pre-line">
      {message}
    </pre>
  </div>
);

export const EmptyMessage = ({ message }) => (
  <div className="w-full h-full flex items-center justify-center py-6">
    <span className="text-[#9C9C9C] text-xl">{message}</span>
  </div>
);

export const actionLabels = {
  login: "Login",
  logout: "Logout",
  create: "Create",
  update: "Update",
  "soft-delete": "Soft Delete",
  delete: "Delete",
};

export const roleColorMap = {
  1: "bg-[#6F3FFF]",
  2: "bg-blue-500",
  3: "bg-gray-400",
  4: "bg-[#FF6666]",
  5: "bg-gray-500",
  default: "bg-gray-800", 
};


export const actionMap = {
  create: "bg-green-400",
  update: "bg-blue-400",
  delete: "bg-red-400",
  "soft-delete": "bg-yellow-400",
  login: "bg-emerald-400",
  logout: "bg-gray-400",
};

export const rolePermissions = {
  1: "Admin",
  2: "Content Manager",
  3: "Viewer",
  4: "Reviewer",
  5: "System",
  default: "N/A"
};


export function generateColorFromKey(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hueSteps = 12; 
  const satSteps = [60, 70, 80];
  const lightSteps = [40, 50, 60];

  const safeHash = Math.abs(hash);

  const hue = (safeHash % hueSteps) * (360 / hueSteps);
  const sat = satSteps[safeHash % satSteps.length];
  const light = lightSteps[(Math.floor(safeHash / 3)) % lightSteps.length];

  function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }

  const [r, g, b] = hslToRgb(hue, sat, light);
  const color = `#${[r, g, b]
    .map(val => val.toString(16).padStart(2, "0"))
    .join("")}`;

  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  const text = luminance > 186 ? "text-black" : "text-white";

  return {
    rawColor: color,
    bg: color,
    text
  };
}

export const socialLinks = [

  
  {
    name: "Museo Bulawan",
    href: "https://www.facebook.com/museobulawancn",
    position: "left",
    viewBox: "0 0 448 512",
    iconPath: "M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64h98.2V334.2H109.4V256h52.8V222.3c0-87.1 39.4-127.5 125-127.5c16.2 0 44.2 3.2 55.7 6.4V172c-6-.6-16.5-1-29.6-1c-42 0-58.2 15.9-58.2 57.2V256h83.6l-14.4 78.2H255V480H384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64z" 
  },
  {
    name: "museobulawanofficial",
    href: "https://www.instagram.com/museobulawanofficial/",
    position: "left",
    viewBox: "0 0 448 512",
    iconPath: "M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"
  },
    {
    name: "Museo Bulawan Official",
    href: "mailto:bulawanmuseo@gmail.com",
    position: "right",
    viewBox: "0 0 512 512",
    iconPath: "M64 112c-8.8 0-16 7.2-16 16l0 22.1L220.5 291.7c20.7 17 50.4 17 71.1 0L464 150.1l0-22.1c0-8.8-7.2-16-16-16L64 112zM48 212.2L48 384c0 8.8 7.2 16 16 16l384 0c8.8 0 16-7.2 16-16l0-171.8L322 328.8c-38.4 31.5-93.7 31.5-132 0L48 212.2zM0 128C0 92.7 28.7 64 64 64l384 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128z"
                      
  },
  {
    name: "museobulawan",
    href: "https://www.tiktok.com/@museobulawan",
    position: "right",
    viewBox: "0 0 448 512",
    iconPath: "M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z" 
  },
  {
    name: "Museo Bulawan (Abel C. Icatlo)",
    href: "https://www.youtube.com/@museobulawanofficial",
    position: "right",
    viewBox: "0 0 576 512",
    iconPath: "M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z" 
                      
  },
];
