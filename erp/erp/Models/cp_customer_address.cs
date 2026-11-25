using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace erp.Models
{
    [Table("cp_customer_address")]
    public class cp_customer_address
    {
        [Key]
        [JsonPropertyName("customer_address_id")]
        public string customer_address_id { get; set; } = string.Empty;
        [JsonPropertyName("customer_id")]
        public string customer_id { get; set; } = string.Empty;
        [JsonPropertyName("address_type")] // billing/shipping
        public string address_type { get; set; } = string.Empty;
        [JsonPropertyName("line_1")]
        public string line_1 { get; set; } = string.Empty;
        [JsonPropertyName("line_2")]
        public string line_2 { get; set; } = string.Empty;
        [JsonPropertyName("city")]
        public string city { get; set; } = string.Empty;
        [JsonPropertyName("state")]
        public string state { get; set; } = string.Empty;
        [JsonPropertyName("postal_code")]
        public string postal_code { get; set; } = string.Empty;
    }
}
