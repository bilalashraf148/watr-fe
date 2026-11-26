import { Link } from "react-router";
import { ROUTES } from "@/config/routes";

export default function NotFoundPage() {
  return (
    <main className="page">
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for does not exist.</p>
      <Link to={ROUTES.home}>Back to home</Link>
    </main>
  );
}
