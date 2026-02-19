import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";


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
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/register/?email=${email}&password=${password}`,
        { method: "POST" }
      );

      if (getPasswordStrength(password).label === "Weak") {
        toast.error("Password too weak!");
        return;
        }


      if (!response.ok) {
        toast.error("Registration failed");

        return;
      }

      toast.success("Account created successfully!");

      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Error registering user");
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center px-4">

    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-xl">

      <h2 className="text-2xl font-bold mb-6 text-center">
        Create Account
      </h2>

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
      />

      <button
        onClick={handleRegister}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-2 rounded font-semibold hover:opacity-90"
      >
        Sign Up
      </button>

      <p className="mt-4 text-center text-gray-400 text-sm">
        Already have an account?{" "}
        <Link to="/login" className="text-purple-400 hover:underline">
          Login
        </Link>
      </p>

    </div>
  </div>
);

}
