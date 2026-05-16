using Microsoft.EntityFrameworkCore;
using Wedding.Data;
using Wedding.Interfaces;
using Wedding.Models;

namespace Wedding.Repositories
{
    public class SurveyQuestionRepository : GenericRepository<SurveyQuestion>, ISurveyQuestionRepository
    {
        public SurveyQuestionRepository(AppDbContext context) : base(context) { }

        public async Task<SurveyQuestion?> GetWithOptionsAsync(int id) =>
            await _dbSet
                .Include(q => q.Options)
                .FirstOrDefaultAsync(q => q.Id == id);
        public async Task<IEnumerable<SurveyQuestion>> GetAllWithOptionsAsync() =>
    await _dbSet
        .Include(q => q.Options)
        .ToListAsync();
    }
}
