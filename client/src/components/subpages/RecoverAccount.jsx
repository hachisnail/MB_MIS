import { NavLink, useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Logo from "../../assets/LOGO.png";
import PopupModal from "../modals/PopupModal";
import axiosClient from "../../lib/axiosClient";

const RecoverAccount = () => {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [passwords, setPasswords] = useState({ password: "", confirm: "" });

  const isSuccessRoute = location.pathname === "/recover/success";
  const isTokenRoute = !!token;

  // Cooldown (for email request)
  useEffect(() => {
    const lastRequest = localStorage.getItem("resetCooldown");
    if (lastRequest) {
      const diff = Date.now() - parseInt(lastRequest);
      if (diff < 60000) {
        setCooldown(Math.ceil((60000 - diff) / 1000));
      }
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Email Reset Request
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const emailInput = e.target.email.value.trim();
    if (!emailInput || cooldown > 0) return;

    setIsLoading(true);
    try {
      const response = await axiosClient.post("/auth/request-reset", {
        email: emailInput,
      });

      e.target.email.value = "";
      localStorage.setItem("resetCooldown", Date.now().toString());
      setCooldown(60);
      setModalMessage(response.data.message || "Reset link sent.");
      setModalOpen(true);
    } catch (err) {
      setModalMessage(err.response?.data?.message || "Something went wrong.");
      setModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Password Reset Submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (
      passwords.password.length < 8 ||
      passwords.password !== passwords.confirm
    ) {
      setModalMessage("Passwords must match and be at least 8 characters.");
      setModalOpen(true);
      setIsLoading(false);
      return;
    }

    try {
      await axiosClient.post(`/auth/reset-password/${token}`, {
        password: passwords.password,
        confirmPassword: passwords.confirm,
      });
      navigate("/recover/success");
    } catch (err) {
      setModalMessage(err.response?.data?.message || "Reset failed.");
      setModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailForm = () => (
    <form
      onSubmit={handleEmailSubmit}
      className="px-8 pt-8 pb-6 rounded-lg shadow-2xl w-full max-w-xl"
    >
      <div className="mb-7 flex flex-col items-center gap-y-4">
        <LogoHeader />
        <h1 className="text-5xl font-semibold text-center">
          Reset Your Password
        </h1>
        <p className="text-2xl text-center text-gray-500">
          Enter your email and we’ll send a reset link.
        </p>
      </div>
      <label htmlFor="email" className="block text-xl mb-2">
        Your email
      </label>
      <input
        id="email"
        type="email"
        name="email"
        required
        className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2"
        placeholder="email"
      />
      <button
        type="submit"
        disabled={isLoading || cooldown > 0}
        className="w-full bg-black text-white mt-4 py-2 text-2xl rounded-lg disabled:opacity-50"
      >
        {isLoading
          ? "Sending..."
          : cooldown > 0
          ? `Wait (${cooldown}s)`
          : "Reset Password"}
      </button>
      <div className="mt-2 w-full flex justify-end">
        <NavLink to="/login">
          <span className="font-semibold text-xl hover:text-gray-600">
            Return to login
          </span>
        </NavLink>
      </div>
    </form>
  );

  const renderPasswordForm = () => (
    <form
      onSubmit={handlePasswordSubmit}
      className="px-8 pt-8 pb-6 rounded-lg shadow-2xl w-full max-w-xl"
    >
      <div className="mb-7 flex flex-col items-center gap-y-4">
        <LogoHeader />
        <h1 className="text-5xl font-semibold text-center">
          Set a New Password
        </h1>
        <p className="text-md text-center text-gray-500">
          Choose a strong password for your account.
        </p>
      </div>

      <label className="block text-xl mb-2">New Password</label>
      <input
        type="password"
        required
        minLength={8}
        value={passwords.password}
        onChange={(e) =>
          setPasswords({ ...passwords, password: e.target.value })
        }
        className="w-full px-3 py-2 border border-gray-400 rounded-lg mb-4"
      />

      <label className="block text-xl mb-2">Confirm Password</label>
      <input
        type="password"
        required
        minLength={8}
        value={passwords.confirm}
        onChange={(e) =>
          setPasswords({ ...passwords, confirm: e.target.value })
        }
        className="w-full px-3 py-2 border border-gray-400 rounded-lg mb-4"
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-black text-white py-2 text-2xl rounded-lg disabled:opacity-50"
      >
        {isLoading ? "Resetting..." : "Set New Password"}
      </button>
    </form>
  );

  const renderSuccess = () => (
    <div className="text-center max-w-xl mx-auto px-8 py-12 rounded shadow-xl bg-white">
      <LogoHeader />
      <h1 className="text-3xl font-bold text-green-600 mt-4">
        Password Reset Successful
      </h1>
      <p className="mt-2 text-gray-600">
        You can now log in with your new password.
      </p>
      <NavLink
        to="/login"
        className="inline-block mt-6 bg-black text-white px-6 py-2 rounded-lg"
      >
        Back to Login
      </NavLink>
    </div>
  );

  return (
    <>
      <PopupModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Notice"
        message={modalMessage}
        type="info"
        theme="light"
      />

      <div className="flex flex-col w-screen min-w-fit h-[98.5vh]">
        <NavLink
          to="/"
          className="group flex items-center font-semibold ml-1 mt-1 px-1 hover:text-gray-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className="stroke-black group-hover:stroke-gray-500"
            strokeWidth="1"
          >
            <path d="M9 14l-4 -4l4 -4" />
            <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
          </svg>
          <span className="font-semibold">Home</span>
        </NavLink>

        <div className="w-full flex my-auto justify-center items-center px-2">
          {isSuccessRoute
            ? renderSuccess()
            : isTokenRoute
            ? renderPasswordForm()
            : renderEmailForm()}
        </div>
      </div>
    </>
  );
};

const LogoHeader = () => (
  <div className="flex gap-x-2 items-center">
    <img src={Logo} className="w-15" alt="Museo Bulawan Logo" />
    <i className="w-1 h-12 rounded-4xl bg-gray-500"></i>
    <div className="flex flex-col justify-center">
      <span className="text-2xl font-bold">Museo Bulawan</span>
      <span className="text-xs text-gray-600 font-semibold leading-3">
        Management Information System
      </span>
    </div>
  </div>
);

export default RecoverAccount;
