import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center px-8 py-4 border-b border-gray-800">

      <h1
        className="text-xl font-bold cursor-pointer"
        onClick={() => navigate("/")}
      >
        SkillLens AI
      </h1>

      <div className="flex gap-4">
        <button
          onClick={() => navigate("/login")}
          className="text-gray-300"
        >
          Login
        </button>

        <button
          onClick={() => navigate("/register")}
          className="bg-indigo-600 px-4 py-2 rounded"
        >
          Sign Up
        </button>
      </div>

    </div>
  );
}
