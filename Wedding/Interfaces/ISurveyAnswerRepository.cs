using Wedding.Models;

namespace Wedding.Interfaces
{
    public interface ISurveyAnswerRepository : IGenericRepository<SurveyAnswer>
    {
        Task<IEnumerable<SurveyAnswer>> GetByGuestAsync(int guestId);
    }
}
