using erp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections;

namespace erp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private DatabaseContext _db;
        public ProductsController(DatabaseContext db)
        {
            _db = db;
        }

        // READ: Get all products
        [HttpGet]
        public async Task<ActionResult<IEnumerable<cp_product_dto>>> GetAll()
        {
            var products = await _db.products
                .AsNoTracking()
                .Select(p => new cp_product_dto
                {
                    product_id = p.product_id,
                    name = p.name,
                    description = p.description,
                    stock = _db.warehouse_products
                        .Where(wp => wp.product_id == p.product_id)
                        .Sum(wp => (int?)wp.quantity) ?? 0,
                    minimum_stock = p.minimum_stock,
                    price = p.price,
                    img = p.img
                })
                .ToListAsync();

            return Ok(products);
        }

        [HttpGet("supplier/{id}")]
        public async Task<ActionResult<IEnumerable<cp_product>>> GetBySupplier(string id)
        {
            var products = await (
                from p in _db.products.AsNoTracking()
                join sp in _db.supplier_products.AsNoTracking()
                    on p.product_id equals sp.product_id

                where sp.supplier_id == id
                select new cp_product
                {
                    product_id = p.product_id,
                    name = p.name,
                    description = p.description,
                    minimum_stock = p.minimum_stock,
                    price = sp.price,
                    img = p.img
                }
            ).ToListAsync();

            return Ok(products);
        }

        // READ: Get one product
        [HttpGet("{id}")]
        public async Task<ActionResult<cp_product>> GetById(string id)
        {
            var product = await _db.products.FindAsync(id);

            if (product == null)
                return NotFound();

            return product;
        }

        // CREATE
        [HttpPost]
        public async Task<ActionResult<cp_product>> Create(
        [FromBody] cp_product product)
        {
            if (string.IsNullOrWhiteSpace(product.product_id))
                return BadRequest("SKU is required.");

            if (product.minimum_stock < 0
                || product.price < 0)
                return BadRequest("Stock and price cannot be negative.");

            if (await _db.products.AnyAsync(
                p => p.product_id == product.product_id))
            {
                return Conflict("A product with this SKU already exists.");
            }

            _db.products.Add(product);
            await _db.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = product.product_id },
                product);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
        string id,
        [FromBody] cp_product updated)
        {
            var product = await _db.products.FindAsync(id);

            if (product == null)
                return NotFound();

            if (updated.minimum_stock < 0 ||
                updated.price < 0)
            {
                return BadRequest(
                    "Stock and price cannot be negative.");
            }

            product.name = updated.name;
            product.description = updated.description;
            product.minimum_stock = updated.minimum_stock;
            product.price = updated.price;
            product.img = updated.img;

            await _db.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var product = await _db.products.FindAsync(id);

            if (product == null)
                return NotFound();

            _db.products.Remove(product);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
