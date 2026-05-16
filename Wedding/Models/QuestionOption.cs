namespace Wedding.Models
{
    public class QuestionOption
    {
        public int Id { get; set; }
        public string Text { get; set; } = "";
        public int QuestionId { get; set; }
        public SurveyQuestion Question { get; set; } = null!;
    }
}
