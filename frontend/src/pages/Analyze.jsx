import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">

      <h1 className="text-5xl font-bold mb-4">
        SkillLens AI
      </h1>

      <p className="text-gray-400 mb-8 text-center max-w-xl">
        Analyze your resume against job descriptions using AI.
        Discover skill gaps and improve your chances.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => navigate("/analyze")}
          className="bg-yellow-500 text-black px-6 py-3 rounded"
        >
          Try Without Login
        </button>

        <button
          onClick={() => navigate("/login")}
          className="border border-gray-500 px-6 py-3 rounded"
        >
          Login
        </button>
      </div>

    </div>
  );
}
