using erp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace erp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SupplierProductsController : ControllerBase
    {
        private readonly DatabaseContext _db;

        public SupplierProductsController(DatabaseContext db)
        {
            _db = db;
        }

        // READ: Get all supplier products
        [HttpGet]
        public async Task<ActionResult<IEnumerable<cp_supplier_product_dto>>> GetAll()
        {
            var products = await (
                from sp in _db.supplier_products.AsNoTracking()
                join p in _db.products.AsNoTracking()
                    on sp.product_id equals p.product_id
                join s in _db.suppliers.AsNoTracking()
                    on sp.supplier_id equals s.supplier_id
                select new cp_supplier_product_dto
                {
                    supplier_product_id = sp.supplier_product_id,
                    supplier_id = sp.supplier_id,
                    supplier_name = s.name,
                    product_id = sp.product_id,
                    product_name = p.name,
                    price = sp.price,
                    img = p.img
                }
            ).ToListAsync();
            return products;
        }

        // READ: Get supplier product by ID
        [HttpGet("{id}")]
        public async Task<ActionResult<cp_supplier_product>> GetById(string id)
        {
            var supplierProduct = await _db.supplier_products
                .AsNoTracking()
                .FirstOrDefaultAsync(sp => sp.supplier_product_id == id);

            if (supplierProduct == null)
                return NotFound();

            return supplierProduct;
        }

        // CREATE
        [HttpPost]
        public async Task<ActionResult<cp_supplier_product>> Create(
        [FromBody] cp_supplier_product supplierProduct)
        {
            // Generate the next supplier product ID using SQL Server sequence
            var connection = _db.Database.GetDbConnection();
            await _db.Database.OpenConnectionAsync();

            int nextId;

            try
            {
                await using var command = connection.CreateCommand();

                command.CommandText =
                    "SELECT NEXT VALUE FOR dbo.SupplierProductIdSequence;";

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

            // Format ID as SP001, SP002, SP003, etc.
            supplierProduct.supplier_product_id = $"SP{nextId:D3}";

            // Save supplier product
            _db.supplier_products.Add(supplierProduct);
            await _db.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = supplierProduct.supplier_product_id },
                supplierProduct);
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] cp_supplier_product updated)
        {
            var supplierProduct = await _db.supplier_products.FindAsync(id);

            if (supplierProduct == null)
                return NotFound();

            supplierProduct.supplier_id = updated.supplier_id;
            supplierProduct.product_id = updated.product_id;
            supplierProduct.price = updated.price;

            await _db.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var supplierProduct = await _db.supplier_products.FindAsync(id);

            if (supplierProduct == null)
                return NotFound();

            _db.supplier_products.Remove(supplierProduct);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}