import { useState, useRef, useEffect, useCallback } from "react";
import chatbotIcon from "../../assets/chatbot-icon.png";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: "msg-0", role: "bot", text: "Hi — ask me anything about movies." },
  ]);
  const [input, setInput] = useState("");

  const listRef = useRef(null);

  // /* Auto scroll */
  // useEffect(() => {
  //   const list = listRef.current;
  //   if (list) list.scrollTop = list.scrollHeight;
  // }, [messages, open]);

  const toggleOpen = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  const handleSend = useCallback(
    async (e) => {
      e?.preventDefault();

      const trimmed = input.trim();
      if (!trimmed) return;

      const userId = `u-${Date.now()}`;
      const loadingId = `l-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", text: trimmed },
        { id: loadingId, role: "bot", text: "Thinking..." },
      ]);

      setInput("");

      try {
        const response = await fetch(
          "https://foxmovies-backend.onrender.com/api/ai-movie-query",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: trimmed }),
          }
        );

        const data = await response.json();
        let reply = "I couldn't find anything.";

        if (data.movies?.length > 0) {
          reply =
            "Here are some movies:\n" +
            data.movies
              .slice(0, 10)
              .map(
                (m, i) =>
                  `${i + 1}. ${m.title} (${
                    m.release_date?.slice(0, 4) || "N/A"
                  })`
              )
              .join("\n");
        }

        // Replace loading bubble with real reply
        setMessages((prev) => {
          return [
            ...prev.filter((m) => m.id !== loadingId),
            { id: `b-${Date.now()}`, role: "bot", text: reply },
          ];
        });
      } catch (error) {
        console.error("AI Error:", error);

        // Remove loading + append error bubble
        setMessages((prev) => [
          ...prev.filter((m) => !m.id.startsWith("l-")),
          {
            id: `err-${Date.now()}`,
            role: "bot",
            text: "Sorry, something went wrong.",
          },
        ]);
      }
    },
    [input]
  );

  return (
    <>
      {/* Chat window */}
      <div
        className={`fixed bottom-24 right-4 z-50 w-80 md:w-96 bg-white shadow-xl rounded-2xl overflow-hidden transition-all duration-200 ${
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <div className="flex items-center gap-3">
            <img src={chatbotIcon} className="w-8 h-8 rounded-full" />
            <div>
              <div className="text-sm font-medium">MovieBot</div>
              <div className="text-xs text-gray-500">Ask me about movies</div>
            </div>
          </div>

          <button
            onClick={toggleOpen}
            className="text-gray-500 hover:text-gray-700 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="h-64 overflow-y-auto px-3 py-3 space-y-3 bg-white"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap px-3 py-2 rounded-lg ${
                  m.role === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="px-3 py-3 border-t bg-white">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me more about movies..."
            className="w-full px-3 py-2 rounded-full border focus:ring-2 focus:ring-purple-300"
          />
        </form>
      </div>

      {/* Floating icon button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center border"
      >
        <img src={chatbotIcon} className="w-8 h-8" />
      </button>
    </>
  );
}
