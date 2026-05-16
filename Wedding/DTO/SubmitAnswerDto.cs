namespace Wedding.DTO
{
    public class SubmitAnswerDto
    {
        public string InviteToken { get; set; } = "";
        public List<AnswerDto> Answers { get; set; } = new();
    }
}
