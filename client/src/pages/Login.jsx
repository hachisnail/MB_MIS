import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/authContext";
import Logo from "../assets/LOGO.png";

const Login = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isloading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true); 

    const success = await login(credentials);
    setIsLoading(false); 

    if (success) {
      navigate("/admin/dashboard");
    } else {
      setError("Invalid username or password!");
    }
  };


  return (
    <div className="flex  flex-col min-h-screen ">
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
          className="  px-8 pt-8 pb-4 rounded-lg shadow-2xl w-full max-w-sm"
        >
          {/* <h2 className="text-2xl font-semibold mb-6 text-center text-white">Login</h2> */}
          <div className="mb-7 w-full h-fit flex flex-col items-center gap-y-1">
            <div className="flex w-fit items-center gap-x-1">
              <img src={Logo} alt="Museo Bulawan Logo" className="w-7 h-auto" />
              <span className=" text-xl font-semibold">MIS</span>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-semibold">Welcome back</span>
              <span className="text-sm text-center text-gray-500">Please enter your details to sign in</span>
            </div>
          </div> 

          <div className="mb-2">
            <label htmlFor="username" className="block text-xs mb-1">Your username</label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="username"
              value={credentials.username}
              onChange={handleChange}
              className="w-full px-3 py-2   border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="password" className="block text-xs mb-1">Password</label>
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
          <div className="mb-2 w-full flex justify-end">
            <NavLink to="/forgot-password">
              <span className="font-semibold text-sm hover:text-gray-600">Forgot password</span>
            </NavLink>
          </div>

          <button
            type="submit"
            disabled={isloading}
            className="cursor-pointer w-full bg-black hover:bg-gray-500 text-white py-2 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isloading ? "Logging in..." : "Login"}
          </button>

          <div className="mt-1 w-full h-6 flex items-center">
            {error && <span className="text-red-400 w-full text-sm text-center">{error}</span>}
          </div>

        </form>
      </div>
    </div>
  );
};

export default Login;
