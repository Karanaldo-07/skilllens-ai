import { useState } from "react";
import { useNavigate , Link} from "react-router-dom";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
  try {
    const url = `http://127.0.0.1:8000/login/?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
      },
    });

    const data = await response.json();

    console.log("LOGIN RESPONSE:", data);

    if (response.ok && data.access_token) {
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
    } else {
      console.log(data);
      toast.error("Invalid credentials");
    }

  } catch (error) {
    console.error(error);
    toast.error("Login failed");
  }
};





  return (
  <div className="min-h-screen flex items-center justify-center px-4">

    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-xl">

      <h2 className="text-2xl font-bold mb-6 text-center">
        Login
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
        onClick={handleLogin}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-2 rounded font-semibold hover:opacity-90"
      >
        Login
      </button>

      <p className="mt-4 text-center text-gray-400 text-sm">
        Don’t have an account?{" "}
        <Link to="/register" className="text-purple-400 hover:underline">
          Register
        </Link>
      </p>

    </div>
  </div>
);

}
