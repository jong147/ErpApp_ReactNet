using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace erp.Models
{
    [Table("cp_product")]
    public class cp_product
    {
        [Key]
        [JsonPropertyName("product_id")]
        public string product_id { get; set; } = string.Empty;
        [JsonPropertyName("name")]
        public string name { get; set; } = string.Empty;
        [JsonPropertyName("description")]
        public string description { get; set; } = string.Empty;
        
        [JsonPropertyName("minimum_stock")]
        public int minimum_stock { get; set; }
        [JsonPropertyName("price")]
        public decimal price { get; set; }
        [JsonPropertyName("img")]
        public string img { get; set; } = string.Empty;
    }
}
