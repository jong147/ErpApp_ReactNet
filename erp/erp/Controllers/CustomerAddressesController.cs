using erp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace erp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerAddressesController : ControllerBase
    {
        private readonly DatabaseContext _db;

        public CustomerAddressesController(DatabaseContext db)
        {
            _db = db;
        }

        // READ: Get all addresses for a specific customer
        [HttpGet("customer/{customerId}")]
        public async Task<ActionResult<IEnumerable<cp_customer_address>>>
            GetByCustomerId(string customerId)
        {
            // Check whether the customer exists
            var customerExists = await _db.customers
                .AnyAsync(c => c.customer_id == customerId);

            if (!customerExists)
                return NotFound("Customer not found.");

            var addresses = await _db.customer_addresses
                .AsNoTracking()
                .Where(a => a.customer_id == customerId)
                .OrderBy(a => a.address_type)
                .ToListAsync();

            return Ok(addresses);
        }

        // CREATE
        [HttpPost]
        public async Task<ActionResult<cp_customer_address>> Create(
            [FromBody] cp_customer_address address)
        {
            // Validate customer ID
            if (string.IsNullOrWhiteSpace(address.customer_id))
            {
                return BadRequest("Customer ID is required.");
            }

            // Check whether the customer exists
            var customerExists = await _db.customers
                .AnyAsync(c => c.customer_id == address.customer_id);

            if (!customerExists)
                return BadRequest("The specified customer does not exist.");

            // Validate address type
            if (address.address_type != "billing" &&
                address.address_type != "shipping")
            {
                return BadRequest(
                    "Address type must be 'billing' or 'shipping'.");
            }

            // Validate required address fields
            if (string.IsNullOrWhiteSpace(address.line_1) ||
                string.IsNullOrWhiteSpace(address.city) ||
                string.IsNullOrWhiteSpace(address.state) ||
                string.IsNullOrWhiteSpace(address.postal_code))
            {
                return BadRequest(
                    "Address line 1, city, state, and postal code are required.");
            }

            // Generate the next address ID using SQL Server sequence
            var connection = _db.Database.GetDbConnection();

            await _db.Database.OpenConnectionAsync();

            int nextId;

            try
            {
                await using var command = connection.CreateCommand();

                command.CommandText =
                    "SELECT NEXT VALUE FOR dbo.CustomerAddressIdSequence;";

                command.Transaction =
                    _db.Database.CurrentTransaction?.GetDbTransaction();

                var result = await command.ExecuteScalarAsync();

                nextId = Convert.ToInt32(result);
            }
            finally
            {
                await _db.Database.CloseConnectionAsync();
            }

            address.customer_address_id = $"CAD{nextId:D3}";

            // Save address
            _db.customer_addresses.Add(address);

            await _db.SaveChangesAsync();

            //return CreatedAtAction(
            //    nameof(GetById),
            //    new { id = address.customer_address_id },
            //    address);

            return Ok(address);
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] cp_customer_address updated)
        {
            var address = await _db.customer_addresses
                .FindAsync(id);

            if (address == null)
                return NotFound();

            // Validate customer ID
            if (string.IsNullOrWhiteSpace(updated.customer_id))
            {
                return BadRequest("Customer ID is required.");
            }

            // Check whether the customer exists
            var customerExists = await _db.customers
                .AnyAsync(c => c.customer_id == updated.customer_id);

            if (!customerExists)
                return BadRequest("The specified customer does not exist.");

            // Validate address type
            if (updated.address_type != "billing" &&
                updated.address_type != "shipping")
            {
                return BadRequest(
                    "Address type must be 'billing' or 'shipping'.");
            }

            // Validate required address fields
            if (string.IsNullOrWhiteSpace(updated.line_1) ||
                string.IsNullOrWhiteSpace(updated.city) ||
                string.IsNullOrWhiteSpace(updated.state) ||
                string.IsNullOrWhiteSpace(updated.postal_code))
            {
                return BadRequest(
                    "Address line 1, city, state, and postal code are required.");
            }

            // Update address fields
            address.customer_id = updated.customer_id;
            address.address_type = updated.address_type;
            address.line_1 = updated.line_1;
            address.line_2 = updated.line_2;
            address.city = updated.city;
            address.state = updated.state;
            address.postal_code = updated.postal_code;

            await _db.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var address = await _db.customer_addresses
                .FindAsync(id);

            if (address == null)
                return NotFound();

            _db.customer_addresses.Remove(address);

            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
