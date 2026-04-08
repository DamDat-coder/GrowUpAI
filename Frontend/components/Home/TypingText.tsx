import { useEffect, useState } from "react";

export default function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;

    const type = () => {
      setDisplayed(text.slice(0, i + 1));
      i++;

      if (i < text.length) {
        const randomSpeed = 10 + Math.random() * 20; // 🔥 tốc độ tự nhiên
        setTimeout(type, randomSpeed);
      }
    };

    type();
  }, [text]);

  return (
    <span>
      {displayed}
      <span className="inline-block w-1.5 ml-1 bg-gray-400 animate-pulse align-middle" />
    </span>
  );
}