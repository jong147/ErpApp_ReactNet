type TopbarProps = {
  breadcrumb?: string;
};

export default function Topbar({
  breadcrumb = "Admin / Products",
}: TopbarProps) {
  return (
    <header className="topbar">
      <span>{breadcrumb}</span>
      <span className="admin-user">Administrator</span>
    </header>
  );
}