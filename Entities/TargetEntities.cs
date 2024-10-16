using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace forms_api.Entities
{
 
    public class WeeklyTarget
    {

        [Key]
        public int Id { get; set; }


        [JsonConverter(typeof(JsonStringEnumConverter))]
        public ProductionRole? ProductionRole { get; set; }
        public int ProductId { get; set; }
        [ForeignKey("ProductId")]
        public Product? Product { get; set; }
        [Required]
        public int LayerId { get; set; }
        [ForeignKey("LayerId")]
        public Layer? Layer { get; set; }

        [Required]
        public DateTime WeekStart { get; set; }

        
        // Daily amounts
        public decimal? MondayAmount { get; set; }
        public decimal? TuesdayAmount { get; set; }
        public decimal? WednesdayAmount { get; set; }
        public decimal? ThursdayAmount { get; set; }
        public decimal? FridayAmount { get; set; }
        public decimal? SaturdayAmount { get; set; }
        public decimal? SundayAmount { get; set; }
        public decimal? Amount { get; set; }

    }

    public class WeeklyTargetDay
    {
        [Key]
        public int Id { get; set; }

        public int ProductId { get; set; }
        [ForeignKey("ProductId")]
        public Product? Product { get; set; }

        [Required]
        public int LayerId { get; set; }
        [ForeignKey("LayerId")]
        public Layer? Layer { get; set; }

        [Required]
        public DateTime Date { get; set; }

        public decimal? Amount { get; set; }


    }
    public class Targets
    {
        [Key]
        public int TargetId { get; set; }
        public Layer? Layer { get; set; }  
        public int? EditorCount { get; set; }
        public Product? Product { get; set; }
        public double? Productivity { get; set; }
    }

    public class Calculation
    {
        [Key]
        public int CalculationId { get; set; }

        [Required]
        public int LayerId { get; set; }

        [ForeignKey("LayerId")]
        public Layer Layer { get; set; }

        [Required]
        public int RemarkId { get; set; }

        [ForeignKey("RemarkId")]
        public Remark Remark { get; set; }

        [Required]
        public double ValuePerHour { get; set; }

        [Required]
        public double ValuePer8Hours { get; set; }


        [Required]
        public double DailyHours { get; set; } = 9.5;

        [Required]
        public int ProductId { get; set; }

        [ForeignKey("ProductId")]
        public Product Product { get; set; }

    }

}
