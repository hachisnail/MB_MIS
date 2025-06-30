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