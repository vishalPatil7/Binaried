import { useEffect, useState, useRef } from "react";
import Navbar from "../components/NavBar/Navbar";
import MovieCarousel from "../components/Carousel/MovieCarousel";
import Footer from "../footer";
import Chatbot from "../components/Chatbot/Chatbot";

export default function Home() {
  const [activeSection, setActiveSection] = useState("trending");

  // Movie state
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [upcoming, setUpcoming] = useState([]);

  // Loading state
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);

  // Refs
  const trendingRef = useRef(null);
  const popularRef = useRef(null);
  const topratedRef = useRef(null);
  const upcomingRef = useRef(null);

  // Scrolls
  const scrollToTrending = () =>
    trendingRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToPopular = () =>
    popularRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToToprated = () =>
    topratedRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToUpcoming = () =>
    upcomingRef.current?.scrollIntoView({ behavior: "smooth" });

  // Fetch all in parallel
  useEffect(() => {
    async function fetchAll() {
      try {
        const urls = [
          "https://foxmovies-backend.onrender.com/api/now_playing",
          "https://foxmovies-backend.onrender.com/api/popular",
          "https://foxmovies-backend.onrender.com/api/top_rated",
          "https://foxmovies-backend.onrender.com/api/upcoming",
        ];

        const [r1, r2, r3, r4] = await Promise.all(
          urls.map((u) => fetch(u).then((res) => res.json()))
        );

        setTrending(r1.results);
        setPopular(r2.results);
        setTopRated(r3.results);
        setUpcoming(r4.results);

        setLoadingTrending(false);
        setLoadingPopular(false);
        setLoadingTopRated(false);
        setLoadingUpcoming(false);
      } catch (e) {
        console.log("Parallel fetch error:", e);
      }
    }

    fetchAll();
  }, []);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }),
      { threshold: 0.4 }
    );

    const sections = [
      trendingRef.current,
      popularRef.current,
      topratedRef.current,
      upcomingRef.current,
    ];

    sections.forEach((sec) => sec && observer.observe(sec));

    return () => sections.forEach((sec) => sec && observer.unobserve(sec));
  }, []);

  return (
    <>
      <Navbar
        activeSection={activeSection}
        scrollToTrending={scrollToTrending}
        scrollToPopular={scrollToPopular}
        scrollToToprated={scrollToToprated}
        scrollToUpcoming={scrollToUpcoming}
      />

      <div
        id="trending"
        ref={trendingRef}
        className="scroll-mt-12 md:scroll-mt-24"
      >
        <MovieCarousel
          section="Trending"
          movies={trending}
          loading={loadingTrending}
        />
      </div>

      <div
        id="popular"
        ref={popularRef}
        className="scroll-mt-12 md:scroll-mt-24"
      >
        <MovieCarousel
          section="Popular"
          movies={popular}
          loading={loadingPopular}
        />
      </div>

      <div
        id="top_rated"
        ref={topratedRef}
        className="scroll-mt-12 md:scroll-mt-24"
      >
        <MovieCarousel
          section="Top Rated"
          movies={topRated}
          loading={loadingTopRated}
        />
      </div>

      <div
        id="upcoming"
        ref={upcomingRef}
        className="scroll-mt-12 md:scroll-mt-24"
      >
        <MovieCarousel
          section="Upcoming"
          movies={upcoming}
          loading={loadingUpcoming}
        />
      </div>

      <Footer />
      <Chatbot />
    </>
  );
}
