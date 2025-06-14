import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authAPI } from "../../services/api";

const RegistrationForm = ({ error, setError }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [position, setPosition] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    const minLength = 8;
    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/;

    if (pwd.length < minLength) {
      return `Password must be at least ${minLength} characters long.`;
    }

    if (!complexityRegex.test(pwd)) {
      return "Password must include uppercase, lowercase, number, and special character.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordError("");

    try {
      await authAPI.completeRegistration(token, {
        password,
        username,
        position,
      });
      navigate("/registration-success");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className=" min-h-fit min-w-fit px-10 pt-10 pb-4 rounded-lg space-y-4 w-[40rem] "
    > 
      <div className="mb-4 gap-y-2 flex flex-col">
        <label htmlFor="username" className=" text-xl">Username</label>
        <input
        id="username"
          type="text"
          placeholder=""
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2   border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          required
        />
      </div>

      <div className="mb-4 gap-y-2 flex flex-col">
        <label htmlFor="position" className=" text-xl">Position</label>
        <input
        id="position"
          type="text"
          placeholder=""
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="w-full px-3 py-2   border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          required
        />
      </div>

      <div className="mb-4 gap-y-2 flex flex-col">
        <label htmlFor="password" className=" text-xl">Password</label>
        <input
        id="password"
          type="text"
          placeholder=""
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2   border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          required
        />
      </div>

      <div className="mb-4 gap-y-2 flex flex-col">
        <label htmlFor="cpassword" className=" text-xl">Confirm Password</label>
        <input
        id="cpassword"
          type="password"
          placeholder=""
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2   border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          required
        />
      </div>
    


      <button
        type="submit"
        className="cursor-pointer w-full bg-black hover:bg-gray-500 text-white py-2 text-2xl rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Complete Registration
      </button>

      <div className="w-full h-6">
        {passwordError && (
          <p className="text-red-600 text-sm ">{passwordError}</p>
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    </form>
  );
};

export default RegistrationForm;
