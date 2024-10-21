using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace forms_api.Entities
{
    public class SheetEntities
    {
        public class SheetLayerStatus
        {
            [Key]
            public int Id { get; set; }

            public int? ProductId { get; set;  }

            [ForeignKey ("ProductId")]
            public Product? Product { get; set; }


            public int SheetId { get; set; }
            [ForeignKey ("SheetId")]
            public Sheet Sheet { get; set; }


            public int LayerId { get; set; }

            [ForeignKey ("LayerId")]
            public Layer Layer { get; set; }

            public decimal Completion { get; set; } = 0;
            public bool IsQCInProgress { get; set; } = true;
            public bool IsFinalQCInProgress { get; set; } = true;
            public bool IsFinalizedQCInProgress { get; set; } = true; 

            public bool InProgress { get; set; } = true;
            public int? DeliveryNumber { get; set; }
        }

        public class DailySheetAssignments
        {
            [Key]
            public int Id { get; set; }

            public int LayerId { get; set; }
            [ForeignKey("LayerId")]
            public Layer? Layer { get; set; }
            public required string SheetNumber { get; set; }

            public DateTime AssignmentDate { get; set; } 

            public int TaqniaId { get; set; }

            [ForeignKey("TaqniaId")]
            public User? User { get; set; }

            public string? Name { get; set; }
            public required string Remark { get; set; }


        }

        public class SheetAssignment
        {
            [Key]
            public int SheetAssignmentId { get; set; }
            public bool? IsQC { get; set; } = false;

            public DateTime? AssignmentDate { get; set; }

            public bool InProgress { get; set; } = true;



            public bool IsApproved { get; set; } = false;

            public int? LayerId { get; set; }
            [ForeignKey("LayerId")]
            public Layer? Layer { get; set; }

      

            public int SheetId { get; set; }
            [ForeignKey("SheetId")]
            public Sheet? Sheet { get; set; }

            public int TaqniaID { get; set; }
            [ForeignKey("TaqniaID")]
            public User? User { get; set; }
        }

        public class Sheet
        {
            [Key]
            public int SheetId { get; set; }
            public string? SheetName { get; set; }
            public int? Year { get; set; }
            public string? Country { get; set; }
            public int? DeliveryNumber { get; set; }
            public bool InProgress { get; set; } = true;
            public bool QCInProgress { get; set; } = true;
            public string? Hydrography { get; set; }
            public string? Agriculture { get; set; }
            public string? Buildings { get; set; }
            public string? Roads { get; set; }
            public string? Physiography { get; set; }

            [JsonIgnore]
            public ICollection<SheetAssignment> SheetAssignments { get; set; } = new List<SheetAssignment>();
            [JsonIgnore]

            // Collection of SheetLayerStatus
            public ICollection<SheetLayerStatus> LayerStatuses { get; set; } = new List<SheetLayerStatus>();
        }

    }
}
