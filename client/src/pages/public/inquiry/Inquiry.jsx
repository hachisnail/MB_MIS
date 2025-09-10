import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import axiosClient from "@/lib/axiosClient";
import { LoadingSpinner } from "../../../components/commons";

export default function Inquiry() {
  const { uuid } = useParams();            
  const [searchParams] = useSearchParams();
  const sig = searchParams.get("sig");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`auth/contributions/session/${uuid}`, {
          params: { sig },
        });
        setSessionData(res.data);
      } catch (err) {
        setError("Invalid or expired interaction link.");
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [uuid, sig]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {

    navigate(-1);
    return (
      <div className="flex items-center justify-center h-screen text-red-500 text-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold mb-4 text-center">
          Contribution Inquiry
        </h1>

        <p className="mb-6 text-gray-700 text-center">
          This is your dedicated interaction space with Museo Bulawan staff
          regarding your contribution.
        </p>

        {/* Contribution details */}
        {sessionData?.contribution && (
          <div className="space-y-3 mb-6">
            <p><b>Artifact:</b> {sessionData.contribution.ContributionArtifact?.title}</p>
            <p><b>Status:</b> {sessionData.contribution.status}</p>
            <p><b>Type:</b> {sessionData.contribution.contribution_type}</p>
          </div>
        )}

        {/* Example interaction zone */}
        <div className="border-t pt-5 space-y-4">
          <h2 className="text-xl font-semibold">Messages</h2>
          <div className="h-40 border rounded-md p-3 overflow-y-auto bg-gray-50">
            {/* TODO: replace with real chat/messages */}
            <p className="text-gray-500">No messages yet.</p>
          </div>

          <textarea
            placeholder="Write a message to the staff..."
            className="w-full border rounded-md p-2 h-20 focus:ring focus:ring-indigo-500 focus:outline-none"
          ></textarea>

          <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
