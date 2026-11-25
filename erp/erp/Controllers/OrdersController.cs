using erp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace erp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly DatabaseContext _db;

        public OrdersController(DatabaseContext db)
        {
            _db = db;
        }

        // GET: api/orders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<cp_order>>> GetAll()
        {
            return Ok(await _db.orders
                .AsNoTracking()
                .ToListAsync());
        }

        // GET: api/orders/0R001
        [HttpGet("{id}")]
        public async Task<ActionResult<cp_order>> GetById(string id)
        {
            var order = await _db.orders.FindAsync(id);

            if (order == null)
                return NotFound();

            return Ok(order);
        }

        // get order products for a given order id
        [HttpGet("{id}/products")]
        public async Task<ActionResult<IEnumerable<cp_order_product_dto>>> GetOrderProducts(string id)
        {
            var orderProducts = await (
                from op in _db.order_products.AsNoTracking()
                join p in _db.products.AsNoTracking()
                    on op.product_id equals p.product_id
                where op.order_id == id
                select new cp_order_product_dto
                {
                    product_id = op.product_id,
                    product_name = p.name,
                    price = p.price,
                    quantity = op.quantity,
                    img = p.img
                }
            ).ToListAsync();

            return Ok(orderProducts);
        }

        [HttpPost]
        public async Task<ActionResult<cp_order>> Create(
        [FromBody] cp_order_dto request)
        {
            await using var transaction =
                await _db.Database.BeginTransactionAsync();

            // if the customer id does not exist, return error
            if (!string.IsNullOrEmpty(request.customer_id))
            {
                var customerExists = await _db.customers
                    .AsNoTracking()
                    .AnyAsync(c => c.customer_id == request.customer_id);
                if (!customerExists)
                    return BadRequest(
                        $"Customer ID '{request.customer_id}' does not exist.");
            }

            // Get product prices
            var productIds = request.products.Keys.ToList();

            var prices = await _db.products
                .AsNoTracking()
                .Where(p => productIds.Contains(p.product_id))
                .ToDictionaryAsync(p => p.product_id, p => p.price);

            if (prices.Count != request.products.Count)
                return BadRequest("One or more products were not found.");

            // Calculate totals
            decimal subtotal = request.products.Sum(
                p => prices[p.Key] * p.Value);

            decimal tax = subtotal * 0.12m;

            // Generate order ID
            int orderId = await NextSequenceValueAsync("OrderIdSequence");

            var order = new cp_order
            {
                order_id = $"OR{orderId:D3}",
                customer_id = request.customer_id,
                date = request.date,
                status = "confirmed",
                subtotal = subtotal,
                tax = tax,
                total = subtotal + tax,
                notes = request.notes
            };

            _db.orders.Add(order);

            // Create order product rows
            foreach (var item in request.products)
            {
                int orderProductId =
                    await NextSequenceValueAsync("OrderProductIdSequence");

                _db.order_products.Add(new cp_order_product
                {
                    order_product_id = $"OP{orderProductId:D3}",
                    order_id = order.order_id,
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

        // PUT: api/orders/0R001
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] cp_order updated)
        {
            var order = await _db.orders.FindAsync(id);

            if (order == null)
                return NotFound();

            order.customer_id = updated.customer_id;
            order.date = updated.date;
            order.status = updated.status;
            order.subtotal = updated.subtotal;
            order.tax = updated.subtotal * 0.12m;
            order.total = order.subtotal + order.tax;
            order.notes = updated.notes;

            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
