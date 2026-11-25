using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using erp.Models;

namespace erp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WarehousesController : ControllerBase
    {
        private readonly DatabaseContext _db;

        public WarehousesController(DatabaseContext db)
        {
            _db = db;
        }

        // READ: Get all warehouses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<cp_warehouse>>> GetAll()
        {
            return await _db.warehouses
                .AsNoTracking()
                //.OrderBy(w => w.warehouse_id)
                .ToListAsync();
        }

        // READ: Get one warehouse
        [HttpGet("{id}")]
        public async Task<ActionResult<cp_warehouse>> GetById(string id)
        {
            var warehouse = await _db.warehouses.FindAsync(id);

            if (warehouse == null)
                return NotFound();

            return warehouse;
        }

        // CREATE
        [HttpPost]
        public async Task<ActionResult<cp_warehouse>> Create(
            [FromBody] cp_warehouse warehouse)
        {
            if (string.IsNullOrWhiteSpace(warehouse.warehouse_id))
                return BadRequest("Warehouse ID is required.");

            if (await _db.warehouses.AnyAsync(
                w => w.warehouse_id == warehouse.warehouse_id))
            {
                return Conflict("A warehouse with this ID already exists.");
            }

            _db.warehouses.Add(warehouse);
            await _db.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = warehouse.warehouse_id },
                warehouse);
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] cp_warehouse updated)
        {
            var warehouse = await _db.warehouses.FindAsync(id);

            if (warehouse == null)
                return NotFound();

            warehouse.name = updated.name;
            warehouse.address = updated.address;

            await _db.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var warehouse = await _db.warehouses.FindAsync(id);

            if (warehouse == null)
                return NotFound();

            _db.warehouses.Remove(warehouse);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}