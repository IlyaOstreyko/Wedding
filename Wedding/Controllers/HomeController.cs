using Microsoft.AspNetCore.Mvc;

namespace Wedding.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
