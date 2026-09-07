import { createPortal } from "react-dom";

function NavbarContent() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2147483647,
        pointerEvents: "auto",
        touchAction: "manipulation",
      }}
      className="flex justify-between items-center px-4 sm:px-8 py-4 border-b border-gray-800 bg-black/80 backdrop-blur-md"
    >
      <a
        href="/"
        className="text-xl font-bold cursor-pointer pointer-events-auto select-none"
        style={{ touchAction: "manipulation" }}
      >
        SkillLens AI
      </a>

      <div className="flex gap-3 sm:gap-4 items-center pointer-events-auto">
        <a
          href="/login"
          className="inline-flex items-center min-h-10 px-2 text-gray-300 hover:text-white transition-colors cursor-pointer pointer-events-auto select-none"
          style={{ touchAction: "manipulation" }}
        >
          Login
        </a>

        <a
          href="/register"
          className="inline-flex items-center min-h-10 px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500 transition-colors cursor-pointer pointer-events-auto select-none"
          style={{ touchAction: "manipulation" }}
        >
          Sign Up
        </a>
      </div>
    </nav>
  );
}

export default function Navbar() {
  return createPortal(<NavbarContent />, document.body);
}
