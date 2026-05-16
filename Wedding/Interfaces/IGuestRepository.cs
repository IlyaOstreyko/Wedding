using Wedding.Models;

namespace Wedding.Interfaces
{
    public interface IGuestRepository : IGenericRepository<Guest>
    {
        Task<Guest?> GetWithAnswersAsync(int id);
        Task<Guest?> GetByTokenAsync(string token);
    }
}
