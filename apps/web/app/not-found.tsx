import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="card mt" aria-labelledby="not-found-heading">
      <div className="eyebrow">404</div>
      <h1 id="not-found-heading">Page not found</h1>
      <p className="sub">
        That address is not part of this site. The asset you were looking for may have moved, or the
        link may be incomplete.
      </p>
      <p className="row mt">
        <Link href="/">Back to the dashboard</Link>
        <Link href="/integrate/" className="secondary">
          Integration guide
        </Link>
      </p>
    </section>
  );
}
