import { useNavigate } from "react-router-dom";

const NoticeStep = ({ onNext, initialData }) => {
    const navigate = useNavigate();

    return (
        <div className="w-[85rem] h-[46rem] flex flex-col items-center justify-between">
            <div className="w-full h-[40rem] flex flex-col justify-center px-20 shadow-md rounded-lg shadow-gray-500 gap-y-15">
                <div className="w-full h-fit flex flex-col">
                    <span className="text-7xl font-light font-hina">NOTICE</span>
                </div>
                <div className="w-full h-fit flex flex-col">
                    <span className="w-full h-full text-3xl text-justify font-hind">
                        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Welcome to our online booking system! Scheduling your
                        appointment is quick and easy. Simply fill out the form ahead with your
                        details and preferred date/time, and we'll confirm your appointment
                        shortly. Please ensure all required information is provided for a smooth booking process.
                    </span>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-x-3">
                        <i className="text-2xl fa-solid fa-clock text-[#524433] mt-1"></i>
                        <div>
                            <h3 className="font-bold text-2xl">Museum Hours</h3>
                            <p className="text-gray-600 text-xl">Open Daily 9:00am-5:00pm, Monday-Friday</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-x-3">
                        <i className="text-2xl fa-solid fa-location-dot text-[#524433] mt-1"></i>
                        <div>
                            <h3 className="font-bold text-2xl">Location</h3>
                            <p className="text-gray-600 text-xl">Camarines Norte Provincial Capitol Grounds, Daet Philippines</p>
                        </div>
                    </div>
                </div>

                <div className="w-full h-fit flex flex-col items-end">
                    <span className="font-hina text-4xl w-fit">
                        "Welcome to Museo Bulawan"
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
