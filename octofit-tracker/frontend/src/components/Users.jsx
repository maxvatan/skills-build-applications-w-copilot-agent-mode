import { useEffect, useState } from 'react';
import { API_BASE_URL, normalizeList } from '../api.js';
import Status from './Status.jsx';

const ENDPOINT = `${API_BASE_URL}/api/users/`;

export default function Users() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(ENDPOINT, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        setItems(normalizeList(data));
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <section>
      <h2 className="mb-3">Users</h2>
      <Status loading={loading} error={error} empty={items.length === 0}>
        <div className="table-responsive">
          <table className="table table-striped table-hover bg-white">
            <thead className="table-dark">
              <tr>
                <th>Username</th>
                <th>Display name</th>
                <th>Email</th>
                <th>Team</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item._id ?? item.id ?? index}>
                  <td>{item.username}</td>
                  <td>{item.displayName}</td>
                  <td>{item.email}</td>
                  <td>{item.team?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Status>
    </section>
  );
}
