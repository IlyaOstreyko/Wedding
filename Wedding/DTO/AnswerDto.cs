namespace Wedding.DTO
{
    public class AnswerDto
    {
        public int QuestionId { get; set; }
        public List<int> SelectedOptionIds { get; set; } = new();
        public string? CustomAnswer { get; set; }
        public int InstanceIndex { get; set; } = 1;
    }
}
