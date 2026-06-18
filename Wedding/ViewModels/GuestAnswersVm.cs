namespace Wedding.ViewModels
{
    public class GuestAnswersVm
    {
        public int GuestId { get; set; }
        public string GuestName { get; set; } = "";
        public string City { get; set; } = "";
        public bool Confirmation { get; set; }

        public List<AnswerVm> Answers { get; set; } = new();
    }
}
