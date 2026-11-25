using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace erp.Models
{
    [Table("cp_supplier")]
    public class cp_supplier
    {
        [Key]
        [JsonPropertyName("supplier_id")]
        public string supplier_id { get; set; } = string.Empty;
        [JsonPropertyName("name")]
        public string name { get; set; } = string.Empty;
        [JsonPropertyName("contact_person")]
        public string contact_person { get; set; } = string.Empty;
        [JsonPropertyName("phone")]
        public string phone { get; set; } = string.Empty;
        [JsonPropertyName("email")]
        public string email { get; set; } = string.Empty;
        [JsonPropertyName("address")]
        public string address { get; set; } = string.Empty;
        [JsonPropertyName("tax_id_number")]
        public string tax_id_number { get; set; } = string.Empty;

    }
}
