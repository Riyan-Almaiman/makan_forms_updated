using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using DocumentFormat.OpenXml.Spreadsheet;
using Bogus.DataSets;
using static forms_api.Entities.SheetEntities;

namespace forms_api.Entities
{
    public enum FormState
    {
        New,
        pending,
        approved,
        rejected,
        unknown
    }


    public class DailyTarget
    {
        [Key]
        public int TargetId { get; set; }
        public double HoursWorked { get; set; }
        public double Productivity { get; set; }
        public double? Completion { get; set; }
        public Layer? Layer { get; set; }
        public Remark? Remark { get; set; }

        public bool IsQC { get; set; } = false; 
        public Product? Product { get; set; }
        public int? SheetLayerStatusId { get; set; }
        [ForeignKey("SheetLayerStatusId")]
        public SheetLayerStatus? SheetLayerStatus { get; set; }

        public int? SheetAssignmentId { get; set; }
        [ForeignKey("SheetAssignmentId")]

        public SheetAssignment? SheetAssignment {get; set;}
        public string? SheetNumber { get; set; }
        public double? ExpectedProductivity { get; set; }
        public int FormId { get; set; }

        [JsonIgnore]
        [ForeignKey("FormId")]
        public Form? Form { get; set; }
    }
    public class Form
    {
        [Key]
        public int FormId { get; set; }
        public string? Comment { get; set; }
        [JsonConverter(typeof(JsonStringEnumConverter))]

        public ProductionRole? ProductionRole { get; set; }
        public Product? Product { get; set; } = null;

        public DateTime SubmissionDate { get; set; }
        public DateTime ProductivityDate { get; set; }
        public string? EmployeeName { get; set; }
        public int? SupervisorTaqniaID { get; set; }

        public List<DailyTarget> DailyTargets { get; set; } = new List<DailyTarget>();

        public List<Approval> Approvals { get; set; } = new List<Approval>();

        public int TaqniaID { get; set; }

        [ForeignKey("TaqniaID")]
        [JsonIgnore]
        public User? User { get; set; }

    }

    public class Approval
    {
        [Key]
        public int ApprovalId { get; set; }
        public int? SupervisorTaqniaID { get; set; }

        public string? SupervisorComment { get; set; }

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public FormState? State { get; set; }

        public int StepOrder { get; set; }
        public int FormId { get; set; }

        [ForeignKey("FormId")]
        [JsonIgnore]
        public Form? Form { get; set; }

    }
}
