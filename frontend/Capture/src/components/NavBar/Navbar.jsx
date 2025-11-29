import logo from "../../assets/logo.png";
import { FiSearch } from "react-icons/fi";
import { FaRegUser } from "react-icons/fa";

export default function Navbar({
  activeSection,
  scrollToTrending,
  scrollToSciFi,
  scrollToComedy,
  scrollToThriller,
}) {
  const activeClass =
    "px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-medium cursor-pointer";
  const inactiveClass = "text-gray-700 hover:text-purple-700 cursor-pointer";

  return (
    <nav className="w-full md:px-8  bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-8xl mx-auto flex items-center justify-between px-2.5">
        <div onClick={scrollToTrending} className="cursor-pointer">
          <img src={logo} alt="logo" className="w-18 md:w-24 object-contain" />
        </div>

        <ul className="hidden md:flex items-center gap-8">
          <li
            onClick={scrollToTrending}
            className={
              activeSection === "trending" ? activeClass : inactiveClass
            }
          >
            Trending
          </li>

          <li
            onClick={scrollToSciFi}
            className={
              activeSection === "popular" ? activeClass : inactiveClass
            }
          >
            Popular
          </li>

          <li
            onClick={scrollToComedy}
            className={
              activeSection === "top_rated" ? activeClass : inactiveClass
            }
          >
            Top Rated
          </li>

          <li
            onClick={scrollToThriller}
            className={
              activeSection === "upcoming" ? activeClass : inactiveClass
            }
          >
            Upcoming
          </li>
        </ul>

        {/* Right Icons */}
        <div className="flex items-center gap-3 pr-4 md:pr-6">
          <FiSearch className="text-purple-600 text-xl cursor-pointer" />
          <div className="p-2 md:p-2.5 ml-3 bg-gray-200 rounded-full cursor-pointer">
            <FaRegUser className="text-gray-600 w-[15px] h-[15px]" />
          </div>
        </div>
      </div>
    </nav>
  );
}
