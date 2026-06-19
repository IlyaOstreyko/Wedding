using System.ComponentModel.DataAnnotations;

namespace Wedding.Models
{
    public enum Gender
    {
        Male,
        Female
    }
    public class Guest
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = "";
        [Required]
        public string City { get; set; } = "";
        public bool CoupleOrNot { get; set; }
        public bool YoungOrNot { get; set; }
        public bool HusbandGuestOrNot { get; set; }        
        public bool WifeGuestOrNot { get; set; }
        public bool RelativeOrNot { get; set; }
        public bool FriendOrNot { get; set; }
        public bool Confirmation { get; set; }
        public Gender? Gender { get; set; }
        public string? Email { get; set; }
        public int ChildrenCount { get; set; } = 0;

        [Required]
        public string InviteToken { get; set; } = Guid.NewGuid().ToString("N");

        public bool IsSent { get; set; } = false;

        public ICollection<SurveyAnswer> SurveyAnswers { get; set; } = new List<SurveyAnswer>();

    }
}
