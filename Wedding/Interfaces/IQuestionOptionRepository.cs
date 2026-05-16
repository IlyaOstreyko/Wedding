using Wedding.Models;

namespace Wedding.Interfaces
{
    public interface IQuestionOptionRepository : IGenericRepository<QuestionOption>
    {
        Task<IEnumerable<QuestionOption>> GetByQuestionIdAsync(int questionId);
    }
}
