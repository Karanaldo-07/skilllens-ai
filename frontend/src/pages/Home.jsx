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

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://skilllens-ai.onrender.com";

export default function Home() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Parsing resume");
  const uploadSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);

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
    if (jobRole.trim()) formData.append("job_role", jobRole.trim());

    const loadingToast = toast.loading("AI is analyzing your resume...");

    try {
      const response = await fetch(`${API_BASE_URL}/analyze/`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || data.message || "Analysis failed");
      }

      setResult(data);

      if (data.match_score > 80) {
        confetti({ particleCount: 120, spread: 80 });
      }

      toast.success("Analysis Complete!", { id: loadingToast });

      setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (error) {
      toast.error(error.message || "Analysis failed. Please try again.", {
        id: loadingToast,
      });
      console.error("Analysis error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setJd("");
    setJobRole("");
    setResult(null);
    setLoading(false);

    setTimeout(() => {
      uploadSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const generateSkillMatchChart = (result) => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");

    const matchedCount = result.fully_matched?.length || 0;
    const partialCount = result.partially_matched?.length || 0;
    const missingCount = result.fully_missing?.length || 0;

    let chart = null;
    try {
      chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Matched", "Partially Matched", "Missing"],
          datasets: [{
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
          }],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: { duration: 0 },
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: "Skill Match Analysis",
              font: { size: 16, weight: "bold" },
            },
          },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
          },
        },
      });

      chart.update("none");
      return new Promise((resolve) => {
        setTimeout(() => {
          const imageData = canvas.toDataURL("image/png");
          chart?.destroy();
          resolve(imageData);
        }, 100);
      });
    } catch (error) {
      console.error("Chart generation error:", error);
      chart?.destroy();
      return Promise.resolve(canvas.toDataURL("image/png"));
    }
  };

  const generateReadinessChart = (score) => {
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
          datasets: [{
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
          }],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: { duration: 0 },
          plugins: { legend: { display: false } },
        },
      });

      chart.update("none");
      return new Promise((resolve) => {
        setTimeout(() => {
          const imageData = canvas.toDataURL("image/png");
          chart?.destroy();
          resolve(imageData);
        }, 100);
      });
    } catch (error) {
      console.error("Chart generation error:", error);
      chart?.destroy();
      return Promise.resolve(canvas.toDataURL("image/png"));
    }
  };

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

      const addFooter = (pageNum) => {
        doc.setPage(pageNum);
        const footerY = pageHeight - 15;
        doc.setDrawColor(139, 92, 246);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY, pageWidth - margin, footerY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text("Generated by SkillLens AI • AI Career Intelligence Platform", pageWidth / 2, footerY + 5, { align: "center" });
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footerY + 5, { align: "right" });
      };

      const addSectionHeader = (text, yPos, color = [139, 92, 246]) => {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...color);
        doc.text(text, margin, yPos);
        doc.setDrawColor(...color);
        doc.setLineWidth(1);
        doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);
        return yPos + 8;
      };

      doc.addPage();
      let yPos = 30;
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
      doc.text("Resume Analysis Report", pageWidth / 2, yPos, { align: "center" });
      yPos += 20;
      doc.setFillColor(255, 255, 255);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text("AI-powered skill gap and readiness analysis", pageWidth / 2, yPos, { align: "center" });
      yPos += 30;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Analysis Summary", margin, yPos);
      yPos += 10;
      if (jobRole.trim()) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Target Role: ${jobRole.trim()}`, margin, yPos);
        yPos += 7;
      }
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
      yPos += 20;
      const readinessChartImg = await generateReadinessChart(result.match_score);
      doc.addImage(readinessChartImg, "PNG", pageWidth / 2 - 50, yPos, 100, 100);
      yPos += 110;
      doc.setFontSize(32);
      doc.setFont("helvetica", "bold");
      const scoreColor = result.match_score >= 80 ? [34, 197, 94] : result.match_score >= 60 ? [234, 179, 8] : [239, 68, 68];
      doc.setTextColor(...scoreColor);
      doc.text(`${result.match_score}%`, pageWidth / 2, yPos, { align: "center" });
      yPos += 10;
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`Readiness Level: ${result.readiness_level}`, pageWidth / 2, yPos, { align: "center" });
      addFooter(1);

      doc.addPage();
      yPos = 30;
      yPos = addSectionHeader("Skills Detected", yPos, [79, 70, 229]);
      if (result.resume_skills && result.resume_skills.length > 0) {
        const skillsData = result.resume_skills.map((skill) => {
          const skillText = typeof skill === "string" ? skill : skill?.name || skill?.skill || String(skill);
          return [skillText];
        });
        doc.autoTable({ startY: yPos, head: [["Skill"]], body: skillsData, theme: "striped", headStyles: { fillColor: [79, 70, 229] }, margin: { left: margin, right: margin }, styles: { fontSize: 9 } });
        yPos = doc.lastAutoTable.finalY + 15;
      }
      const skillChartImg = await generateSkillMatchChart(result);
      doc.addImage(skillChartImg, "PNG", margin, yPos, pageWidth - 2 * margin, 120);
      yPos += 130;
      yPos = addSectionHeader("Skill Match Breakdown", yPos, [139, 92, 246]);
      const skillNames = (items) => items?.map((skill) => typeof skill === "string" ? skill : skill?.name || skill?.skill || String(skill)).join(", ") || "None";
      const matchData = [
        ["Matched Skills", result.fully_matched?.length || 0, skillNames(result.fully_matched)],
        ["Partially Matched", result.partially_matched?.length || 0, skillNames(result.partially_matched)],
        ["Missing Skills", result.fully_missing?.length || 0, skillNames(result.fully_missing)],
      ];
      doc.autoTable({ startY: yPos, head: [["Category", "Count", "Skills"]], body: matchData, theme: "striped", headStyles: { fillColor: [139, 92, 246] }, columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 30, halign: "center" }, 2: { cellWidth: "auto" } }, margin: { left: margin, right: margin }, styles: { fontSize: 8, cellPadding: 3 } });
      addFooter(2);

      doc.addPage();
      yPos = 30;
      yPos = addSectionHeader("Learning Roadmap", yPos, [16, 185, 129]);
      if (result.roadmap && Array.isArray(result.roadmap)) {
        result.roadmap.forEach((item, index) => {
          const title = typeof item === "string" ? item : item?.title || item?.skill || `Step ${index + 1}`;
          const description = typeof item === "string" ? "" : item?.description || item?.details || "";
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 0, 0);
          doc.text(`${index + 1}. ${title}`, margin, yPos);
          yPos += 7;
          if (description) {
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(String(description), pageWidth - 2 * margin);
            doc.text(lines, margin, yPos);
            yPos += lines.length * 5 + 8;
          } else {
            yPos += 5;
          }
          if (yPos > pageHeight - 35) {
            addFooter(3);
            doc.addPage();
            yPos = 30;
          }
        });
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("No roadmap items were returned.", margin, yPos);
        yPos += 10;
      }
      addFooter(3);

      doc.addPage();
      yPos = 30;
      yPos = addSectionHeader("Recommendations", yPos, [245, 158, 11]);
      const recommendations = Array.isArray(result.suggestions) ? result.suggestions : [];
      if (recommendations.length) {
        recommendations.forEach((item, index) => {
          const text = typeof item === "string" ? item : item?.text || item?.description || String(item);
          const lines = doc.splitTextToSize(`${index + 1}. ${text}`, pageWidth - 2 * margin);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          doc.text(lines, margin, yPos);
          yPos += lines.length * 5 + 5;
          if (yPos > pageHeight - 35) {
            addFooter(4);
            doc.addPage();
            yPos = 30;
          }
        });
      } else {
        doc.setFontSize(10);
        doc.text("No additional recommendations were returned.", margin, yPos);
      }
      addFooter(4);

      doc.save("SkillLens_AI_Resume_Report.pdf");
      toast.success("PDF report downloaded!", { id: loadingToast });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Could not generate the PDF report.", { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <ParticleBg />
      <Navbar />
      <main className="relative z-10 pt-24">
        <section className="max-w-6xl mx-auto px-4 py-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-indigo-400 font-semibold mb-3">AI Career Intelligence</p>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">Know Your Resume. Know Your Next Move.</h1>
            <p className="mt-6 max-w-3xl mx-auto text-gray-400 text-base sm:text-lg">Upload your resume, paste a job description, and get an instant skill match, readiness score, learning roadmap, and actionable recommendations.</p>
          </motion.div>
        </section>

        <section ref={uploadSectionRef} className="relative z-10 max-w-5xl mx-auto px-4 pb-20">
          <UploadBox
            file={file}
            setFile={setFile}
            jd={jd}
            setJd={setJd}
            jobRole={jobRole}
            setJobRole={setJobRole}
            loading={loading}
            loadingMessage={loadingMessage}
            onAnalyze={handleAnalyze}
          />
        </section>

        {result && (
          <section ref={resultsSectionRef} className="relative z-10 max-w-6xl mx-auto px-4 pb-24">
            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-5 sm:p-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 mb-8">
                <div>
                  <p className="text-indigo-400 font-semibold">Analysis Complete</p>
                  <h2 className="text-3xl font-bold mt-1">Your Resume Intelligence Report</h2>
                  <p className="text-gray-400 mt-2">No account required. Your analysis is generated for this session.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleDownloadPDF} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold">Download PDF</button>
                  <button onClick={handleReset} className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-900">Analyze Another</button>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-black/40 rounded-xl border border-gray-800 p-6 flex flex-col items-center justify-center">
                  <ScoreCircle score={result.match_score} />
                  <p className="mt-4 text-center font-semibold">{result.readiness_level}</p>
                </div>

                <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
                  <div className="bg-black/40 rounded-xl border border-gray-800 p-5"><p className="text-gray-400 text-sm">Matched Skills</p><p className="text-2xl font-bold mt-1">{result.fully_matched?.length || 0}</p></div>
                  <div className="bg-black/40 rounded-xl border border-gray-800 p-5"><p className="text-gray-400 text-sm">Partial Matches</p><p className="text-2xl font-bold mt-1">{result.partially_matched?.length || 0}</p></div>
                  <div className="bg-black/40 rounded-xl border border-gray-800 p-5"><p className="text-gray-400 text-sm">Missing Skills</p><p className="text-2xl font-bold mt-1">{result.fully_missing?.length || 0}</p></div>
                  <div className="bg-black/40 rounded-xl border border-gray-800 p-5"><p className="text-gray-400 text-sm">Estimated Days</p><p className="text-2xl font-bold mt-1">{result.estimated_days_to_ready ?? 0}</p></div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6 mt-6">
                <div className="bg-black/40 rounded-xl border border-gray-800 p-5"><h3 className="font-bold text-lg mb-3">Matched</h3><div className="flex flex-wrap gap-2">{(result.fully_matched || []).map((s, i) => <span key={i} className="px-2 py-1 rounded bg-green-500/10 text-green-300 text-sm">{s}</span>)}</div></div>
                <div className="bg-black/40 rounded-xl border border-gray-800 p-5"><h3 className="font-bold text-lg mb-3">Partial</h3><div className="flex flex-wrap gap-2">{(result.partially_matched || []).map((s, i) => <span key={i} className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-300 text-sm">{s}</span>)}</div></div>
                <div className="bg-black/40 rounded-xl border border-gray-800 p-5"><h3 className="font-bold text-lg mb-3">Missing</h3><div className="flex flex-wrap gap-2">{(result.fully_missing || []).map((s, i) => <span key={i} className="px-2 py-1 rounded bg-red-500/10 text-red-300 text-sm">{s}</span>)}</div></div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-black/40 rounded-xl border border-gray-800 p-5"><h3 className="font-bold text-lg mb-4">Learning Roadmap</h3>{(result.roadmap || []).map((item, i) => <div key={i} className="mb-4"><p className="font-semibold">{i + 1}. {typeof item === "string" ? item : item?.title || item?.skill || `Step ${i + 1}`}</p>{typeof item !== "string" && (item?.description || item?.details) && <p className="text-gray-400 text-sm mt-1">{item.description || item.details}</p>}</div>)}</div>
                <div className="bg-black/40 rounded-xl border border-gray-800 p-5"><h3 className="font-bold text-lg mb-4">Recommendations</h3>{(result.suggestions || []).map((item, i) => <p key={i} className="text-gray-300 text-sm mb-3">{i + 1}. {typeof item === "string" ? item : item?.text || item?.description || String(item)}</p>)}</div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
