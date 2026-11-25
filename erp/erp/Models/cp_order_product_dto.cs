using System.Text.Json.Serialization;

namespace erp.Models
{
    public class cp_order_product_dto
    {
        public string product_id { get; set; } = string.Empty;
        public string product_name { get; set; } = string.Empty;
        public decimal price { get; set; }
        public int quantity { get; set; }
        public string img { get; set; } = string.Empty;
    }
}
