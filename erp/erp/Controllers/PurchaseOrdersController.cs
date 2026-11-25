using erp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace erp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly DatabaseContext _db;

        public PurchaseOrdersController(DatabaseContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<cp_order>>> GetAll()
        {
            return Ok(await _db.purchase_orders
                .AsNoTracking()
                .ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<cp_order>> GetById(string id)
        {
            var order = await _db.purchase_orders.FindAsync(id);

            if (order == null)
                return NotFound();

            return Ok(order);
        }

        [HttpGet("{id}/products")]
        public async Task<ActionResult<IEnumerable<cp_purchase_order_product_dto>>> GetOrderProducts(string id)
        {
            var orderProducts = await (
                from pop in _db.purchase_order_products.AsNoTracking()
                join p in _db.products.AsNoTracking()
                    on pop.product_id equals p.product_id
                join po in _db.purchase_orders.AsNoTracking()
                    on pop.purchase_order_id equals po.purchase_order_id
                join sp in _db.supplier_products.AsNoTracking()
                    on new { SupplierId = po.supplier_id, ProductId = pop.product_id }
                equals new { SupplierId = sp.supplier_id, ProductId = sp.product_id }

                where pop.purchase_order_id == id
                select new cp_purchase_order_product_dto
                {
                    product_id = pop.product_id,
                    product_name = p.name,
                    price = sp.price,
                    quantity = pop.quantity,
                    img = p.img
                }
            ).ToListAsync();

            return Ok(orderProducts);
        }

        [HttpPost]
        public async Task<ActionResult<cp_purchase_order>> Create(
        [FromBody] cp_purchase_order_dto request)
        {
            await using var transaction =
                await _db.Database.BeginTransactionAsync();

            // Get product prices
            var productIds = request.products.Keys.ToList();

            var prices = await _db.products
                .AsNoTracking()
                .Where(p => productIds.Contains(p.product_id))
                .ToDictionaryAsync(p => p.product_id, p => p.price);

            // Calculate totals
            decimal subtotal = request.products.Sum(
                p => prices[p.Key] * p.Value);

            decimal tax = subtotal * 0.12m;

            // Generate order ID
            int orderId = await NextSequenceValueAsync("PurchaseOrderIdSequence");

            var order = new cp_purchase_order
            {
                purchase_order_id = $"PO{orderId:D3}",
                supplier_id = request.supplier_id,
                order_date = request.order_date,
                status = "ordered",
                subtotal = subtotal,
                tax = tax,
                delivery_cost = request.delivery_cost,
                total = subtotal + tax + request.delivery_cost,
            };

            _db.purchase_orders.Add(order);

            // Create order product rows
            foreach (var item in request.products)
            {
                int orderProductId =
                    await NextSequenceValueAsync("PurchaseOrderProductIdSequence");

                _db.purchase_order_products.Add(new cp_purchase_order_product
                {
                    purchase_order_product_id = $"OP{orderProductId:D3}",
                    purchase_order_id = order.purchase_order_id,
                    product_id = item.Key,
                    quantity = item.Value
                });
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(order);
        }

        private async Task<int> NextSequenceValueAsync(string sequenceName)
        {
            var connection = _db.Database.GetDbConnection();

            await using var command = connection.CreateCommand();

            command.CommandText =
                $"SELECT NEXT VALUE FOR dbo.{sequenceName};";

            command.Transaction =
                _db.Database.CurrentTransaction?.GetDbTransaction();

            return Convert.ToInt32(await command.ExecuteScalarAsync());
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] cp_purchase_order updated)
        {
            var order = await _db.purchase_orders.FindAsync(id);

            if (order == null)
                return NotFound();

            order.delivery_date = updated.delivery_date;
            order.status = updated.status;

            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
