namespace Wedding.Models
{
    public class InviteTheme
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string Name { get; set; } = "";

        public string PrimaryColor { get; set; } = "#d4af37";

        public string TextColor { get; set; } = "#2c2c2c";

        public string BackgroundColor { get; set; } = "#ffffff";

        public string CardColor { get; set; } = "rgba(255,255,255,0.85)";
        public string CardColorHex { get; set; } = "#ffffff";
        public double CardOpacity { get; set; } = 0.06;
        public int ScrollBlur { get; set; } = 10;
        public double ScrollDarken { get; set; } = 0.6;
        public bool IsPredefined { get; set; }
    }
}
