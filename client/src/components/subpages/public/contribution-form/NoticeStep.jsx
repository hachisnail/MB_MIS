import { useNavigate } from "react-router-dom";

const NoticeStep = ({ onNext,initialData }) => {
  const navigate = useNavigate();
  return (
    <div className="w-[85rem] h-[46rem] flex flex-col items-center justify-between ">
      <div className="w-full h-[40rem] flex flex-col justify-center px-20 shadow-md rounded-lg shadow-gray-500 gap-y-15">
        <div className="w-full h-fit flex flex-col">
          <span className="text-7xl font-light font-hina">NOTICE</span>
        </div>
        <div className="w-full h-fit flex flex-col">
          <span className="w-full h-full text-3xl text-justify font-hind">
            {" "}
            &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; In addition to preserving
            your historic objects it is important to remember to preserve the
            history or story that goes with them. For example, the uniform worn
            by your great grand father is just a uniform if the story is lost.
            Take the time to write down the story that goes with your objects;
            include any background details that would help our team understand
            the significance of the item.
          </span>
        </div>
        <div className="w-full h-fit flex flex-col items-end">
          <span className="font-hina text-4xl w-fit">
            “The Story Matters as Much as the Artifact”
          </span>
        </div>
      </div>

      <div className="w-full h-15 flex justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-44 h-15 rounded-md bg-black text-white text-2xl hover:bg-gray-800"
        >
          Return
        </button>
        <div className="flex gap-x-5 w-fit h-fit items-center">
          <span className="text-2xl font-semibold">Proceed to the form.</span>
        <button
          onClick={() => onNext(initialData)}
          className="w-30 h-15 flex items-center justify-center rounded-md bg-black text-white text-2xl hover:bg-gray-800"
        >
               <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 12l-10 0" />
                      <path d="M20 12l-4 4" />
                      <path d="M20 12l-4 -4" />
                      <path d="M4 4l0 16" />
                    </svg>
        </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeStep;
