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
  const [brands, setBrands] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const search = searchParams.get("search") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sortBy = searchParams.get("sortBy") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const [searchInput, setSearchInput] = useState(search);
  // Local states for price inputs — avoid router.push on every keystroke
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isCatExpanded, setIsCatExpanded] = useState(true);
  const [isBrandExpanded, setIsBrandExpanded] = useState(true);

  // Keep local price inputs in sync when URL changes externally (e.g. clear filters)
  useEffect(() => { setMinPriceInput(minPrice); }, [minPrice]);
  useEffect(() => { setMaxPriceInput(maxPrice); }, [maxPrice]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (search) params.set("search", search);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sortBy) params.set("sortBy", sortBy);
    params.set("page", page.toString());
    params.set("limit", "12");

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setCategories(data.categories || []);
    setBrands(data.brands || []);
    setTotal(data.total || 0);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }, [category, brand, search, minPrice, maxPrice, sortBy, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") {
      params.delete("page");
    }
    router.push(`/products?${params}`);
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (minPriceInput) params.set("minPrice", minPriceInput);
    else params.delete("minPrice");
    if (maxPriceInput) params.set("maxPrice", maxPriceInput);
    else params.delete("maxPrice");
    params.delete("page");
    router.push(`/products?${params}`);
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") applyPriceFilter();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", searchInput);
  };

  const clearFilters = () => {
    setSearchInput("");
    setMinPriceInput("");
    setMaxPriceInput("");
    router.push("/products");
    setShowMobileFilters(false);
  };

  const hasFilters = category || brand || search || minPrice || maxPrice || sortBy;

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

          {/* Search bar + sort */}
          <div className={styles.headerRight}>
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
        </div>

        {/* Mobile Filter Button */}
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
                    onClick={() => {
                      if (!category) {
                        setIsCatExpanded(!isCatExpanded);
                      } else {
                        updateParam("category", "");
                        setIsCatExpanded(true);
                      }
                    }}
                    id="filter-all"
                    style={{ justifyContent: 'space-between', display: 'flex', width: '100%' }}
                  >
                    <span>Todas las categorías</span>
                    <span>{isCatExpanded ? '▲' : '▼'}</span>
                  </button>
                </li>
                {isCatExpanded && categories.map((cat: any) => (
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

            {/* Brands filter */}
            {brands.length > 0 && (
              <div className={styles.filterGroup}>
                <h3 className={styles.filterTitle}>Marca</h3>
                <ul className={styles.filterList}>
                  <li>
                    <button
                      className={`${styles.filterItem} ${!brand ? styles.active : ""}`}
                      onClick={() => {
                        if (!brand) {
                          setIsBrandExpanded(!isBrandExpanded);
                        } else {
                          updateParam("brand", "");
                          setIsBrandExpanded(true);
                        }
                      }}
                      id="filter-brand-all"
                      style={{ justifyContent: 'space-between', display: 'flex', width: '100%' }}
                    >
                      <span>Todas las marcas</span>
                      <span>{isBrandExpanded ? '▲' : '▼'}</span>
                    </button>
                  </li>
                  {isBrandExpanded && brands.map((b: any) => (
                    <li key={b.slug}>
                      <button
                        className={`${styles.filterItem} ${brand === b.slug ? styles.active : ""}`}
                        onClick={() => updateParam("brand", b.slug)}
                        id={`filter-brand-${b.slug}`}
                      >
                        <span>🏅 {b.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.filterGroup}>
              <h3 className={styles.filterTitle}>Precio</h3>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-dark)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Ordenar:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <button
                    className={`${styles.presetBtn} ${sortBy === 'price_desc' ? styles.active : ""}`}
                    onClick={() => updateParam("sortBy", sortBy === "price_desc" ? "" : "price_desc")}
                  >
                    Mayor a menor
                  </button>
                  <button
                    className={`${styles.presetBtn} ${sortBy === 'price_asc' ? styles.active : ""}`}
                    onClick={() => updateParam("sortBy", sortBy === "price_asc" ? "" : "price_asc")}
                  >
                    Menor a mayor
                  </button>
                </div>
              </div>
              <div className={styles.priceInputs}>
                <input
                  type="number"
                  placeholder="Mín"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  onBlur={applyPriceFilter}
                  onKeyDown={handlePriceKeyDown}
                  className={`form-input ${styles.priceInput}`}
                  id="filter-min-price"
                />
                <span className={styles.priceSep}>—</span>
                <input
                  type="number"
                  placeholder="Máx"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  onBlur={applyPriceFilter}
                  onKeyDown={handlePriceKeyDown}
                  className={`form-input ${styles.priceInput}`}
                  id="filter-max-price"
                />
              </div>
              <button
                className={`btn btn-ghost btn-sm btn-full ${styles.applyPriceBtn}`}
                onClick={applyPriceFilter}
                id="apply-price-filter-btn"
                style={{ marginTop: "0.5rem" }}
              >
                Aplicar precio
              </button>
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
                      setMinPriceInput(preset.min);
                      setMaxPriceInput(preset.max);
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
