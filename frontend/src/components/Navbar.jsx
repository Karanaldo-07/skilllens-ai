export default function Navbar() {
  return (
    <nav className="relative z-[9999] flex justify-between items-center px-8 py-4 border-b border-gray-800 pointer-events-auto">
      <a
        href="/"
        className="text-xl font-bold cursor-pointer"
      >
        SkillLens AI
      </a>

      <div className="flex gap-4 items-center relative z-[10000]">
        <a
          href="/login"
          className="inline-block text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          Login
        </a>

        <a
          href="/register"
          className="inline-block bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-500 transition-colors cursor-pointer"
        >
          Sign Up
        </a>
      </div>
    </nav>
  );
}
