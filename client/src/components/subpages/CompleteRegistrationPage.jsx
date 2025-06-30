import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authAPI } from "../../services/api";
import RegistrationForm from "./RegistrationForm";
import Logo from "../../assets/LOGO.png";

const CompleteRegistrationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const validateToken = async () => {
      try {
        const { data } = await authAPI.validateToken(token);
        setValid(data.valid);
        setInvitation(data.invitation);
      } catch (err) {
        setError("Failed to validate invitation token");
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (password) => {
    try {
      await authAPI.completeRegistration(token, { password });
      navigate("/registration-success");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (!valid) {
    return (
      // <div className="w-screen h-screen flex items-center justify-center">

      //   <div className="w-[40rem] h-[50rem]">
      //   <h2 className="text-xl font-bold text-red-600 mb-4">
      //     Invalid Invitation
      //   </h2>
      //   <p>The invitation link is invalid or has expired.</p>
      //   <p>Please contact your administrator for a new invitation.</p>
      //   </div>

      // </div>
      <div className="w-screen items-center justify-center h-screen mx-auto p-6 flex flex-col">
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center text-center max-w-xl w-full space-y-6">
            <div className="flex flex-col justify-center items-center">
            
            <div className="flex items-center space-x-3">
              <img
                src={Logo}
                alt="Museo Bulawan Logo"
                className="w-12 h-12 object-contain"
              />
              <span className="text-4xl font-semibold text-gray-800">
                MIS
              </span>
            </div>

            <h1 className="text-6xl font-semibold text-red-600 mb-2">
              Invalid Invitation
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed">
              The invitation link is either{" "}
              <span className="font-semibold">invalid</span> or has{" "}
              <span className="font-semibold">expired</span>.
              <br />
              Please contact your administrator to request a new invitation.
            </p>
</div>
            <button
              onClick={() => (navigate("/"))} 
            className="cursor-pointer w-full bg-black hover:bg-gray-500 text-white py-2 text-2xl rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"

            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen items-center justify-center h-screen mx-auto p-6 flex flex-col">
      <div className="w-fit h-fit rounded-lg shadow-2xl flex items-center flex-col">
        <div className="flex">
          <img src={Logo} alt="Museo Bulawan Logo" className="w-11 h-auto" />
          <span className="text-4xl font-semibold">MIS</span>
        </div>
        <span className="text-2xl w-fit text-gray-500">
          Complete Registration for
        </span>
        <span className="text-4xl">
          <strong>{invitation.email}</strong>
        </span>
        <RegistrationForm onSubmit={handleSubmit} error={error} />
      </div>
    </div>
  );
};

export default CompleteRegistrationPage;
