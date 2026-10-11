import { useEffect, useState } from 'react';
import { API_BASE_URL, normalizeList } from '../api.js';
import Status from './Status.jsx';

const ENDPOINT = `${API_BASE_URL}/api/workouts/`;

export default function Workouts() {
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
      <h2 className="mb-3">Workouts</h2>
      <Status loading={loading} error={error} empty={items.length === 0}>
        <div className="row g-3">
          {items.map((item, index) => (
            <div className="col-md-6 col-lg-4" key={item._id ?? item.id ?? index}>
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{item.title}</h5>
                  <h6 className="card-subtitle mb-2 text-muted">
                    {item.category} · {item.difficulty} · {item.durationMinutes} min
                  </h6>
                  <p className="card-text">{item.description}</p>
                  <ul className="mb-0">
                    {(item.exercises ?? []).map((exercise, i) => (
                      <li key={i}>{typeof exercise === 'string' ? exercise : exercise.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Status>
    </section>
  );
}
