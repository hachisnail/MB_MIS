// src/pages/RegistrationSuccess.jsx
import { Link } from 'react-router-dom';

const RegistrationSuccess = () => (
  <div className="min-h-screen w-screen min-w-fit flex items-center justify-center bg-gray-50">
    <div className=" w-full bg-white p-8 rounded-lg shadow-lg text-center">
      <div className="text-6xl mb-4 text-green-500">✓</div>
      <h1 className="text-2xl font-bold mb-2">Registration Successful!</h1>
      <p className="mb-6 text-gray-600">
        Your account has been created successfully
      </p>
      <Link 
        to="/login" 
        className="inline-block bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition"
      >
        Go to Login
      </Link>
    </div>
  </div>
);

export default RegistrationSuccess;