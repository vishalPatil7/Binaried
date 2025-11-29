import { useRef } from "react";

export default function MovieCarousel({ section, movies = [], loading }) {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -350, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 350, behavior: "smooth" });
  };

  // Skeleton Card Component
  const SkeletonCard = () => (
    <div className="snap-start bg-white rounded-xl shadow-md overflow-hidden min-w-[45vw] sm:min-w-[260px]">
      <div className="w-full h-[50vw] sm:h-[330px] bg-gray-300 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-300 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded animate-pulse w-1/2"></div>
      </div>
    </div>
  );

  return (
    <section className="w-full px-4 py-6 sm:px-6 sm:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold">{section}</h2>

        <div
          className={
            !loading ? "hidden md:flex gap-3" : "disabled md:flex gap-3"
          }
        >
          <button
            onClick={scrollLeft}
            className="px-3 py-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"
          >
            ◀
          </button>
          <button
            onClick={scrollRight}
            className="px-3 py-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
        style={{ scrollBehavior: "smooth" }}
        ref={scrollRef}
      >
        {/* Render Skeletons */}
        {loading &&
          Array(5)
            .fill(0)
            .map((_, i) => <SkeletonCard key={i} />)}

        {/* Render Real Movie Cards */}
        {!loading &&
          movies.map((movie, idx) => (
            <div
              key={idx}
              className="snap-start bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105
                       min-w-[45vw] sm:min-w-[260px] sm:max-w-[260px]"
            >
              <div className="w-full h-[50vw] sm:h-[330px]">
                <img
                  loading="lazy"
                  src={`https://image.tmdb.org/t/p/original${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-3">
                <h3 className="font-semibold text-md sm:text-lg line-clamp-2 leading-tight">
                  {movie.title}
                </h3>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
