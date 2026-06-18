using Microsoft.Extensions.Options;

namespace Wedding.ViewModel
{
    public class InviteQuestionVm
    {
        public int QuestionId { get; set; }
        public string Text { get; set; } = "";
        public bool IsMultipleChoice { get; set; }
        public bool AllowCustomAnswer { get; set; }
        public List<OptionVm> Options { get; set; } = new();
    }
}
