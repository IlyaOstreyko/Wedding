using Microsoft.EntityFrameworkCore;
using Wedding.Data;
using Wedding.Interfaces;
using Wedding.Models;

namespace Wedding.Repositories
{
    public class SurveyAnswerRepository : GenericRepository<SurveyAnswer>, ISurveyAnswerRepository
    {
        public SurveyAnswerRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<SurveyAnswer>> GetByGuestAsync(int guestId) =>
            await _dbSet
                .Where(a => a.GuestId == guestId)
                .Include(a => a.Question)
                .Include(a => a.SelectedOption)
                .ToListAsync();
    }
}
