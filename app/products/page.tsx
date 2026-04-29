"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ui/ProductCard";
import styles from "./page.module.css";
import { Suspense } from "react";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const [searchInput, setSearchInput] = useState(search);

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    params.set("page", page.toString());
    params.set("limit", "12");

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setCategories(data.categories || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [category, search, minPrice, maxPrice, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/products?${params}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", searchInput);
  };

  const clearFilters = () => {
    setSearchInput("");
    router.push("/products");
    setShowMobileFilters(false);
  };

  const hasFilters = category || search || minPrice || maxPrice;

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <span className="section-label">Tienda</span>
            <h1 className={styles.title}>Catálogo de Productos</h1>
            {!loading && (
              <p className={styles.resultCount}>
                {total} producto{total !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className={styles.searchForm} id="products-search-form">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`form-input ${styles.searchInput}`}
              id="products-search-input"
            />
            <button type="submit" className="btn btn-primary" id="products-search-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </button>
          </form>
        </div>

        {/* Mobile Filter Button (Relocated) */}
        <div className={styles.mobileFilterWrapper}>
          <button 
            className={styles.mobileFilterBtn}
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            {showMobileFilters ? "Ocultar Filtros" : "Filtrar Resultados"}
          </button>
        </div>

        {/* Mobile quick filters */}
        <div className={styles.mobileCategories}>
          <button
            className={`${styles.mobileCatItem} ${!category ? styles.mobileCatActive : ""}`}
            onClick={() => updateParam("category", "")}
          >
            Todos
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.slug}
              className={`${styles.mobileCatItem} ${category === cat.slug ? styles.mobileCatActive : ""}`}
              onClick={() => updateParam("category", cat.slug)}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        <div className={styles.layout}>
          {/* Sidebar filters */}
          <aside className={`${styles.sidebar} ${showMobileFilters ? styles.sidebarVisible : ""}`} id="products-sidebar">
            <div className={styles.filterGroup}>
              <h3 className={styles.filterTitle}>Categorías</h3>
              <ul className={styles.filterList}>
                <li>
                  <button
                    className={`${styles.filterItem} ${!category ? styles.active : ""}`}
                    onClick={() => updateParam("category", "")}
                    id="filter-all"
                  >
                    Todas las categorías
                    <span className={styles.filterCount}>{total}</span>
                  </button>
                </li>
                {categories.map((cat: any) => (
                  <li key={cat.slug}>
                    <button
                      className={`${styles.filterItem} ${category === cat.slug ? styles.active : ""}`}
                      onClick={() => updateParam("category", cat.slug)}
                      id={`filter-${cat.slug}`}
                    >
                      <span>{cat.icon} {cat.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.filterGroup}>
              <h3 className={styles.filterTitle}>Precio</h3>
              <div className={styles.priceInputs}>
                <input
                  type="number"
                  placeholder="Mín"
                  value={minPrice}
                  onChange={(e) => updateParam("minPrice", e.target.value)}
                  className={`form-input ${styles.priceInput}`}
                  id="filter-min-price"
                />
                <span className={styles.priceSep}>—</span>
                <input
                  type="number"
                  placeholder="Máx"
                  value={maxPrice}
                  onChange={(e) => updateParam("maxPrice", e.target.value)}
                  className={`form-input ${styles.priceInput}`}
                  id="filter-max-price"
                />
              </div>
              <div className={styles.pricePresets}>
                {[
                  { label: "Hasta $8.000", min: "", max: "8000" },
                  { label: "$8.000 - $12.000", min: "8000", max: "12000" },
                  { label: "Más de $12.000", min: "12000", max: "" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    className={`${styles.presetBtn} ${minPrice === preset.min && maxPrice === preset.max ? styles.active : ""}`}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      if (preset.min) params.set("minPrice", preset.min); else params.delete("minPrice");
                      if (preset.max) params.set("maxPrice", preset.max); else params.delete("maxPrice");
                      params.delete("page");
                      router.push(`/products?${params}`);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {hasFilters && (
              <button className="btn btn-ghost btn-sm btn-full" onClick={clearFilters} id="clear-filters-btn">
                ✕ Limpiar filtros
              </button>
            )}
          </aside>

          {/* Products grid */}
          <div className={styles.main}>
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : products.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🔍</span>
                <h3>No se encontraron productos</h3>
                <p>Probá con otros filtros o términos de búsqueda</p>
                <button className="btn btn-outline" onClick={clearFilters}>Ver todos</button>
              </div>
            ) : (
              <>
                <div className={styles.grid}>
                  {products.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        className={`${styles.pageBtn} ${page === p ? styles.pageActive : ""}`}
                        onClick={() => updateParam("page", p.toString())}
                        id={`page-btn-${p}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
