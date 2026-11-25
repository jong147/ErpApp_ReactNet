using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace erp.Models
{
    [Table("cp_warehouse_product")]
    public class cp_warehouse_product
    {
        [Key]
        [JsonPropertyName("warehouse_product_id")] // e.g. WP001
        public string warehouse_product_id { get; set; } = string.Empty;
        [JsonPropertyName("warehouse_id")] // e.g. WH001
        public string warehouse_id { get; set; } = string.Empty;
        [JsonPropertyName("product_id")]
        public string product_id { get; set; } = string.Empty;
        [JsonPropertyName("quantity")]
        public int quantity { get; set; }
    }
}
