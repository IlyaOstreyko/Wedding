namespace Wedding.Models
{
    public class InviteSettings
    {
        public string GroomName { get; set; } = "";
        public string BrideName { get; set; } = "";
        public DateTime? WeddingDate { get; set; } = DateTime.MaxValue;
        public string Paragraph1 { get; set; } = "";
        public string Paragraph2 { get; set; } = "";
        public string Paragraph3 { get; set; } = "";
        public string Paragraph4 { get; set; } = "";

        public TimeSpan? TimeCeremony { get; set; }
        public string PlaceCeremony { get; set; } = "";
        public string AddressCeremony { get; set; } = "";

        public TimeSpan? TimeBanquet { get; set; }
        public string PlaceBanquet { get; set; } = "";
        public string AddressBanquet { get; set; } = "";

        public string BackgroundImage { get; set; } = "/Uploads/Backgrounds/frame.png";
        public List<string> AvailableBackgrounds { get; set; } = new();
        public InviteTheme CurrentTheme { get; set; }
        public List<InviteTheme> SavedThemes { get; set; }
            = new();
        public InviteSettings()
        {
            SavedThemes = new List<InviteTheme>
{
    new() {
        Id = "default_1", Name = "Классика (Тёмная)",
        PrimaryColor = "#d4af37", TextColor = "#f5f5f5", BackgroundColor = "#0f0f10",
        CardColor = "rgba(255,255,255,0.06)", CardColorHex = "#ffffff", CardOpacity = 0.06,
        ScrollBlur = 12, ScrollDarken = 0.7, IsPredefined = true
    },
    new() {
        Id = "default_2", Name = "Светлая нежность",
        PrimaryColor = "#d4af37", TextColor = "#333333", BackgroundColor = "#fdfbfb",
        CardColor = "rgba(0,0,0,0.03)", CardColorHex = "#000000", CardOpacity = 0.03,
        ScrollBlur = 8, ScrollDarken = 0.3, IsPredefined = true
    },
    new() {
        Id = "default_3", Name = "Изумруд",
        PrimaryColor = "#c5a059", TextColor = "#e0e0e0", BackgroundColor = "#0a1f15",
        CardColor = "rgba(255,255,255,0.05)", CardColorHex = "#ffffff", CardOpacity = 0.05,
        ScrollBlur = 15, ScrollDarken = 0.8, IsPredefined = true
    }
};
            CurrentTheme = SavedThemes[0];
        }
    }
}

