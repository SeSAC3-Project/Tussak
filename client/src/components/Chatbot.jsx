import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

const Chatbot = ({ isExpanded = false, onToggle = null, height = "h-96" }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "안녕하세요! 무엇을 알려드릴까요?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(isExpanded);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const chatContainer = messagesEndRef.current.closest('.overflow-y-auto');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setIsOpen(isExpanded);
  }, [isExpanded]);

  // 백엔드 API 호출
  const sendMessageToBot = async (question) => {
    const response = await fetch('/api/chatbot/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '네트워크 오류입니다')
    }

    return await response.json();
  }

  const handleSendMessage = async () => {
  if (!inputText.trim() || isLoading) return;

    const userMessage = {
      // 추후 유효 아이디로 변경
      id: Date.now(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

  // 사용자 메시지 먼저 추가
  setMessages(prev => [...prev, userMessage]);

  const currentInput = inputText.trim();
  setInputText('');
  setIsLoading(true);

  try {
    // API 호출
    const response = await sendMessageToBot(currentInput);
    
    const botMessage = {
      id: Date.now() + 1,
      text: response.response,
      sender: 'bot',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, botMessage]);

  } catch (error) {
    console.error('채팅 API 오류:', error);
    
    const errorMessage = {
      id: Date.now() + 1,
      text: error.message || "죄송합니다. 당신의 잘못이 아닙니다. 다시 시도해주세요.",
      sender: 'bot',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
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
      <div className={`bg-white rounded-[20px] p-4 flex flex-col flex-1 ${height}`}>
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-2" style={{ maxHeight: 'calc(100% - 80px)' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-3 rounded-xl max-w-xs sm:max-w-sm ${
                  message.sender === 'user'
                    ? 'rounded-br-none text-gray-800 ml-auto'
                    : 'rounded-bl-none text-gray-800'
                }`}
                style={{
                  backgroundColor: message.sender === 'user' ? '#EDEDED' : '#F2F8E9'
                }}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-xl rounded-bl-none text-gray-800 max-w-xs" style={{backgroundColor: '#F2F8E9'}}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-0"/>
        </div>
        <div className="pt-3 mb-0 w-full px-2">
          <div className="relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder=""
              className="w-full p-2 px-4 pr-12 rounded-full focus:outline-none"
              style={{backgroundColor: '#EDEDED', borderRadius: '40px', color: '#0F250B'}}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 disabled:cursor-not-allowed"
            >
              <img src="/icon/send.png" alt="Send" className="w-5 h-5"  />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 플로팅 챗봇
  return (
    <div className="fixed bottom-7 right-8 z-50">
      {/* 채팅 창 */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 h-96 bg-white rounded-[20px] p-4 flex flex-col animate-in slide-in-from-bottom duration-300" style={{boxShadow: '0px 0px 30px 5px rgba(0, 0, 0, 0.25)'}}>
          {/* 헤더 */}
          <div className="flex justify-end mb-2">
            <button
              onClick={toggleChat}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-2" style={{ maxHeight: 'calc(100% - 80px)' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-3 rounded-xl max-w-xs sm:max-w-sm ${
                    message.sender === 'user'
                      ? 'rounded-br-none text-gray-800 ml-auto'
                      : 'rounded-bl-none text-gray-800'
                  }`}
                  style={{
                    backgroundColor: message.sender === 'user' ? '#EDEDED' : '#F2F8E9'
                  }}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="p-3 rounded-xl rounded-bl-none text-gray-800 max-w-xs" style={{backgroundColor: '#F2F8E9'}}>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-0"/>
          </div>
          
          {/* 입력 영역 */}
          <div className="pt-3 mb-0 w-full px-2">
            <div className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder=""
                className="w-full p-2 px-4 pr-12 rounded-full focus:outline-none"
                style={{backgroundColor: '#EDEDED', borderRadius: '40px', color: '#0F250B'}}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 disabled:cursor-not-allowed"
              >
                <img src="/icon/send.png" alt="Send" className="w-5 h-5"  />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 플로팅 버튼 */}
      <button
        onClick={toggleChat}
        className="rounded-full shadow-2xl hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
        style={{
          width: '70px',
          height: '70px',
          backgroundColor: '#89D67D',
          boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.15)'
        }}
      >
        <img src="/icon/chatbot.png" alt="chatbot" style={{ width: '25px', height: '25px' }} className="mx-auto" />
      </button>
    </div>
  );
};

export default Chatbot;