import { memo, useCallback } from "react";
import logo from "../../assets/logo.png";
import UserMenu from "../UserMenu/UserMenu";
// import { FiSearch } from "react-icons/fi";

function Navbar({
  activeSection,
  scrollToTrending,
  scrollToPopular,
  scrollToToprated,
  scrollToUpcoming,
}) {
  const handleTrending = useCallback(
    () => scrollToTrending?.(),
    [scrollToTrending]
  );
  const handleSciFi = useCallback(() => scrollToPopular?.(), [scrollToPopular]);
  const handleComedy = useCallback(
    () => scrollToToprated?.(),
    [scrollToToprated]
  );
  const handleThriller = useCallback(
    () => scrollToUpcoming?.(),
    [scrollToUpcoming]
  );

  return (
    <nav className="w-full bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-8xl mx-auto flex items-center justify-between px-2.5">
        {/* Logo */}
        <div
          onClick={handleTrending}
          className="flex items-center gap-6 cursor-pointer"
        >
          <img src={logo} alt="logo" className="w-24 object-contain" />
        </div>

        {/* Middle Navigation */}
        <ul className="hidden md:flex items-center gap-6 sticky top-0 z-50">
          <li
            onClick={handleTrending}
            className={`px-4 py-2 rounded-full font-medium cursor-pointer ${
              activeSection === "trending"
                ? "bg-purple-100 text-purple-700"
                : "text-gray-700 hover:text-purple-700"
            }`}
          >
            Trending
          </li>

          <li
            onClick={handleSciFi}
            className={`cursor-pointer ${
              activeSection === "popular"
                ? "text-purple-700 font-medium"
                : "text-gray-700 hover:text-purple-700"
            }`}
          >
            Popular
          </li>

          <li
            onClick={handleComedy}
            className={`cursor-pointer ${
              activeSection === "top_rated"
                ? "text-purple-700 font-medium"
                : "text-gray-700 hover:text-purple-700"
            }`}
          >
            Top Rated
          </li>

          <li
            onClick={handleThriller}
            className={`cursor-pointer ${
              activeSection === "upcoming"
                ? "text-purple-700 font-medium"
                : "text-gray-700 hover:text-purple-700"
            }`}
          >
            Upcoming
          </li>
        </ul>

        {/* Right Section */}
        <div className="flex items-center gap-3 pr-3">
          {/* <FiSearch className="text-purple-600 text-xl cursor-pointer" /> */}
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}

export default memo(Navbar);
