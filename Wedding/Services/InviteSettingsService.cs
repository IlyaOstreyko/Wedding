using System.Text.Json;
using Wedding.Models;

namespace Wedding.Services
{
    public class InviteSettingsService
    {
        private readonly string path;

        public InviteSettingsService(
            IWebHostEnvironment env)
        {
            path = Path.Combine(
                env.ContentRootPath,
                "App_Data",
                "invite-settings.json");
        }

        public async Task<InviteSettings> GetAsync()
        {
            if (!File.Exists(path))
            {
                return new InviteSettings();
            }

            var json =
                await File.ReadAllTextAsync(path);

            return JsonSerializer.Deserialize<InviteSettings>(json)
                   ?? new InviteSettings();
        }

        public async Task SaveAsync(
            InviteSettings settings)
        {
            var json =
                JsonSerializer.Serialize(
                    settings,
                    new JsonSerializerOptions
                    {
                        WriteIndented = true
                    });

            await File.WriteAllTextAsync(
                path,
                json);
        }
    }
}
