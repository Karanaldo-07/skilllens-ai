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

      <div className="text-sm text-gray-400 hidden sm:block">
        Free Resume Analysis
      </div>
    </nav>
  );
}

export default function Navbar() {
  return createPortal(<NavbarContent />, document.body);
}
