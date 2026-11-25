using erp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace erp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SuppliersController : ControllerBase
    {
        private readonly DatabaseContext _db;

        public SuppliersController(DatabaseContext db)
        {
            _db = db;
        }

        // READ: Get all suppliers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<cp_supplier>>> GetAll()
        {
            return await _db.suppliers
                .AsNoTracking()
                .ToListAsync();
        }

        // READ: Get one supplier
        [HttpGet("{id}")]
        public async Task<ActionResult<cp_supplier>> GetById(string id)
        {
            var supplier = await _db.suppliers.FindAsync(id);

            if (supplier == null)
                return NotFound();

            return supplier;
        }

        // CREATE
        [HttpPost]
        public async Task<ActionResult<cp_supplier>> Create(
            [FromBody] cp_supplier supplier)
        {
            if (string.IsNullOrWhiteSpace(supplier.supplier_id))
                return BadRequest("Supplier ID is required.");

            if (await _db.suppliers.AnyAsync(
                s => s.supplier_id == supplier.supplier_id))
            {
                return Conflict("A supplier with this ID already exists.");
            }

            _db.suppliers.Add(supplier);
            await _db.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = supplier.supplier_id },
                supplier);
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] cp_supplier updated)
        {
            var supplier = await _db.suppliers.FindAsync(id);

            if (supplier == null)
                return NotFound();

            supplier.name = updated.name;
            supplier.contact_person = updated.contact_person;
            supplier.phone = updated.phone;
            supplier.email = updated.email;
            supplier.address = updated.address;
            supplier.tax_id_number = updated.tax_id_number;

            await _db.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var supplier = await _db.suppliers.FindAsync(id);

            if (supplier == null)
                return NotFound();

            _db.suppliers.Remove(supplier);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}