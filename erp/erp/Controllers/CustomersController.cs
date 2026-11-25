using erp;
using erp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace erp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly DatabaseContext _db;

        public CustomersController(DatabaseContext db)
        {
            _db = db;
        }

        // READ: Get all customers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<cp_customer>>> GetAll()
        {
            return await _db.customers
                .AsNoTracking()
                .OrderBy(c => c.customer_type)
                .ToListAsync();
        }

        // get the customer complete name based on the customer type, by id
        [HttpGet("{id}/name")]
        public async Task<ActionResult<string>> GetCustomerName(string id)
        {
            var customer = await _db.customers.FindAsync(id);
            if (customer == null)
                return NotFound();
            string name = customer.customer_type switch
            {
                "individual" => $"{customer.first_name} {customer.last_name}",
                "company" => customer.company_name,
                _ => string.Empty
            };
            //return Ok(name);
            return new JsonResult(name);
        }

        // CREATE
        [HttpPost]
        public async Task<ActionResult<cp_customer>> Create(
        [FromBody] cp_customer customer)
        {
            // Validate customer type
            if (customer.customer_type != "individual" &&
                customer.customer_type != "company")
            {
                return BadRequest(
                    "Customer type must be 'individual' or 'company'.");
            }

            // Validate individual customer
            if (customer.customer_type == "individual" &&
                (string.IsNullOrWhiteSpace(customer.first_name) ||
                 string.IsNullOrWhiteSpace(customer.last_name)))
            {
                return BadRequest(
                    "First name and last name are required for individual customers.");
            }

            // Validate company customer
            if (customer.customer_type == "company" &&
                string.IsNullOrWhiteSpace(customer.company_name))
            {
                return BadRequest(
                    "Company name is required for company customers.");
            }

            // Check for duplicate email
            if (!string.IsNullOrWhiteSpace(customer.email) &&
                await _db.customers.AnyAsync(
                    c => c.email == customer.email))
            {
                return Conflict(
                    "A customer with this email already exists.");
            }

            // Generate the next customer ID using SQL Server sequence
            var connection = _db.Database.GetDbConnection();
            await _db.Database.OpenConnectionAsync();

            int nextId;

            try
            {
                await using var command = connection.CreateCommand();

                command.CommandText =
                    "SELECT NEXT VALUE FOR dbo.CustomerIdSequence;";

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

            customer.customer_id = $"CUS{nextId:D3}";

            // Save customer
            _db.customers.Add(customer);
            await _db.SaveChangesAsync();

            return Ok(customer);
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] cp_customer updated)
        {
            var customer = await _db.customers.FindAsync(id);

            if (customer == null)
                return NotFound();

            if (updated.customer_type != "individual" &&
                updated.customer_type != "company")
            {
                return BadRequest(
                    "Customer type must be 'individual' or 'company'.");
            }

            if (updated.customer_type == "individual" &&
                (string.IsNullOrWhiteSpace(updated.first_name) ||
                 string.IsNullOrWhiteSpace(updated.last_name)))
            {
                return BadRequest(
                    "First name and last name are required for individual customers.");
            }

            if (updated.customer_type == "company" &&
                string.IsNullOrWhiteSpace(updated.company_name))
            {
                return BadRequest(
                    "Company name is required for company customers.");
            }

            if (!string.IsNullOrWhiteSpace(updated.email) &&
                await _db.customers.AnyAsync(
                    c => c.email == updated.email &&
                         c.customer_id != id))
            {
                return Conflict("A customer with this email already exists.");
            }

            customer.customer_type = updated.customer_type;
            customer.first_name = updated.first_name;
            customer.last_name = updated.last_name;
            customer.company_name = updated.company_name;
            customer.email = updated.email;
            customer.phone = updated.phone;
            customer.tax_id = updated.tax_id;

            await _db.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var customer = await _db.customers.FindAsync(id);

            if (customer == null)
                return NotFound();

            _db.customers.Remove(customer);
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
