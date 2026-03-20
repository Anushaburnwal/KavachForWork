/**
 * Chatbot Page — KavachForWork
 * AI-powered support chatbot using Claude API
 */
import { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';

const SYSTEM_PROMPT = `You are Kavach Assistant, the helpful AI support agent for KavachForWork — an AI-powered microinsurance platform protecting outdoor workers (delivery drivers, construction workers, street vendors) from extreme heat in India.

Key facts:
- Weekly premium: ₹29/week auto-deducted from wallet
- Payout tiers: 45-47°C = ₹150, 47-50°C = ₹300, 50°C+ = ₹500
- AI fraud detection: Sentry Random Forest model checks battery temp, GPS, network, brightness
- Signup bonus: ₹100 added automatically on registration
- Insurance deactivates if wallet balance < ₹29 on Monday
- Claims get instant wallet credit if approved by AI
- Temperature oracle: WeatherStack API at user's GPS location
- Works best on Android (battery temp sensor access)

Be concise, friendly, and helpful. Answer in the same language the user writes in (Hindi or English). Use ₹ symbol for rupees. If you don't know something, say so honestly.`;

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Namaste! 🙏 Main Kavach Assistant hoon. Main aapki madad kar sakta hoon:\n\n• Insurance ke baare mein\n• Claims kaise file karein\n• Wallet top-up\n• Heatwave alerts\n\nKya jaanna chahte hain? (Hindi ya English mein poochh sakte hain)',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error('Chatbot API error');
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      // Fallback: local pattern matching
      const reply = getLocalReply(text);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK_QUESTIONS = [
    'How do I file a claim?',
    'How much is the premium?',
    'When will I get paid?',
    'How does fraud detection work?',
  ];

  return (
    <div className="min-h-screen bg-kavach-warm font-body flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col">
        <div className="mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-kavach-orange to-orange-600 rounded-xl flex items-center justify-center shadow-kavach">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-kavach-dark">Kavach Assistant</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">Online • Replies in seconds</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-gradient-to-br from-kavach-orange to-orange-600 rounded-lg flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 mt-0.5">
                  🤖
                </div>
              )}
              <div className={`max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-kavach-orange text-white rounded-br-sm'
                  : 'bg-white border border-orange-50 text-kavach-dark rounded-bl-sm shadow-card'}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 bg-gradient-to-br from-kavach-orange to-orange-600 rounded-lg flex items-center justify-center text-white text-xs mr-2">🤖</div>
              <div className="bg-white border border-orange-50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-card">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-kavach-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-kavach-orange rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-kavach-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="px-3 py-1.5 text-xs font-medium text-kavach-orange bg-orange-50 border border-orange-200 rounded-full hover:bg-orange-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Type your question... (Hindi or English)"
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="btn-primary px-4 py-2.5 flex-shrink-0 disabled:opacity-50"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

// Local fallback responses when API is unavailable
function getLocalReply(text) {
  const t = text.toLowerCase();
  if (t.includes('claim') || t.includes('file')) {
    return '📋 To file a claim:\n1. Make sure your insurance is active (Dashboard)\n2. Go to "File Claim"\n3. We check weather at your location\n4. AI verifies you\'re outdoors\n5. ₹150-₹500 credited to wallet instantly!';
  }
  if (t.includes('premium') || t.includes('₹29') || t.includes('cost') || t.includes('price')) {
    return '💰 KavachForWork costs just ₹29/week.\n\nThis is auto-deducted from your wallet every Monday. Make sure you have ₹29+ balance to keep coverage active.';
  }
  if (t.includes('fraud') || t.includes('ai') || t.includes('verify')) {
    return '🤖 Our Sentry AI checks 8 signals:\n• Battery temperature (outdoor = warm)\n• Network type (mobile data = outdoors)\n• Screen brightness (outdoor = high)\n• GPS jitter & altitude variance\n• Battery drain rate\n\nYou can\'t fool it from an AC room! 🌡️';
  }
  if (t.includes('payout') || t.includes('money') || t.includes('paid')) {
    return '💸 Payout tiers:\n• 45-47°C → ₹150\n• 47-50°C → ₹300  \n• 50°C+ → ₹500\n\nApproved claims are credited instantly to your wallet. Flagged claims are reviewed within 24 hours.';
  }
  if (t.includes('wallet') || t.includes('balance') || t.includes('topup')) {
    return '💳 To top up your wallet:\n1. Go to Wallet page\n2. Choose amount (₹29, ₹100, ₹200, ₹500)\n3. Pay via UPI/Card (Razorpay)\n4. Balance updates instantly\n\nTip: Keep ₹100+ for a month\'s coverage + buffer!';
  }
  return 'Namaste! Main samjha nahi. Please ek aur tarike se poochein, ya humse contact karein support@kavachforwork.in par. 🙏';
}
