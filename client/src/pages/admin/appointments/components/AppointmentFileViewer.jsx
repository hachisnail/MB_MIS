import React, { useState } from 'react';
import { handlePreview } from '@/components/commons';
import { useNavigate, useLocation } from 'react-router-dom';
import ContextMenu from '@/components/modals/ContextMenu';

const AppointmentFileViewer = ({
    requestLetterFiles = [],
    containerHeight = "h-[36rem]",
    fileBoxWidth = "w-full"
}) => {
    const [fileCurrentPage, setFileCurrentPage] = useState(1);
    const navigate = useNavigate();
    const location = useLocation();

    const SERVER_URL = import.meta.env.VITE_SERVER_URL;

    // Parse files if they come as JSON string
    const files = Array.isArray(requestLetterFiles)
        ? requestLetterFiles
        : (typeof requestLetterFiles === 'string'
            ? JSON.parse(requestLetterFiles || '[]')
            : []);

    // Pagination for files
    const fileItemsPerPage = 6;
    const totalPages = Math.ceil(files.length / fileItemsPerPage);
    const paginatedFiles = files.slice(
        (fileCurrentPage - 1) * fileItemsPerPage,
        fileCurrentPage * fileItemsPerPage
    );

    const handleNextPage = () => {
        if (fileCurrentPage < totalPages) {
            setFileCurrentPage(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (fileCurrentPage > 1) {
            setFileCurrentPage(prev => prev - 1);
        }
    };

    if (!files || files.length === 0) {
        return (
            <div className="w-full">
                <div className="text-2xl font-medium text-gray-900 mb-4">Request Letter Files</div>
                <div className="bg-gray-100 p-10 rounded-lg text-center">
                    <svg
                        className="w-16 h-16 text-gray-400 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <div className="text-2xl text-gray-600">No files uploaded</div>
                    <div className="text-xl text-gray-500 mt-2">No request letter files were submitted with this appointment.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="text-2xl font-medium text-gray-900 mb-4">Request Letter Files</div>

            {/* File container */}
            <div className={`${containerHeight} flex flex-col rounded-xl shadow-sm shadow-gray-400 ${fileBoxWidth}`}>
                {/* Header */}
                <div className="h-fit w-full flex flex-col items-center rounded-t-xl justify-center bg-[#1D1911]">
                    <span className="my-3 text-white text-xl font-semibold">
                        Attached Files ({files.length})
                    </span>
                    <div className="h-5 w-full bg-white rounded-t-xl"></div>
                </div>

                {/* Files grid */}
                <div className="w-full p-4 h-full flex flex-col overflow-hidden rounded-b-xl bg-white shadow-[inset_0_8px_12px_rgba(0,0,0,0.25),inset_0_-8px_12px_rgba(0,0,0,0.50)]">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
                        {paginatedFiles.map((filename, index) => {
                            const fileUrl = `${SERVER_URL}/uploads/private/request-letter/${filename}`;
                            const fileExtension = filename.split('.').pop()?.toLowerCase() || '';

                            return (
                                <ContextMenu
                                    className="w-full h-fit"
                                    key={`${filename}-${index}`}
                                    menuItems={[
                                        {
                                            label: "Preview",
                                            onClick: () => {
                                                handlePreview(
                                                    navigate,
                                                    `${location.pathname}/view`,
                                                    fileUrl,
                                                    filename,
                                                    fileExtension
                                                );
                                            },
                                        },
                                        {
                                            label: "Download",
                                            onClick: () => {
                                                const link = document.createElement('a');
                                                link.href = fileUrl;
                                                link.download = filename;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            },
                                        },
                                    ]}
                                >
                                    <div
                                        className="flex w-full rounded-2xl py-6 px-3 border border-gray-400 flex-col items-center cursor-pointer hover:scale-105 transition-transform bg-white hover:bg-gray-50"
                                        onClick={() => {
                                            // Use handlePreview for ALL files (images and documents)
                                            handlePreview(
                                                navigate,
                                                `${location.pathname}/view`,
                                                fileUrl,
                                                filename,
                                                fileExtension
                                            );
                                        }}
                                    >
                                        {/* File icon based on type */}
                                        {['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension) ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1}
                                                stroke="currentColor"
                                                className="w-12 h-12 text-green-600"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                            </svg>
                                        ) : fileExtension === 'pdf' ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1}
                                                stroke="currentColor"
                                                className="w-12 h-12 text-red-600"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                            </svg>
                                        ) : ['doc', 'docx'].includes(fileExtension) ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1}
                                                stroke="currentColor"
                                                className="w-12 h-12 text-blue-600"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                            </svg>
                                        ) : (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1}
                                                stroke="currentColor"
                                                className="w-12 h-12 text-gray-600"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 18.75H5.625c-.621 0-1.125-.504-1.125-1.125V5.625c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v1.5h2.625c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125Z" />
                                            </svg>
                                        )}

                                        <p
                                            title={filename}
                                            className="w-full mt-3 text-sm font-medium text-gray-800 truncate text-center px-1"
                                        >
                                            {filename}
                                        </p>

                                        <p className="text-xs uppercase text-gray-500 mt-1">
                                            {fileExtension}
                                        </p>
                                    </div>
                                </ContextMenu>
                            );
                        })}
                    </div>

                    {/* Pagination controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={handlePrevPage}
                                disabled={fileCurrentPage === 1}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${fileCurrentPage === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Previous
                            </button>

                            <span className="text-sm text-gray-600">
                                Page {fileCurrentPage} of {totalPages}
                            </span>

                            <button
                                onClick={handleNextPage}
                                disabled={fileCurrentPage === totalPages}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${fileCurrentPage === totalPages
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default AppointmentFileViewer;
