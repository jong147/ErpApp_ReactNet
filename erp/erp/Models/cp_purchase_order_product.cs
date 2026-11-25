using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace erp.Models
{
    [Table("cp_purchase_order_product")]
    public class cp_purchase_order_product
    {
        [Key]
        [JsonPropertyName("purchase_order_product_id")]
        public string purchase_order_product_id { get; set; } = string.Empty;
        [JsonPropertyName("purchase_order_id")]
        public string purchase_order_id { get; set; } = string.Empty;
        [JsonPropertyName("product_id")]
        public string product_id { get; set; } = string.Empty;
        [JsonPropertyName("quantity")]
        public int quantity { get; set; }
    }
}
