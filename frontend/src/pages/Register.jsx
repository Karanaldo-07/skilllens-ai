import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://skilllens-ai.onrender.com";

const getPasswordStrength = (password) => {
  if (password.length < 6) return { label: "Weak", color: "red" };

  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  const hasUpper = /[A-Z]/.test(password);

  let score = 0;
  if (password.length >= 8) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;
  if (hasUpper) score++;

  if (score <= 1) return { label: "Weak", color: "red" };
  if (score === 2) return { label: "Medium", color: "yellow" };
  return { label: "Strong", color: "green" };
};

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    if (getPasswordStrength(password).label === "Weak") {
      toast.error("Please choose a stronger password");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.detail || "Registration failed");
        return;
      }

      toast.success("Account created successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Unable to connect to SkillLens AI");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

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
          onKeyDown={(e) => e.key === "Enter" && handleRegister()}
        />

        <button
          onClick={handleRegister}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-2 rounded font-semibold hover:opacity-90"
        >
          Sign Up
        </button>

        <p className="mt-4 text-center text-gray-400 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
