namespace Wedding.ViewModels
{
    public class SurveyAnswersAdminVm
    {
        public List<GuestAnswersVm> Guests { get; set; } = new();
        public List<QuestionSummaryVm> Questions { get; set; } = new();
    }
}
