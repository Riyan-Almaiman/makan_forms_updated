using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace forms_api.Services
{
    public class PasswordEncryptionService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PasswordEncryptionService> _logger;

        public PasswordEncryptionService(ApplicationDbContext context, ILogger<PasswordEncryptionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task CheckAndEncryptPasswords()
        {
            var users = await _context.Users.ToListAsync();
            var hasChanges = false;

            foreach (var user in users)
            {
                if (!user.Password.StartsWith("$2a$") && !user.Password.StartsWith("$2b$") && !user.Password.StartsWith("$2y$"))
                {
                    user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
                    hasChanges = true;
                    _logger.LogInformation($"Encrypted password for user: {user.Username}");
                }
            }

            if (hasChanges)
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Completed password encryption check and updates.");
            }
            else
            {
                _logger.LogInformation("No passwords required encryption.");
            }
        }
    }
}