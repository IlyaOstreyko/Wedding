using Microsoft.EntityFrameworkCore;
using Wedding.Data;
using Wedding.Interfaces;
using Wedding.Models;

namespace Wedding.Repositories
{
    public class GuestRepository : GenericRepository<Guest>, IGuestRepository
    {
        public GuestRepository(AppDbContext context) : base(context) { }

        public async Task<Guest?> GetWithAnswersAsync(int id) =>
            await _dbSet
                .Include(g => g.SurveyAnswers)
                .ThenInclude(a => a.SelectedOption)
                .FirstOrDefaultAsync(g => g.Id == id);

        public async Task<List<Guest>> GetAllWithAnswersAsync()
        {
            return await _context.Guests
                .Include(g => g.SurveyAnswers)
                    .ThenInclude(a => a.Question)
                .Include(g => g.SurveyAnswers)
                    .ThenInclude(a => a.SelectedOption)
                .OrderBy(g => g.Name)
                .ToListAsync();
        }

        public async Task<Guest?> GetByTokenAsync(string token) =>
            await _dbSet.FirstOrDefaultAsync(g => g.InviteToken == token);
    }
}
