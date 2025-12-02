export default function MessageList({ messages }) {
  return (
    <div style={{ border: '1px solid #3A506B', padding: '10px', maxHeight: '400px', overflowY: 'auto' }}>
      {messages.length === 0 && <div style={ {color:'#3A506B'}}>Brak wiadomości</div>}
      {messages.map((msg, idx) => (
        <div key={idx} style={{ marginBottom: '8px' }}>
          <strong>{msg.content}</strong> <em style={{ color: '#888' }}>{msg.timestamp}</em>
        </div>
      ))}
    </div>
  );
}
