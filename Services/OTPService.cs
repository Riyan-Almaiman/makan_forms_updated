using System;
using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace forms_api.Services
{
    public class OTPService
    {
        private readonly IConfiguration _configuration;
        private readonly Random _random = new Random();

        public OTPService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateOTP(int length = 6)
        {
            const string chars = "0123456789";
            return new string(Enumerable.Repeat(chars, length)
                .Select(s => s[_random.Next(s.Length)]).ToArray());
        }

        public async Task SendOTPEmail(string email, string otp)
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var senderEmail = emailSettings["SenderEmail"];
            var senderName = emailSettings["SenderName"];
            var smtpServer = emailSettings["Server"];
            var smtpPort = int.Parse(emailSettings["Port"]);
            var smtpUsername = emailSettings["UserName"];
            var smtpPassword = emailSettings["Password"];

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = "Makan Forms OTP",
                Body = GenerateHTMLEmail(otp),
                IsBodyHtml = true,
            };
            mailMessage.To.Add(email);

            using var smtpClient = new SmtpClient(smtpServer, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUsername, smtpPassword),
                EnableSsl = true,
                UseDefaultCredentials = false,
                DeliveryMethod = SmtpDeliveryMethod.Network,
            };

            smtpClient.Timeout = 10000;

            try
            {
                await smtpClient.SendMailAsync(mailMessage);
            }
            catch (Exception ex)
            {
                throw new ApplicationException($"Failed to send OTP email. Error: {ex.Message}", ex);
            }
        }

        private string GenerateHTMLEmail(string otp)
        {
            return @$"
            <!DOCTYPE html>
            <html lang='en'>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <title>MakanForms OTP</title>
            </head>
            <body style='font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;'>
                <table role='presentation' style='width: 100%; border-collapse: collapse;'>
                    <tr>
                        <td align='center' style='padding: 40px 0;'>
                            <table role='presentation' style='width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);'>
                                <tr>
                                    <td style='padding: 40px; text-align: center; background-color: #196A58; border-radius: 8px 8px 0 0;'>
                                        <h1 style='color: #ffffff; margin: 0;'>Makan Productivity</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style='padding: 40px;'>
                                        <h2 style='color: #333333; margin-top: 0;'>Your One-Time Password</h2>
                                        <p style='color: #666666; font-size: 16px; line-height: 1.5;'>Use the following OTP to complete your authentication:</p>
                                        <p style='font-size: 32px; font-weight: bold; color: #196A58; margin: 30px 0;'>{otp}</p>
                                        <p style='color: #666666; font-size: 14px;'>This OTP will expire in 5 minutes.</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style='padding: 20px; text-align: center; background-color: #f8f8f8; border-radius: 0 0 8px 8px;'>
                                        <p style='color: #999999; font-size: 12px; margin: 0;'>If you didn't request this OTP, please ignore this email.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>";
        }

        public async Task GenerateAndSendOTP(string email)
        {
            var otp = GenerateOTP();
            await SendOTPEmail(email, otp);
        }
    }
}