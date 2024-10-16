using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;
using System.Text.Json.Serialization;
using static forms_api.Entities.SheetEntities;

namespace forms_api.Entities
{

 





        public class Attendance
    {
        [Key]
        public int AttendanceID { get; set; }
        public int TaqniaID { get; set; }
        public string? NationalID { get; set; }
        public DateTime? Date { get; set; }
        public string? TimeIn { get; set; }
        public string? TimeOut { get; set; }
        public string? Status { get; set; }
        public string? Reason { get; set; }
        public string? Comment { get; set; }

        public string? Hours { get; set; }
    }

    public class Team
    {

        [Key]
        public int TeamId { get; set; }

        public int LayerId { get; set; }
        [ForeignKey("LayerId")]
        public Layer Layer { get; set;  }

        public int ProductId { get; set; }
        [ForeignKey("ProductId")]
        public Product Product { get; set;  }



    }
    public class User
    {
        [Key]
        public int TaqniaID { get; set; }
        public string? NationalID { get; set; }

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public ProductionRole? ProductionRole { get; set; }

        public string? Name { get; set; }
        public string? Product { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; }
        public int? ProductAssignmentId { get; set; }
        [ForeignKey("ProductAssignmentId")]
        public Product? ProductAssignment { get; set; }
        public int? LayerAssignmentId { get; set; }
        [ForeignKey("LayerAssignmentId")]
        public Layer? LayerAssignment { get; set; }
        public string? Layer { get; set; }
        public string? EmployeeType { get; set; }
        [JsonIgnore]
        public ICollection<SheetAssignment> SheetAssignments { get; set; } = new List<SheetAssignment>();
        public int? SupervisorTaqniaID { get; set; }
    }

    public enum ProductionRole
    {
        Production,
        DailyQC,
        FinalizedQC,
       FinalQC,

    }
}
