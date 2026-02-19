import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ScoreCircle from "../components/ScoreCircle";
import UploadBox from "../components/UploadBox";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function Dashboard() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // ================= FETCH HISTORY =================
  const fetchHistory = async () => {
    if (!token) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/history/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (Array.isArray(data)) setHistory(data);
      else setHistory([]);
    } catch (error) {
      console.error(error);
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // ================= ANALYZE =================
  const handleSubmit = async () => {
    if (!file || !jd) {
      toast.error("Upload resume and paste JD");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jd);

    const loadingToast = toast.loading("AI is analyzing your resume...");

    try {
      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const response = await fetch("http://127.0.0.1:8000/analyze/", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();

      setResult(data);

      if (token) fetchHistory();

      // 🎉 Confetti if high score
      if (data.match_score > 80) {
        confetti({
          particleCount: 120,
          spread: 80,
        });
      }

      toast.success("Analysis Complete!", { id: loadingToast });

    } catch (error) {
      toast.error("Analysis failed", { id: loadingToast });
    }

    setLoading(false);
  };

  // ================= DELETE =================
  const deleteItem = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8000/history/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchHistory();
    } catch (error) {
      console.error(error);
    }
  };

  // ================= DOWNLOAD REPORT =================
  const downloadReport = async () => {
    if (!result) {
      toast.error("Run analysis first");
      return;
    }

    if (!token) {
      toast.error("Login required to download report");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("match_score", result.match_score || 0);
      formData.append("readiness", result.readiness_level || "");
      formData.append(
        "missing_skills",
        (result.fully_missing || []).join(", ")
      );
      formData.append(
        "days",
        result.estimated_days_to_ready || 0
      );

      const response = await fetch(
        "http://127.0.0.1:8000/generate-report/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "SkillLens_Report.pdf";
      a.click();

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen text-white p-6 md:p-10 bg-gradient-to-br from-[#020617] to-[#0f172a]">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        {token && (
          <button
            onClick={logout}
            className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        )}
      </div>

      {/* ================= UPLOAD SECTION ================= */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 shadow-lg"
      >
        <UploadBox setFile={setFile} />

        <textarea
          placeholder="Paste Job Description"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          className="w-full p-3 text-black rounded mt-4"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2 rounded-lg mt-4 font-semibold disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>

        {/* AI LOADER */}
        {loading && (
          <div className="mt-6">
            <div className="relative w-full h-2 bg-gray-800 rounded">
              <motion.div
                className="absolute top-0 left-0 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2 }}
              />
            </div>

            <p className="text-center mt-3 text-purple-400 animate-pulse">
              AI is scanning your resume...
            </p>
          </div>
        )}
      </motion.div>

      {/* ================= RESULT SECTION ================= */}
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 mb-8 shadow-lg"
        >
          <ScoreCircle score={result.match_score} />

          <p className="text-center mt-4 text-yellow-400 font-semibold">
            {result.readiness_level}
          </p>

          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {result.fully_missing?.map((skill, i) => (
              <span
                key={i}
                className="bg-red-500/20 text-red-400 px-3 py-1 rounded"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* AI Suggestions */}
          {result?.suggestions && (
            <div className="mt-8 p-6 rounded-xl bg-black/40 border border-gray-700">
              <h3 className="text-lg font-semibold text-purple-400 mb-3">
                AI Improvement Suggestions
              </h3>

              <ul className="space-y-2 text-gray-300">
                {result.suggestions.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={downloadReport}
              className="bg-green-500 px-6 py-2 rounded-lg mt-6 hover:bg-green-600"
            >
              Download Report
            </button>
          </div>
        </motion.div>
      )}

      {/* ================= HISTORY ================= */}
      {token && (
        <>
          <h2 className="text-xl mb-4 font-semibold">
            Analysis History
          </h2>

          {history.length === 0 && (
            <p className="text-gray-400">No analysis yet.</p>
          )}

          {history.map((item) => (
            <div
              key={item.id}
              className="mb-4 border-b border-gray-700 pb-2 flex justify-between"
            >
              <div>
                <p>{item.resume_name}</p>
                <p>{item.match_score}%</p>
                <p>{item.estimated_days} days</p>
              </div>

              <button
                onClick={() => deleteItem(item.id)}
                className="bg-red-500 px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
