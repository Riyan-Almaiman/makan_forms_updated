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
        public async Task ImportDailySheetAssignments(
     string filePath,
     int sheetNumberColumn,
     int assignmentDateColumn,
     int taqniaIdColumn,
     int nameColumn,
     int remarkColumn,
     int layerId)
        {
            using var workbook = new XLWorkbook(filePath);
            var worksheet = workbook.Worksheet(1); // Get the first worksheet
            var rows = worksheet.RowsUsed().Skip(1); // Skip header row
            var dailySheetAssignments = new List<DailySheetAssignments>();
            var skippedRows = new List<string>();

            // Get all existing TaqniaIds from the Users table
            var existingTaqniaIds = new HashSet<int>(await _context.Users.Select(u => u.TaqniaID).ToListAsync());

            foreach (var row in rows)
            {
                if (DateTime.TryParseExact(
                    row.Cell(assignmentDateColumn).Value.ToString(),
                    new[] { "M/d/yyyy", "M/d/yyyy h:mm:ss tt" },
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out DateTime assignmentDate))
                {
                    if (int.TryParse(row.Cell(taqniaIdColumn).Value.ToString(), out int taqniaId))
                    {
                        if (existingTaqniaIds.Contains(taqniaId))
                        {
                            var dailyAssignment = new DailySheetAssignments
                            {
                                SheetNumber = row.Cell(sheetNumberColumn).Value.ToString(),
                                AssignmentDate = assignmentDate,
                                TaqniaId = taqniaId,
                                Name = row.Cell(nameColumn).Value.ToString(),
                                Remark = row.Cell(remarkColumn).Value.ToString(),
                                LayerId = layerId
                            };
                            dailySheetAssignments.Add(dailyAssignment);
                        }
                        else
                        {
                            skippedRows.Add($"Row {row.RowNumber()}: TaqniaId {taqniaId} does not exist in the Users table");
                        }
                    }
                    else
                    {
                        skippedRows.Add($"Row {row.RowNumber()}: Invalid TaqniaId format");
                    }
                }
                else
                {
                    skippedRows.Add($"Row {row.RowNumber()}: Invalid date format");
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

            // Report skipped rows
            if (skippedRows.Any())
            {
                Console.WriteLine("The following rows were skipped:");
                foreach (var skippedRow in skippedRows)
                {
                    Console.WriteLine(skippedRow);
                }
            }
        }

        private class SheetAssignment
        {
            public string Nrn { get; set; }
            public string Username { get; set; }
            public string IndexStat { get; set; }
        }
    }
}
