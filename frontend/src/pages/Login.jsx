import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://skilllens-ai.onrender.com";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    try {
      const url = `${API_BASE_URL}/login/?email=${encodeURIComponent(email.trim())}&password=${encodeURIComponent(password)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.access_token) {
        localStorage.setItem("token", data.access_token);
        toast.success("Login successful");
        navigate("/dashboard");
      } else {
        toast.error(data.detail || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Unable to connect to SkillLens AI");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 rounded bg-black/40 border border-gray-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-3 rounded bg-black/40 border border-gray-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-2 rounded font-semibold hover:opacity-90"
        >
          Login
        </button>

        <p className="mt-4 text-center text-gray-400 text-sm">
          Don’t have an account?{" "}
          <Link to="/register" className="text-purple-400 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
