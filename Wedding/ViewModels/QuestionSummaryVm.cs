namespace Wedding.ViewModels
{
    public class QuestionSummaryVm
    {
        public int QuestionId { get; set; }
        public string Question { get; set; } = "";

        public List<OptionCountVm> Options { get; set; } = new();

        public List<string> CustomAnswers { get; set; } = new();
    }
}
