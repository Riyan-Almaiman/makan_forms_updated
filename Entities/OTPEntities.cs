using System.ComponentModel.DataAnnotations;

namespace forms_api.Entities
{
    public class OTPEntity
    {
        [Key]
        public int OTPId { get; set; }
        public int TaqniaId { get; set; }
        public DateTime? ExpiryTime { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? Purpose { get; set; }
        public bool IsUsed { get; set; } = false;
        public string? OTP { get; set; }
    }
}