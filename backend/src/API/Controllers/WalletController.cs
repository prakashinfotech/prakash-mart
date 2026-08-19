using PrakashMart.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PrakashMart.API.Controllers;

[Authorize(Roles = "Customer")]
public class WalletController(IWalletService walletService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetWallet()
    {
        var result = await walletService.GetOrCreateAsync(CurrentUserId);
        return Ok(result);
    }

    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance()
    {
        var balance = await walletService.GetBalanceAsync(CurrentUserId);
        return Ok(new { balance });
    }
}
