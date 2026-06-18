using Microsoft.AspNetCore.Mvc;
using Wedding.Security;

namespace Wedding.Controllers
{
    public class AdminAuthController : Controller
    {
        [HttpPost]
        public IActionResult Login([FromBody] string password)
        {
            const string adminPassword = "1236547";

            if (password == adminPassword)
            {
                AdminAuthHelper.GrantAccess(HttpContext);
                return Ok();
            }

            return Unauthorized();
        }
    }
}
