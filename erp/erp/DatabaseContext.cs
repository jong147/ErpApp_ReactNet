using Microsoft.EntityFrameworkCore;
using erp.Models;

namespace erp
{
    public class DatabaseContext : DbContext
    {
        public DatabaseContext(DbContextOptions<DatabaseContext> options) : base(options) { }

        public DbSet<cp_product> products { get; set; } = null!;
        public DbSet<cp_warehouse> warehouses { get; set; } = null!;
        public DbSet<cp_warehouse_product> warehouse_products { get; set; } = null!;
        public DbSet<cp_customer> customers { get; set; } = null!;
        public DbSet<cp_customer_address> customer_addresses { get; set; } = null!;
        public DbSet<cp_order> orders { get; set; } = null!;
        public DbSet<cp_order_product> order_products { get; set; } = null!;
        public DbSet<cp_supplier> suppliers { get; set; } = null!;
        public DbSet<cp_supplier_product> supplier_products { get; set; } = null!;

        public DbSet<cp_purchase_order> purchase_orders { get; set; } = null!;
        public DbSet<cp_purchase_order_product> purchase_order_products { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<cp_product>(entity =>
            {
                entity.ToTable("cp_product");
                entity.HasKey(p => p.product_id);
                entity.Property(p => p.name)
                .HasColumnName("name");
            });

            modelBuilder.Entity<cp_customer>(entity =>
            {
                entity.ToTable("cp_customer");
                entity.HasKey(p => p.customer_id);
            });

        }
    }

}
