import { useRef, useCallback, memo } from "react";

function MovieCarousel({ section, movies = [], loading }) {
  const scrollRef = useRef(null);

  const scrollLeft = useCallback(() => {
    scrollRef.current?.scrollBy({ left: -350, behavior: "smooth" });
  }, []);

  const scrollRight = useCallback(() => {
    scrollRef.current?.scrollBy({ left: 350, behavior: "smooth" });
  }, []);

  const SkeletonCard = memo(() => (
    <div className="snap-start bg-white rounded-xl shadow-md overflow-hidden min-w-[45vw] sm:min-w-[260px]">
      <div className="w-full h-[50vw] sm:h-[330px] bg-gray-300 animate-ping" />
      <div className="p-4">
        <div className="h-4 bg-gray-300 rounded animate-pulse w-3/4"></div>
      </div>
    </div>
  ));

  const MovieCard = memo(function MovieCard({ movie }) {
    return (
      <div
        className="snap-start bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105
                   min-w-[45vw] sm:min-w-[260px] sm:max-w-[260px]"
      >
        <div className="w-full h-[50vw] sm:h-[330px]">
          <img
            loading="lazy"
            src={`https://image.tmdb.org/t/p/original${movie?.poster_path}`}
            alt={movie?.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-md sm:text-lg line-clamp-2 leading-tight">
            {movie?.title}
          </h3>
        </div>
      </div>
    );
  });

  return (
    <section className="w-full px-4 py-6 sm:px-6 sm:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold">{section}</h2>

        {/* Arrow Buttons */}
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
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Skeleton Loader */}
        {loading &&
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}

        {/* Movie Cards */}
        {!loading &&
          movies.map((movie) => <MovieCard key={movie?.id} movie={movie} />)}
      </div>
    </section>
  );
}

export default memo(MovieCarousel);
