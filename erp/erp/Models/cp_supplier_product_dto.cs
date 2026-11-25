using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace erp.Models
{
    public class cp_supplier_product_dto
    {
        public string supplier_product_id { get; set; } = string.Empty;
        public string supplier_id { get; set; } = string.Empty;
        public string supplier_name { get; set; } = string.Empty;
        public string product_id { get; set; } = string.Empty;
        public string product_name { get; set; } = string.Empty;
        public decimal price { get; set; }
        public string img { get; set; } = string.Empty;
    }
}
