using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using static forms_api.Entities.SheetEntities;

namespace forms_api.Entities
{


    public class Layer
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string? Name { get; set; }

        [JsonIgnore]
        public ICollection<SheetLayerStatus> SheetLayerStatuses { get; set; } = new List<SheetLayerStatus>();

    }

    public class Remark
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string? Name { get; set; }
    }

    
    public class Product
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string? Name { get; set; }
    }
    public class Links
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
        public string? Link { get; set; }

        [Required]
        public DateTime WeekStart { get; set; }
    }

}
