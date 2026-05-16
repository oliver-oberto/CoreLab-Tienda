"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import styles from "./ChatWidget.module.css";

type Message = {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "¡Hola! Soy tu asesor de CoreLab. ¿Qué estás buscando mejorar?",
};

const QUICK_REPLIES = [
  "Rendimiento deportivo",
  "Salud general",
  "Piel y articulaciones",
  "Sueño y estrés",
  "No sé bien, necesito orientación",
];

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Pulse animation after 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) setShowPulse(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Show tooltip after 5 seconds if chat was not opened
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen && !tooltipDismissed) {
        setShowTooltip(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isOpen, tooltipDismissed]);

  // Listen for custom event from CTA buttons
  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
      setShowTooltip(false);
      setTooltipDismissed(true);
    };
    window.addEventListener("openCoreLabChat", handler);
    return () => window.removeEventListener("openCoreLabChat", handler);
  }, []);

  // Hide on checkout
  if (pathname?.startsWith("/checkout")) {
    return null;
  }

  const handleOpen = () => {
    setIsOpen(true);
    setShowPulse(false);
    setShowTooltip(false);
    setTooltipDismissed(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: "user", content: text };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: messages, // Send previous history
          message: text,     // Send new message
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "API Error");
      }

      setMessages([...newHistory, { role: "assistant", content: data.text }]);
    } catch (error: any) {
      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content: "Hubo un problema al conectar. Podés escribirnos por [WhatsApp →](https://wa.me/543518792797)",
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Convert markdown links [text](url) to html links to make WA links clickable
  const renderMessageContent = (content: string) => {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    let html = content;
    
    // First convert markdown links if any
    if (linkRegex.test(html)) {
      html = html.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    } else {
      // Otherwise just convert raw URLs
      html = html.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    }

    // Replace newlines with <br/>
    html = html.replace(/\n/g, "<br />");
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className={styles.chatWrapper}>
      {isOpen ? (
        <div className={styles.chatPanel}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              CORELAB ASESOR
            </div>
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Cerrar chat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className={styles.messagesArea}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`${styles.messageRow} ${styles[msg.role]}`}>
                <div className={`${styles.messageBubble} ${msg.isError ? styles.errorBubble : ""}`}>
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            ))}
            
            {/* Show Quick Replies only after the first bot message, if it's the last message */}
            {messages.length === 1 && messages[0].role === "assistant" && (
              <div className={`${styles.messageRow} ${styles.bot}`}>
                <div className={styles.quickReplies}>
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      className={styles.quickReplyBtn}
                      onClick={() => sendMessage(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isTyping && (
              <div className={`${styles.messageRow} ${styles.bot}`}>
                <div className={styles.messageBubble}>
                  <div className={styles.typingIndicator}>
                    <span className={styles.typingDot}></span>
                    <span className={styles.typingDot}></span>
                    <span className={styles.typingDot}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className={styles.inputArea}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribí tu consulta..."
              className={styles.inputField}
              disabled={isTyping}
            />
            <button type="submit" className={styles.sendBtn} disabled={!inputValue.trim() || isTyping}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      ) : (
        <>
          {showTooltip && !isOpen && (
            <div className={styles.tooltip}>
              <button
                className={styles.tooltipClose}
                onClick={() => { setShowTooltip(false); setTooltipDismissed(true); }}
                aria-label="Cerrar"
              >✕</button>
              ¿No sabés qué suplemento elegir?
              <br />
              <span style={{ opacity: 0.75, fontSize: "12px" }}>
                Nuestro asesor IA te ayuda al instante 💬
              </span>
            </div>
          )}
          <button
            className={`${styles.floatingBtn} ${showPulse ? styles.pulse : ""}`}
            onClick={handleOpen}
            aria-label="Abrir asistente virtual"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
