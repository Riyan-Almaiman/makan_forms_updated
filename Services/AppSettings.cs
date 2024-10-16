using Microsoft.Extensions.Configuration;
using System.Threading;

public class AppSettings
{
    private readonly IConfiguration _configuration;
    private static bool _otpEnabled = true;
    private static readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

    public AppSettings(IConfiguration configuration)
    {
        _configuration = configuration;
        _otpEnabled = _configuration.GetValue<bool>("OTPEnabled", false);
    }

    public bool IsOTPEnabled()
    {
        return _otpEnabled;
    }

    public async Task SetOTPEnabled(bool enabled)
    {
        await _semaphore.WaitAsync();
        try
        {
            _otpEnabled = enabled;
            // Optionally, you can persist this setting to a database or configuration file
        }
        finally
        {
            _semaphore.Release();
        }
    }
}