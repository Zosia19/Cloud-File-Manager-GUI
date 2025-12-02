import { useState, useEffect } from 'react';
import MessageInput from './components/MessageInput';
import MessageList from './components/MessageList';

function App() {
  const [messages, setMessages] = useState([]);
  const [view, setView] = useState('list'); 

 
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch('http://localhost:3001/messages'); 
      const data = await res.json();
      setMessages(data);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (text) => {
    await fetch('http://localhost:3001/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ display: 'inline-block', width: '50%' }}>RabbitMQ Chat</h1>
      <h5 style={{ display: 'inline-block', width: '50%', textAlign: 'right' }}>
        Masz {messages.length} nowych wiadomości
      </h5>

      <MessageInput onSend={sendMessage} />

      <h2>Widok listy:</h2>
      <label>
        Lista
        <input
          type="radio"
          name="view"
          checked={view === 'list'}
          onChange={() => setView('list')}
          style={{ accentColor: 'gray' }}
        />
      </label>
      <label style={{ marginLeft: '20px' }}>
        Siatka
        <input
          type="radio"
          name="view"
          checked={view === 'grid'}
          onChange={() => setView('grid')}
          style={{ accentColor: 'gray' }}
        />
      </label>
<br/><br/>
      <MessageList messages={messages} view={view} /> 
    </div>
  );
}

export default App;
