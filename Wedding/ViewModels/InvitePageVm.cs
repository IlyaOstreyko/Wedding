using Wedding.Models;

namespace Wedding.ViewModel
{
    public class InvitePageVm
    {
        public string InviteToken { get; set; } = "";
        public int GuestId { get; set; }
        public string GuestName { get; set; } = "";
        public string GuestCity { get; set; } = "";
        public bool IsCouple { get; set; }
        public Gender? Gender { get; set; }
        public bool IsConfirmed { get; set; }
        public List<InviteQuestionVm> Questions { get; set; } = new();
    }
}
