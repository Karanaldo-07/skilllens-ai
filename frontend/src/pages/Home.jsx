import { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import ParticleBg from "../components/ParticlesBg";
import UploadBox from "../components/UploadBox";
import ScoreCircle from "../components/ScoreCircle";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Chart } from "chart.js/auto";



export default function Home() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Parsing resume");
  const uploadSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

  const token = localStorage.getItem("token");

  // Cycle through loading messages
  useEffect(() => {
    if (!loading) return;

    const messages = ["Parsing resume", "Matching skills", "Generating roadmap"];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      setLoadingMessage(messages[currentIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, [loading]);

  // ================= ANALYZE =================
  const handleAnalyze = async () => {
    if (!file || !jd.trim()) {
      toast.error("Please upload resume and paste job description");
      return;
    }

    setLoading(true);
    setLoadingMessage("Parsing resume");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jd);
    if (jobRole.trim()) {
      formData.append("job_role", jobRole.trim());
    }

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

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();

      setResult(data);

      // 🎉 Confetti if high score
      if (data.match_score > 80) {
        confetti({
          particleCount: 120,
          spread: 80,
        });
      }

      toast.success("Analysis Complete!", { id: loadingToast });

      // Scroll to results using ref
      setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

    } catch (error) {
      toast.error("Analysis failed. Please try again.", { id: loadingToast });
      console.error("Analysis error:", error);
    }

    setLoading(false);
  };

  // ================= RESET =================
  const handleReset = () => {
    setFile(null);
    setJd("");
    setJobRole("");
    setResult(null);
    setLoading(false);
    
    // Scroll back to upload section
    setTimeout(() => {
      uploadSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // ================= CHART GENERATION HELPERS =================
  const generateSkillMatchChart = (result) => {
    // Chart.js components are already registered at module level
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");

    const matchedCount = result.fully_matched?.length || 0;
    const partialCount = result.partially_matched?.length || 0;
    const missingCount = result.fully_missing?.length || 0;
    const total = matchedCount + partialCount + missingCount;

    let chart = null;
    try {
      chart = new Chart(ctx, {

        type: "bar",
        data: {
          labels: ["Matched", "Partially Matched", "Missing"],
          datasets: [
            {
              label: "Skills",
              data: [matchedCount, partialCount, missingCount],
              backgroundColor: [
                "rgba(34, 197, 94, 0.8)",
                "rgba(234, 179, 8, 0.8)",
                "rgba(239, 68, 68, 0.8)",
              ],
              borderColor: [
                "rgba(34, 197, 94, 1)",
                "rgba(234, 179, 8, 1)",
                "rgba(239, 68, 68, 1)",
              ],
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            duration: 0, // Disable animation for faster rendering
          },
          plugins: {
            legend: {
              display: false,
            },
            title: {
              display: true,
              text: "Skill Match Analysis",
              font: {
                size: 16,
                weight: "bold",
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
              },
            },
          },
        },
      });

      // Force chart update and wait a tick for rendering
      chart.update("none");
      
      // Small delay to ensure chart is rendered
      return new Promise((resolve) => {
        setTimeout(() => {
          const imageData = canvas.toDataURL("image/png");
          if (chart) chart.destroy(); // Clean up
          resolve(imageData);
        }, 100);
      });
    } catch (error) {
      console.error("Chart generation error:", error);
      if (chart) chart.destroy();
      // Return a fallback empty canvas
      return Promise.resolve(canvas.toDataURL("image/png"));
    }
  };

  const generateReadinessChart = (score) => {
    // Chart.js components are already registered at module level
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");

    let chart = null;
    try {
      chart = new Chart(ctx, {

        type: "doughnut",
        data: {
          labels: ["Score", "Remaining"],
          datasets: [
            {
              data: [score, 100 - score],
              backgroundColor: [
                score >= 80
                  ? "rgba(34, 197, 94, 0.8)"
                  : score >= 60
                  ? "rgba(234, 179, 8, 0.8)"
                  : "rgba(239, 68, 68, 0.8)",
                "rgba(229, 231, 235, 0.3)",
              ],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            duration: 0, // Disable animation for faster rendering
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });

      // Force chart update and wait a tick for rendering
      chart.update("none");
      
      // Small delay to ensure chart is rendered
      return new Promise((resolve) => {
        setTimeout(() => {
          const imageData = canvas.toDataURL("image/png");
          if (chart) chart.destroy(); // Clean up
          resolve(imageData);
        }, 100);
      });
    } catch (error) {
      console.error("Chart generation error:", error);
      if (chart) chart.destroy();
      // Return a fallback empty canvas
      return Promise.resolve(canvas.toDataURL("image/png"));
    }
  };

  // ================= DOWNLOAD PDF (UPGRADED) =================
  const handleDownloadPDF = async () => {
    if (!result) {
      toast.error("No analysis results available");
      return;
    }

    try {
      const loadingToast = toast.loading("Generating professional PDF report...");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const totalPages = 4;

      // Helper function to add footer and page numbers
      const addFooter = (pageNum) => {
        doc.setPage(pageNum);
        const footerY = pageHeight - 15;

        // Footer line
        doc.setDrawColor(139, 92, 246);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY, pageWidth - margin, footerY);

        // Footer text
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text(
          "Generated by SkillLens AI • AI Career Intelligence Platform",
          pageWidth / 2,
          footerY + 5,
          { align: "center" }
        );

        // Page number
        doc.text(
          `Page ${pageNum} of ${totalPages}`,
          pageWidth - margin,
          footerY + 5,
          { align: "right" }
        );
      };

      // Helper function to add section header
      const addSectionHeader = (text, yPos, color = [139, 92, 246]) => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...color);
        doc.text(text, margin, yPos);

        // Colored divider line
        doc.setDrawColor(...color);
        doc.setLineWidth(1);
        doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);
        return yPos + 8;
      };

      // ================= PAGE 1: COVER PAGE =================
      doc.addPage();
      let yPos = 30;

      // Logo/Branding Section
      doc.setFillColor(139, 92, 246);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 40, "F");
      yPos += 15;

      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("SkillLens AI", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Resume Analysis Report",
        pageWidth / 2,
        yPos,
        { align: "center" }
      );
      yPos += 20;

      doc.setFillColor(255, 255, 255);
      doc.setTextColor(0, 0, 0);

      // Subtitle
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(
        "AI-powered skill gap and readiness analysis",
        pageWidth / 2,
        yPos,
        { align: "center" }
      );
      yPos += 30;

      // User Summary Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Analysis Summary", margin, yPos);
      yPos += 10;

      // Target Job Role
      if (jobRole.trim()) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Target Role: ${jobRole.trim()}`, margin, yPos);
        yPos += 7;
      }

      // Timestamp
      const timestamp = new Date().toLocaleString();
      doc.text(`Generated: ${timestamp}`, margin, yPos);
      yPos += 20;

      // Large Readiness Score Display
      const readinessChartImg = await generateReadinessChart(result.match_score);
      doc.addImage(readinessChartImg, "PNG", pageWidth / 2 - 50, yPos, 100, 100);
      yPos += 110;

      doc.setFontSize(32);
      doc.setFont("helvetica", "bold");
      const scoreColor =
        result.match_score >= 80
          ? [34, 197, 94]
          : result.match_score >= 60
          ? [234, 179, 8]
          : [239, 68, 68];
      doc.setTextColor(...scoreColor);
      doc.text(`${result.match_score}%`, pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 10;

      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Readiness Level: ${result.readiness_level}`,
        pageWidth / 2,
        yPos,
        { align: "center" }
      );

      addFooter(1);

      // ================= PAGE 2: SKILLS ANALYSIS =================
      doc.addPage();
      yPos = 30;

      yPos = addSectionHeader("Skills Detected", yPos, [79, 70, 229]);

      if (result.resume_skills && result.resume_skills.length > 0) {
        const skillsData = result.resume_skills.map((skill) => {
          const skillText = typeof skill === "string" ? skill : skill?.name || skill?.skill || String(skill);
          return [skillText];
        });
        doc.autoTable({
          startY: yPos,
          head: [["Skill"]],
          body: skillsData,
          theme: "striped",
          headStyles: { fillColor: [79, 70, 229] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 9 },
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }

      // Skill Match Chart
      const skillChartImg = await generateSkillMatchChart(result);
      doc.addImage(skillChartImg, "PNG", margin, yPos, pageWidth - 2 * margin, 120);
      yPos += 130;

      // Skill Match Levels Table
      yPos = addSectionHeader("Skill Match Breakdown", yPos, [139, 92, 246]);

      const matchData = [
        [
          "Matched Skills",
          result.fully_matched?.length || 0,
          result.fully_matched
            ?.map((skill) => (typeof skill === "string" ? skill : skill?.name || skill?.skill || String(skill)))
            .join(", ") || "None",
        ],
        [
          "Partially Matched",
          result.partially_matched?.length || 0,
          result.partially_matched
            ?.map((skill) => (typeof skill === "string" ? skill : skill?.name || skill?.skill || String(skill)))
            .join(", ") || "None",
        ],
        [
          "Missing Skills",
          result.fully_missing?.length || 0,
          result.fully_missing
            ?.map((skill) => (typeof skill === "string" ? skill : skill?.name || skill?.skill || String(skill)))
            .join(", ") || "None",
        ],
      ];

      doc.autoTable({
        startY: yPos,
        head: [["Category", "Count", "Skills"]],
        body: matchData,
        theme: "striped",
        headStyles: { fillColor: [139, 92, 246] },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30, halign: "center" },
          2: { cellWidth: "auto" },
        },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8 },
      });

      addFooter(2);

      // ================= PAGE 3: GAPS & SUGGESTIONS =================
      doc.addPage();
      yPos = 30;

      // Missing Skills
      if (result.fully_missing && result.fully_missing.length > 0) {
        yPos = addSectionHeader("Skill Gaps", yPos, [239, 68, 68]);

        const missingData = result.fully_missing.map((skill) => {
          const skillText = typeof skill === "string" ? skill : skill?.name || skill?.skill || String(skill);
          return [skillText];
        });
        doc.autoTable({
          startY: yPos,
          head: [["Missing Skill"]],
          body: missingData,
          theme: "striped",
          headStyles: { fillColor: [239, 68, 68] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 9 },
        });
        yPos = doc.lastAutoTable.finalY + 20;
      }

      // AI Suggestions
      if (result.suggestions && result.suggestions.length > 0) {
        yPos = addSectionHeader("AI Improvement Suggestions", yPos, [139, 92, 246]);

        const suggestionsData = result.suggestions.map((item, index) => {
          const suggestionText =
            typeof item === "string"
              ? item
              : item?.text || item?.suggestion || item?.message || String(item);
          return [`${index + 1}. ${suggestionText}`];
        });
        doc.autoTable({
          startY: yPos,
          head: [["Recommendation"]],
          body: suggestionsData,
          theme: "striped",
          headStyles: { fillColor: [139, 92, 246] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 9 },
        });
      }

      addFooter(3);

      // ================= PAGE 4: LEARNING ROADMAP =================
      doc.addPage();
      yPos = 30;

      if (result.roadmap && result.roadmap.length > 0) {
        yPos = addSectionHeader(
          `Learning Roadmap (${result.estimated_days_to_ready} days)`,
          yPos,
          [139, 92, 246]
        );

        const roadmapData = result.roadmap.map((item, index) => {
          // Handle both string and object formats
          const taskText =
            typeof item === "string"
              ? item
              : item?.skill
              ? `${item.skill}${item.duration_days ? ` (${item.duration_days} days)` : ""}${item.tasks && Array.isArray(item.tasks) ? ` - ${item.tasks.join(", ")}` : ""}`
              : String(item);
          return [`Step ${index + 1}`, taskText];
        });
        doc.autoTable({
          startY: yPos,
          head: [["Step", "Task"]],
          body: roadmapData,
          theme: "striped",
          headStyles: { fillColor: [139, 92, 246] },
          columnStyles: {
            0: { cellWidth: 30, halign: "center" },
            1: { cellWidth: "auto" },
          },
          margin: { left: margin, right: margin },
          styles: { fontSize: 9 },
        });
      }

      addFooter(4);

      // Save PDF
      doc.save("SkillLens_AI_Report.pdf");
      toast.success("Professional PDF report downloaded!", { id: loadingToast });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <ParticleBg />

      <Navbar />

      {/* HERO SECTION */}
      <div className="flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl w-full"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Analyze Your Resume with{" "}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
              AI
            </span>
          </h1>

          <p className="text-gray-400 mb-12 text-lg md:text-xl">
            Get instant skill gap analysis, readiness score, and roadmap.
          </p>

          {/* UPLOAD SECTION */}
          <motion.div
            ref={uploadSectionRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl mx-auto mb-8"
          >
            {/* Target Job Role Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Job Role <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Data Scientist, Frontend Developer"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                disabled={loading}
                className="w-full p-3 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <UploadBox setFile={setFile} file={file} disabled={loading} />

            <textarea
              placeholder="Paste Job Description Here..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              disabled={loading}
              className="w-full p-4 mt-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              rows="6"
            />

            <motion.button
              whileHover={{ scale: loading ? 1 : 1.05 }}
              whileTap={{ scale: loading ? 1 : 0.95 }}
              onClick={handleAnalyze}
              disabled={loading || !file || !jd.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 rounded-lg mt-6 font-semibold shadow-lg hover:shadow-purple-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Analyzing..." : "Analyze Resume"}
            </motion.button>

            {/* ENHANCED LOADING STATE */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                    <motion.div
                      className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Analyzing Resume...
                </h3>
                <motion.p
                  key={loadingMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-purple-400"
                >
                  {loadingMessage}
                </motion.p>
                <div className="relative w-full h-2 bg-gray-800 rounded mt-4">
                  <motion.div
                    className="absolute top-0 left-0 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2 }}
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* RESULTS SECTION */}
        {result && (
          <motion.div
            ref={resultsSectionRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-4xl mx-auto px-4 mb-16"
          >
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-8 shadow-lg">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
                  Your Analysis Results
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownloadPDF}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-green-500/40 transition flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download Report
                </motion.button>
              </div>
              
              <ScoreCircle score={result.match_score} />

              <p className="text-center mt-6 text-yellow-400 font-semibold text-xl">
                {result.readiness_level}
              </p>

              {/* Skills Detected */}
              {result.resume_skills && result.resume_skills.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-purple-400 mb-3">
                    Skills Detected
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.resume_skills.map((skill, i) => {
                      // Handle both string and object formats
                      const skillText = typeof skill === "string" ? skill : skill?.name || skill?.skill || String(skill);
                      return (
                        <span
                          key={i}
                          className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm"
                        >
                          {skillText}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fully Matched Skills */}
              {result.fully_matched && result.fully_matched.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-green-400 mb-3">
                    Matched Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.fully_matched.map((skill, i) => {
                      // Handle both string and object formats
                      const skillText = typeof skill === "string" ? skill : skill?.name || skill?.skill || String(skill);
                      return (
                        <span
                          key={i}
                          className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm"
                        >
                          {skillText}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Partially Matched Skills */}
              {result.partially_matched && result.partially_matched.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                    Partially Matched Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.partially_matched.map((skill, i) => {
                      // Handle both string and object formats
                      const skillText = typeof skill === "string" ? skill : skill?.name || skill?.skill || String(skill);
                      return (
                        <span
                          key={i}
                          className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-sm"
                        >
                          {skillText}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {result.fully_missing && result.fully_missing.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-red-400 mb-3">
                    Missing Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.fully_missing.map((skill, i) => {
                      // Handle both string and object formats
                      const skillText = typeof skill === "string" ? skill : skill?.name || skill?.skill || String(skill);
                      return (
                        <span
                          key={i}
                          className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-sm"
                        >
                          {skillText}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Roadmap */}
              {result.roadmap && result.roadmap.length > 0 && (
                <div className="mt-8 p-6 rounded-xl bg-black/40 border border-gray-700">
                  <h3 className="text-lg font-semibold text-purple-400 mb-3">
                    Learning Roadmap ({result.estimated_days_to_ready} days)
                  </h3>
                  <ul className="space-y-2 text-gray-300">
                    {result.roadmap.map((item, index) => {
                      // Handle both string and object formats
                      const displayText =
                        typeof item === "string"
                          ? item
                          : item?.skill
                          ? `${item.skill}${item.duration_days ? ` (${item.duration_days} days)` : ""}${item.tasks && Array.isArray(item.tasks) ? ` - ${item.tasks.join(", ")}` : ""}`
                          : JSON.stringify(item);
                      
                      return (
                        <li key={index} className="flex items-start">
                          <span className="text-purple-400 mr-2">•</span>
                          <span>{displayText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* AI Suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="mt-8 p-6 rounded-xl bg-black/40 border border-gray-700">
                  <h3 className="text-lg font-semibold text-purple-400 mb-3">
                    AI Improvement Suggestions
                  </h3>
                  <ul className="space-y-2 text-gray-300">
                    {result.suggestions.map((item, index) => {
                      // Handle both string and object formats
                      const displayText =
                        typeof item === "string"
                          ? item
                          : item?.text || item?.suggestion || item?.message || JSON.stringify(item);
                      
                      return (
                        <li key={index} className="flex items-start">
                          <span className="text-purple-400 mr-2">•</span>
                          <span>{displayText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Try Another Resume Button */}
              <div className="flex justify-center mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-purple-500/40 transition"
                >
                  Analyze Another Resume
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* FEATURES */}
        {!result && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6 px-4 md:px-10 pb-20 w-full max-w-6xl"
          >
            {[
              {
                title: "AI Skill Matching",
                desc: "NLP-based comparison between resume and job description.",
              },
              {
                title: "Readiness Score",
                desc: "Smart scoring to estimate interview chances.",
              },
              {
                title: "Learning Roadmap",
                desc: "Personalized plan to close skill gaps faster.",
              },
            ].map((f) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -10, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 shadow-lg hover:border-white/20 hover:bg-white/10"
              >
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
