using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace erp.Models
{
    [Table("cp_purchase_order")]
    public class cp_purchase_order
    {
        [Key]
        [JsonPropertyName("purchase_order_id")]
        public string purchase_order_id { get; set; } = string.Empty; // format PO001
        [JsonPropertyName("supplier_id")]
        public string supplier_id { get; set; } = string.Empty;
        [JsonPropertyName("order_date")]
        public DateTime order_date { get; set; }
        [JsonPropertyName("delivery_date")]
        public DateTime delivery_date { get; set; }
        [JsonPropertyName("status")] // ordered/received/cancelled
        public string status { get; set; } = string.Empty;
        [JsonPropertyName("subtotal")]
        public decimal subtotal { get; set; }
        [JsonPropertyName("tax")]
        public decimal tax { get; set; } // 12% of subtotal
        [JsonPropertyName("delivery_cost")]
        public decimal delivery_cost { get; set; }
        [JsonPropertyName("total")]
        public decimal total { get; set; }
    }
}
