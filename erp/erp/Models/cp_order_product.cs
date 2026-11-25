using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace erp.Models
{
    [Table("cp_order_product")]
    public class cp_order_product
    {
        [Key]
        [JsonPropertyName("order_product_id")] // e.g. OP001
        public string order_product_id { get; set; } = string.Empty;
        [JsonPropertyName("order_id")] // e.g. OR001
        public string order_id { get; set; } = string.Empty;
        [JsonPropertyName("product_id")]
        public string product_id { get; set; } = string.Empty;
        [JsonPropertyName("quantity")]
        public int quantity { get; set; }
    }
}
