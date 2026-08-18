"use client";

import * as React from "react";

/**
 * Featured Products — Smart Projectors pinned to the very top of the landing page.
 *
 * Self-contained component that fetches projectors from the API and displays
 * them in a grid. Placed directly in page.tsx so it renders before the Marketplace.
 */
export function FeaturedProjectorsInline() {
  const [projectors, setProjectors] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/v1/products?category=smart-projectors&limit=8&sort=popular")
      .then((res) => res.json())
      .then((data) => {
        setProjectors(data?.data?.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && projectors.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight pb-text-gradient">
            ✨ Featured Products
          </h2>
          <p className="text-sm text-muted-foreground">
            Smart Projectors — premium home cinema experience
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[4/3] rounded-xl bg-muted animate-pulse" />
                <div className="mt-2 h-4 rounded bg-muted animate-pulse" />
              </div>
            ))
          : projectors.map((p: any) => (
              <div
                key={p.id}
                className="group cursor-pointer"
                onClick={() => {
                  window.location.href = `/product/${p.slug}`;
                }}
              >
                <div className="aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
                  {p.cover && (
                    <img
                      src={p.cover}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                <h3 className="mt-2 text-sm font-semibold line-clamp-1">{p.title}</h3>
                <p className="text-sm font-bold text-primary">
                  Rs {Number(p.price).toLocaleString()}
                </p>
              </div>
            ))}
      </div>
    </section>
  );
}
