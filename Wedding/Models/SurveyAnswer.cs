namespace Wedding.Models
{
    public class SurveyAnswer
    {
        public int Id { get; set; }
        public int GuestId { get; set; }
        public Guest Guest { get; set; } = null!;
        public int QuestionId { get; set; }
        public SurveyQuestion Question { get; set; } = null!;
        public int? SelectedOptionId { get; set; }
        public QuestionOption? SelectedOption { get; set; }
        public string? CustomAnswer { get; set; }
    }
}
