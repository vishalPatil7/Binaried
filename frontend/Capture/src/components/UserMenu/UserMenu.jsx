import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaRegUser } from "react-icons/fa";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => setOpen((v) => !v);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <div
        onClick={toggleMenu}
        className="p-3 ml-2 bg-gray-200 rounded-full cursor-pointer"
      >
        <FaRegUser className="text-gray-600 text-sm" />
      </div>
      {/* dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-40 bg-white border rounded-xl shadow-lg py-2 z-50">
          <Link
            to={"/login"}
            className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
            onClick={() => setOpen(false)}
          >
            Login
          </Link>

          <Link
            to={"/register"}
            className="block px-4 py-2 hover:bg-gray-100 text-gray-800"
            onClick={() => setOpen(false)}
          >
            Register
          </Link>
        </div>
      )}
    </div>
  );
}
