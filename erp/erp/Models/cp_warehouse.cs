using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace erp.Models
{
    [Table("cp_warehouse")]
    public class cp_warehouse
    {
        [Key]
        [JsonPropertyName("warehouse_id")]
        public string warehouse_id { get; set; } = string.Empty;
        [JsonPropertyName("name")]
        public string name { get; set; } = string.Empty;
        [JsonPropertyName("address")]
        public string address { get; set; } = string.Empty;
    }
}
