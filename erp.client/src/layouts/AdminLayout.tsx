import type { ReactNode } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "./AdminLayout.css";

type AdminLayoutProps = {
  children: ReactNode;
  breadcrumb?: string;
};

export default function AdminLayout({
  children,
  breadcrumb,
}: AdminLayoutProps) {
  return (
    <div className="admin">
      <Sidebar />

      <main className="main">
        <Topbar breadcrumb={breadcrumb} />

        <section className="content">
          {children}
        </section>
      </main>
    </div>
  );
}