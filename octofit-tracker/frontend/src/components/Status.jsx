export default function Status({ loading, error, empty, children }) {
  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" role="status" />
        <span>Loading…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        Could not load data: {error}
      </div>
    );
  }
  if (empty) {
    return <div className="alert alert-info">Nothing here yet.</div>;
  }
  return children;
}
