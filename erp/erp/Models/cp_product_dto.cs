using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace erp.Models
{
    public class cp_product_dto
    {
        public string product_id { get; set; } = string.Empty;
        public string name { get; set; } = string.Empty;
        public string description { get; set; } = string.Empty;
        public int stock { get; set; }
        public int minimum_stock { get; set; }
        public decimal price { get; set; }
        public string img { get; set; } = string.Empty;
    }
}
