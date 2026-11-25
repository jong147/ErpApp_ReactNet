using erp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace erp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WarehouseProductsController : ControllerBase
    {
        private readonly DatabaseContext _db;

        public WarehouseProductsController(DatabaseContext db)
        {
            _db = db;
        }

        // READ: Get all warehouse products
        [HttpGet]
        public async Task<ActionResult<IEnumerable<cp_warehouse_product>>> GetAll()
        {
            return await _db.warehouse_products
                .AsNoTracking()
                .ToListAsync();
        }

        // READ: Get one warehouse product
        [HttpGet("{id}")]
        public async Task<ActionResult<cp_warehouse_product>> GetById(string id)
        {
            var warehouseProduct = await _db.warehouse_products.FindAsync(id);

            if (warehouseProduct == null)
                return NotFound();

            return warehouseProduct;
        }

        // CREATE
        [HttpPost]
        public async Task<ActionResult<cp_warehouse_product>> Create(
            [FromBody] cp_warehouse_product warehouseProduct)
        {
            // Generate the next warehouse product ID using SQL Server sequence
            var connection = _db.Database.GetDbConnection();
            await _db.Database.OpenConnectionAsync();

            int nextId;

            try
            {
                await using var command = connection.CreateCommand();

                command.CommandText =
                    "SELECT NEXT VALUE FOR dbo.WarehouseProductIdSequence;";

                // Participate in an existing EF Core transaction, if present.
                command.Transaction =
                    _db.Database.CurrentTransaction?.GetDbTransaction();

                var result = await command.ExecuteScalarAsync();

                nextId = Convert.ToInt32(result);
            }
            finally
            {
                await _db.Database.CloseConnectionAsync();
            }

            // Format ID as WP001, WP002, WP003, etc.
            warehouseProduct.warehouse_product_id = $"WP{nextId:D3}";

            // Save warehouse product
            _db.warehouse_products.Add(warehouseProduct);
            await _db.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = warehouseProduct.warehouse_product_id },
                warehouseProduct);
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] cp_warehouse_product updated)
        {
            var warehouseProduct = await _db.warehouse_products.FindAsync(id);

            if (warehouseProduct == null)
                return NotFound();

            warehouseProduct.warehouse_id = updated.warehouse_id;
            warehouseProduct.product_id = updated.product_id;
            warehouseProduct.quantity = updated.quantity;

            await _db.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var warehouseProduct = await _db.warehouse_products.FindAsync(id);

            if (warehouseProduct == null)
                return NotFound();

            _db.warehouse_products.Remove(warehouseProduct);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}