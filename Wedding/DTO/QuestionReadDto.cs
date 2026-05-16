namespace Wedding.DTO
{
    public class QuestionReadDto
    {
        public int Id { get; set; }
        public string Text { get; set; } = "";
        public bool IsMultipleChoice { get; set; }
        public bool AllowCustomAnswer { get; set; }
        public bool OutOfTowners { get; set; }
        public bool ForCouple { get; set; }
        public List<OptionDto> Options { get; set; } = new();
    }
}
