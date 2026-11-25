using erp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace erp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private DatabaseContext _db;
        public DashboardController(DatabaseContext db)
        {
            _db = db;
        }

        [HttpGet("purchased")]
        public async Task<ActionResult<decimal>> GetPurchased()
        {
            decimal purchased = await _db.purchase_orders
                .AsNoTracking()
                .Where(po => po.status != "cancelled")
                .Select(po => po.total)
                .SumAsync();

            return Ok(purchased);
        }

        [HttpGet("revenue")]
        public async Task<ActionResult<decimal>> GetRevenue()
        {
            decimal revenue = await _db.orders
                .AsNoTracking()
                .Where(x => x.status != "cancelled")
                .Select(x => x.total)
                .SumAsync();

            return Ok(revenue);
        }

        [HttpGet("customers")]
        public async Task<ActionResult<int>> GetCustomers()
        {
            int count = await _db.customers
                .AsNoTracking()
                .CountAsync();

            return Ok(count);
        }

        [HttpGet("low_stock")]
        public async Task<ActionResult<int>> GetLowStockProducts()
        {
            int count = await (
                from p in _db.products.AsNoTracking()
                join wp in _db.warehouse_products.AsNoTracking()
                    on p.product_id equals wp.product_id
                group wp by new { p.product_id, p.minimum_stock } into g
                where g.Sum(wp => wp.quantity) <= g.Key.minimum_stock
                select g.Key.product_id
            ).CountAsync();

            return Ok(count);
        }

        [HttpGet("pending_orders")]
        public async Task<ActionResult<int>> GetPendingOrders()
        {
            int count = await _db.orders
                .AsNoTracking()
                .Where(o => o.status == "confirmed")
                .CountAsync();

            return Ok(count);
        }

        [HttpGet("pending_po")]
        public async Task<ActionResult<int>> GetPendingPO()
        {
            int count = await _db.purchase_orders
                .AsNoTracking()
                .Where(po => po.status == "ordered")
                .CountAsync();

            return Ok(count);
        }
    }
}
