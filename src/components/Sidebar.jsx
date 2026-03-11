import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div style={{ width: '200px', background: '#eee', padding: '20px' }}>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/profile">Profile</Link></li>
      </ul>
    </div>
  );
}
