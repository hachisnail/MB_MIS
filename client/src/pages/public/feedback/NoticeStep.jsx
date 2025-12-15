import { useNavigate } from "react-router-dom";

const NoticeStep = ({ onNext }) => {
    const navigate = useNavigate();

    return (
        <div className="w-[85rem] h-[46rem] flex flex-col items-center justify-between">
            <div className="w-full h-[40rem] flex flex-col justify-center px-20 shadow-md rounded-lg shadow-gray-500 gap-y-15">
                <div className="w-full h-fit flex flex-col">
                    <span className="text-8xl font-light font-hina">FEEDBACK</span>
                </div>
                <div className="w-full h-fit flex flex-col">
                    <span className="w-full h-full text-4xl text-justify font-hind">
                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; We appreciate your visit to Museo Bulawan! Your feedback
                        is invaluable in helping us improve our services and create better experiences for all our visitors.
                        The survey takes just a few minutes to complete. Thank you for taking the time to share your thoughts!
                    </span>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-x-3">
                        <i className="text-3xl fa-solid fa-star text-[#FFB800] mt-1"></i>
                        <div>
                            <h3 className="font-bold text-3xl">Your Input Matters</h3>
                            <p className="text-gray-600 text-2xl">Help us understand what we're doing well and where we can improve</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-x-3">
                        <i className="text-3xl fa-solid fa-lock text-[#524433] mt-1"></i>
                        <div>
                            <h3 className="font-bold text-3xl">Privacy</h3>
                            <p className="text-gray-600 text-2xl">Your responses are confidential and used only for service improvement</p>
                        </div>
                    </div>
                </div>

                <div className="w-full h-fit flex flex-col items-end">
                    <span className="font-hina text-5xl w-fit">
                        "Your Voice Counts"
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
                    <span className="text-2xl font-semibold">Start the survey.</span>
                    <button
                        onClick={() => onNext()}
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
