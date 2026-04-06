"use client";
import { useState, useEffect } from "react";
import styles from "./page.module.css";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => {
      setUsers(d.users || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Usuarios ({users.length})</h2>
      </div>
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table} id="admin-users-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Registrado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} id={`admin-user-${user.id}`}>
                  <td className={styles.gray}>{user.id}</td>
                  <td style={{ color: "var(--white)", fontWeight: 600 }}>{user.name}</td>
                  <td className={styles.gray}>{user.email}</td>
                  <td className={styles.gray}>{user.phone || "—"}</td>
                  <td>
                    <span className={`badge ${user.role === "admin" ? "badge-silver" : "badge-success"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className={styles.gray}>
                    {new Date(user.created_at).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
