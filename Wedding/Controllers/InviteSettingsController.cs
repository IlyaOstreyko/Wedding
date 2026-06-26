using Microsoft.AspNetCore.Mvc;
using Wedding.Models;
using Wedding.Security;
using Wedding.Services;

namespace Wedding.Controllers
{
    public class InviteSettingsController : Controller
    {
        private readonly InviteSettingsService _service;
        private readonly IWebHostEnvironment _env;
        public InviteSettingsController(
            InviteSettingsService service,
            IWebHostEnvironment env)
        {
            _service = service;
            _env = env;
        }

        public async Task<IActionResult> Index()
        {
            if (!AdminAuthHelper.IsAuthorized(HttpContext))
                return RedirectToAction("Locked");

            var settings =
                await _service.GetAsync();

            return View(settings);
        }

        public IActionResult Locked()
        {
            return View("~/Views/Shared/Locked.cshtml");
        }

        [HttpPost]
        public async Task<IActionResult> ColorsSettings(InviteTheme theme, string actionType)
        {
            var settings = await _service.GetAsync();

            theme.CardColor = HexToRgba(theme.CardColorHex, theme.CardOpacity);

            if (actionType == "saveCustom")
            {
                theme.Id = Guid.NewGuid().ToString();
                theme.IsPredefined = false;

                if (string.IsNullOrWhiteSpace(theme.Name))
                    theme.Name = "Моя тема";

                settings.SavedThemes.Add(theme);
                settings.CurrentTheme = theme;
            }
            else
            {
                theme.Id = "custom";
                theme.Name = "Ручная настройка";
                theme.IsPredefined = false;
                settings.CurrentTheme = theme;
            }

            await _service.SaveAsync(settings);
            return RedirectToAction(nameof(Index));
        }
        private string HexToRgba(string hex, double opacity)
        {
            if (string.IsNullOrEmpty(hex)) hex = "#ffffff";
            hex = hex.Replace("#", "");

            if (hex.Length == 6)
            {
                int r = Convert.ToInt32(hex.Substring(0, 2), 16);
                int g = Convert.ToInt32(hex.Substring(2, 2), 16);
                int b = Convert.ToInt32(hex.Substring(4, 2), 16);
                return $"rgba({r},{g},{b},{opacity.ToString(System.Globalization.CultureInfo.InvariantCulture)})";
            }

            return $"rgba(255,255,255,{opacity.ToString(System.Globalization.CultureInfo.InvariantCulture)})";
        }

        [HttpPost]
        public async Task<IActionResult> ApplyTheme(string themeId)
        {
            var settings = await _service.GetAsync();
            var themeToApply = settings.SavedThemes.FirstOrDefault(t => t.Id == themeId);

            if (themeToApply != null)
            {
                settings.CurrentTheme = themeToApply;
                await _service.SaveAsync(settings);
            }

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> DeleteTheme(string themeId)
        {
            var settings = await _service.GetAsync();
            var themeToRemove = settings.SavedThemes.FirstOrDefault(t => t.Id == themeId && !t.IsPredefined);

            if (themeToRemove != null)
            {
                settings.SavedThemes.Remove(themeToRemove);
                if (settings.CurrentTheme.Id == themeId)
                {
                    settings.CurrentTheme = settings.SavedThemes.First();
                }
                await _service.SaveAsync(settings);
            }

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> NamesSettings(
    string groomName,
    string brideName)
        {
            var settings =
                await _service.GetAsync();
            settings.GroomName =
                groomName;
            settings.BrideName =
                brideName;
            await _service.SaveAsync(settings);
            return RedirectToAction("Index");
        }

        [HttpPost]
        public async Task<IActionResult> SelectBackground(
            string image)
        {
            var settings =
                await _service.GetAsync();

            settings.BackgroundImage = image;

            await _service.SaveAsync(settings);

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> UploadBackgrounds(
            IFormFile file)
        {
            if (file == null || file.Length == 0)
                return RedirectToAction(nameof(Index));

            var folder =
                Path.Combine(
                    _env.WebRootPath,
                    "Uploads",
                    "Backgrounds");

            Directory.CreateDirectory(folder);

            var filename =
                Guid.NewGuid()
                + Path.GetExtension(file.FileName);

            var path =
                Path.Combine(
                    folder,
                    filename);

            using (var stream =
                new FileStream(path, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var settings =
                await _service.GetAsync();

            var url =
                "/Uploads/Backgrounds/" + filename;

            settings.AvailableBackgrounds.Add(url);

            settings.BackgroundImage = url;

            await _service.SaveAsync(settings);

            return RedirectToAction(nameof(Index));
        }
    }
}
