using ClosedXML.Excel;
using forms_api.Entities;
using Microsoft.EntityFrameworkCore;

using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using static forms_api.Entities.SheetEntities;
using System.Globalization;
using System.Text.Json;

namespace forms_api.Services
{
    public class DataImportService
    {
        private readonly ApplicationDbContext _context;

        public DataImportService(ApplicationDbContext context)
        {
            _context = context;

        }
        public async Task EnsureSheetLayerStatusEntries()
        {
            // Get all sheets, products, and layers
            var sheets = await _context.Sheets.ToListAsync();
            var products = await _context.Products.ToListAsync();
            var layers = await _context.Layers.ToListAsync();

            // Get existing SheetLayerStatus entries
            var existingStatuses = await _context.SheetLayerStatus
                .Select(sls => new { sls.SheetId, sls.ProductId, sls.LayerId })
                .ToListAsync();

            var statusesToAdd = new List<SheetLayerStatus>();

            foreach (var sheet in sheets)
            {
                foreach (var product in products)
                {
                    foreach (var layer in layers)
                    {
                        // Check if the combination already exists
                        if (!existingStatuses.Any(s => s.SheetId == sheet.SheetId &&
                                                       s.ProductId == product.Id &&
                                                       s.LayerId == layer.Id))
                        {
                            // If it doesn't exist, create a new SheetLayerStatus
                            statusesToAdd.Add(new SheetLayerStatus
                            {
                                SheetId = sheet.SheetId,
                                ProductId = product.Id,
                                LayerId = layer.Id,
                                Completion = 0,
                                IsQCInProgress = true,
                                IsFinalQCInProgress = true,
                                IsFinalizedQCInProgress = true,
                                InProgress = true
                            });
                        }
                    }
                }
            }

            // Add the new statuses to the context
            if (statusesToAdd.Any())
            {
                await _context.SheetLayerStatus.AddRangeAsync(statusesToAdd);
                await _context.SaveChangesAsync();
            }

            Console.WriteLine($"Added {statusesToAdd.Count} new SheetLayerStatus entries.");
        }
        public async Task ImportUsersFromExcel(string filePath)
        {
            _context.ChangeTracker.Clear();

            using var workbook = new XLWorkbook(filePath);
            var worksheet = workbook.Worksheet(1); // Get the first worksheet
            var rows = worksheet.RowsUsed().Skip(1); // Skip header row

            var usersToUpdate = new List<User>();
            var usersToAdd = new List<User>();

            foreach (var row in rows)
            {
                var email = row.Cell(7).Value.ToString();
                var username = email.Split('@')[0];

                var user = new User
                {
                    TaqniaID = int.Parse(row.Cell(1).Value.ToString()),
                    NationalID = row.Cell(4).Value.ToString(),
                    Name = row.Cell(2).Value.ToString(),
                    Layer = row.Cell(8).Value.ToString(),
                    Email = email,
                    PhoneNumber = row.Cell(6).Value.ToString(),
                    Username = username,
                    Password = BCrypt.Net.BCrypt.HashPassword(row.Cell(1).Value.ToString()),
                    Role = row.Cell(9).Value.ToString().Contains("supervisor", StringComparison.OrdinalIgnoreCase) ? "supervisor" : "editor",
                    EmployeeType = row.Cell(5).Value.ToString(),
                };

                
             
                    usersToAdd.Add(user);
                
            }

            await _context.Users.AddRangeAsync(usersToAdd);

            await _context.SaveChangesAsync();
        }
        public async Task ImportSheetAssignmentsFromExcel(string filePath)
        {
            using var workbook = new XLWorkbook(filePath);
            var worksheet = workbook.Worksheet(1); // Get the first worksheet
            var rows = worksheet.RowsUsed().Skip(1); // Skip header row

            var sheetAssignmentsToAdd = new List<SheetEntities.SheetAssignment>();

            foreach (var row in rows)
            {
                var sheetName = row.Cell(4).Value.ToString();
                var taqniaId = int.Parse(row.Cell(7).Value.ToString());

                var sheet = await _context.Sheets.FirstOrDefaultAsync(s => s.SheetName == sheetName);
                var user = await _context.Users.FirstOrDefaultAsync(u => u.TaqniaID == taqniaId);

                if (sheet != null && user != null)
                {
                    var sheetAssignment = new SheetEntities.SheetAssignment
                    {
                        SheetId = sheet.SheetId,
                        TaqniaID = user.TaqniaID,
                        InProgress = true,
                        AssignmentDate = DateTime.Now
                    };

                    sheetAssignmentsToAdd.Add(sheetAssignment);
                }
            }

            await _context.SheetAssignments.AddRangeAsync(sheetAssignmentsToAdd);
            await _context.SaveChangesAsync();
        }
        public async Task ImportSheetsFromExcel(string filePath)
        {
            string agriCompletedSheetsPath = @"C:\Users\ralmaiman\MakanForms_2\Services\Production Finished_Agriculture.xlsx";
            var completedAgriSheets = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            using (var agriWorkbook = new XLWorkbook(agriCompletedSheetsPath))
            {
                var agriWorksheet = agriWorkbook.Worksheet(1);
                foreach (var cell in agriWorksheet.Column(2).CellsUsed())
                {
                    completedAgriSheets.Add(cell.Value.ToString());
                }
            }

            using var workbook = new XLWorkbook(filePath);
            var worksheet = workbook.Worksheet(1); // Get the first worksheet
            var rows = worksheet.RowsUsed().Skip(1); // Skip header row

            var sheetsToUpdate = new List<Sheet>();
            var sheetsToAdd = new List<Sheet>();

            // Get all layers from the database
            var layers = await _context.Layers.ToListAsync();
            var agricultureLayer = layers.FirstOrDefault(l => l.Name.Equals("Agriculture", StringComparison.OrdinalIgnoreCase));

            foreach (var row in rows)
            {
                var sheetName = row.Cell(1).Value.ToString();
                var existingSheet = await _context.Sheets
                    .Include(s => s.LayerStatuses)
                    .FirstOrDefaultAsync(s => s.SheetName == sheetName);

                if (existingSheet != null)
                {
                    // Update existing sheet
                    existingSheet.DeliveryNumber = int.TryParse(row.Cell(5).Value.ToString(), out int deliveryNumber) ? deliveryNumber : null;
                    existingSheet.InProgress = true;
                    existingSheet.QCInProgress = true;
                    existingSheet.Hydrography = row.Cell(2).Value.ToString();
                    existingSheet.Agriculture = row.Cell(3).Value.ToString();
                    existingSheet.Buildings = row.Cell(4).Value.ToString();
                    existingSheet.Roads = row.Cell(6).Value.ToString();
                    existingSheet.Physiography = "";

                    sheetsToUpdate.Add(existingSheet);
                }
                else
                {
                    // Create new sheet
                    var newSheet = new Sheet
                    {
                        SheetName = sheetName,
                        DeliveryNumber = int.TryParse(row.Cell(5).Value.ToString(), out int deliveryNumber) ? deliveryNumber : null,
                        InProgress = true,
                        QCInProgress = true,
                        Hydrography = row.Cell(2).Value.ToString(),
                        Agriculture = row.Cell(3).Value.ToString(),
                        Buildings = row.Cell(4).Value.ToString(),
                        Roads = row.Cell(6).Value.ToString(),
                        Physiography = "",
                        LayerStatuses = new List<SheetLayerStatus>()
                    };
                    sheetsToAdd.Add(newSheet);
                }

                var sheet = existingSheet ?? sheetsToAdd.Last();

                // Create or update SheetLayerStatus for each layer
                foreach (var layer in layers)
                {
                    var layerStatus = sheet.LayerStatuses.FirstOrDefault(ls => ls.LayerId == layer.Id);
                    if (layerStatus == null)
                    {
                        layerStatus = new SheetLayerStatus
                        {
                            LayerId = layer.Id,
                            InProgress = true
                        };
                        sheet.LayerStatuses.Add(layerStatus);
                    }

                    // Set Agriculture layer status based on the completed sheets list
                    if (layer.Id == agricultureLayer?.Id)
                    {
                        layerStatus.InProgress = !completedAgriSheets.Contains(sheetName);
                    }
                }
            }

            // Add new sheets
            await _context.Sheets.AddRangeAsync(sheetsToAdd);

            // Save changes
            await _context.SaveChangesAsync();
        }
        public async Task SeedInitialDataAsync()
        {
            await SeedLayersAsync();
            await SeedProductsAsync();
            await SeedRemarksAsync();

            await _context.SaveChangesAsync();
        }

        private async Task SeedLayersAsync()
        {
            if (!await _context.Layers.AnyAsync())
            {
                var layers = new List<Layer>
            {
                new Layer { Name = "Agriculture" },
                 new Layer { Name = "Roads" },
                new Layer { Name = "Buildings" },
                new Layer { Name = "Utility Network" },
                new Layer { Name = "Hydrography" },
                new Layer { Name = "Physiography" },
                new Layer { Name = "Airports & Coast lines" }
            };

                await _context.Layers.AddRangeAsync(layers);
            }
        }

        private async Task SeedProductsAsync()
        {
            if (!await _context.Products.AnyAsync())
            {
                var products = new List<Product>
            {
                new Product { Name = "TDS7" },
             
            };

                await _context.Products.AddRangeAsync(products);
            }
        }

        private async Task SeedRemarksAsync()
        {
            if (!await _context.Remarks.AnyAsync())
            {
                var remarks = new List<Remark>
            {
                new Remark { Name = "Empty" },
                new Remark { Name = "Easy" },
                new Remark { Name = "Medium" },
                new Remark { Name = "Dense" },
                new Remark { Name = "Mountain" },
                new Remark { Name = "Terrace" },
                new Remark { Name = "Dense Difficult" },
                new Remark { Name = "Terrace" },
                new Remark { Name = "Super Dense" },
                new Remark { Name = "Difficult" },
                new Remark { Name = "Fixing" },
                new Remark { Name = "Dense" },
                new Remark { Name = "Fixing" },
                new Remark { Name = "Medium_Easy" },
                new Remark { Name = "Attribute filling" },
                new Remark { Name = "delete" },
                new Remark { Name = "QC" },
      
            };

            

                await _context.Remarks.AddRangeAsync(remarks);
            }
        }
        public async Task ImportDailySheetAssignments(string jsonFilePath, int layerId)
        {
            // Read and parse the JSON file
            string jsonContent = await File.ReadAllTextAsync(jsonFilePath);
            var jsonData = JsonSerializer.Deserialize<List<JsonEntry>>(jsonContent);

            var dailySheetAssignments = new List<DailySheetAssignments>();
            var skippedEntries = new List<string>();

            // Get all existing TaqniaIds from the Users table
            var existingTaqniaIds = new HashSet<int>(await _context.Users.Select(u => u.TaqniaID).ToListAsync());

            foreach (var entry in jsonData)
            {
                if (int.TryParse(entry.Attributes.Emp_ID, out int taqniaId))
                {
                    if (existingTaqniaIds.Contains(taqniaId))
                    {
                        var dates = ParseDates(entry.Attributes.Delivery_Date);
                        foreach (var date in dates)
                        {
                            var dailyAssignment = new DailySheetAssignments
                            {
                                SheetNumber = entry.Attributes.nrn,
                                AssignmentDate = date,
                                TaqniaId = taqniaId,
                                Name = entry.Attributes.Username,
                                Remark = string.Empty,
                                LayerId = layerId
                            };
                            dailySheetAssignments.Add(dailyAssignment);
                        }
                    }
                    else
                    {
                        skippedEntries.Add($"Entry with NRN {entry.Attributes.nrn}: TaqniaId {taqniaId} does not exist in the Users table");
                    }
                }
                else
                {
                    skippedEntries.Add($"Entry with NRN {entry.Attributes.nrn}: Invalid TaqniaId format");
                }
            }

            // Use a transaction to ensure data consistency
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    await _context.DailySheets.AddRangeAsync(dailySheetAssignments);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    Console.WriteLine($"Successfully imported {dailySheetAssignments.Count} daily sheet assignments.");
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    Console.WriteLine($"Error occurred during import: {ex.Message}");
                    throw;
                }
            }

            // Report skipped entries
            if (skippedEntries.Any())
            {
                Console.WriteLine("The following entries were skipped:");
                foreach (var skippedEntry in skippedEntries)
                {
                    Console.WriteLine(skippedEntry);
                }
            }
        }

        private List<DateTime> ParseDates(string dateString)
        {
            var dates = new List<DateTime>();
            var dateParts = dateString.Split(new[] { '-', ' ' }, StringSplitOptions.RemoveEmptyEntries);

            foreach (var part in dateParts)
            {
                if (DateTime.TryParseExact(part.Trim(), "MM/dd/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime date))
                {
                    dates.Add(date);
                }
            }

            return dates;
        }

        public class JsonEntry
        {
            public Attributes Attributes { get; set; }
            public Geometry Geometry { get; set; }
        }

        public class Attributes
        {
            public string country { get; set; }
            public string nrn { get; set; }
            public string Remarks { get; set; }
            public int Year { get; set; }
            public string Delivery { get; set; }
            public int Priority { get; set; }
            public string Deliveries_Dates { get; set; }
            public string Sheets100K { get; set; }
            public string Sheets250K { get; set; }
            public string Road_Index_Density { get; set; }
            public string Newplan_Dates { get; set; }
            public string Roads_Status { get; set; }
            public int KM { get; set; }
            public string GlobalID { get; set; }
            public string created_user { get; set; }
            public string created_date { get; set; }
            public string last_edited_user { get; set; }
            public string last_edited_date { get; set; }
            public string Username { get; set; }
            public string Delivery_Date { get; set; }
            public string Emp_ID { get; set; }
            public double shape_Length { get; set; }
            public double shape_Area { get; set; }
        }

        public class Geometry
        {
            public string type { get; set; }
            public List<List<List<double>>> coordinates { get; set; }
        }
    }
}
