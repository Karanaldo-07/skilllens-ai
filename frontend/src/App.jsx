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
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>SkillLens AI</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <textarea
        placeholder="Paste Job Description..."
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        rows={8}
        cols={80}
      />

      <br /><br />

      <button onClick={handleSubmit}>
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>

      {result && (
        <div style={{ marginTop: "30px" }}>
          <h2>Match Score: {result.match_score}%</h2>

          <div style={{
            height: "20px",
            width: "100%",
            backgroundColor: "#ddd",
            borderRadius: "10px",
            overflow: "hidden",
            marginBottom: "10px"
          }}>
            <div style={{
              height: "100%",
              width: `${result.match_score}%`,
              backgroundColor: result.match_score > 70 ? "green" :
                              result.match_score > 40 ? "orange" : "red"
            }} />
          </div>

          <p><b>{result.readiness_level}</b></p>

          <h3>Fully Matched</h3>
          <ul>
            {result.fully_matched.map((skill, i) => (
              <li key={i}>{skill}</li>
            ))}
          </ul>

          <h3>Partially Matched</h3>
          <ul>
            {result.partially_matched.map((skill, i) => (
              <li key={i}>{skill}</li>
            ))}
          </ul>

          <h3>Missing Skills</h3>
          <ul>
            {result.fully_missing.map((skill, i) => (
              <li key={i}>{skill}</li>
            ))}
          </ul>

          <h3>Estimated Days to Ready</h3>
          <p>{result.estimated_days_to_ready} days</p>
        </div>
      )}
    </div>
  );
}

export default App;
