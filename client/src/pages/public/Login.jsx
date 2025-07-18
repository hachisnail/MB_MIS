import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import Logo from "../../assets/LOGO.png";
import PopupModal from "../../components/modals/PopupModal";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isloading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login, forcedLogoutReason } = useAuth(); 

  useEffect(() => {
    if (user) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user]);

  useEffect(() => {
    if (forcedLogoutReason) {
      setError(forcedLogoutReason);
    }
  }, [forcedLogoutReason]);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setApiError("");
    setIsLoading(true);

    const { success, message } = await login(credentials);
    setIsLoading(false);

    if (success) {
      navigate("/admin/dashboard");
    } else {
      // If error is validation (simple string), show inline
      if (
        message &&
        (message.toLowerCase().includes("password") ||
          message.toLowerCase().includes("username") ||
          message.toLowerCase().includes("email"))
      ) {
        setError(message);
      } else {
        setApiError(message);
      }
    }
  };

  return (
    <div className="flex  flex-col w-screen  min-w-fit h-[98.5vh]">
      <NavLink
        className="group flex items-center cursor-pointer font-semibold ml-1 mt-1 w-fit rounded-md px-1 hover:text-gray-500"
        to="/"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          className="stroke-black group-hover:stroke-gray-500"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 14l-4 -4l4 -4" />
          <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
        </svg>
        <span className="font-semibold">Home</span>
      </NavLink>

      <div className="w-full flex my-auto select-none justify-center">
        <form
          onSubmit={handleSubmit}
          className="  px-8 pt-8 pb-6  rounded-lg shadow-2xl w-full max-w-xl"
        >
          {/* <h2 className="text-2xl font-semibold mb-6 text-center text-white">Login</h2> */}
          <div className="mb-7 w-full h-fit flex flex-col items-center gap-y-4">
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
            <div className="flex flex-col">
              <span className="text-7xl font-semibold">Welcome back</span>
              <span className="text-2xl text-center text-gray-500">
                Please enter your details to sign in
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="username" className="block text-xl mb-2">
              Your username or email
            </label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="username or email"
              value={credentials.username}
              onChange={handleChange}
              className="w-full px-3 py-2   border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-xl mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="*******"
              value={credentials.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>
          <div className="mb-4 w-full flex justify-end">
            <NavLink to="/login/forgot-password">
              <span className="font-semibold text-xl hover:text-gray-600">
                Forgot password
              </span>
            </NavLink>
          </div>

          <button
            type="submit"
            disabled={isloading}
            className="cursor-pointer w-full bg-black hover:bg-gray-500 text-white py-2 text-2xl rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isloading ? "Logging in..." : "Login"}
          </button>

          <div className="mt-2 w-full h-6 flex items-center">
            {error && (
              <span className="text-red-400 mt-4 w-full text-xl text-center bg-gray-100 rounded px-2 py-1 border border-gray-300">
                {error}
              </span>
            )}
          </div>
        </form>
      </div>
      <PopupModal
        isOpen={!!apiError}
        onClose={() => setApiError("")}
        title="Login Error"
        message={apiError}
        buttonText="Close"
        type="error"
        theme="light"
      />
    </div>
  );
};

export default Login;
