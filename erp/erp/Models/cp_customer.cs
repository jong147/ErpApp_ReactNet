using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace erp.Models
{
    [Table("cp_customer")]
    public class cp_customer
    {
        [Key]
        [JsonPropertyName("customer_id")]
        public string customer_id { get; set; } = string.Empty; // increment
        [JsonPropertyName("customer_type")] // individual/company
        public string customer_type { get; set; } = string.Empty;
        [JsonPropertyName("first_name")]
        public string first_name { get; set; } = string.Empty;
        [JsonPropertyName("last_name")]
        public string last_name { get; set; } = string.Empty;
        [JsonPropertyName("company_name")]
        public string company_name { get; set; } = string.Empty;
        [JsonPropertyName("email")]
        public string email { get; set; } = string.Empty;
        [JsonPropertyName("phone")]
        public string phone { get; set; } = string.Empty;
        [JsonPropertyName("tax_id")]
        public string tax_id { get; set; } = string.Empty;

    }
}
