using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace erp.Models
{
    [Table("cp_order")]
    public class cp_order
    {
        [Key]
        [JsonPropertyName("order_id")]
        public string order_id { get; set; } = string.Empty; // format OR001
        [JsonPropertyName("customer_id")] // existing or walk-in customer (no id)
        public string customer_id { get; set; } = string.Empty; // e.g. CUS001 or ""
        [JsonPropertyName("date")]
        public DateTime date { get; set; }
        [JsonPropertyName("status")] // confirmed/completed/cancelled
        public string status { get; set; } = string.Empty;
        [JsonPropertyName("subtotal")]
        public decimal subtotal { get; set; }
        [JsonPropertyName("tax")]
        public decimal tax { get; set; } // 12% of subtotal
        [JsonPropertyName("total")]
        public decimal total { get; set; }
        [JsonPropertyName("notes")]
        public string notes { get; set; } = string.Empty;
    }
}
