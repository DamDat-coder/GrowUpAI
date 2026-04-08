"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default function TypingMarkdown({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;

    const type = () => {
      setDisplayed(text.slice(0, i + 1));
      i++;

      if (i < text.length) {
        const speed = 10 + Math.random() * 20;
        setTimeout(type, speed);
      }
    };

    type();
  }, [text]);

  const components = {
    code({
      className,
      children,
    }: {
      className?: string;
      children?: React.ReactNode;
    }) {
      const match = /language-(\w+)/.exec(className || "");

      return match ? (
        <SyntaxHighlighter
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={oneDark as any}
          language={match[1]}
          PreTag="div"
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">
          {children}
        </code>
      );
    },
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {displayed}
    </ReactMarkdown>
  );
}