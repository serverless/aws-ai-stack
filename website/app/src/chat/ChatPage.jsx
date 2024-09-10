import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

import { useAuth } from '../auth/AuthProvider';

const chatApiUrl = import.meta.env.VITE_CHAT_API_URL;

/**
 * Wrapper for ReactMarkdown to format the text in the chat window.
 */
const FormattedText = ({ children }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        li: ({ node, ...props }) => <li className='my-2' {...props} />,
        ol: ({ node, ...props }) => (
          <ol className='list-disc my-4' {...props} />
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
    if (jsonString[i] === '{') {
      if (depth === 0) {
        startIndex = i;
      }
      depth++;
    } else if (jsonString[i] === '}') {
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
  const [streamingResponse, setStreamingResponse] = useState('');
  const [messageHistory, setMessageHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(null);
  const [input, setInput] = useState(
    'What makes the serverless framework so great?',
  );

  const { getToken } = useAuth();

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  // Disable sending when streaming response is in progress, when loading, or when input is empty
  const disabled = !!streamingResponse || loading || input.trim() === '';

  /**
   * Scroll to the bottom of the chat window as new messages are streamed.
   */
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    setLoading(true);
    // Prevent sending empty messages
    if (!input) {
      return;
    }
    const userMessage = {
      role: 'user',
      content: [{ text: input }],
    };

    setError();
    // Add message to message history
    setMessageHistory((message) => message.concat(userMessage));
    setInput('');
    scrollToBottom();
    const response = await fetch(chatApiUrl, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      method: 'POST',
      body: JSON.stringify([...messageHistory, userMessage]),
    });

    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();

    let fullResponseMessage = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      try {
        const responseBlocks = parseMultipleJsonObjects(value);
        for (const response of responseBlocks) {
          if (response.error) {
            setError(response.error);
            setLoading(false);
            scrollToBottom();
            return;
          }
          if (response.contentBlockDelta) {
            const responseText = response.contentBlockDelta.delta.text;
            fullResponseMessage = fullResponseMessage + responseText;
            setStreamingResponse((messages) => messages.concat(responseText));
            scrollToBottom();
            setLoading(false);
          }
        }
      } catch (er) {
        console.error(er);
      }
      scrollToBottom();
    }

    setMessageHistory((message) =>
      message.concat({
        role: 'assistant',
        content: [{ text: fullResponseMessage }],
      }),
    );
    setStreamingResponse('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 160); // 160px is equivalent to max-h-40
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = newHeight === 160 ? 'auto' : 'hidden';
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setError(''); // clear error message when user types
  };

  return (
    <div className='container mx-auto px-6 flex flex-col mt-20 flex-1 flex-grow'>
      <div className='flex-1 flex flex-col space-y-4 bg-white'>
        {messageHistory.map((message) =>
          message.content.map((content, index) => {
            const styles = ['animate-fadeIn p-2 px-4  break-words'];
            if (message.role === 'user') {
              styles.push('bg-gray-100 rounded-xl self-end');
            } else {
              styles.push('text-gray-800 self-start ');
            }
            return (
              <div className={styles.join(' ')} key={index}>
                <FormattedText>{content.text}</FormattedText>
              </div>
            );
          }),
        )}
        {streamingResponse && (
          <div className=' p-2 px-4 text-gray-800 self-start'>
            <FormattedText>{streamingResponse}</FormattedText>
          </div>
        )}

        <div ref={bottomRef} className='h-10'></div>
      </div>
      <div className='flex flex-row sticky bottom-0 left-0 w-full p-4 bg-white'>
        <div className='relative w-full'>
          {error && (
            <div className='animate-fadeIn p-2 px-4 w-full bg-primary text-white self-center rounded-md mb-2'>
              <FormattedText>{error}</FormattedText>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={input}
            className='w-full pr-12 appearance-none border border-gray-300 rounded-md py-3 text-gray-700 leading-tight px-4 focus:outline-none focus:ring-2 focus:ring-primary resize-none  min-h-[2.5rem] max-h-40'
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows='1'
          />
          {loading && (
            <div
              className='animate-fadeIn absolute bottom-5 right-14 inline-block size-5 animate-spin rounded-full border-2 border-solid border-gray-300 border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite]'
              role='status'
            />
          )}
          <button
            className='absolute right-2 bottom-3 flex justify-center items-center bg-primary text-white p-2 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-300'
            onClick={sendMessage}
            disabled={disabled}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='17'
              height='17'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='lucide lucide-circle-arrow-up'
            >
              <circle cx='12' cy='12' r='10' />
              <path d='m16 12-4-4-4 4' />
              <path d='M12 16V8' />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
