using PrakashMart.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace PrakashMart.Infrastructure.Services;

public class ReservationCleanupService(
    IServiceScopeFactory scopeFactory,
    ILogger<ReservationCleanupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("ReservationCleanupService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);

            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var service = scope.ServiceProvider.GetRequiredService<ICartReservationService>();
                await service.CleanupExpiredAsync();
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during reservation cleanup.");
            }
        }

        logger.LogInformation("ReservationCleanupService stopped.");
    }
}
