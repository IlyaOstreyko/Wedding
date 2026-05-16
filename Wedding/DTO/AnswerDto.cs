namespace Wedding.DTO
{
    public class AnswerDto
    {
        public int QuestionId { get; set; }
        // Для одиночного выбора — либо SelectedOptionIds[0], для множественного — несколько
        public List<int> SelectedOptionIds { get; set; } = new();
        public string? CustomAnswer { get; set; }
        // InstanceIndex — чтобы отличать два экземпляра одного вопроса (ForCouple)
        public int InstanceIndex { get; set; } = 1;
    }
}
