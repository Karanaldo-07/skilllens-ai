import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="relative z-50 flex justify-between items-center px-8 py-4 border-b border-gray-800">
      <Link to="/" className="text-xl font-bold cursor-pointer">
        SkillLens AI
      </Link>

      <div className="flex gap-4 items-center">
        <Link
          to="/login"
          className="text-gray-300 hover:text-white transition-colors"
        >
          Login
        </Link>

        <Link
          to="/register"
          className="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-500 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
