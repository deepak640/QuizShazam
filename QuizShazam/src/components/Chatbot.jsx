import React, { useEffect, useRef, useState } from 'react';
import styles from './Chatbot.module.css';
import { useMutation } from "react-query"
import { chat } from '../func/apiCalls.service';
import { message as usemessage } from 'antd'

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [messageApi, contextHolder] = usemessage.useMessage()
  const { mutate: useChat } = useMutation("sendMessage", chat)
  const messagesEndRef = useRef(null)

  const handleSend = () => {
    if (input.trim() === '') return;
    setMessages([...messages, { sender: 'user', text: input }]);
    setInput('');

    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: 'bot', text: 'Typing...' },
    ]);

    useChat({ values: { message: input } }, {
      onSuccess: (data) => {
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          updatedMessages.pop(); // Remove 'Typing...' message
          return [
            ...updatedMessages,
            { sender: 'bot', text: data },
          ];
        });
      },
      onError: (error) => {
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          updatedMessages.pop(); // Remove 'Typing...' message
          return updatedMessages;
        });
        messageApi.error(error);
      }
    });
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={styles.chatbotContainer}>
      {contextHolder}
      <div className={styles.chatWindow}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={
              msg.sender === 'user' ? styles.userMessage : styles.botMessage
            }
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className={styles.inputBox}
        />
        <button onClick={handleSend} className={styles.sendButton}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
