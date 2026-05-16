using Wedding.Models;

namespace Wedding.Interfaces
{
    public interface ISurveyQuestionRepository : IGenericRepository<SurveyQuestion>
    {
        Task<SurveyQuestion?> GetWithOptionsAsync(int id);
        Task<IEnumerable<SurveyQuestion>> GetAllWithOptionsAsync();
    }
}
