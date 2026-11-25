using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace erp.Models
{
    [Table("cp_supplier_product")]
    public class cp_supplier_product
    {
        [Key]
        [JsonPropertyName("supplier_product_id")] // SP001
        public string supplier_product_id { get; set; } = string.Empty;
        [JsonPropertyName("supplier_id")]
        public string supplier_id { get; set; } = string.Empty;
        [JsonPropertyName("product_id")]
        public string product_id { get; set; } = string.Empty;
        [JsonPropertyName("price")]
        public decimal price { get; set; }
    }
}
