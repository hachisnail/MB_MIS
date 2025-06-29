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

export const colorMap = {
  A: "#FF6666",
  B: "#FF9933",
  C: "#FFD700",
  D: "#66CC66",
  E: "#0099CC",
  F: "#9933CC",
  G: "#FF3399",
  H: "#6666FF",
  I: "#00CC99",
  J: "#FF6600",
  K: "#3399FF",
  L: "#FF3366",
  M: "#33CC33",
  N: "#FFCC00",
  O: "#336699",
  P: "#990000",
  Q: "#FF6699",
  R: "#666600",
  S: "#669900",
  T: "#009999",
  U: "#6600CC",
  V: "#CC3300",
  W: "#99CC00",
  X: "#9966FF",
  Y: "#FF0000",
  Z: "#33CCCC",
};