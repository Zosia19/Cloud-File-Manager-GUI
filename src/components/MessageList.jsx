export default function MessageList({ messages, view }) {

  const isGrid = view === 'grid';

  const containerStyle = {
    display: isGrid ? 'grid' : 'flex',
    flexDirection: isGrid ? undefined : 'column',
    gridTemplateColumns: isGrid
      ? 'repeat(auto-fill, minmax(200px, 1fr))'
      : undefined,
    gap: isGrid ? '15px' : '8px',
    padding: '10px',
    border: !isGrid ? '1px solid #3A506B' : 'none',
    maxHeight: '400px',
    overflowY: 'auto',
  };

  const emptyStyle = {
    color: '#5BC0BE',
    textAlign: 'center',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #3A506B',
  };

  const messageStyle = {
    border: '1px solid #3A506B',
    borderRadius: '8px',
    padding: '10px',
    backgroundColor: '#1C2541',
    color: '#FFFFFF',
    minHeight: isGrid ? '140px' : '60px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: isGrid ? 'center' : 'flex-start',
    textAlign: isGrid ? 'center' : 'left',
  };

  return (
    <div style={containerStyle}>
      {messages.length === 0 && (
        <div style={emptyStyle}>Brak wiadomości</div>
      )}

      {messages.map((msg, idx) => (
        <div key={idx} style={messageStyle}>
          <strong>{msg.content}</strong>
          <small style={{ opacity: 0.7 }}>{msg.timestamp}</small>
        </div>
      ))}
    </div>
  );
}
