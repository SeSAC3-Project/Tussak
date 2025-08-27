import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

const Chatbot = ({ isExpanded = false, onToggle = null }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "안녕하세요! 무엇을 도와드릴까요?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(isExpanded);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setIsOpen(isExpanded);
  }, [isExpanded]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // OpenAI API 호출 부분
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "당신은 친근하고 도움이 되는 AI 어시스턴트입니다. 한국어로 답변해주세요."
            },
            ...messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text
            })),
            {
              role: "user",
              content: inputText
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        const botMessage = {
          id: Date.now() + 1,
          text: data.choices[0].message.content,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('OpenAI API 호출 오류:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    if (onToggle) {
      onToggle();
    } else {
      setIsOpen(!isOpen);
    }
  };

  // 확장된 채팅 창 (Home.jsx용)
  if (isExpanded) {
    return (
      <div className="bg-lime-50 rounded-xl shadow-lg p-4 flex flex-col flex-1 h-96">
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-3 rounded-xl max-w-xs sm:max-w-sm ${
                  message.sender === 'user'
                    ? 'bg-white rounded-br-none text-gray-800 ml-auto'
                    : 'bg-lime-200 rounded-bl-none text-gray-800'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-lime-200 p-3 rounded-xl rounded-bl-none text-gray-800 max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center border-t border-gray-200 pt-3 w-full">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요"
            className="flex-1 p-2 px-4 bg-white rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="bg-lime-600 text-white rounded-full p-3 ml-2 hover:bg-lime-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    );
  }

  // 플로팅 챗봇 (다른 페이지용)
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 채팅 창 */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* 헤더 */}
          <div className="bg-lime-600 text-white p-4 rounded-t-xl flex items-center justify-between">
            <h3 className="font-semibold">챗봇</h3>
            <button
              onClick={toggleChat}
              className="text-white hover:bg-lime-700 rounded-full p-1 transition-colors duration-200"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-lime-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-3 rounded-xl max-w-xs text-sm ${
                    message.sender === 'user'
                      ? 'bg-white rounded-br-none text-gray-800'
                      : 'bg-lime-200 rounded-bl-none text-gray-800'
                  }`}
                >
                  <p>{message.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-lime-200 p-3 rounded-xl rounded-bl-none text-gray-800 max-w-xs">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* 입력 영역 */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
            <div className="flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요"
                className="flex-1 p-2 px-3 border border-gray-300 rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
                className="bg-lime-600 text-white rounded-full p-2 ml-2 hover:bg-lime-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 플로팅 버튼 */}
      <button
        onClick={toggleChat}
        className="bg-lime-600 text-white rounded-full p-4 shadow-lg hover:bg-lime-700 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
};

export default Chatbot;