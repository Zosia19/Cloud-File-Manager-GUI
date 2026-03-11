import { useState } from 'react';

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text) return;
    onSend(text);
    setText('');
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Wpisz wiadomość..."
        style={{ padding: '8px', width: '300px' }}
      />
      <button onClick={handleSend} style={{ padding: '8px 12px', marginLeft: '10px' }}>
        Wyślij
      </button>
    </div>
  );
}
