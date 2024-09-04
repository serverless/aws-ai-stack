import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAuth } from "../auth/AuthProvider";

const chatApiUrl = import.meta.env.VITE_CHAT_API_URL;

/**
 * Wrapper for ReactMarkdown to format the text in the chat window.
 */
const FormattedText = ({ children }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        li: ({ node, ...props }) => <li className="my-2" {...props} />,
        ol: ({ node, ...props }) => (
          <ol className="list-disc my-4" {...props} />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
};

/**
 * The response stream from the API may return multiple JSON objects in a single
 * response, which is not valid JSON. This function parses the response stream
 * and returns an array of JSON objects.
 */
const parseMultipleJsonObjects = (jsonString) => {
  let depth = 0;
  let startIndex = 0;
  const jsonObjects = [];

  for (let i = 0; i < jsonString.length; i++) {
    if (jsonString[i] === "{") {
      if (depth === 0) {
        startIndex = i;
      }
      depth++;
    } else if (jsonString[i] === "}") {
      depth--;
      if (depth === 0) {
        const jsonStr = jsonString.slice(startIndex, i + 1);
        jsonObjects.push(JSON.parse(jsonStr));
      }
    }
  }

  return jsonObjects;
};

const ChatPage = () => {
  const [streamingResponse, setStreamingResponse] = useState("");
  const [messageHistory, setMessageHistory] = useState([]);
  const [error, setError] = useState(null);
  const [input, setInput] = useState(
    "What makes the serverless framework so great?"
  );
  const { getToken } = useAuth();

  const bottomRef = useRef(null);

  /**
   * Scroll to the bottom of the chat window as new messages are streamed.
   */
  const scrollToBottom = () => {
    bottomRef.current.scrollIntoView();
  };

  const sendMessage = async () => {
    const userMessage = {
      role: "user",
      content: [{ text: input }],
    };

    setError();
    setMessageHistory((message) => message.concat(userMessage));
    setInput("");

    const response = await fetch(chatApiUrl, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      method: "POST",
      body: JSON.stringify([...messageHistory, userMessage]),
    });

    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();

    let fullResponseMessage = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      try {
        const responseBlocks = parseMultipleJsonObjects(value);
        for (const response of responseBlocks) {
          if (response.error) {
            setError(response.error);
            return;
          }
          if (response.contentBlockDelta) {
            const responseText = response.contentBlockDelta.delta.text;
            fullResponseMessage = fullResponseMessage + responseText;
            setStreamingResponse((messages) => messages.concat(responseText));
            scrollToBottom();
          }
        }
      } catch (er) {
        console.error(er);
      }
    }

    setMessageHistory((message) =>
      message.concat({
        role: "assistant",
        content: [{ text: fullResponseMessage }],
      })
    );
    setStreamingResponse("");
  };
  return (
    <div className="container mx-auto px-6 pt-2">
      <div className="flex flex-col space-y-4 pb-10">
        {messageHistory.map((message) =>
          message.content.map((content, index) => {
            const styles = ["p-1 px-4"];
            if (message.role === "user") {
              styles.push("bg-gray-200");
              styles.push("rounded-full");
            }
            return (
              <div className={styles.join(" ")} key={index}>
                <FormattedText>{content.text}</FormattedText>
              </div>
            );
          })
        )}
        {streamingResponse && (
          <div className="animate-pulse p-1 px-4">
            <FormattedText>{streamingResponse}</FormattedText>
          </div>
        )}
        {error && (
          <div className="p-1 px-4 bg-red-200 rounded-full">
            <FormattedText>{error}</FormattedText>
          </div>
        )}
        <div ref={bottomRef} className="h-6"></div>
      </div>
      <div className="flex flex-row fixed bottom-0 left-0 w-full p-4 bg-white border-t-2 border-gray-200">
        <input
          type="text"
          value={input}
          className="grow shadow appearance-none border border-gray-300 rounded p-2 text-gray-700 mr-2 h-10 leading-tight px-3 rounded-full focus:outline-none focus:shadow-outline"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="shadow h-10 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
