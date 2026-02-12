import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://skilllens-ai.onrender.com";


  const handleSubmit = async () => {
    if (!file || !jd) return alert("Upload resume and paste JD");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jd);

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/analyze/`, {

        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Error analyzing resume");
    }

    setLoading(false);
  };

  return (


    <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] text-white flex justify-center items-start py-12 px-4">
      
      <div className="w-full max-w-3xl bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/10">

        <h1 className="text-4xl font-bold mb-6 text-center">
          SkillLens <span className="text-yellow-400">AI</span>
        </h1>

        <div className="space-y-4">

          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400"
          />

          <textarea
            placeholder="Paste Job Description..."
            rows={6}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            className="w-full p-4 rounded-lg bg-black/40 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold bg-yellow-500 hover:bg-yellow-400 text-black transition duration-200"
          >
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>

        </div>

        {result && (
          <div className="mt-10">

            <h2 className="text-2xl font-semibold mb-3">
              Match Score: {result.match_score}%
            </h2>

            <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden mb-3">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${result.match_score}%`,
                  backgroundColor:
                    result.match_score > 70
                      ? "#22c55e"
                      : result.match_score > 40
                      ? "#facc15"
                      : "#ef4444",
                }}
              />
            </div>

            <p className="mb-6 text-gray-400">
              {result.match_score > 70
                ? "Strong Fit 🔥"
                : result.match_score > 40
                ? "Moderate - Needs Improvement"
                : "High Risk - Major Skill Gaps"}
            </p>

            <div className="grid md:grid-cols-3 gap-6">

              <div>
                <h3 className="font-semibold text-green-400 mb-2">
                  Fully Matched
                </h3>
                <ul className="space-y-1 text-sm text-gray-300">
                  {result.fully_matched?.map((skill, i) => (
                    <li key={i}>• {skill}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-yellow-400 mb-2">
                  Partially Matched
                </h3>
                <ul className="space-y-1 text-sm text-gray-300">
                  {result.partially_matched?.map((skill, i) => (
                    <li key={i}>• {skill}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-red-400 mb-2">
                  Missing Skills
                </h3>
                <ul className="space-y-1 text-sm text-gray-300">
                  {result.fully_missing?.map((skill, i) => (
                    <li key={i}>• {skill}</li>
                  ))}
                </ul>
              </div>

            </div>

            {result.estimated_days_to_ready && (
              <div className="mt-8 p-4 rounded-lg bg-black/30 border border-gray-700">
                <h3 className="font-semibold text-yellow-400">
                  Estimated Days to Ready:
                </h3>
                <p className="text-lg mt-1">
                  {result.estimated_days_to_ready} days
                </p>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
);
}
