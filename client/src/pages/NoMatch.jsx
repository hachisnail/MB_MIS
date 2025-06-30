import { useNavigate } from 'react-router-dom';

const NoMatch = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className='flex items-center h-screen w-screen justify-center'>
      <div className='flex items-center flex-col'>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          className='w-40 h-40'
          stroke="#000000"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 20h-1a1 1 0 0 1 -1 -1v-10a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1v2" />
          <path d="M18 8v-3a1 1 0 0 0 -1 -1h-13a1 1 0 0 0 -1 1v12a1 1 0 0 0 1 1h9" />
          <path d="M19 22v.01" />
          <path d="M19 19a2.003 2.003 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" />
          <path d="M16 9h2" />
        </svg>

        <span className='text-3xl font-semibold'>Are you lost?</span>
        <div className='flex items-center gap-x-2'>
          <span>go back to</span>
          <button
            onClick={handleGoBack}
            className='hover:text-gray-500 underline'
          >
            previous page.
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoMatch;
