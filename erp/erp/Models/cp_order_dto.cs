namespace erp.Models
{
    public class cp_order_dto
    {
        public string customer_id { get; set; } = string.Empty;
        public DateTime date { get; set; }
        public string notes { get; set; } = string.Empty;
        public Dictionary<string, int> products { get; set; } = new();
    }
}
