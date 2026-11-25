namespace erp.Models
{
    public class cp_purchase_order_dto
    {
        public string supplier_id { get; set; } = string.Empty;
        public DateTime order_date { get; set; }
        public decimal delivery_cost { get; set; }
        public Dictionary<string, int> products { get; set; } = new();
    }
}
